const mongoose = require('mongoose');

/**
 * Stores pending email OTP verifications.
 * TTL index auto-deletes documents after 10 minutes (MongoDB handles cleanup).
 */
const emailVerificationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  otpHash: {
    type: String,
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // TTL: auto-delete after 10 minutes
  },
});

const EmailVerification = mongoose.model('EmailVerification', emailVerificationSchema);

module.exports = EmailVerification;
