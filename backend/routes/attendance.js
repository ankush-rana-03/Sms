const express = require('express');
const {
  markAttendance,
  getAttendanceByDate,
  getStudentAttendance,
  updateAttendance,
  bulkMarkAttendance,
  getClassAttendanceStatistics,
  getAttendanceDashboard,
  sendAttendanceNotifications
} = require('../controllers/attendance');

const router = express.Router();

const { protect, authorize, teacherLocationCheck } = require('../middleware/auth');

// Teacher routes (with location check)
router.post('/mark', protect, authorize('teacher'), teacherLocationCheck, markAttendance);
router.post('/bulk', protect, authorize('teacher'), teacherLocationCheck, bulkMarkAttendance);

// Routes for all authenticated users
router.get('/date/:date', protect, getAttendanceByDate);
router.get('/student/:studentId', protect, getStudentAttendance);

// Admin/Principal routes
router.put('/:id', protect, authorize('teacher', 'admin', 'principal'), updateAttendance);

// Additional routes
router.get('/class/:classId/statistics', protect, getClassAttendanceStatistics);
router.get('/dashboard', protect, getAttendanceDashboard);
router.post('/notifications', protect, authorize('teacher', 'admin', 'principal'), sendAttendanceNotifications);

module.exports = router;