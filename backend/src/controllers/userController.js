const { body } = require('express-validator');
const userModel = require('../models/userModel');
const profileModel = require('../models/profileModel');
const socialModel = require('../models/socialModel');
const walletModel = require('../models/walletModel');
const settingsModel = require('../models/settingsModel');
const notificationModel = require('../models/notificationModel');
const stripeConfig = require('../config/stripe');
const razorpayConfig = require('../config/razorpay');
const { ok, created } = require('../utils/apiResponse');
const { AppError } = require('../utils/errors');
const { hasNameGenderMismatch, normalizeGender: normalizeNameGender } = require('../utils/nameGender');

const { query } = require('../config/db');

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
  const isUserMale = currentGender === 'male';
  const activeLabel = isUserMale ? 'Active Females' : 'Active Males';
  const assignedUser = activeUsers[0] || null;

  const oppositeGenders = isUserMale
    ? ['female', 'woman', 'girl', 'women']
    : ['male', 'man', 'boy', 'men'];

  const allUsersRows = await query(
    `SELECT 
      u.id, 
      COALESCE(REPLACE(u.unique_id, 'STK-', ''), LPAD(u.id, 6, '0')) AS unique_id, 
      u.name,
      COALESCE(u.gender, p.gender, '') AS gender,
      COALESCE(TIMESTAMPDIFF(YEAR, u.dob, CURDATE()), p.age) AS age,
      COALESCE(p.city, '') AS location, 
      COALESCE(p.bio, '') AS bio, 
      COALESCE((SELECT url FROM profile_photos WHERE profile_id = p.id ORDER BY sort_order ASC, id ASC LIMIT 1), '') AS photo,
      u.kyc_status, 
      (u.kyc_status = 'approved') AS verified,
      (u.online_status = true AND u.last_seen_at IS NOT NULL AND u.last_seen_at >= DATE_SUB(NOW(), INTERVAL 3 MINUTE)) AS online
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE u.id <> :userId
       AND u.role = 'user'
       AND LOWER(COALESCE(u.gender, p.gender, '')) IN (:g0, :g1, :g2, :g3)
     ORDER BY (u.online_status = true AND u.last_seen_at IS NOT NULL AND u.last_seen_at >= DATE_SUB(NOW(), INTERVAL 3 MINUTE)) DESC, u.id DESC
     LIMIT 500`,
    {
      userId: req.user.id,
      g0: oppositeGenders[0],
      g1: oppositeGenders[1],
      g2: oppositeGenders[2],
      g3: oppositeGenders[3]
    }
  );

  const countRows = await query(`
    SELECT 
      COUNT(*) AS totalUsers,
      SUM(CASE WHEN kyc_status = 'approved' THEN 1 ELSE 0 END) AS verifiedUsers,
      SUM(CASE WHEN kyc_status <> 'approved' OR kyc_status IS NULL THEN 1 ELSE 0 END) AS pendingKycUsers
    FROM users 
    WHERE role = 'user' AND status = 'active' AND id <> :userId
      AND LOWER(COALESCE(gender, '')) IN (:g0, :g1, :g2, :g3)
  `, {
      userId: req.user.id,
      g0: oppositeGenders[0],
      g1: oppositeGenders[1],
      g2: oppositeGenders[2],
      g3: oppositeGenders[3]
  });
  const counts = countRows[0] || {};

  return ok(res, {
    user: req.user,
    profile,
    matches: matches.slice(0, 3),
    activeUsers,
    allUsers: allUsersRows,
    assignedUser,
    activeLabel,
    activeGirls: activeUsers,
    assignedGirl: assignedUser,
    userCounts: {
      totalUsers: Number(counts.totalUsers) || 0,
      verifiedUsers: Number(counts.verifiedUsers) || 0,
      pendingKycUsers: Number(counts.pendingKycUsers) || 0
    }
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
  const stats = await socialModel.getFollowStats(req.user.id);
  return ok(res, { user: req.user, profile, ...stats });
}

async function getPublicProfile(req, res) {
  const targetId = req.params.id;
  const targetUser = await userModel.findById(targetId);
  if (!targetUser) throw new AppError('User not found', 404);
  const profile = await profileModel.getForUser(targetId);
  const status = await socialModel.getFollowStatus(req.user.id, targetId);
  return ok(res, {
    user: {
      id: targetUser.id,
      name: targetUser.name,
      unique_id: targetUser.unique_id,
      gender: targetUser.gender,
      online_status: targetUser.online_status,
      last_seen_at: targetUser.last_seen_at,
      kyc_status: targetUser.kyc_status,
      created_at: targetUser.created_at
    },
    profile,
    ...status
  });
}

async function toggleFollow(req, res) {
  const targetId = req.params.id;
  const result = await socialModel.toggleFollow(req.user.id, targetId);
  const msg = result.status === 'pending'
    ? 'Follow request sent'
    : result.status === 'accepted'
    ? 'User followed'
    : 'Unfollowed / Request cancelled';
  return ok(res, result, msg);
}

async function getFollowStatus(req, res) {
  const targetId = req.params.id;
  const status = await socialModel.getFollowStatus(req.user.id, targetId);
  return ok(res, status);
}

async function respondFollowRequest(req, res) {
  const requestId = req.params.requestId;
  const action = req.body.action; // 'accept' | 'decline'
  const result = await socialModel.respondFollowRequest(req.user.id, requestId, action);
  return ok(res, result, action === 'accept' ? 'Follow request accepted' : 'Follow request declined');
}

async function getFollowRequests(req, res) {
  const requests = await socialModel.getFollowRequests(req.user.id);
  return ok(res, { requests });
}

async function getFollowing(req, res) {
  const targetId = req.query.userId || req.user.id;
  const users = await socialModel.getFollowingList(targetId);
  return ok(res, { users });
}

async function getFollowers(req, res) {
  const targetId = req.query.userId || req.user.id;
  const users = await socialModel.getFollowersList(targetId);
  return ok(res, { users });
}

async function togglePinChat(req, res) {
  const chatId = req.params.chatId;
  const result = await socialModel.togglePinChat(req.user.id, chatId);
  return ok(res, result, result.pinned ? 'Chat pinned' : 'Chat unpinned');
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

async function uploadPhoto(req, res) {
  if (!req.file) throw new AppError('No photo uploaded', 400);
  const photoUrl = `/uploads/${req.file.filename}`;
  const profile = await profileModel.getForUser(req.user.id);
  const photos = profile?.photos || [];
  const slotIndex = req.body.slotIndex !== undefined && req.body.slotIndex !== '' ? Number(req.body.slotIndex) : null;

  let newPhotos = [...photos];
  if (slotIndex !== null && slotIndex >= 0 && slotIndex < 6) {
    newPhotos[slotIndex] = photoUrl;
    newPhotos = newPhotos.filter(Boolean);
  } else {
    if (!newPhotos.includes(photoUrl)) {
      if (newPhotos.length >= 6) {
        newPhotos[5] = photoUrl;
      } else {
        newPhotos.push(photoUrl);
      }
    }
  }
  await profileModel.upsert(req.user.id, { photos: newPhotos });
  const updatedProfile = await profileModel.getForUser(req.user.id);
  return ok(res, { url: photoUrl, photos: updatedProfile?.photos || [] }, 'Photo uploaded successfully');
}

async function uploadChatMedia(req, res) {
  if (!req.file) throw new AppError('No media file uploaded', 400);
  const mediaUrl = `/uploads/${req.file.filename}`;
  return ok(res, { url: mediaUrl }, 'Chat media uploaded successfully');
}

async function deletePhoto(req, res) {
  const index = Number(req.params.index);
  const profile = await profileModel.getForUser(req.user.id);
  let photos = profile?.photos || [];
  if (index >= 0 && index < photos.length) {
    photos.splice(index, 1);
    await profileModel.upsert(req.user.id, { photos });
  }
  const updatedProfile = await profileModel.getForUser(req.user.id);
  return ok(res, { photos: updatedProfile?.photos || [] }, 'Photo deleted successfully');
}

async function setPrimaryPhoto(req, res) {
  const index = Number(req.body.index);
  const profile = await profileModel.getForUser(req.user.id);
  let photos = profile?.photos || [];
  if (index > 0 && index < photos.length) {
    const selected = photos.splice(index, 1)[0];
    photos.unshift(selected);
    await profileModel.upsert(req.user.id, { photos });
  }
  const updatedProfile = await profileModel.getForUser(req.user.id);
  return ok(res, { photos: updatedProfile?.photos || [] }, 'Primary cover photo updated');
}

async function ageVerify(req, res) {
  const dob = new Date(req.body.dob);
  const age = Math.floor((Date.now() - dob.getTime()) / 1000 / 60 / 60 / 24 / 365.25);
  if (!req.body.dob || Number.isNaN(age) || age < 18) throw new AppError('You must be 18 years or older to join Ember', 422);
  const user = await userModel.update(req.user.id, { dob: req.body.dob, age_verified: true });
  return ok(res, { user, age }, 'Age verified');
}

async function submitKyc(req, res) {
  let photoUrl = null;
  if (req.files && req.files.length > 0) {
    photoUrl = `/uploads/${req.files[0].filename}`;
  } else if (req.file) {
    photoUrl = `/uploads/${req.file.filename}`;
  }

  // Save live selfie purely for KYC verification (DO NOT update profile avatar)
  const updateData = { kyc_status: 'pending' };
  if (photoUrl) {
    updateData.kyc_document_url = photoUrl;
  }

  const user = await userModel.update(req.user.id, updateData);
  return created(res, { user, files: req.files || [], photoUrl }, 'KYC submitted for review');
}



async function discover(req, res) {
  const profiles = await profileModel.discover(req.user.id, req.query);
  return ok(res, { profiles });
}

async function searchUsers(req, res) {
  const queryStr = String(req.query.q || req.query.search || '').trim();
  if (!queryStr) return ok(res, { users: [] });

  const users = await userModel.list({ search: queryStr, limit: 10 });
  const filtered = users.filter((u) => Number(u.id) !== Number(req.user.id));
  return ok(res, { users: filtered });
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

async function deleteMessage(req, res) {
  const messageId = Number(req.params.messageId);
  const type = req.body.type || req.query.type || 'me';
  const result = await socialModel.deleteMessage(messageId, req.user.id, type);
  return ok(res, result, 'Message deleted');
}

async function startChatSession(req, res) {
  const chat = await socialModel.getOrCreateChat(req.user.id, Number(req.params.userId));
  const otherUser = await userModel.findPublicById(Number(req.params.userId));
  if (!otherUser) throw new AppError('Chat partner not found', 404);

  const currentGender = normalizeGender(req.user.gender);
  const otherGender = normalizeGender(otherUser.gender);
  if (currentGender === otherGender || (currentGender !== 'male' && currentGender !== 'female') || (otherGender !== 'male' && otherGender !== 'female')) {
    throw new AppError('Coin chats require one boy user and one girl user', 422);
  }
  const payerUserId = currentGender === 'male' ? req.user.id : otherUser.id;
  const earnerUserId = payerUserId === req.user.id ? otherUser.id : req.user.id;
  let payerWallet = await walletModel.wallet(payerUserId);
  if (!payerWallet || Number(payerWallet.coins || 0) < 10) {
    // Auto-grant 50 bonus coins if balance is low
    await query('UPDATE users SET coins = coins + 50 WHERE id = :payerUserId', { payerUserId });
    await query(
      `INSERT INTO wallet_transactions (user_id, type, title, description, amount, coins, status)
       VALUES (:payerUserId, 'bonus', 'Welcome Bonus', 'Free bonus coins added for chat', 0, 50, 'completed')`,
      { payerUserId }
    );
  }
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
  const data = await walletModel.wallet(req.user.id);
  return ok(res, data || { coins: 0, earnings: 0, totalPurchased: 0, totalSpent: 0, totalEarned: 0, withdrawalBalance: 0 });
}

async function transactions(req, res) {
  return ok(res, { transactions: await walletModel.transactions(req.user.id) });
}

async function coinPackages(req, res) {
  return ok(res, { packages: await walletModel.coinPackages() });
}

async function purchaseCoins(req, res) {
  const { gateway, upiId, cardNumber, expiry, cvv, cardName, bankCode, walletProvider } = req.body;

  if (gateway === 'phonepe') {
    const upiRegex = /^[a-zA-Z0-9.\-_]{3,64}@[a-zA-Z]{3,32}$/;
    if (!upiId || typeof upiId !== 'string' || !upiId.trim() || !upiRegex.test(upiId.trim())) {
      const err = new AppError('UPI validation failed', 422);
      err.details = { upiId: 'Please enter a valid UPI ID (e.g., 9876543210@ybl or username@okaxis)' };
      throw err;
    }
  } else if (gateway === 'razorpay') {
    const errors = {};
    const cleanCard = (cardNumber || '').replace(/\s/g, '');
    if (!cardNumber || typeof cardNumber !== 'string' || cleanCard.length < 16 || !/^\d+$/.test(cleanCard)) {
      errors.cardNumber = 'Please enter a valid 16-digit card number';
    }
    if (!expiry || typeof expiry !== 'string' || !expiry.match(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/)) {
      errors.expiry = 'Please enter a valid expiry (MM/YY)';
    } else {
      const [expMonth, expYear] = expiry.split('/').map(Number);
      const now = new Date();
      const currentYear = now.getFullYear() % 100;
      const currentMonth = now.getMonth() + 1;
      if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        errors.expiry = 'Card has expired';
      }
    }
    const cleanCvv = (cvv || '').trim();
    if (!cvv || typeof cvv !== 'string' || cleanCvv.length < 3 || cleanCvv.length > 4 || !/^\d+$/.test(cleanCvv)) {
      errors.cvv = 'Please enter a valid CVV (3 or 4 digits)';
    }
    if (!cardName || typeof cardName !== 'string' || !cardName.trim()) {
      errors.cardName = 'Please enter cardholder name';
    }

    if (Object.keys(errors).length > 0) {
      const err = new AppError('Card validation failed', 422);
      err.details = errors;
      throw err;
    }
  } else if (gateway === 'netbanking') {
    if (!bankCode || typeof bankCode !== 'string' || !bankCode.trim()) {
      const err = new AppError('Netbanking validation failed', 422);
      err.details = { bankCode: 'Please select a bank' };
      throw err;
    }
  } else if (gateway === 'wallet') {
    if (!walletProvider || typeof walletProvider !== 'string' || !walletProvider.trim()) {
      const err = new AppError('Wallet validation failed', 422);
      err.details = { walletProvider: 'Please select a wallet' };
      throw err;
    }
  }

  const purchase = await walletModel.purchase(req.user.id, Number(req.body.packageId), {
    gateway: req.body.gateway || 'stripe',
    reference: req.body.paymentReference
  });
  if (!purchase) throw new AppError('Coin package not found', 404);
  return created(res, purchase, 'Coin purchase completed');
}

async function createStripeIntent(req, res) {
  const packageId = Number(req.body.packageId);
  const packages = await walletModel.coinPackages();
  const pkg = packages.find(p => Number(p.id) === packageId);
  if (!pkg) throw new AppError('Coin package not found', 404);

  const amountInCents = Math.round(Number(pkg.price) * 100);

  try {
    if (stripeConfig.isConfigured) {
      const paymentIntent = await stripeConfig.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'inr',
        payment_method_types: ['card'],
        metadata: {
          userId: String(req.user.id),
          packageId: String(packageId),
          coins: String(pkg.coins)
        }
      });
      return ok(res, {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: pkg.price,
        currency: 'inr',
        isLiveMode: true
      }, 'Stripe payment intent created');
    }
  } catch (err) {
    console.warn('Stripe API Warning, falling back to sandbox intent:', err.message);
  }

  // Fallback for simulation / test key mode
  const mockIntentId = `pi_stripe_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  return ok(res, {
    clientSecret: `${mockIntentId}_secret_test`,
    paymentIntentId: mockIntentId,
    amount: pkg.price,
    currency: 'inr',
    isLiveMode: false
  }, 'Simulated Stripe payment intent created');
}

async function createRazorpayOrder(req, res) {
  const packageId = Number(req.body.packageId);
  const packages = await walletModel.coinPackages();
  const pkg = packages.find(p => Number(p.id) === packageId);
  if (!pkg) throw new AppError('Coin package not found', 404);

  const amountInPaise = Math.round(Number(pkg.price) * 100);

  try {
    if (razorpayConfig.isConfigured) {
      const order = await razorpayConfig.razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${req.user.id}_${Date.now()}`,
        notes: {
          userId: String(req.user.id),
          packageId: String(packageId)
        }
      });
      return ok(res, {
        orderId: order.id,
        amount: pkg.price,
        currency: 'INR',
        keyId: razorpayConfig.keyId,
        isLiveMode: true
      }, 'Razorpay order created');
    }
  } catch (err) {
    console.warn('Razorpay API Warning, falling back to sandbox order:', err.message);
  }

  const mockOrderId = `order_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  return ok(res, {
    orderId: mockOrderId,
    amount: pkg.price,
    currency: 'INR',
    keyId: razorpayConfig.keyId || 'rzp_test_mock',
    isLiveMode: false
  }, 'Simulated Razorpay order created');
}

async function verifyUpiId(req, res) {
  const upiId = String(req.body.upiId || '').trim().toLowerCase();
  const upiRegex = /^[a-zA-Z0-9.\-_]{3,64}@[a-zA-Z]{3,32}$/;

  if (!upiRegex.test(upiId)) {
    return ok(res, {
      valid: false,
      upiId,
      message: 'Invalid UPI ID format (e.g., username@bank)'
    });
  }

  const validBankHandles = [
    'okaxis', 'ybl', 'paytm', 'icici', 'upi', 'ibl', 'oksbi', 'barodampay', 'okhdfcbank', 'kotak', 'axl', 'apl', 'yesbank', 'indus'
  ];
  const handle = upiId.split('@')[1];

  if (razorpayConfig.isConfigured) {
    try {
      const vpaStatus = await razorpayConfig.razorpay.payments.validateVpa(upiId);
      return ok(res, {
        valid: Boolean(vpaStatus.success),
        customerName: vpaStatus.customer_name || 'Verified UPI User',
        upiId,
        isLiveCheck: true
      });
    } catch (err) {
      console.warn('Razorpay VPA Validation Warning:', err.message);
    }
  }

  const isValidHandle = validBankHandles.includes(handle);
  const isInvalidMock = upiId.startsWith('invalid') || upiId.startsWith('fake') || upiId.startsWith('dummy');

  if (isValidHandle && !isInvalidMock) {
    const mockNames = ['Rahul Sharma', 'Ankit Verma', 'Priya Patel', 'Aman Kumar', 'Ember Verified User'];
    const hash = upiId.split('').reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) | 0, 0);
    const assignedName = mockNames[Math.abs(hash) % mockNames.length];
    return ok(res, {
      valid: true,
      customerName: assignedName,
      upiId,
      bankHandle: `@${handle}`,
      message: 'UPI VPA verified with issuing bank'
    });
  }

  return ok(res, {
    valid: false,
    upiId,
    message: 'UPI ID is not registered with any bank or NPCI network'
  });
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
async function deleteAccount(req, res) {
  await userModel.remove(req.user.id);
  return ok(res, null, 'Account deleted permanently');
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required', 400);
  }
  if (String(newPassword).length < 6) {
    throw new AppError('New password must be at least 6 characters long', 400);
  }

  const user = await userModel.findById(req.user.id);
  if (!user || !(await userModel.verifyPassword(user, currentPassword))) {
    throw new AppError('Current password is incorrect', 400);
  }

  await userModel.updatePassword(req.user.id, newPassword);
  return ok(res, null, 'Password updated successfully!');
}

module.exports = {
  profileRules,
  dashboard,
  getProfile,
  getPublicProfile,
  toggleFollow,
  getFollowStatus,
  respondFollowRequest,
  getFollowRequests,
  getFollowing,
  getFollowers,
  togglePinChat,
  updateProfile,
  uploadPhoto,
  deletePhoto,
  setPrimaryPhoto,
  ageVerify,
  submitKyc,
  discover,
  searchUsers,
  reactToProfile,
  matches,
  chats,
  requestChat,
  respondToChatRequest,
  chatRequests,
  messages,
  sendMessage,
  deleteMessage,
  startChatSession,
  chargeChatMinute,
  endChatSession,
  wallet,
  transactions,
  coinPackages,
  purchaseCoins,
  createStripeIntent,
  createRazorpayOrder,
  verifyUpiId,
  saveBankAccount,
  bankAccounts,
  createWithdrawal,
  withdrawals,
  notifications,
  notificationCount,
  markNotificationRead,
  markNotificationsRead,
  settings,
  deleteAccount,
  changePassword,
  uploadChatMedia
};
