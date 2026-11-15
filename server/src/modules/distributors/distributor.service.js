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

module.exports = { getDistributors, createDistributor, updateDistributor, deleteDistributor };
