const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const userModel = require('../models/userModel');
const adminModel = require('../models/adminModel');
const { signToken } = require('../utils/token');
const { ok, created } = require('../utils/apiResponse');
const { AppError } = require('../utils/errors');

const loginRules = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

async function ensureEnvAdmin() {
  let admin = await userModel.findByEmailOrPhone(env.adminEmail);
  if (!admin) {
    admin = await userModel.create({
      name: 'Admin',
      email: env.adminEmail,
      phone: '9999999999',
      password: env.adminPassword,
      role: 'admin'
    });
  }
  return admin;
}

async function login(req, res) {
  const admin = await ensureEnvAdmin();
  if (req.body.email !== admin.email || !(await bcrypt.compare(req.body.password, admin.password_hash))) {
    throw new AppError('Invalid admin credentials', 401);
  }
  const token = signToken(admin);
  delete admin.password_hash;
  return ok(res, { token, user: admin }, 'Admin logged in');
}

async function dashboard(req, res) {
  return ok(res, { dashboard: await adminModel.dashboard() });
}

async function users(req, res) {
  return ok(res, { users: await userModel.list(req.query) });
}

async function updateUser(req, res) {
  return ok(res, { user: await userModel.update(Number(req.params.id), req.body) }, 'User updated');
}

async function deleteUser(req, res) {
  return ok(res, { user: await userModel.update(Number(req.params.id), { status: 'deleted' }) }, 'User deleted');
}

async function kycRequests(req, res) {
  return ok(res, { requests: await adminModel.kycRequests(req.query) });
}

async function updateKyc(req, res) {
  return ok(res, { request: await adminModel.updateKyc(Number(req.params.id), req.body) }, 'KYC status updated');
}

async function walletLogs(req, res) {
  return ok(res, { transactions: await adminModel.walletLogs(req.query) });
}

async function adjustCoins(req, res) {
  return ok(res, { user: await adminModel.adjustCoins(req.body) }, 'Wallet adjusted');
}

async function chats(req, res) {
  return ok(res, { chats: await adminModel.chats(req.query) });
}

async function withdrawals(req, res) {
  return ok(res, { withdrawals: await adminModel.withdrawals(req.query) });
}

async function updateWithdrawal(req, res) {
  return ok(res, { withdrawal: await adminModel.updateWithdrawal(Number(req.params.id), req.body) }, 'Withdrawal updated');
}

async function reports(req, res) {
  return ok(res, { reports: await adminModel.reports() });
}

async function categories(req, res) {
  return ok(res, { categories: await adminModel.listTable('categories', req.query) });
}

async function createCategory(req, res) {
  return created(res, { category: await adminModel.createCategory(req.body) }, 'Category created');
}

async function updateCategory(req, res) {
  return ok(res, { category: await adminModel.updateCategory(Number(req.params.id), req.body) }, 'Category updated');
}

async function deleteCategory(req, res) {
  await adminModel.remove('categories', Number(req.params.id));
  return ok(res, null, 'Category deleted');
}

async function products(req, res) {
  return ok(res, { products: await adminModel.listTable('products', req.query) });
}

async function createProduct(req, res) {
  return created(res, { product: await adminModel.createProduct(req.body) }, 'Product created');
}

async function updateProduct(req, res) {
  return ok(res, { product: await adminModel.updateProduct(Number(req.params.id), req.body) }, 'Product updated');
}

async function deleteProduct(req, res) {
  await adminModel.remove('products', Number(req.params.id));
  return ok(res, null, 'Product deleted');
}

async function orders(req, res) {
  return ok(res, { orders: await adminModel.listTable('orders', req.query) });
}

async function updateOrder(req, res) {
  return ok(res, { order: await adminModel.updateOrder(Number(req.params.id), req.body) }, 'Order updated');
}

async function deleteOrder(req, res) {
  await adminModel.remove('orders', Number(req.params.id));
  return ok(res, null, 'Order deleted');
}

async function upload(req, res) {
  const files = (req.files || [req.file]).filter(Boolean).map((file) => ({
    filename: file.filename,
    originalName: file.originalname,
    url: `/uploads/${file.filename}`,
    size: file.size,
    mimetype: file.mimetype
  }));
  return created(res, { files }, 'File uploaded');
}

async function settings(req, res) {
  return ok(res, { settings: await adminModel.settings() });
}

async function upsertSetting(req, res) {
  return ok(res, { setting: await adminModel.upsertSetting(req.body.key, req.body.value) }, 'Setting saved');
}

module.exports = {
  loginRules,
  login,
  dashboard,
  users,
  updateUser,
  deleteUser,
  kycRequests,
  updateKyc,
  walletLogs,
  adjustCoins,
  chats,
  withdrawals,
  updateWithdrawal,
  reports,
  categories,
  createCategory,
  updateCategory,
  deleteCategory,
  products,
  createProduct,
  updateProduct,
  deleteProduct,
  orders,
  updateOrder,
  deleteOrder,
  upload,
  settings,
  upsertSetting
};
