const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { filterParentData } = require('../middleware/parentAccess');
const {
  getParentHomework,
  getParentTests,
  getParentResults,
  getParentChildrenSummary
} = require('../controllers/parentController');

// Parent-specific routes - all require parent role and filter data
router.get('/children', protect, authorize('parent'), filterParentData, getParentChildrenSummary);
router.get('/homework', protect, authorize('parent'), filterParentData, getParentHomework);
router.get('/tests', protect, authorize('parent'), filterParentData, getParentTests);
router.get('/results', protect, authorize('parent'), filterParentData, getParentResults);

module.exports = router;
