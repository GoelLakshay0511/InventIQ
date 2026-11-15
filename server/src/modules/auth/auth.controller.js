const authService = require('./auth.service');
const User = require('./auth.model');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

/**
 * POST /api/auth/register
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
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { phone, password } = req.body;
    const { accessToken, refreshToken, user } = await authService.loginUser({ phone, password });

    // Set refresh token as HttpOnly cookie — not accessible via JS
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    return sendSuccess(res, { accessToken, user }, 'Login successful');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/refresh
 * Reads refresh token from cookie or body (cookie preferred).
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
 * Requires valid access token (user must be authenticated to log out).
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
 * Returns the authenticated user's public profile.
 */
async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return sendError(res, 'User not found', 404);
    return sendSuccess(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          storeName: user.storeName,
          pincode: user.pincode,
          settings: user.settings,
          createdAt: user.createdAt,
        },
      },
      'User profile'
    );
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/auth/me
 * Update store profile & settings
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
 * Verify old password and set new password
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

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  updateMe,
  changePassword,
};
