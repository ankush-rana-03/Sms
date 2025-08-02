const express = require('express');
const {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  registerStudentFace,
  getStudentAttendance
} = require('../controllers/students');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Public routes (if any)
// router.get('/', getStudents);

// Protected routes
router.use(protect);

// Routes for all authenticated users
router.get('/', getStudents);
router.get('/:id', getStudent);
router.get('/:id/attendance', getStudentAttendance);

// Admin/Principal routes
router.post('/', authorize('admin', 'principal'), createStudent);
router.put('/:id', authorize('admin', 'principal'), updateStudent);
router.delete('/:id', authorize('admin', 'principal'), deleteStudent);
router.post('/:id/register-face', authorize('admin', 'principal'), registerStudentFace);

module.exports = router;