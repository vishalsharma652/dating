const router = require('express').Router();
const { body } = require('express-validator');
const auth = require('../controllers/authController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

router.post('/register', auth.registerRules, validate, asyncHandler(auth.register));
router.post('/login', auth.loginRules, validate, asyncHandler(auth.login));
router.get('/me', authenticate, asyncHandler(auth.me));
router.post('/verify-otp', [body('phone').notEmpty(), body('otp').notEmpty()], validate, asyncHandler(auth.verifyOtp));
router.post('/resend-otp', [body('phone').notEmpty()], validate, asyncHandler(auth.resendOtp));
router.post('/forgot-password', asyncHandler(auth.forgotPassword));
router.post('/reset-password', asyncHandler(auth.resetPassword));

module.exports = router;
