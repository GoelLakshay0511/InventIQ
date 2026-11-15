const express = require('express');
const multer = require('multer');
const salesController = require('./sales.controller');
const { authMiddleware } = require('../../middleware/auth.middleware');

const router = express.Router();

// Use memory storage — CSV bytes are parsed in-process, never written to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
});

// All sales routes require authentication
router.use(authMiddleware);

router.post('/batch', salesController.batchLog);
router.get('/history', salesController.getHistory);
router.get('/daily-summary', salesController.getDailySummary);
router.post('/import/csv', upload.single('file'), salesController.importCSV);

module.exports = router;
