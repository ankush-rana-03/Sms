const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  staffCheckIn,
  staffCheckOut,
  markStaffAttendance,
  getStaffAttendanceByDate,
  getStaffAttendanceReport,
  updateStaffAttendance,
  getStaffAttendanceDashboard
} = require('../controllers/staffAttendance');

// Staff check-in/check-out routes (all staff can access)
router.post('/check-in', protect, staffCheckIn);
router.post('/check-out', protect, staffCheckOut);

// Get own attendance report (staff can view their own)
router.get('/my-attendance', protect, (req, res) => {
  // Redirect to staff-specific route
  req.params.staffId = req.user.id;
  getStaffAttendanceReport(req, res);
});

// Admin/Principal routes
router.post('/mark', protect, authorize('admin', 'principal'), markStaffAttendance);
router.get('/date/:date', protect, authorize('admin', 'principal'), getStaffAttendanceByDate);
router.get('/staff/:staffId', protect, authorize('admin', 'principal'), getStaffAttendanceReport);
router.put('/:id', protect, authorize('admin', 'principal'), updateStaffAttendance);
router.get('/dashboard', protect, authorize('admin', 'principal'), getStaffAttendanceDashboard);

module.exports = router;