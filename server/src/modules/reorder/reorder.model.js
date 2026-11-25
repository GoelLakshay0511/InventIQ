const mongoose = require('mongoose');

const reorderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,
    distributorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Distributor' },
    distributorName: String,
    currentStock: Number,
    reorderPoint: Number,
    safetyStock: Number,
    avgDailySales: Number,
    forecastedDemand7d: Number,
    suggestedOrderQty: Number,
    suggestedCartons: Number,
    costPrice: { type: Number, default: 0 },
    packSize: { type: Number, default: 1 },
    unit: { type: String, default: 'piece' },
    distributorMov: { type: Number, default: 0 },
    promisedLeadTime: { type: Number, default: 2 },
    effectiveLeadTime: { type: Number, default: 2 },
    delayBufferDays: { type: Number, default: 0 },
    distributorOnTimeRate: { type: Number, default: 100 },
    urgency: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'low',
    },
  },
  { _id: false } // Subdocuments — no individual _id needed
);

const reorderSuggestionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'ordered', 'delivered'],
      default: 'pending',
    },
    // Map of distributorId -> { status: 'pending'|'ordered'|'delivered', orderedAt: Date, deliveredAt: Date }
    distributorOrders: {
      type: Map,
      of: new mongoose.Schema(
        {
          status: { type: String, enum: ['pending', 'ordered', 'delivered'], default: 'pending' },
          orderedAt: { type: Date, default: null },
          deliveredAt: { type: Date, default: null },
          actualDays: { type: Number, default: null },
        },
        { _id: false }
      ),
      default: {},
    },
    items: [reorderItemSchema],
    // Map of distributorId (string) → WhatsApp message/link info
    whatsappMessages: {
      type: Map,
      of: new mongoose.Schema(
        {
          distributorName: String,
          phone: String,
          message: String,
          link: String,
        },
        { _id: false }
      ),
    },
  },
  { timestamps: true }
);

const ReorderSuggestion = mongoose.model('ReorderSuggestion', reorderSuggestionSchema);

module.exports = ReorderSuggestion;
