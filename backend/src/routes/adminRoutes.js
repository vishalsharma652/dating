const router = require('express').Router();
const { body, param } = require('express-validator');
const admin = require('../controllers/adminController');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const asyncHandler = require('../utils/asyncHandler');

router.post('/login', admin.loginRules, validate, asyncHandler(admin.login));

router.use(authenticate, authorize('admin'));
router.get('/dashboard', asyncHandler(admin.dashboard));
router.get('/users', asyncHandler(admin.users));
router.patch('/users/:id', [param('id').isInt()], validate, asyncHandler(admin.updateUser));
router.delete('/users/:id', [param('id').isInt()], validate, asyncHandler(admin.deleteUser));

router.get('/kyc', asyncHandler(admin.kycRequests));
router.patch('/kyc/:id', [param('id').isInt(), body('status').isIn(['pending', 'approved', 'rejected'])], validate, asyncHandler(admin.updateKyc));

router.get('/wallet/transactions', asyncHandler(admin.walletLogs));
router.post('/wallet/adjust', [
  body('userId').isInt(),
  body('coins').isInt({ min: 1 }),
  body('mode').isIn(['add', 'deduct'])
], validate, asyncHandler(admin.adjustCoins));

router.get('/chats', asyncHandler(admin.chats));

router.get('/withdrawals', asyncHandler(admin.withdrawals));
router.patch('/withdrawals/:id', [param('id').isInt(), body('status').isIn(['pending', 'completed', 'rejected'])], validate, asyncHandler(admin.updateWithdrawal));

router.get('/reports', asyncHandler(admin.reports));

// Catalog and Commerce modules have been removed. Related routes are disabled.

router.post('/upload', upload.array('files', 8), asyncHandler(admin.upload));
router.get('/settings', asyncHandler(admin.settings));
router.put('/brand', [body('name').trim().isLength({ min: 1, max: 120 })], validate, asyncHandler(admin.updateBrand));
router.post('/brand/logo', upload.single('logo'), asyncHandler(admin.updateBrandLogo));
router.put('/settings', [body('key').notEmpty(), body('value').exists()], validate, asyncHandler(admin.upsertSetting));

module.exports = router;
