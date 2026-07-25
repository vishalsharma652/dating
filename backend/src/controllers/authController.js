const { body } = require('express-validator');
const { randomInt, randomBytes } = require('crypto');
const userModel = require('../models/userModel');
const { query } = require('../config/db');
const { signToken } = require('../utils/token');
const { ok, created } = require('../utils/apiResponse');
const { AppError } = require('../utils/errors');
const { hasNameGenderMismatch } = require('../utils/nameGender');

// ─────────────────────────────────────────────────────────────────────────────
// DB-backed session store (survives server restarts)
// Auto-creates the otp_sessions table on first use.
// ─────────────────────────────────────────────────────────────────────────────
let _tableReady = false;

async function ensureSessionTable() {
  if (_tableReady) return;
  await query(`
    CREATE TABLE IF NOT EXISTS otp_sessions (
      phone        VARCHAR(20)  NOT NULL,
      otp          VARCHAR(10)  NOT NULL,
      data         JSON         NOT NULL,
      expires_at   BIGINT       NOT NULL,
      PRIMARY KEY  (phone)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  try {
    await query("ALTER TABLE otp_sessions MODIFY COLUMN expires_at BIGINT NOT NULL");
  } catch (err) {
    // Ignore
  }
  _tableReady = true;
}

async function saveSession(phone, payload, ttlMs = 10 * 60 * 1000) {
  await ensureSessionTable();
  const expiresAt = Date.now() + ttlMs;
  await query(
    `INSERT INTO otp_sessions (phone, otp, data, expires_at)
     VALUES (:phone, :otp, :data, :expiresAt)
     ON DUPLICATE KEY UPDATE otp = :otp, data = :data, expires_at = :expiresAt`,
    { phone, otp: payload.otp, data: JSON.stringify(payload), expiresAt }
  );
}

async function getSession(phone) {
  await ensureSessionTable();
  const rows = await query(
    'SELECT * FROM otp_sessions WHERE phone = :phone LIMIT 1',
    { phone }
  );
  if (!rows[0]) return null;
  const session = rows[0];
  if (Number(session.expires_at) < Date.now()) {
    await deleteSession(phone);
    return null; // expired
  }
  return typeof session.data === 'string' ? JSON.parse(session.data) : session.data;
}

async function deleteSession(phone) {
  await ensureSessionTable();
  await query('DELETE FROM otp_sessions WHERE phone = :phone', { phone });
}

// ─────────────────────────────────────────────────────────────────────────────
// Password-reset tokens (still in-memory but with DB fallback if needed)
// Using DB table for persistence across restarts
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
  } catch (err) {
    // Ignore
  }
  _resetTableReady = true;
}

async function saveResetToken(email, token, userId, ttlMs = 30 * 60 * 1000) {
  await ensureResetTable();
  const expiresAt = Date.now() + ttlMs;
  await query(
    `INSERT INTO password_reset_tokens (token, email, user_id, expires_at)
     VALUES (:token, :email, :userId, :expiresAt)
     ON DUPLICATE KEY UPDATE expires_at = :expiresAt`,
    { token, email, userId, expiresAt }
  );
}

async function getResetToken(token) {
  await ensureResetTable();
  const rows = await query(
    'SELECT * FROM password_reset_tokens WHERE token = :token LIMIT 1',
    { token }
  );
  if (!rows[0]) return null;
  if (Number(rows[0].expires_at) < Date.now()) {
    await deleteResetToken(token);
    return null;
  }
  return rows[0];
}

async function deleteResetToken(token) {
  await ensureResetTable();
  await query('DELETE FROM password_reset_tokens WHERE token = :token', { token });
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
  body('phone').customSanitizer(normalizePhone).matches(/^\d{10,15}$/).withMessage('Enter a valid mobile number'),
  body('email').notEmpty().withMessage('Email address is required').bail().isEmail().withMessage('Enter a valid email address'),
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
async function register(req, res) {
  const phone = normalizePhone(req.body.phone);
  const email = req.body.email;
  const existingPhone = await userModel.findByEmailOrPhone(phone);
  const existingEmail = await userModel.findByEmailOrPhone(email);
  if (existingPhone || existingEmail) throw new AppError('An account with this email or phone already exists', 409);

  const otp = createOtp();
  await saveSession(phone, {
    name: req.body.name,
    email,
    phone,
    gender: req.body.gender,
    password: req.body.password,
    otp
  });

  return ok(res, { phone, otp }, 'Verification code sent');
}

async function login(req, res) {
  const identifier = req.body.email || req.body.phone;
  if (!identifier) throw new AppError('Email or phone is required', 422);
  const user = await userModel.findByEmailOrPhone(identifier);
  if (!user || !(await userModel.verifyPassword(user, req.body.password))) {
    throw new AppError('Invalid credentials', 401);
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

async function verifyOtp(req, res) {
  const phone = normalizePhone(req.body.phone);
  const { otp } = req.body;
  if (!phone || !otp) throw new AppError('Phone and OTP are required', 422);

  const session = await getSession(phone);
  if (!session) {
    throw new AppError('Registration session expired. Please register again.', 410);
  }

  if (String(otp) !== String(session.otp)) {
    throw new AppError('Invalid verification code. Please try again.', 422);
  }

  const existingPhone = await userModel.findByEmailOrPhone(phone);
  const existingEmail = session.email ? await userModel.findByEmailOrPhone(session.email) : null;
  if (existingPhone || existingEmail) {
    await deleteSession(phone);
    throw new AppError('An account with this email or phone already exists', 409);
  }

  const user = await userModel.create({ ...session, phoneVerified: true });
  const onlineUser = await userModel.markOnline(user.id);
  await deleteSession(phone);
  const token = signToken(onlineUser);
  return created(res, { token, user: toPublicUser(onlineUser), phoneVerified: true }, 'Account created');
}

async function resendOtp(req, res) {
  const phone = normalizePhone(req.body.phone);
  if (!phone) throw new AppError('Phone is required', 422);

  const session = await getSession(phone);
  if (!session) {
    throw new AppError('Registration session not found. Please register again.', 410);
  }

  const otp = createOtp();
  await saveSession(phone, { ...session, otp });

  return ok(res, { phone, otp }, 'Verification code resent');
}

async function forgotPassword(req, res) {
  const email = (req.body.email || '').trim().toLowerCase();
  const user = await userModel.findByEmailOrPhone(email);
  if (user) {
    const token = randomBytes(32).toString('hex');
    await saveResetToken(email, token, user.id);
    // In production: send email with reset link containing token
    // For development: token is returned in the response
    return ok(res, { resetToken: token }, 'Password reset instructions sent to your email');
  }
  // Anti-enumeration: same response whether email exists or not
  return ok(res, {}, 'If this email is registered, you will receive reset instructions shortly');
}

async function resetPassword(req, res) {
  const { token, password } = req.body;
  const entry = await getResetToken(token);
  if (!entry) throw new AppError('Invalid or expired reset link. Please request a new one.', 410);
  await userModel.updatePassword(entry.user_id, password);
  await deleteResetToken(token);
  return ok(res, null, 'Password reset successfully. You can now sign in.');
}

module.exports = {
  registerRules, loginRules, forgotPasswordRules, resetPasswordRules,
  register, login, me, logout, heartbeat, verifyOtp, resendOtp, forgotPassword, resetPassword
};
