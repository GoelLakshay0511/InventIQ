const express = require('express');
const distributorController = require('./distributor.controller');
const { authMiddleware } = require('../../middleware/auth.middleware');

const router = express.Router();

// All distributor routes require authentication
router.use(authMiddleware);

router.get('/', distributorController.getDistributors);
router.post('/', distributorController.createDistributor);
router.put('/:id', distributorController.updateDistributor);
router.delete('/:id', distributorController.deleteDistributor);

module.exports = router;
