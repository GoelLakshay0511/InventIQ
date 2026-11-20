const authService = require('./auth.service');
const User = require('./auth.model');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

// ── NEW: OTP-based registration endpoints ─────────────────────────────────────

/**
 * POST /api/auth/send-otp
 * Step 1: validate email/phone uniqueness and dispatch a 6-digit OTP.
 */
async function sendOtp(req, res, next) {
  try {
    const { email, phone, storeName } = req.body;
    if (!email || !phone) return sendError(res, 'Email and phone are required', 400);
    const result = await authService.sendRegistrationOtp({ email, phone, storeName });
    return sendSuccess(res, result, result.message, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/resend-otp
 * Resend OTP (subject to 60s cooldown enforced server-side).
 */
async function resendOtp(req, res, next) {
  try {
    const { email, storeName } = req.body;
    if (!email) return sendError(res, 'Email is required', 400);
    const result = await authService.resendRegistrationOtp({ email, storeName });
    return sendSuccess(res, result, result.message, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/verify-otp-register
 * Step 2: verify OTP, create account, and auto-login (returns tokens).
 */
async function verifyOtpAndRegister(req, res, next) {
  try {
    const { name, email, phone, storeName, pincode, password, otp } = req.body;

    if (!name || !email || !phone || !storeName || !password || !otp) {
      return sendError(res, 'All fields are required', 400);
    }

    const { accessToken, refreshToken, user } = await authService.verifyOtpAndRegister({
      name, email, phone, storeName, pincode, password, otp,
    });

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    return sendSuccess(res, { accessToken, user }, 'Account created successfully!', 201);
  } catch (err) {
    next(err);
  }
}

// ── EXISTING endpoints (unchanged) ────────────────────────────────────────────

/**
 * POST /api/auth/register  (legacy — kept for seeder / internal use)
 */
async function register(req, res, next) {
  try {
    const { name, phone, storeName, pincode, password } = req.body;
    const user = await authService.registerUser({ name, phone, storeName, pincode, password });
    return sendSuccess(res, { user }, 'Registration successful', 201);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login  — phone + password (unchanged, works for all users)
 */
async function login(req, res, next) {
  try {
    const { phone, password } = req.body;
    const { accessToken, refreshToken, user } = await authService.loginUser({ phone, password });
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    return sendSuccess(res, { accessToken, user }, 'Login successful');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/refresh
 */
async function refresh(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const { accessToken } = await authService.refreshAccessToken(refreshToken);
    return sendSuccess(res, { accessToken }, 'Token refreshed');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 */
async function logout(req, res, next) {
  try {
    await authService.logoutUser(req.user.id);
    res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
    return sendSuccess(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 */
async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return sendError(res, 'User not found', 404);
    return sendSuccess(res, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        storeName: user.storeName,
        pincode: user.pincode,
        isEmailVerified: user.isEmailVerified ?? false,
        settings: user.settings,
        createdAt: user.createdAt,
      },
    }, 'User profile');
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/auth/me
 */
async function updateMe(req, res, next) {
  try {
    const { storeName, settings, name, pincode } = req.body;
    const user = await authService.updateProfile(req.user.id, { storeName, settings, name, pincode });
    return sendSuccess(res, { user }, 'Settings updated successfully');
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/auth/change-password
 */
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user.id, { currentPassword, newPassword });
    return sendSuccess(res, result, 'Password updated successfully');
  } catch (err) {
    next(err);
  }
}

// ── Forgot Password endpoints ─────────────────────────────────────────────────

/**
 * POST /api/auth/forgot-password
 * Find account by phone, send OTP to their email.
 * If the account has no email (legacy user), returns needsEmail: true
 * so the frontend can display an email input field.
 */
async function forgotPassword(req, res, next) {
  try {
    const { phone, email } = req.body;
    if (!phone) return sendError(res, 'Phone number is required', 400);

    const result = await authService.sendPasswordResetOtp({ phone, email });
    return sendSuccess(res, result, 'Verification code sent to your email.');
  } catch (err) {
    // Special case: legacy account has no email — tell frontend to show email field
    if (err.needsEmail) {
      return res.status(422).json({
        success: false,
        message: err.message,
        needsEmail: true,
      });
    }
    next(err);
  }
}

/**
 * POST /api/auth/reset-password
 * Verify OTP and set a new password.
 */
async function resetPassword(req, res, next) {
  try {
    const { phone, otp, newPassword } = req.body;
    if (!phone || !otp || !newPassword) {
      return sendError(res, 'Phone, verification code, and new password are required', 400);
    }
    const result = await authService.resetPasswordWithOtp({ phone, otp, newPassword });
    return sendSuccess(res, result, result.message);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  // New OTP flow
  sendOtp,
  resendOtp,
  verifyOtpAndRegister,
  // Forgot password
  forgotPassword,
  resetPassword,
  // Existing
  register,
  login,
  refresh,
  logout,
  getMe,
  updateMe,
  changePassword,
};
