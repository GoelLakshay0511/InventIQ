const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('./auth.model');
const EmailVerification = require('./emailVerification.model');
const PasswordReset = require('./passwordReset.model');
const { sendOtpEmail, sendPasswordResetEmail } = require('../../services/email.service');

const SALT_ROUNDS = 12;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

/** Generate a cryptographically random 6-digit OTP. */
function generateOtp() {
  // 100000 – 999999  (always 6 digits)
  return String(crypto.randomInt(100000, 1000000));
}

/** SHA-256 hash of the OTP — never store plain OTPs in the DB. */
function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

// ── OTP: Send ─────────────────────────────────────────────────────────────────

/**
 * Step 1 of new registration flow.
 * Validates that email & phone aren't already taken, then sends a 6-digit OTP.
 *
 * @param {{ email: string, phone: string, storeName?: string }} params
 */
async function sendRegistrationOtp({ email, phone, storeName }) {
  if (!email || !phone) {
    const err = new Error('Email and phone are required');
    err.statusCode = 400;
    throw err;
  }

  const emailLower = email.toLowerCase().trim();

  // Check for duplicates (email or phone already registered)
  const [emailTaken, phoneTaken] = await Promise.all([
    User.findOne({ email: emailLower }),
    User.findOne({ phone }),
  ]);

  if (emailTaken) {
    const err = new Error('This email address is already registered. Please sign in instead.');
    err.statusCode = 409;
    throw err;
  }
  if (phoneTaken) {
    const err = new Error('This phone number is already registered. Please sign in instead.');
    err.statusCode = 409;
    throw err;
  }

  // Enforce resend cooldown: check if an unexpired record exists that was
  // created less than OTP_RESEND_COOLDOWN_SECONDS ago.
  const existing = await EmailVerification.findOne({ email: emailLower });
  if (existing) {
    const ageSeconds = (Date.now() - existing.createdAt.getTime()) / 1000;
    if (ageSeconds < OTP_RESEND_COOLDOWN_SECONDS) {
      const waitSeconds = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - ageSeconds);
      const err = new Error(`Please wait ${waitSeconds}s before requesting a new code.`);
      err.statusCode = 429;
      err.waitSeconds = waitSeconds;
      throw err;
    }
    // Old entry exists but cooldown passed — delete it and issue a fresh one
    await EmailVerification.deleteOne({ email: emailLower });
  }

  const otp = generateOtp();
  const otpHash = hashOtp(otp);

  await EmailVerification.create({ email: emailLower, otpHash });
  await sendOtpEmail(emailLower, otp, storeName || '');

  return { message: 'Verification code sent to your email.' };
}

// ── OTP: Resend ───────────────────────────────────────────────────────────────

/**
 * Resend OTP — deletes any existing record and re-sends.
 * Front-end should enforce the 60s UI timer; this is the backend safety net.
 */
async function resendRegistrationOtp({ email, storeName }) {
  if (!email) {
    const err = new Error('Email is required');
    err.statusCode = 400;
    throw err;
  }

  const emailLower = email.toLowerCase().trim();

  // Check cooldown
  const existing = await EmailVerification.findOne({ email: emailLower });
  if (existing) {
    const ageSeconds = (Date.now() - existing.createdAt.getTime()) / 1000;
    if (ageSeconds < OTP_RESEND_COOLDOWN_SECONDS) {
      const waitSeconds = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - ageSeconds);
      const err = new Error(`Please wait ${waitSeconds}s before requesting a new code.`);
      err.statusCode = 429;
      err.waitSeconds = waitSeconds;
      throw err;
    }
    await EmailVerification.deleteOne({ email: emailLower });
  }

  const otp = generateOtp();
  await EmailVerification.create({ email: emailLower, otpHash: hashOtp(otp) });
  await sendOtpEmail(emailLower, otp, storeName || '');

  return { message: 'A new verification code has been sent.' };
}

// ── OTP: Verify + Register ────────────────────────────────────────────────────

/**
 * Final step: verify OTP then create the account.
 * Returns the same shape as loginUser for seamless auto-sign-in.
 *
 * @param {{ name, email, phone, storeName, pincode, password, otp }} params
 */
async function verifyOtpAndRegister({ name, email, phone, storeName, pincode, password, otp }) {
  if (!otp) {
    const err = new Error('Verification code is required');
    err.statusCode = 400;
    throw err;
  }

  const emailLower = email.toLowerCase().trim();

  // Find the pending verification record
  const record = await EmailVerification.findOne({ email: emailLower });
  if (!record) {
    const err = new Error('Verification code has expired or was never sent. Please request a new one.');
    err.statusCode = 400;
    throw err;
  }

  // Brute-force guard: max 5 attempts
  if (record.attempts >= 5) {
    await EmailVerification.deleteOne({ email: emailLower });
    const err = new Error('Too many incorrect attempts. Please request a new verification code.');
    err.statusCode = 429;
    throw err;
  }

  // Compare OTP hashes
  if (hashOtp(otp.trim()) !== record.otpHash) {
    record.attempts += 1;
    await record.save();
    const remaining = 5 - record.attempts;
    const err = new Error(`Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
    err.statusCode = 400;
    throw err;
  }

  // OTP is correct — clean up the verification record
  await EmailVerification.deleteOne({ email: emailLower });

  // Final duplicate check (race-condition safety)
  const [emailExists, phoneExists] = await Promise.all([
    User.findOne({ email: emailLower }),
    User.findOne({ phone }),
  ]);
  if (emailExists) {
    const err = new Error('This email is already registered.');
    err.statusCode = 409;
    throw err;
  }
  if (phoneExists) {
    const err = new Error('This phone number is already registered.');
    err.statusCode = 409;
    throw err;
  }

  // Create user
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({
    name,
    email: emailLower,
    isEmailVerified: true,  // verified during registration
    phone,
    storeName,
    pincode,
    passwordHash,
  });

  // Auto-login — generate tokens
  const tokenPayload = { id: user._id, phone: user.phone };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);
  user.refreshToken = refreshToken;
  await user.save();

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      storeName: user.storeName,
      pincode: user.pincode,
      isEmailVerified: user.isEmailVerified,
      settings: user.settings,
    },
  };
}

// ── Existing Functions (unchanged — old users not affected) ───────────────────

/**
 * Register a new user (legacy path — kept for internal use / seeds).
 * New public registrations must go through sendOtp → verifyOtpAndRegister.
 */
async function registerUser({ name, phone, storeName, pincode, password, email }) {
  const existingPhone = await User.findOne({ phone });
  if (existingPhone) {
    const err = new Error('Phone number already registered');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const createData = { name, phone, storeName, pincode, passwordHash };
  if (email) {
    createData.email = email.toLowerCase().trim();
    createData.isEmailVerified = false;
  }

  const user = await User.create(createData);

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    storeName: user.storeName,
    pincode: user.pincode,
    settings: user.settings,
    createdAt: user.createdAt,
  };
}

/**
 * Authenticate a user with phone + password.
 * Works for BOTH old users (no email) and new users (with email).
 */
async function loginUser({ phone, password }) {
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

  user.refreshToken = refreshToken;
  await user.save();

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      storeName: user.storeName,
      pincode: user.pincode,
      isEmailVerified: user.isEmailVerified ?? false,
      settings: user.settings,
    },
  };
}

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

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== refreshToken) {
    const err = new Error('Refresh token revoked or not recognised');
    err.statusCode = 401;
    throw err;
  }

  const newAccessToken = generateAccessToken({ id: user._id, phone: user.phone });
  return { accessToken: newAccessToken };
}

async function logoutUser(userId) {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
}

async function updateProfile(userId, { storeName, settings, name, pincode }) {
  const updateData = {};
  if (name && name.trim()) updateData.name = name.trim();
  if (storeName && storeName.trim()) updateData.storeName = storeName.trim();
  if (pincode && pincode.trim()) updateData.pincode = pincode.trim();
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
    email: user.email,
    phone: user.phone,
    storeName: user.storeName,
    pincode: user.pincode,
    settings: user.settings,
  };
}

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

// ── Forgot Password Flow ──────────────────────────────────────────────────────

/** Mask email for safe display: lakshay@gmail.com → la****@gmail.com */
function maskEmail(email) {
  const [local, domain] = email.split('@');
  const masked = local.length > 2 ? local.slice(0, 2) + '****' : '****';
  return `${masked}@${domain}`;
}

/**
 * Send a 6-digit OTP for password reset.
 *
 * Works for BOTH old users (may have no email) and new users (have email).
 *
 * - If the user already has an email on file → send OTP there.
 * - If the user has NO email (old legacy account):
 *     - If caller provided an email → save it to the account then send OTP.
 *     - If no email provided → respond with needsEmail: true so the UI
 *       can show an email field for the user to enter.
 *
 * @param {{ phone: string, email?: string }} params
 */
async function sendPasswordResetOtp({ phone, email }) {
  const user = await User.findOne({ phone });
  if (!user) {
    const err = new Error('No account found with this phone number. Please check and try again.');
    err.statusCode = 404;
    throw err;
  }

  let targetEmail = user.email;

  // ── Handle legacy users who have no email ──────────────────────────────────
  if (!targetEmail) {
    if (!email || !email.trim()) {
      // Signal frontend to show the email input field
      const err = new Error('This account does not have a recovery email. Please enter your email address to continue.');
      err.statusCode = 422;
      err.needsEmail = true;
      throw err;
    }

    const emailLower = email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
      const err = new Error('Please enter a valid email address.');
      err.statusCode = 400;
      throw err;
    }

    // Make sure this email is not already used by a different account
    const emailTaken = await User.findOne({ email: emailLower, _id: { $ne: user._id } });
    if (emailTaken) {
      const err = new Error('This email address is already linked to another account.');
      err.statusCode = 409;
      throw err;
    }

    // Save email to their account so future resets / logins work
    user.email = emailLower;
    await user.save();
    targetEmail = emailLower;
  }

  // ── Cooldown: prevent spam ─────────────────────────────────────────────────
  const existing = await PasswordReset.findOne({ phone });
  if (existing) {
    const ageSeconds = (Date.now() - existing.createdAt.getTime()) / 1000;
    if (ageSeconds < 60) {
      const wait = Math.ceil(60 - ageSeconds);
      const err = new Error(`Please wait ${wait}s before requesting a new code.`);
      err.statusCode = 429;
      err.waitSeconds = wait;
      throw err;
    }
    await PasswordReset.deleteOne({ phone });
  }

  const otp = generateOtp();
  await PasswordReset.create({ phone, email: targetEmail, otpHash: hashOtp(otp) });
  await sendPasswordResetEmail(targetEmail, otp, user.name);

  return { maskedEmail: maskEmail(targetEmail) };
}

/**
 * Verify OTP and reset the user's password in one step.
 *
 * @param {{ phone: string, otp: string, newPassword: string }} params
 */
async function resetPasswordWithOtp({ phone, otp, newPassword }) {
  if (!phone || !otp || !newPassword) {
    const err = new Error('Phone, OTP, and new password are all required.');
    err.statusCode = 400;
    throw err;
  }

  if (newPassword.length < 6) {
    const err = new Error('New password must be at least 6 characters.');
    err.statusCode = 400;
    throw err;
  }

  const record = await PasswordReset.findOne({ phone });
  if (!record) {
    const err = new Error('Reset code has expired or was never sent. Please request a new one.');
    err.statusCode = 400;
    throw err;
  }

  // Brute-force guard: max 5 attempts
  if (record.attempts >= 5) {
    await PasswordReset.deleteOne({ phone });
    const err = new Error('Too many incorrect attempts. Please request a new reset code.');
    err.statusCode = 429;
    throw err;
  }

  if (hashOtp(otp.trim()) !== record.otpHash) {
    record.attempts += 1;
    await record.save();
    const remaining = 5 - record.attempts;
    const err = new Error(`Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
    err.statusCode = 400;
    throw err;
  }

  // OTP correct — delete the record and update password
  await PasswordReset.deleteOne({ phone });

  const user = await User.findOne({ phone });
  if (!user) {
    const err = new Error('Account not found.');
    err.statusCode = 404;
    throw err;
  }

  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  user.refreshToken = null; // invalidate all existing sessions for security
  await user.save();

  return { success: true, message: 'Password reset successfully. You can now sign in with your new password.' };
}

module.exports = {
  // New OTP-based registration flow
  sendRegistrationOtp,
  resendRegistrationOtp,
  verifyOtpAndRegister,
  // Forgot password flow
  sendPasswordResetOtp,
  resetPasswordWithOtp,
  // Legacy / existing
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  updateProfile,
  changePassword,
};
