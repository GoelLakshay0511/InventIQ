const express = require('express');
const multer = require('multer');
const productController = require('./product.controller');
const { authMiddleware } = require('../../middleware/auth.middleware');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max for invoice photos / PDFs
});

// All product routes require authentication
router.use(authMiddleware);

// Named routes must come BEFORE /:id to avoid route conflict
router.get('/top-sellers', productController.getTopSellers);
router.get('/dead-stock', productController.getDeadStock);

// Restock & Invoice OCR routes
router.post('/restock/ocr', upload.single('invoice'), productController.scanInvoiceOCR);
router.post('/restock/confirm', productController.confirmRestock);
router.post('/:id/restock', productController.quickRestockProduct);

router.get('/', productController.getProducts);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
