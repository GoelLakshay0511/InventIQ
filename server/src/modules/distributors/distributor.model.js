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
    // Typical promised lead time in days from order to delivery
    deliveryDays: {
      type: Number,
      default: 2,
      min: 1,
    },
    // Dynamic Lead Time (Rolling avg of actual deliveries)
    effectiveLeadTime: {
      type: Number,
      default: function () {
        return this.deliveryDays || 2;
      },
    },
    // On-Time Delivery percentage (0 - 100%)
    onTimeRate: {
      type: Number,
      default: 100,
    },
    // Extra safety buffer added to absorb vendor delays
    delayBufferDays: {
      type: Number,
      default: 0,
    },
    // Historical delivery turnaround log (last 15 deliveries)
    deliveryHistory: [
      {
        orderDate: { type: Date, default: Date.now },
        deliveredDate: { type: Date, default: Date.now },
        turnaroundDays: { type: Number, required: true },
        promisedDays: { type: Number, required: true },
        onTime: { type: Boolean, default: true },
        note: { type: String, default: '' },
      },
    ],
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

distributorSchema.methods.recordDelivery = function (turnaroundDays, note = '', orderDate = null, deliveredDate = null) {
  const promised = this.deliveryDays || 2;
  const days = Math.max(0.5, Math.min(Number(turnaroundDays), promised * 3.5));
  const roundedTurnaround = Number(days.toFixed(1));
  const onTime = roundedTurnaround <= promised + 0.2; // slight grace buffer

  const entry = {
    orderDate: orderDate || new Date(Date.now() - roundedTurnaround * 24 * 60 * 60 * 1000),
    deliveredDate: deliveredDate || new Date(),
    turnaroundDays: roundedTurnaround,
    promisedDays: promised,
    onTime,
    note: note || (onTime ? 'Delivered on time' : `Delayed by ${(roundedTurnaround - promised).toFixed(1)} days`),
  };

  if (!this.deliveryHistory) this.deliveryHistory = [];
  this.deliveryHistory.push(entry);

  // Keep last 15 delivery records
  if (this.deliveryHistory.length > 15) {
    this.deliveryHistory = this.deliveryHistory.slice(-15);
  }

  // Rolling average of the last 3 deliveries
  const recent3 = this.deliveryHistory.slice(-3);
  const avgRecent = recent3.reduce((sum, h) => sum + h.turnaroundDays, 0) / recent3.length;
  this.effectiveLeadTime = Number(avgRecent.toFixed(1));

  // Overall on-time percentage across history
  const onTimeCount = this.deliveryHistory.filter((h) => h.onTime).length;
  this.onTimeRate = Math.round((onTimeCount / this.deliveryHistory.length) * 100);

  // Extra safety buffer days
  this.delayBufferDays = Math.max(0, Number((this.effectiveLeadTime - this.deliveryDays).toFixed(1)));

  return this;
};

distributorSchema.methods.resetReliability = function () {
  this.effectiveLeadTime = this.deliveryDays || 2;
  this.onTimeRate = 100;
  this.delayBufferDays = 0;
  this.deliveryHistory = [];
  return this;
};

const Distributor = mongoose.model('Distributor', distributorSchema);

module.exports = Distributor;
