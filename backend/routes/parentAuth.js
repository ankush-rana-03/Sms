const express = require('express');
const router = express.Router();
const {
  registerParent,
  loginParent,
  getParentProfile,
  updateParentProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  getStudentAttendance,
  getAttendanceSummary,
  getMonthlyAttendance,
  getCurrentMonthAttendance,
  validateToken,
  createSampleAttendance
} = require('../controllers/parentAuth');
const { protectParent } = require('../middleware/parentAuth');

// Public routes
router.post('/register', registerParent);
router.post('/login', loginParent);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resettoken', resetPassword);

// Protected routes
router.get('/validate-token', protectParent, validateToken);
router.get('/profile', protectParent, getParentProfile);
router.put('/profile', protectParent, updateParentProfile);
router.put('/change-password', protectParent, changePassword);
router.post('/create-sample-attendance', protectParent, createSampleAttendance);

// Attendance routes
router.get('/attendance/current-month', protectParent, getCurrentMonthAttendance);
router.get('/attendance/:studentId', protectParent, getStudentAttendance);
router.get('/attendance/:studentId/summary', protectParent, getAttendanceSummary);
router.get('/attendance/:studentId/monthly', protectParent, getMonthlyAttendance);

module.exports = router;