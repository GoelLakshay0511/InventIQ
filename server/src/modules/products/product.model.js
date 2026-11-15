const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    // e.g. "kg", "litre", "unit", "dozen"
    unit: {
      type: String,
      default: 'unit',
      trim: true,
    },
    // Number of units per carton/pack
    packSize: {
      type: Number,
      default: 1,
      min: [1, 'Pack size must be at least 1'],
    },
    currentStock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    // Computed or manually set; used to trigger reorder alerts
    reorderPoint: {
      type: Number,
      default: 0,
    },
    distributorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Distributor',
    },
    costPrice: {
      type: Number,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      min: 0,
    },
    // Flagged by the forecasting engine or manually
    isTopSeller: {
      type: Boolean,
      default: false,
    },
    // Soft-delete flag
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound index: most queries filter by userId + isActive
productSchema.index({ userId: 1, isActive: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
