const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./auth.model');

const SALT_ROUNDS = 12;

/**
 * Generate a short-lived access token (15 min).
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

/**
 * Generate a long-lived refresh token (7 days).
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

/**
 * Register a new user.
 * Hashes password before saving; never returns passwordHash.
 */
async function registerUser({ name, phone, storeName, pincode, password }) {
  const existingUser = await User.findOne({ phone });
  if (existingUser) {
    const err = new Error('Phone number already registered');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({ name, phone, storeName, pincode, passwordHash });

  // Return user object without sensitive fields
  return {
    id: user._id,
    name: user.name,
    phone: user.phone,
    storeName: user.storeName,
    pincode: user.pincode,
    settings: user.settings,
    createdAt: user.createdAt,
  };
}

/**
 * Authenticate a user with phone + password.
 * Returns accessToken, refreshToken, and public user fields on success.
 */
async function loginUser({ phone, password }) {
  // Explicitly select passwordHash since it is excluded by default
  const user = await User.findOne({ phone }).select('+passwordHash +refreshToken');
  if (!user) {
    const err = new Error('Invalid phone number or password');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const err = new Error('Invalid phone number or password');
    err.statusCode = 401;
    throw err;
  }

  const tokenPayload = { id: user._id, phone: user.phone };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Persist refresh token for later rotation/validation
  user.refreshToken = refreshToken;
  await user.save();

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      phone: user.phone,
      storeName: user.storeName,
      pincode: user.pincode,
      settings: user.settings,
    },
  };
}

/**
 * Issue a new access token using a valid refresh token.
 * Also validates the token matches what is stored in DB (rotation guard).
 */
async function refreshAccessToken(refreshToken) {
  if (!refreshToken) {
    const err = new Error('Refresh token missing');
    err.statusCode = 401;
    throw err;
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    const err = new Error('Invalid or expired refresh token');
    err.statusCode = 401;
    throw err;
  }

  // Look up user and compare stored token (prevents reuse of old tokens)
  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== refreshToken) {
    const err = new Error('Refresh token revoked or not recognised');
    err.statusCode = 401;
    throw err;
  }

  const newAccessToken = generateAccessToken({ id: user._id, phone: user.phone });
  return { accessToken: newAccessToken };
}

/**
 * Logout — clears stored refresh token from DB.
 */
async function logoutUser(userId) {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
}

/**
 * Update user profile settings (storeName, leadTimeDays, safetyStockDays).
 */
async function updateProfile(userId, { storeName, settings, name, pincode }) {
  const updateData = {};
  if (name && name.trim()) {
    updateData.name = name.trim();
  }
  if (storeName && storeName.trim()) {
    updateData.storeName = storeName.trim();
  }
  if (pincode && pincode.trim()) {
    updateData.pincode = pincode.trim();
  }
  if (settings && typeof settings === 'object') {
    updateData.settings = {
      leadTimeDays: Math.max(1, Number(settings.leadTimeDays) || 3),
      safetyStockDays: Math.max(1, Number(settings.safetyStockDays) || 2),
    };
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  return {
    id: user._id,
    name: user.name,
    phone: user.phone,
    storeName: user.storeName,
    pincode: user.pincode,
    settings: user.settings,
  };
}

/**
 * Change user password after verifying current password.
 */
async function changePassword(userId, { currentPassword, newPassword }) {
  if (!currentPassword || !newPassword) {
    const err = new Error('Current password and new password are required');
    err.statusCode = 400;
    throw err;
  }

  if (newPassword.length < 6) {
    const err = new Error('New password must be at least 6 characters');
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findById(userId).select('+passwordHash');
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    const err = new Error('Current password does not match');
    err.statusCode = 400;
    throw err;
  }

  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.save();

  return { success: true, message: 'Password changed successfully' };
}

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  updateProfile,
  changePassword,
};
