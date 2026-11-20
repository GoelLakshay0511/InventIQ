const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('./auth.controller');
const { authMiddleware } = require('../../middleware/auth.middleware');

const router = express.Router();

// Rate limiter for auth endpoints: max 20 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for OTP endpoints to prevent abuse
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many OTP requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── New OTP-based registration flow ──────────────────────────────────────────
router.post('/send-otp', otpLimiter, authController.sendOtp);
router.post('/resend-otp', otpLimiter, authController.resendOtp);
router.post('/verify-otp-register', authLimiter, authController.verifyOtpAndRegister);

// ── Forgot / reset password ───────────────────────────────────────────────────
router.post('/forgot-password', otpLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);

// ── Existing public routes ────────────────────────────────────────────────────
router.post('/register', authLimiter, authController.register);  // legacy (seeder)
router.post('/login', authLimiter, authController.login);

// Semi-public: uses refresh token from cookie
router.post('/refresh', authController.refresh);

// Protected routes
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.getMe);
router.put('/me', authMiddleware, authController.updateMe);
router.put('/change-password', authMiddleware, authController.changePassword);

module.exports = router;
