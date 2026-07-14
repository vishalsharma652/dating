const router = require('express').Router();
const { body, param } = require('express-validator');
const user = require('../controllers/userController');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const asyncHandler = require('../utils/asyncHandler');

router.get('/dashboard', asyncHandler(user.dashboard));
router.get('/profile', asyncHandler(user.getProfile));
router.put('/profile', user.profileRules, validate, asyncHandler(user.updateProfile));
router.post('/profile/setup', user.profileRules, validate, asyncHandler(user.updateProfile));
router.post('/profile/photo', upload.single('photo'), asyncHandler(user.uploadPhoto));
router.post('/profile/age-verify', [body('dob').isISO8601()], validate, asyncHandler(user.ageVerify));
router.post('/profile/kyc', upload.array('documents', 6), asyncHandler(user.submitKyc));
router.post('/profile/mobile/send-otp', asyncHandler((req, res) => res.json({ success: true, message: 'OTP sent', data: { otp: '123456' } })));
router.post('/profile/mobile/verify', asyncHandler((req, res) => res.json({ success: true, message: 'Mobile verified', data: { phoneVerified: true } })));

router.get('/discover', asyncHandler(user.discover));
router.post('/discover/:id/action', [param('id').isInt(), body('action').isIn(['like', 'pass', 'super_like'])], validate, asyncHandler(user.reactToProfile));
router.get('/matches', asyncHandler(user.matches));
router.get('/chat', asyncHandler(user.chats));
router.get('/chat/requests', asyncHandler(user.chatRequests));
router.post('/chat/:userId/request', [param('userId').isInt()], validate, asyncHandler(user.requestChat));
router.patch('/chat/requests/:requestId', [param('requestId').isInt(), body('status').isIn(['accepted', 'rejected'])], validate, asyncHandler(user.respondToChatRequest));
router.post('/chat/:userId/session', [param('userId').isInt()], validate, asyncHandler(user.startChatSession));
router.post('/chat/sessions/:sessionId/charge-minute', [param('sessionId').isInt()], validate, asyncHandler(user.chargeChatMinute));
router.patch('/chat/sessions/:sessionId/end', [param('sessionId').isInt()], validate, asyncHandler(user.endChatSession));
router.get('/chat/:userId/messages', [param('userId').isInt()], validate, asyncHandler(user.messages));
router.post('/chat/:userId/messages', [param('userId').isInt(), body('text').trim().notEmpty()], validate, asyncHandler(user.sendMessage));

router.get('/wallet', asyncHandler(user.wallet));
router.get('/wallet/history', asyncHandler(user.transactions));
router.get('/wallet/coins', asyncHandler(user.coinPackages));
router.post('/wallet/coins/purchase', [
  body('packageId').isInt(),
  body('gateway').optional({ values: 'falsy' }).isIn(['razorpay', 'cashfree', 'phonepe']),
  body('paymentReference').optional({ values: 'falsy' }).isString(),
  body('upiId').optional({ values: 'falsy' }).isString(),
  body('cardNumber').optional({ values: 'falsy' }).isString(),
  body('expiry').optional({ values: 'falsy' }).isString(),
  body('cvv').optional({ values: 'falsy' }).isString(),
  body('cardName').optional({ values: 'falsy' }).isString()
], validate, asyncHandler(user.purchaseCoins));
router.get('/wallet/bank-accounts', asyncHandler(user.bankAccounts));
router.post('/wallet/bank-accounts', [
  body('accountHolderName').trim().notEmpty(),
  body('bankName').optional({ values: 'falsy' }).isString(),
  body('accountNumber').optional({ values: 'falsy' }).isString(),
  body('ifscCode').optional({ values: 'falsy' }).isString(),
  body('upiId').optional({ values: 'falsy' }).isString()
], validate, asyncHandler(user.saveBankAccount));
router.post('/withdraw', [body('amount').isFloat({ min: 500 }), body('method').isIn(['upi', 'bank_transfer'])], validate, asyncHandler(user.createWithdrawal));
router.get('/withdraw/history', asyncHandler(user.withdrawals));

router.get('/notifications', asyncHandler(user.notifications));
router.get('/notifications/count', asyncHandler(user.notificationCount));
router.patch('/notifications/read-all', asyncHandler(user.markNotificationsRead));
router.patch('/notifications/:id/read', [param('id').isInt()], validate, asyncHandler(user.markNotificationRead));
router.get('/settings', asyncHandler(user.settings));

module.exports = router;
