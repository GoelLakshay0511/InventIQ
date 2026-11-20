const mongoose = require('mongoose');

/**
 * Stores pending password-reset OTPs.
 * TTL index auto-deletes documents after 10 minutes.
 */
const passwordResetSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
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

const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);

module.exports = PasswordReset;
