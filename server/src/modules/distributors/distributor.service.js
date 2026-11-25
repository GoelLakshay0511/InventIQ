const Distributor = require('./distributor.model');

/**
 * List all active distributors for a user.
 */
async function getDistributors(userId) {
  return Distributor.find({ userId, isActive: true }).sort({ name: 1 });
}

/**
 * Create a new distributor entry.
 */
async function createDistributor(userId, data) {
  return Distributor.create({ ...data, userId });
}

/**
 * Update a distributor's details. Scoped to the calling user.
 */
async function updateDistributor(userId, id, data) {
  const distributor = await Distributor.findOneAndUpdate(
    { _id: id, userId, isActive: true },
    { $set: data },
    { new: true, runValidators: true }
  );
  if (!distributor) {
    const err = new Error('Distributor not found');
    err.statusCode = 404;
    throw err;
  }
  return distributor;
}

/**
 * Soft-delete a distributor (sets isActive: false).
 */
async function deleteDistributor(userId, id) {
  const distributor = await Distributor.findOneAndUpdate(
    { _id: id, userId, isActive: true },
    { $set: { isActive: false } },
    { new: true }
  );
  if (!distributor) {
    const err = new Error('Distributor not found');
    err.statusCode = 404;
    throw err;
  }
  return distributor;
}

/**
 * Record a wholesale delivery turnaround and update the distributor's reliability scorecard.
 * Automatically recalculates effectiveLeadTime, delayBufferDays, and onTimeRate.
 *
 * @param {string} userId
 * @param {string} id - Distributor ID
 * @param {{ turnaroundDays?: number, orderDate?: Date, deliveredDate?: Date, note?: string }} data
 */
async function recordDeliveryTurnaround(userId, id, data = {}) {
  const distributor = await Distributor.findOne({ _id: id, userId, isActive: true });
  if (!distributor) {
    const err = new Error('Distributor not found');
    err.statusCode = 404;
    throw err;
  }

  let turnaroundDays = Number(data.turnaroundDays);
  const orderDate = data.orderDate ? new Date(data.orderDate) : null;
  const deliveredDate = data.deliveredDate ? new Date(data.deliveredDate) : new Date();

  if (isNaN(turnaroundDays) || turnaroundDays <= 0) {
    if (orderDate) {
      const diffDays = (deliveredDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
      turnaroundDays = Math.max(0.5, Number(diffDays.toFixed(1)));
    } else {
      turnaroundDays = distributor.deliveryDays || 2;
    }
  }

  distributor.recordDelivery(turnaroundDays, data.note, orderDate, deliveredDate);
  await distributor.save();

  // Trigger non-blocking forecast refresh so safety stocks update immediately
  try {
    const { generateForecast } = require('../../services/forecasting');
    const ReorderSuggestion = require('../reorder/reorder.model');
    const updatedForecast = await generateForecast(userId);
    if (updatedForecast && updatedForecast.length > 0) {
      await ReorderSuggestion.findOneAndUpdate(
        { userId, status: 'pending' },
        { $set: { items: updatedForecast, generatedAt: new Date() } }
      );
    }
  } catch (err) {
    console.error('Non-critical forecast sync after delivery log:', err.message);
  }

  return distributor;
}

/**
 * Reset distributor reliability history back to promised values.
 */
async function resetReliabilityScorecard(userId, id) {
  const distributor = await Distributor.findOne({ _id: id, userId, isActive: true });
  if (!distributor) {
    const err = new Error('Distributor not found');
    err.statusCode = 404;
    throw err;
  }

  distributor.resetReliability();
  await distributor.save();
  return distributor;
}

module.exports = {
  getDistributors,
  createDistributor,
  updateDistributor,
  deleteDistributor,
  recordDeliveryTurnaround,
  resetReliabilityScorecard,
};
