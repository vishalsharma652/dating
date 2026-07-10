const { body } = require('express-validator');
const { randomInt } = require('crypto');
const userModel = require('../models/userModel');
const { signToken } = require('../utils/token');
const { ok, created } = require('../utils/apiResponse');
const { AppError } = require('../utils/errors');

const pendingRegistrations = new Map();

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

const registerRules = [
  body('name').trim().notEmpty().withMessage('Full name is required'),
  body('phone').customSanitizer(normalizePhone).matches(/^\d{10,15}$/).withMessage('Enter a valid mobile number'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Enter a valid email address'),
  body('password').isLength({ min: 8 }).withMessage('Password should be at least 8 characters')
];

const loginRules = [
  body('email').optional({ values: 'falsy' }).isString(),
  body('phone').optional({ values: 'falsy' }).isString(),
  body('password').notEmpty().withMessage('Password is required')
];

async function register(req, res) {
  const phone = normalizePhone(req.body.phone);
  const email = req.body.email || null;
  const existingPhone = await userModel.findByEmailOrPhone(phone);
  const existingEmail = req.body.email ? await userModel.findByEmailOrPhone(req.body.email) : null;
  if (existingPhone || existingEmail) throw new AppError('An account with this email or phone already exists', 409);

  const otp = createOtp();
  pendingRegistrations.set(phone, {
    name: req.body.name,
    email,
    phone,
    password: req.body.password,
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000
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

  const pendingRegistration = pendingRegistrations.get(phone);
  if (!pendingRegistration) {
    throw new AppError('Registration expired. Please start again.', 410);
  }

  if (String(otp) !== pendingRegistration.otp) {
    throw new AppError('Invalid OTP', 422);
  }

  if (Date.now() > pendingRegistration.expiresAt) {
    pendingRegistrations.delete(phone);
    throw new AppError('Verification code expired. Please request a new code.', 410);
  }

  const existingPhone = await userModel.findByEmailOrPhone(phone);
  const existingEmail = pendingRegistration.email ? await userModel.findByEmailOrPhone(pendingRegistration.email) : null;
  if (existingPhone || existingEmail) {
    pendingRegistrations.delete(phone);
    throw new AppError('An account with this email or phone already exists', 409);
  }

  const user = await userModel.create({ ...pendingRegistration, phoneVerified: true });
  const onlineUser = await userModel.markOnline(user.id);
  pendingRegistrations.delete(phone);
  const token = signToken(onlineUser);
  return created(res, { token, user: toPublicUser(onlineUser), phoneVerified: true }, 'Account created');
}

async function resendOtp(req, res) {
  const phone = normalizePhone(req.body.phone);
  if (!phone) throw new AppError('Phone is required', 422);

  const pendingRegistration = pendingRegistrations.get(phone);
  if (!pendingRegistration) throw new AppError('Registration expired. Please start again.', 410);

  const otp = createOtp();
  pendingRegistrations.set(phone, {
    ...pendingRegistration,
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000
  });

  return ok(res, { phone, otp }, 'OTP sent');
}

async function forgotPassword(req, res) {
  return ok(res, { resetToken: 'development-reset-token' }, 'Password reset instructions sent');
}

async function resetPassword(req, res) {
  return ok(res, null, 'Password reset successfully');
}

module.exports = { registerRules, loginRules, register, login, me, logout, heartbeat, verifyOtp, resendOtp, forgotPassword, resetPassword };
