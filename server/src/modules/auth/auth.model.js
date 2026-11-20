const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      // NOT required at schema level — old users don't have emails.
      // Required is enforced at the application/service level for new registrations.
      unique: true,
      sparse: true,          // sparse: allows multiple null/undefined (old users)
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      match: [/^\d{10}$/, 'Phone must be a 10-digit number'],
    },
    storeName: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
      match: [/^\d{6}$/, 'Pincode must be 6 digits'],
    },
    // Hashed password — never store plain text
    passwordHash: {
      type: String,
      required: true,
      select: false, // Excluded from queries by default
    },
    // Stored for refresh-token rotation; cleared on logout
    refreshToken: {
      type: String,
      select: false,
    },
    settings: {
      leadTimeDays: { type: Number, default: 3 },
      safetyStockDays: { type: Number, default: 2 },
    },
  },
  { timestamps: true }
);

/**
 * Instance method to compare a plain-text password against the stored hash.
 * @param {string} plainPassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
