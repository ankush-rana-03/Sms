const express = require('express');
const router = express.Router();
const {
  getAllHomework,
  createHomework,
  getParentHomework
} = require('../controllers/homework');
const { protect, authorize } = require('../middleware/auth');

// Get all homework with filtering
router.get('/', protect, authorize('teacher', 'admin', 'principal', 'parent'), getAllHomework);

// Create new homework
router.post('/', protect, authorize('teacher', 'admin', 'principal'), createHomework);

// Get homework for parent's children
router.get('/parent', protect, authorize('parent'), getParentHomework);

module.exports = router;