const express = require('express');
const reorderController = require('./reorder.controller');
const { authMiddleware } = require('../../middleware/auth.middleware');

const router = express.Router();

// All reorder routes require authentication
router.use(authMiddleware);

router.get('/suggestions', reorderController.getSuggestions);
router.get('/history', reorderController.getHistory);
router.post('/generate', reorderController.generate);
router.post('/whatsapp', reorderController.getWhatsAppLinks);
router.patch('/mark-ordered', reorderController.markOrdered);
router.post('/mark-delivered', reorderController.markDelivered);
router.post('/:id/fulfill', reorderController.fulfillOrder);
router.patch('/:id/status', reorderController.updateStatus);

module.exports = router;
