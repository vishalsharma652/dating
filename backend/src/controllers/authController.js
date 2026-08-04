const { body } = require('express-validator');
const { randomInt, randomBytes } = require('crypto');
const userModel = require('../models/userModel');
const { query } = require('../config/db');
const { signToken } = require('../utils/token');
const { ok, created } = require('../utils/apiResponse');
const { AppError } = require('../utils/errors');
const { hasNameGenderMismatch } = require('../utils/nameGender');
const nodemailer = require('nodemailer');

// ─────────────────────────────────────────────────────────────────────────────
// Email OTP session store (DB-backed, keyed by email for registration)
// ─────────────────────────────────────────────────────────────────────────────
let _tableReady = false;

async function ensureSessionTable() {
  if (_tableReady) return;
  await query(`
    CREATE TABLE IF NOT EXISTS otp_sessions (
      email        VARCHAR(190) NOT NULL,
      otp          VARCHAR(10)  NOT NULL,
      data         JSON         NOT NULL,
      expires_at   BIGINT       NOT NULL,
      PRIMARY KEY  (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  try {
    await query("ALTER TABLE otp_sessions ADD COLUMN IF NOT EXISTS email VARCHAR(190) NOT NULL PRIMARY KEY");
  } catch { /* ignore if column/primary key already exists */ }
  _tableReady = true;
}

async function saveSession(email, payload, ttlMs = 3 * 60 * 1000) {
  await ensureSessionTable();
  const expiresAt = Date.now() + ttlMs;
  await query(
    `INSERT INTO otp_sessions (email, otp, data, expires_at)
     VALUES (:email, :otp, :data, :expiresAt)
     ON DUPLICATE KEY UPDATE otp = :otp, data = :data, expires_at = :expiresAt`,
    { email, otp: payload.otp, data: JSON.stringify(payload), expiresAt }
  );
}


async function getSession(email) {
  await ensureSessionTable();
  const rows = await query('SELECT * FROM otp_sessions WHERE email = :email LIMIT 1', { email });
  if (!rows[0]) return null;
  const session = rows[0];
  if (Number(session.expires_at) < Date.now()) {
    await deleteSession(email);
    return null; // expired
  }
  return typeof session.data === 'string' ? JSON.parse(session.data) : session.data;
}

async function deleteSession(email) {
  await ensureSessionTable();
  await query('DELETE FROM otp_sessions WHERE email = :email', { email });
}

// ─────────────────────────────────────────────────────────────────────────────
// Email sender (nodemailer — configure via .env SMTP_* variables)
// ─────────────────────────────────────────────────────────────────────────────
function createTransporter() {
  if (process.env.SMTP_HOST) {
    const cleanUser = String(process.env.SMTP_USER || '').replace(/["'\s]/g, '');
    const cleanPass = String(process.env.SMTP_PASS || '').replace(/["'\s]/g, '');

    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: cleanUser,
        pass: cleanPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }
  return { sendMail: async () => {} };
}




async function sendOtpEmail(toEmail, otp, name) {
  try {
    if (!process.env.SMTP_HOST) {
      console.warn(`[OTP EMAIL NOTICE] SMTP_HOST not set in .env. Email not sent via network. Generated OTP for ${toEmail}: ${otp}`);
      return;
    }
    const cleanUser = String(process.env.SMTP_USER || '').replace(/["'\s]/g, '');
    const cleanTo = String(toEmail || '').replace(/["'\s]/g, '');
    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: cleanUser,
      to: cleanTo,
      subject: `Your Saathika Verification Code: ${otp}`,

      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'High',
      },
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
          <div style="background:linear-gradient(135deg,#ec4899,#6366f1);padding:32px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:26px">Saathika</h1>
            <p style="color:rgba(255,255,255,0.8);margin:8px 0 0">Your love story begins here</p>
          </div>
          <div style="padding:32px">
            <p style="color:#374151;font-size:16px">Hi <strong>${name || 'there'}</strong>,</p>
            <p style="color:#6b7280;font-size:14px">Use the code below to verify your email address. It expires in <strong>3 minutes</strong>.</p>
            <div style="text-align:center;margin:28px 0">
              <span style="display:inline-block;background:#f9fafb;border:2px dashed #e5e7eb;border-radius:12px;padding:16px 40px;font-size:36px;font-weight:bold;letter-spacing:10px;color:#111827">${otp}</span>
            </div>
            <p style="color:#9ca3af;font-size:12px;text-align:center">If you didn't create an account on Saathika, you can safely ignore this email.</p>
          </div>
        </div>
      `,
      text: `Hi ${name || 'there'}, your Saathika verification code is: ${otp}. It expires in 3 minutes.`,
    });

    console.log(`[OTP EMAIL SUCCESS] Verification email sent to ${cleanTo}. MessageId: ${info?.messageId} | Generated OTP: [ ${otp} ]`);
  } catch (err) {
    console.error(`[OTP EMAIL ERROR] Failed to send email to ${toEmail}:`, err.message || err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────

// Password-reset tokens (DB-backed)
// ─────────────────────────────────────────────────────────────────────────────
let _resetTableReady = false;

async function ensureResetTable() {
  if (_resetTableReady) return;
  await query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token        VARCHAR(80)  NOT NULL,
      email        VARCHAR(190) NOT NULL,
      user_id      INT UNSIGNED NOT NULL,
      expires_at   BIGINT       NOT NULL,
      PRIMARY KEY  (token),
      KEY          idx_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  try {
    await query("ALTER TABLE password_reset_tokens MODIFY COLUMN expires_at BIGINT NOT NULL");
  } catch (err) { /* ignore */ }
  try {
    await query("ALTER TABLE password_reset_tokens ADD COLUMN otp VARCHAR(10) NULL");
  } catch (err) { /* ignore */ }
  _resetTableReady = true;
}

async function saveResetToken(email, token, userId, otp = null, ttlMs = 30 * 60 * 1000) {
  await ensureResetTable();
  const expiresAt = Date.now() + ttlMs;
  await query(
    `INSERT INTO password_reset_tokens (token, email, user_id, otp, expires_at)
     VALUES (:token, :email, :userId, :otp, :expiresAt)
     ON DUPLICATE KEY UPDATE otp = :otp, expires_at = :expiresAt`,
    { token, email, userId, otp, expiresAt }
  );
}

async function getResetToken(tokenOrOtp, email = null) {
  await ensureResetTable();
  if (!tokenOrOtp && !email) return null;
  const rows = await query(
    `SELECT * FROM password_reset_tokens 
     WHERE (token = :val OR otp = :val OR (email = :email AND otp = :val)) 
       AND expires_at >= :now 
     ORDER BY expires_at DESC LIMIT 1`,
    { val: tokenOrOtp || '', email: email || '', now: Date.now() }
  );
  if (!rows[0]) return null;
  return rows[0];
}

async function deleteResetToken(token) {
  await ensureResetTable();
  await query('DELETE FROM password_reset_tokens WHERE token = :token OR email = :token', { token });
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function createOtp() {
  return String(randomInt(100000, 1000000));
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function toPublicUser(user) {
  if (!user) return user;
  const publicUser = { ...user };
  delete publicUser.password_hash;
  return publicUser;
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation rules
// ─────────────────────────────────────────────────────────────────────────────
const registerRules = [
  body('name').trim().notEmpty().withMessage('Full name is required'),
  body('email').notEmpty().withMessage('Email address is required').bail().isEmail().withMessage('Enter a valid email address'),
  body('phone').optional({ values: 'falsy' }).customSanitizer(normalizePhone),
  body('gender')
    .isIn(['male', 'female'])
    .withMessage('Choose a valid gender')
    .bail()
    .custom((gender, { req }) => {
      if (hasNameGenderMismatch(req.body.name, gender)) {
        throw new Error('Name and gender mismatch.');
      }
      return true;
    }),
  body('password').isLength({ min: 8 }).withMessage('Password should be at least 8 characters')
];

const loginRules = [
  body('email').optional({ values: 'falsy' }).isString(),
  body('phone').optional({ values: 'falsy' }).isString(),
  body('password').notEmpty().withMessage('Password is required')
];

const forgotPasswordRules = [
  body('email').notEmpty().withMessage('Email address is required').bail().isEmail().withMessage('Enter a valid email address')
];

const resetPasswordRules = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
];

// ─────────────────────────────────────────────────────────────────────────────
// Controllers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Registration Step 1: Validate form, check uniqueness, send OTP to EMAIL.
 * Phone is optional (auto-generated fallback if omitted).
 */
async function register(req, res) {
  const email = (req.body.email || '').trim().toLowerCase();
  let phone = normalizePhone(req.body.phone);
  if (!phone) {
    phone = '99' + Math.floor(10000000 + Math.random() * 90000000);
  }

  const existingEmail = await userModel.findByEmailOrPhone(email);
  if (existingEmail) {
    throw new AppError('An account with this email address already exists', 409);
  }

  const otp = createOtp();
  await saveSession(email, {
    name: req.body.name,
    email,
    phone,
    gender: req.body.gender,
    password: req.body.password,
    otp,
  });

  sendOtpEmail(email, otp, req.body.name).catch((err) =>
    console.error('[OTP EMAIL BG ERROR]', err.message || err)
  );

  return ok(res, { email }, 'Verification code sent to your email');
}





/**
 * Registration Step 2: Verify the 6-digit EMAIL OTP → create account.
 */
async function verifyOtp(req, res) {
  const email = (req.body.email || '').trim().toLowerCase();
  const { otp } = req.body;
  if (!email || !otp) throw new AppError('Email and OTP are required', 422);

  const session = await getSession(email);
  if (!session) throw new AppError('Verification session expired. Please register again.', 410);

  if (String(otp) !== String(session.otp)) {
    throw new AppError('Invalid verification code. Please try again.', 422);
  }

  // Double-check uniqueness before account creation
  const existingPhone = await userModel.findByEmailOrPhone(session.phone);
  const existingEmail = await userModel.findByEmailOrPhone(email);
  if (existingPhone || existingEmail) {
    await deleteSession(email);
    throw new AppError('An account with this email or phone already exists', 409);
  }

  const user = await userModel.create({ ...session, phoneVerified: true, emailVerified: true });
  const onlineUser = await userModel.markOnline(user.id);
  await deleteSession(email);
  const token = signToken(onlineUser);
  return created(res, { token, user: toPublicUser(onlineUser), emailVerified: true }, 'Account created');
}

/**
 * Resend email OTP during registration flow.
 */
async function resendOtp(req, res) {
  const email = (req.body.email || '').trim().toLowerCase();
  if (!email) throw new AppError('Email is required', 422);

  let session = await getSession(email);
  if (!session) {
    const existingUser = await userModel.findByEmailOrPhone(email);
    if (existingUser && existingUser.email_verified) {
      throw new AppError('An account with this email address is already verified and active. Please log in.', 409);
    }
    session = { email, name: req.body.name || 'User', phone: '', gender: 'male' };
  }

  const otp = createOtp();
  await saveSession(email, { ...session, otp });

  sendOtpEmail(email, otp, session.name).catch((err) =>
    console.error('[OTP EMAIL BG ERROR]', err.message || err)
  );

  return ok(res, { email }, 'Verification code resent to your email');
}





/**
 * Login: email/phone + password. No OTP needed after registration.
 */
async function login(req, res) {
  const identifier = req.body.email || req.body.phone;
  if (!identifier) throw new AppError('Email or phone is required', 422);
  const user = await userModel.findByEmailOrPhone(identifier);
  if (!user || !(await userModel.verifyPassword(user, req.body.password))) {
    throw new AppError('Invalid credentials', 401);
  }
  if (user.status && user.status !== 'active') {
    throw new AppError('Your account is currently inactive or suspended', 403);
  }
  const onlineUser = await userModel.markOnline(user.id);
  const token = signToken(onlineUser);
  return ok(res, { token, user: toPublicUser(onlineUser) }, 'Logged in');
}

async function me(req, res) {
  return ok(res, { user: req.user });
}

async function logout(req, res) {
  await userModel.markOffline(req.user.id);
  return ok(res, null, 'Logged out');
}

async function heartbeat(req, res) {
  const user = await userModel.markOnline(req.user.id);
  return ok(res, { user: toPublicUser(user) }, 'Active status refreshed');
}

async function forgotPassword(req, res) {
  const email = (req.body.email || '').trim().toLowerCase();
  const user = await userModel.findByEmailOrPhone(email);
  if (user && user.email) {
    const token = randomBytes(32).toString('hex');
    const otp = String(randomInt(100000, 1000000));
    await saveResetToken(user.email, token, user.id, otp);

    const baseUrl = (process.env.APP_URL || 'https://saathika.com').replace(/\/+$/, '');
    const resetLink = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"Saathika Dating" <noreply@saathika.com>`,
        to: user.email,
        subject: '🔐 Reset your Saathika password (OTP & Link)',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background-color: #070B18; color: #ffffff; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #EC4899; font-size: 22px; font-weight: 800; margin: 0;">Saathika Dating</h2>
              <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Password Reset Request</p>
            </div>
            
            <p style="font-size: 14px; color: #e2e8f0; line-height: 1.6;">Hello <strong>${user.name || 'User'}</strong>,</p>
            <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">You requested to reset your password for your Saathika account. You can use either the <strong>6-Digit OTP Code</strong> below or click the button.</p>

            <!-- OTP Box -->
            <div style="text-align: center; margin: 28px 0; padding: 18px; background: rgba(255,255,255,0.03); border-radius: 16px; border: 1px dashed rgba(236,72,153,0.4);">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #ec4899; font-weight: 700; margin-bottom: 8px;">Your Password Reset OTP</div>
              <div style="display: inline-block; background: linear-gradient(135deg, #EC4899 0%, #7C3AED 100%); font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #ffffff; padding: 12px 28px; border-radius: 12px;">
                ${otp}
              </div>
              <p style="font-size: 11px; color: #94a3b8; margin-top: 8px;">Valid for 30 minutes</p>
            </div>

            <!-- Direct Reset Link Button -->
            <div style="text-align: center; margin: 28px 0;">
              <a href="${resetLink}" target="_blank" style="display: inline-block; background: linear-gradient(90deg, #EC4899 0%, #7C3AED 100%); color: #ffffff; font-weight: bold; font-size: 14px; text-decoration: none; padding: 14px 34px; border-radius: 30px; text-transform: uppercase; letter-spacing: 1px;">
                Click Here to Reset Password
              </a>
            </div>

            <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 24px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 16px;">
              Direct URL: <a href="${resetLink}" style="color: #ec4899; text-decoration: underline;">${resetLink}</a>
            </p>
          </div>
        `,
        text: `Reset your Saathika password. Your OTP Code is: ${otp}. Or click this link: ${resetLink}`,
      });
    } catch (err) {
      console.error('[Reset Email] Failed:', err.message);
    }

    const isDev = process.env.NODE_ENV !== 'production';
    return ok(res, isDev ? { resetToken: token, otp } : {}, 'Password reset OTP & link sent to your email');
  }
  return ok(res, {}, 'If this email is registered, you will receive reset instructions shortly');
}

async function verifyResetOtp(req, res) {
  const email = (req.body.email || '').trim().toLowerCase();
  const otp = (req.body.otp || '').trim();
  if (!email || !otp) {
    throw new AppError('Email and 6-digit OTP code are required.', 400);
  }

  const entry = await getResetToken(otp, email);
  if (!entry) {
    throw new AppError('Invalid or expired 6-digit OTP code. Please check and try again.', 400);
  }

  return ok(res, { resetToken: entry.token, email: entry.email, verified: true }, 'OTP verified successfully.');
}

async function resetPassword(req, res) {
  const { token, otp, email, password } = req.body;
  const tokenOrOtp = token || otp;
  if (!tokenOrOtp) {
    throw new AppError('Please provide a valid reset token or 6-digit OTP code.', 400);
  }
  if (!password || String(password).length < 6) {
    throw new AppError('Password must be at least 6 characters long.', 400);
  }

  const entry = await getResetToken(tokenOrOtp, email);
  if (!entry) {
    throw new AppError('Invalid or expired reset link/OTP code. Please request a new one.', 410);
  }

  await userModel.updatePassword(entry.user_id, password);
  await deleteResetToken(entry.token);
  return ok(res, null, 'Password reset successfully. You can now sign in.');
}

module.exports = {
  registerRules, loginRules, forgotPasswordRules, resetPasswordRules,
  register, login, me, logout, heartbeat, verifyOtp, resendOtp, forgotPassword, verifyResetOtp, resetPassword
};
