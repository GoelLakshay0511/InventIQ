const mongoose = require('mongoose');

const salesLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    // Date of sale (not necessarily creation time)
    date: {
      type: Date,
      required: true,
      index: true,
    },
    quantitySold: {
      type: Number,
      required: true,
      min: [1, 'Quantity sold must be at least 1'],
    },
    // How the sale entry was created
    source: {
      type: String,
      enum: ['manual', 'csv', 'voice', 'ocr'],
      default: 'manual',
    },
  },
  { timestamps: true }
);

// Compound indexes for common query patterns
salesLogSchema.index({ userId: 1, date: 1 });
salesLogSchema.index({ userId: 1, productId: 1, date: 1 });

const SalesLog = mongoose.model('SalesLog', salesLogSchema);

module.exports = SalesLog;
