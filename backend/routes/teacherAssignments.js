const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createAssignment,
  getAllAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  getAssignmentsByTeacher,
  getAssignmentsByClass,
  getTeacherDaySchedule,
  getAssignmentStatistics
} = require('../controllers/teacherAssignments');

// All routes require admin authorization
router.use(protect, authorize('admin'));

/**
 * @swagger
 * components:
 *   schemas:
 *     TeacherAssignment:
 *       type: object
 *       required:
 *         - teacher
 *         - class
 *         - subject
 *         - day
 *         - startTime
 *         - endTime
 *       properties:
 *         _id:
 *           type: string
 *           description: Assignment ID
 *         teacher:
 *           type: string
 *           description: Teacher ID
 *         class:
 *           type: string
 *           description: Class ID
 *         subject:
 *           type: string
 *           description: Subject name
 *         day:
 *           type: string
 *           enum: [monday, tuesday, wednesday, thursday, friday, saturday]
 *           description: Day of the week
 *         startTime:
 *           type: string
 *           pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *           description: Start time in HH:MM format
 *         endTime:
 *           type: string
 *           pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *           description: End time in HH:MM format
 *         academicYear:
 *           type: string
 *           description: Academic year (e.g., 2024-2025)
 *         notes:
 *           type: string
 *           description: Additional notes
 *         isActive:
 *           type: boolean
 *           description: Whether the assignment is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/admin/assignments:
 *   get:
 *     summary: Get all teacher assignments
 *     tags: [Admin - Assignments]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: teacher
 *         schema:
 *           type: string
 *         description: Filter by teacher ID
 *       - in: query
 *         name: class
 *         schema:
 *           type: string
 *         description: Filter by class ID
 *       - in: query
 *         name: day
 *         schema:
 *           type: string
 *           enum: [monday, tuesday, wednesday, thursday, friday, saturday]
 *         description: Filter by day
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *         description: Filter by subject (partial match)
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *         description: Filter by academic year
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in subject and notes
 *     responses:
 *       200:
 *         description: List of assignments with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TeacherAssignment'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     current:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *   post:
 *     summary: Create a new teacher assignment
 *     tags: [Admin - Assignments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teacher
 *               - class
 *               - subject
 *               - day
 *               - startTime
 *               - endTime
 *             properties:
 *               teacher:
 *                 type: string
 *                 description: Teacher ID
 *               class:
 *                 type: string
 *                 description: Class ID
 *               subject:
 *                 type: string
 *                 description: Subject name
 *               day:
 *                 type: string
 *                 enum: [monday, tuesday, wednesday, thursday, friday, saturday]
 *               startTime:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *                 example: "09:00"
 *               endTime:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *                 example: "10:00"
 *               academicYear:
 *                 type: string
 *                 example: "2024-2025"
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Assignment created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Teacher or class not found
 *       409:
 *         description: Time conflict or duplicate assignment
 */

/**
 * @swagger
 * /api/admin/assignments/{id}:
 *   get:
 *     summary: Get assignment by ID
 *     tags: [Admin - Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Assignment ID
 *     responses:
 *       200:
 *         description: Assignment details
 *       404:
 *         description: Assignment not found
 *   put:
 *     summary: Update an assignment
 *     tags: [Admin - Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Assignment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               teacher:
 *                 type: string
 *               class:
 *                 type: string
 *               subject:
 *                 type: string
 *               day:
 *                 type: string
 *                 enum: [monday, tuesday, wednesday, thursday, friday, saturday]
 *               startTime:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               endTime:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               academicYear:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Assignment updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Assignment, teacher, or class not found
 *       409:
 *         description: Time conflict or duplicate assignment
 *   delete:
 *     summary: Delete an assignment (soft delete)
 *     tags: [Admin - Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Assignment ID
 *     responses:
 *       200:
 *         description: Assignment deleted successfully
 *       404:
 *         description: Assignment not found
 */

/**
 * @swagger
 * /api/admin/assignments/teacher/{teacherId}:
 *   get:
 *     summary: Get assignments by teacher
 *     tags: [Admin - Assignments]
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *         description: Teacher ID
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *         description: Filter by academic year
 *       - in: query
 *         name: day
 *         schema:
 *           type: string
 *           enum: [monday, tuesday, wednesday, thursday, friday, saturday]
 *         description: Filter by day
 *     responses:
 *       200:
 *         description: Teacher's assignments grouped by day
 *       404:
 *         description: Teacher not found
 */

/**
 * @swagger
 * /api/admin/assignments/class/{classId}:
 *   get:
 *     summary: Get assignments by class
 *     tags: [Admin - Assignments]
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *         description: Filter by academic year
 *       - in: query
 *         name: day
 *         schema:
 *           type: string
 *           enum: [monday, tuesday, wednesday, thursday, friday, saturday]
 *         description: Filter by day
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *         description: Filter by subject
 *     responses:
 *       200:
 *         description: Class timetable and assignments
 *       404:
 *         description: Class not found
 */

/**
 * @swagger
 * /api/admin/assignments/teacher/{teacherId}/schedule/{day}:
 *   get:
 *     summary: Get teacher's schedule for a specific day
 *     tags: [Admin - Assignments]
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *         description: Teacher ID
 *       - in: path
 *         name: day
 *         required: true
 *         schema:
 *           type: string
 *           enum: [monday, tuesday, wednesday, thursday, friday, saturday]
 *         description: Day of the week
 *     responses:
 *       200:
 *         description: Teacher's daily schedule
 *       404:
 *         description: Teacher not found
 */

/**
 * @swagger
 * /api/admin/assignments/statistics:
 *   get:
 *     summary: Get assignment statistics
 *     tags: [Admin - Assignments]
 *     parameters:
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *         description: Filter by academic year
 *     responses:
 *       200:
 *         description: Assignment statistics including subject distribution, day distribution, and teacher workload
 */

// Main CRUD routes
router.get('/', getAllAssignments);
router.post('/', createAssignment);
router.get('/:id', getAssignmentById);
router.put('/:id', updateAssignment);
router.delete('/:id', deleteAssignment);

// Specialized routes
router.get('/teacher/:teacherId', getAssignmentsByTeacher);
router.get('/class/:classId', getAssignmentsByClass);
router.get('/teacher/:teacherId/schedule/:day', getTeacherDaySchedule);
router.get('/statistics/overview', getAssignmentStatistics);

module.exports = router;