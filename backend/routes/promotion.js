const express = require('express');
const {
  evaluatePromotions,
  promoteStudent,
  getPromotionStatus,
  bulkPromote
} = require('../controllers/promotion');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// All promotion routes require admin or principal access
router.use(protect);
router.use(authorize('admin', 'principal'));

// Promotion evaluation and management
router.post('/evaluate/:sessionId', evaluatePromotions);
router.post('/promote/:studentId', promoteStudent);
router.post('/bulk-promote', bulkPromote);
router.get('/status/:sessionId', getPromotionStatus);

module.exports = router;