const router = require('express').Router();
const { body } = require('express-validator');
const auth = require('../controllers/authController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

router.post('/register', auth.registerRules, validate, asyncHandler(auth.register));
router.post('/login', auth.loginRules, validate, asyncHandler(auth.login));
router.get('/me', authenticate, asyncHandler(auth.me));
router.post('/logout', authenticate, asyncHandler(auth.logout));
router.post('/heartbeat', authenticate, asyncHandler(auth.heartbeat));

// Email OTP routes for registration only
router.post('/verify-otp', [body('email').notEmpty().isEmail(), body('otp').notEmpty()], validate, asyncHandler(auth.verifyOtp));
router.post('/resend-otp', [body('email').notEmpty().isEmail()], validate, asyncHandler(auth.resendOtp));

router.post('/forgot-password', auth.forgotPasswordRules, validate, asyncHandler(auth.forgotPassword));
router.post('/verify-reset-otp', asyncHandler(auth.verifyResetOtp));
router.post('/reset-password', auth.resetPasswordRules, validate, asyncHandler(auth.resetPassword));

module.exports = router;
