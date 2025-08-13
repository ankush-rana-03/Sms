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
  getTeacherWeeklySchedule,
  getClassWeeklySchedule,
  checkTimeConflicts,
  bulkCreateAssignments
} = require('../controllers/teacherAssignment');

// All routes require authentication
router.use(protect);

/**
 * @swagger
 * components:
 *   schemas:
 *     TeacherAssignment:
 *       type: object
 *       required:
 *         - teacherId
 *         - classId
 *         - subject
 *         - day
 *         - startTime
 *         - endTime
 *         - semester
 *       properties:
 *         teacherId:
 *           type: string
 *           description: ID of the teacher
 *         classId:
 *           type: string
 *           description: ID of the class
 *         subject:
 *           type: string
 *           description: Subject name
 *         day:
 *           type: string
 *           enum: [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday]
 *           description: Day of the week
 *         startTime:
 *           type: string
 *           pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *           description: Start time in HH:MM format
 *         endTime:
 *           type: string
 *           pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *           description: End time in HH:MM format
 *         academicYear:
 *           type: string
 *           description: Academic year (e.g., "2024-2025")
 *         semester:
 *           type: string
 *           enum: [First, Second, Third, Fourth, Fifth, Sixth, Seventh, Eighth]
 *           description: Semester
 *         notes:
 *           type: string
 *           maxLength: 500
 *           description: Additional notes
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Whether the assignment is active
 */

/**
 * @swagger
 * /api/assignments:
 *   post:
 *     summary: Create a new teacher assignment
 *     tags: [Teacher Assignments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TeacherAssignment'
 *     responses:
 *       201:
 *         description: Assignment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/TeacherAssignment'
 *       400:
 *         description: Bad request - validation error
 *       409:
 *         description: Conflict - time conflict or duplicate assignment
 *       500:
 *         description: Internal server error
 *   get:
 *     summary: Get all assignments with filtering and pagination
 *     tags: [Teacher Assignments]
 *     security:
 *       - bearerAuth: []
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
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: teacherId
 *         schema:
 *           type: string
 *         description: Filter by teacher ID
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *         description: Filter by class ID
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *         description: Filter by subject
 *       - in: query
 *         name: day
 *         schema:
 *           type: string
 *           enum: [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday]
 *         description: Filter by day
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *         description: Filter by academic year
 *       - in: query
 *         name: semester
 *         schema:
 *           type: string
 *         description: Filter by semester
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in subject and notes
 *     responses:
 *       200:
 *         description: List of assignments
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/assignments/{id}:
 *   get:
 *     summary: Get assignment by ID
 *     tags: [Teacher Assignments]
 *     security:
 *       - bearerAuth: []
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
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update assignment
 *     tags: [Teacher Assignments]
 *     security:
 *       - bearerAuth: []
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
 *             $ref: '#/components/schemas/TeacherAssignment'
 *     responses:
 *       200:
 *         description: Assignment updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Assignment not found
 *       409:
 *         description: Conflict - time conflict
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete assignment
 *     tags: [Teacher Assignments]
 *     security:
 *       - bearerAuth: []
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
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/assignments/teacher/{teacherId}:
 *   get:
 *     summary: Get assignments by teacher
 *     tags: [Teacher Assignments]
 *     security:
 *       - bearerAuth: []
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
 *         name: semester
 *         schema:
 *           type: string
 *         description: Filter by semester
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Teacher assignments
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/assignments/class/{classId}:
 *   get:
 *     summary: Get assignments by class
 *     tags: [Teacher Assignments]
 *     security:
 *       - bearerAuth: []
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
 *         name: semester
 *         schema:
 *           type: string
 *         description: Filter by semester
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Class assignments
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/assignments/teacher/{teacherId}/schedule:
 *   get:
 *     summary: Get weekly schedule for a teacher
 *     tags: [Teacher Assignments]
 *     security:
 *       - bearerAuth: []
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
 *         name: semester
 *         schema:
 *           type: string
 *         description: Filter by semester
 *     responses:
 *       200:
 *         description: Weekly schedule
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/assignments/class/{classId}/schedule:
 *   get:
 *     summary: Get weekly schedule for a class
 *     tags: [Teacher Assignments]
 *     security:
 *       - bearerAuth: []
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
 *         name: semester
 *         schema:
 *           type: string
 *         description: Filter by semester
 *     responses:
 *       200:
 *         description: Weekly schedule
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/assignments/check-conflicts:
 *   post:
 *     summary: Check for time conflicts
 *     tags: [Teacher Assignments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teacherId
 *               - day
 *               - startTime
 *               - endTime
 *               - semester
 *             properties:
 *               teacherId:
 *                 type: string
 *               classId:
 *                 type: string
 *               day:
 *                 type: string
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               academicYear:
 *                 type: string
 *               semester:
 *                 type: string
 *               excludeAssignmentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Conflict check result
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/assignments/bulk:
 *   post:
 *     summary: Bulk create assignments
 *     tags: [Teacher Assignments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assignments
 *             properties:
 *               assignments:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/TeacherAssignment'
 *     responses:
 *       200:
 *         description: Bulk creation result
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */

// Public routes (require only authentication)
router.post('/', createAssignment);
router.get('/', getAllAssignments);
router.get('/:id', getAssignmentById);
router.put('/:id', updateAssignment);
router.delete('/:id', deleteAssignment);

// Teacher-specific routes
router.get('/teacher/:teacherId', getAssignmentsByTeacher);
router.get('/teacher/:teacherId/schedule', getTeacherWeeklySchedule);

// Class-specific routes
router.get('/class/:classId', getAssignmentsByClass);
router.get('/class/:classId/schedule', getClassWeeklySchedule);

// Utility routes
router.post('/check-conflicts', checkTimeConflicts);
router.post('/bulk', bulkCreateAssignments);

module.exports = router;