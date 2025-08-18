const express = require('express');
const {
  markAttendance,
  getAttendanceByDate,
  getStudentAttendance,
  updateAttendance,
  bulkMarkAttendance,
  getClassAttendanceStatistics,
  getAttendanceStatsBySession,
  getAttendanceDashboard,
  sendAttendanceNotifications,
  getAttendanceRecords,
  getAttendanceReport
} = require('../controllers/attendance');

const router = express.Router();

const { protect, authorize, teacherLocationCheck } = require('../middleware/auth');

// Teacher/Admin/Principal routes (with location check for teachers)
router.post('/mark', protect, authorize('teacher', 'admin', 'principal'), teacherLocationCheck, markAttendance);
router.post('/bulk', protect, authorize('teacher', 'admin', 'principal'), teacherLocationCheck, bulkMarkAttendance);

// Routes for all authenticated users
router.get('/date/:date', protect, getAttendanceByDate);
router.get('/student/:studentId', protect, getStudentAttendance);
router.get('/records', protect, getAttendanceRecords);
router.get('/report', protect, getAttendanceReport);

// Admin/Principal routes
router.put('/:id', protect, authorize('teacher', 'admin', 'principal'), updateAttendance);

// Additional routes
router.get('/class/:classId/statistics', protect, getClassAttendanceStatistics);
router.get('/session/:session/stats', protect, getAttendanceStatsBySession);
router.get('/dashboard', protect, getAttendanceDashboard);
router.post('/notifications', protect, authorize('teacher', 'admin', 'principal'), sendAttendanceNotifications);

module.exports = router;