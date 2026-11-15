const distributorService = require('./distributor.service');
const { sendSuccess } = require('../../utils/apiResponse');

/**
 * GET /api/distributors
 */
async function getDistributors(req, res, next) {
  try {
    const distributors = await distributorService.getDistributors(req.user.id);
    return sendSuccess(res, { distributors }, 'Distributors retrieved');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/distributors
 */
async function createDistributor(req, res, next) {
  try {
    const distributor = await distributorService.createDistributor(req.user.id, req.body);
    return sendSuccess(res, { distributor }, 'Distributor created', 201);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/distributors/:id
 */
async function updateDistributor(req, res, next) {
  try {
    const distributor = await distributorService.updateDistributor(req.user.id, req.params.id, req.body);
    return sendSuccess(res, { distributor }, 'Distributor updated');
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/distributors/:id
 */
async function deleteDistributor(req, res, next) {
  try {
    await distributorService.deleteDistributor(req.user.id, req.params.id);
    return sendSuccess(res, null, 'Distributor deleted');
  } catch (err) {
    next(err);
  }
}

module.exports = { getDistributors, createDistributor, updateDistributor, deleteDistributor };
