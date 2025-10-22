const express = require('express');
const router = express.Router();
const {
  getParentHomework,
  getChildHomeworkDetails,
  updateHomeworkCompletion,
  getHomeworkStatistics
} = require('../controllers/parentHomework');
const { protect } = require('../middleware/auth');

// All routes are protected and require parent authentication
router.get('/', protect, getParentHomework);
router.get('/statistics', protect, getHomeworkStatistics);
router.get('/:homeworkId/child/:childId', protect, getChildHomeworkDetails);
router.put('/:homeworkId/child/:childId/complete', protect, updateHomeworkCompletion);

module.exports = router;