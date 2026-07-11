const { body } = require('express-validator');
const userModel = require('../models/userModel');
const profileModel = require('../models/profileModel');
const socialModel = require('../models/socialModel');
const walletModel = require('../models/walletModel');
const settingsModel = require('../models/settingsModel');
const notificationModel = require('../models/notificationModel');
const { ok, created } = require('../utils/apiResponse');
const { AppError } = require('../utils/errors');
const { hasNameGenderMismatch, normalizeGender: normalizeNameGender } = require('../utils/nameGender');

const profileRules = [
  body('name').optional().trim().notEmpty(),
  body('age').optional().isInt({ min: 18 }),
  body('bio').optional().isLength({ max: 180 }),
  body('photos').optional().isArray()
];

async function dashboard(req, res) {
  const profile = await profileModel.getForUser(req.user.id);
  const matches = await socialModel.matches(req.user.id);
  const activeUsers = await profileModel.activeOppositeGenderUsers(req.user.id);
  const currentGender = normalizeGender(req.user.gender || profile?.gender);
  const activeLabel = currentGender === 'female' ? 'Active Boys' : 'Active Girls';
  const assignedUser = activeUsers[0] || null;
  return ok(res, {
    user: req.user,
    profile,
    matches: matches.slice(0, 3),
    activeUsers,
    assignedUser,
    activeLabel,
    activeGirls: activeUsers,
    assignedGirl: assignedUser
  });
}

function normalizeGender(value) {
  const gender = String(value || '').trim().toLowerCase();
  if (['female', 'woman', 'girl', 'women'].includes(gender)) return 'female';
  if (['male', 'man', 'boy', 'men'].includes(gender)) return 'male';
  return gender;
}

async function getProfile(req, res) {
  const profile = await profileModel.getForUser(req.user.id);
  return ok(res, { user: req.user, profile });
}

async function updateProfile(req, res) {
  const currentProfile = await profileModel.getForUser(req.user.id);
  const nextName = req.body.name || req.user.name;
  const nextGender = req.body.gender || req.user.gender || currentProfile?.gender;
  if (hasNameGenderMismatch(nextName, nextGender)) {
    throw new AppError('Validation failed', 422, [{
      field: 'gender',
      message: 'Name and gender mismatch.'
    }]);
  }

  const userFields = {};
  if (req.body.name) userFields.name = req.body.name;
  if (req.body.gender) userFields.gender = normalizeNameGender(req.body.gender) || req.body.gender;
  const user = Object.keys(userFields).length ? await userModel.update(req.user.id, userFields) : req.user;
  const profile = await profileModel.upsert(req.user.id, req.body);
  return ok(res, { user, profile }, 'Profile updated');
}

async function ageVerify(req, res) {
  const dob = new Date(req.body.dob);
  const age = Math.floor((Date.now() - dob.getTime()) / 1000 / 60 / 60 / 24 / 365.25);
  if (!req.body.dob || Number.isNaN(age) || age < 18) throw new AppError('You must be 18 years or older to join Ember', 422);
  const user = await userModel.update(req.user.id, { dob: req.body.dob, age_verified: true });
  return ok(res, { user, age }, 'Age verified');
}

async function submitKyc(req, res) {
  const user = await userModel.update(req.user.id, { kyc_status: 'pending' });
  return created(res, { user, files: req.files || [] }, 'KYC submitted for review');
}

async function discover(req, res) {
  const profiles = await profileModel.discover(req.user.id, req.query);
  return ok(res, { profiles });
}

async function reactToProfile(req, res) {
  await socialModel.like(req.user.id, Number(req.params.id), req.body.action || 'like');
  return ok(res, null, 'Profile action saved');
}

async function matches(req, res) {
  return ok(res, { matches: await socialModel.matches(req.user.id) });
}

async function chats(req, res) {
  return ok(res, { chats: await socialModel.chats(req.user.id) });
}

async function requestChat(req, res) {
  if (Number(req.params.userId) === Number(req.user.id)) throw new AppError('You cannot request a chat with yourself', 422);
  return created(res, { request: await socialModel.createChatRequest(req.user.id, Number(req.params.userId)) }, 'Chat request sent');
}

async function respondToChatRequest(req, res) {
  const request = await socialModel.respondToChatRequest(req.user.id, Number(req.params.requestId), req.body.status);
  if (!request) throw new AppError('Chat request not found', 404);
  return ok(res, { request }, 'Chat request updated');
}

async function chatRequests(req, res) {
  return ok(res, { requests: await socialModel.chatRequests(req.user.id) });
}

async function messages(req, res) {
  const otherUserId = Number(req.params.userId);
  const chat = await socialModel.getOrCreateChat(req.user.id, otherUserId);
  const otherUser = await socialModel.chatPartner(req.user.id, otherUserId);
  return ok(res, { chat: { ...chat, otherUser }, messages: await socialModel.messages(chat.id, req.user.id) });
}

async function sendMessage(req, res) {
  const chat = await socialModel.getOrCreateChat(req.user.id, Number(req.params.userId));
  const message = await socialModel.sendMessage(chat.id, req.user.id, req.body.text, req.body.type || 'text');
  return created(res, { message }, 'Message sent');
}

async function startChatSession(req, res) {
  const chat = await socialModel.getOrCreateChat(req.user.id, Number(req.params.userId));
  const otherUser = await userModel.findPublicById(Number(req.params.userId));
  if (!otherUser) throw new AppError('Chat partner not found', 404);

  const currentGender = String(req.user.gender || '').toLowerCase();
  const otherGender = String(otherUser.gender || '').toLowerCase();
  const payerUserId = currentGender === 'female' && otherGender !== 'female' ? otherUser.id : req.user.id;
  const earnerUserId = payerUserId === req.user.id ? otherUser.id : req.user.id;
  const session = await socialModel.startChatSession(chat.id, payerUserId, earnerUserId, await settingsModel.chatSettings());
  return created(res, { session }, 'Chat session started');
}

async function chargeChatMinute(req, res) {
  const charge = await socialModel.chargeChatMinute(Number(req.params.sessionId));
  if (!charge) throw new AppError('Active chat session not found', 404);
  return ok(res, { charge }, charge.charged ? 'Chat minute charged' : 'Chat session ended');
}

async function endChatSession(req, res) {
  const session = await socialModel.endChatSession(Number(req.params.sessionId), req.user.id);
  if (!session) throw new AppError('Chat session not found', 404);
  return ok(res, { session }, 'Chat session ended');
}

async function wallet(req, res) {
  return ok(res, { coins: req.user.coins, earnings: req.user.earnings });
}

async function transactions(req, res) {
  return ok(res, { transactions: await walletModel.transactions(req.user.id) });
}

async function coinPackages(req, res) {
  return ok(res, { packages: await walletModel.coinPackages() });
}

async function purchaseCoins(req, res) {
  const purchase = await walletModel.purchase(req.user.id, Number(req.body.packageId), {
    gateway: req.body.gateway,
    reference: req.body.paymentReference
  });
  if (!purchase) throw new AppError('Coin package not found', 404);
  return created(res, purchase, 'Coin purchase completed');
}

async function saveBankAccount(req, res) {
  return created(res, { bankAccount: await walletModel.saveBankAccount(req.user.id, req.body) }, 'Bank account submitted for verification');
}

async function bankAccounts(req, res) {
  return ok(res, { bankAccounts: await walletModel.bankAccounts(req.user.id) });
}

async function createWithdrawal(req, res) {
  if (Number(req.body.amount) < 500) throw new AppError('Minimum withdrawal amount is 500', 422);
  return created(res, { withdrawal: await walletModel.createWithdrawal(req.user.id, req.body) }, 'Withdrawal requested');
}

async function withdrawals(req, res) {
  return ok(res, { withdrawals: await walletModel.withdrawals(req.user.id) });
}

async function notifications(req, res) {
  return ok(res, {
    notifications: await notificationModel.list(req.user.id, req.query),
    unread: await notificationModel.unreadCount(req.user.id)
  });
}

async function notificationCount(req, res) {
  return ok(res, { unread: await notificationModel.unreadCount(req.user.id) });
}

async function markNotificationRead(req, res) {
  await notificationModel.markRead(req.user.id, Number(req.params.id));
  return ok(res, { unread: await notificationModel.unreadCount(req.user.id) }, 'Notification marked as read');
}

async function markNotificationsRead(req, res) {
  await notificationModel.markAllRead(req.user.id);
  return ok(res, { unread: 0 }, 'Notifications marked as read');
}

async function settings(req, res) {
  return ok(res, {
    settings: {
      notifications: true,
      profileVisible: true,
      language: 'English',
      ...(await settingsModel.chatSettings())
    }
  });
}

module.exports = {
  profileRules,
  dashboard,
  getProfile,
  updateProfile,
  ageVerify,
  submitKyc,
  discover,
  reactToProfile,
  matches,
  chats,
  requestChat,
  respondToChatRequest,
  chatRequests,
  messages,
  sendMessage,
  startChatSession,
  chargeChatMinute,
  endChatSession,
  wallet,
  transactions,
  coinPackages,
  purchaseCoins,
  saveBankAccount,
  bankAccounts,
  createWithdrawal,
  withdrawals,
  notifications,
  notificationCount,
  markNotificationRead,
  markNotificationsRead,
  settings
};
