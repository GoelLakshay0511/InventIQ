const mongoose = require('mongoose');

const distributorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Distributor name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Distributor phone is required'],
      trim: true,
      match: [/^\d{10}$/, 'Phone must be a valid 10-digit mobile number'],
    },
    // Minimum order value in INR
    minimumOrderValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Typical lead time in days from order to delivery
    deliveryDays: {
      type: Number,
      default: 2,
      min: 1,
    },
    // Product categories this distributor supplies
    categories: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Distributor = mongoose.model('Distributor', distributorSchema);

module.exports = Distributor;
