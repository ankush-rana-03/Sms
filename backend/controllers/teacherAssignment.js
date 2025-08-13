const TeacherAssignment = require('../models/TeacherAssignment');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const User = require('../models/User');

// Create a new teacher assignment
exports.createAssignment = async (req, res) => {
  try {
    const {
      teacherId,
      classId,
      subject,
      day,
      startTime,
      endTime,
      academicYear,
      semester,
      notes
    } = req.body;

    // Validate required fields
    if (!teacherId || !classId || !subject || !day || !startTime || !endTime || !semester) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({
        success: false,
        message: 'Time must be in HH:MM format'
      });
    }

    // Check if start time is before end time
    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: 'Start time must be before end time'
      });
    }

    // Validate day
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if (!validDays.includes(day)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid day. Must be one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday'
      });
    }

    // Validate semester
    const validSemesters = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth'];
    if (!validSemesters.includes(semester)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid semester'
      });
    }

    // Check if teacher exists
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Check if class exists
    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check for time conflicts
    const conflicts = await TeacherAssignment.findConflicts(
      teacherId,
      day,
      startTime,
      endTime,
      academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      semester
    );

    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Time conflict detected',
        conflicts: conflicts.map(conflict => ({
          day: conflict.day,
          startTime: conflict.startTime,
          endTime: conflict.endTime,
          subject: conflict.subject,
          className: conflict.class.name
        }))
      });
    }

    // Create the assignment
    const assignment = new TeacherAssignment({
      teacher: teacherId,
      class: classId,
      subject,
      day,
      startTime,
      endTime,
      academicYear: academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      semester,
      notes,
      createdBy: req.user.id
    });

    await assignment.save();

    // Populate references for response
    await assignment.populate([
      { path: 'teacher', select: 'name teacherId email' },
      { path: 'class', select: 'name grade section' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Teacher assignment created successfully',
      data: assignment
    });

  } catch (error) {
    console.error('Error creating teacher assignment:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Assignment already exists with the same parameters'
      });
    }

    if (error.message.includes('Time conflict')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating teacher assignment',
      error: error.message
    });
  }
};

// Get all assignments with filtering and pagination
exports.getAllAssignments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      teacherId,
      classId,
      subject,
      day,
      academicYear,
      semester,
      isActive,
      search
    } = req.query;

    // Build query
    const query = {};

    if (teacherId) query.teacher = teacherId;
    if (classId) query.class = classId;
    if (subject) query.subject = { $regex: subject, $options: 'i' };
    if (day) query.day = day;
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = semester;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const assignments = await TeacherAssignment.find(query)
      .populate('teacher', 'name teacherId email')
      .populate('class', 'name grade section')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ day: 1, startTime: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await TeacherAssignment.countDocuments(query);

    res.status(200).json({
      success: true,
      count: assignments.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: assignments
    });

  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignments',
      error: error.message
    });
  }
};

// Get assignment by ID
exports.getAssignmentById = async (req, res) => {
  try {
    const assignment = await TeacherAssignment.findById(req.params.id)
      .populate('teacher', 'name teacherId email phone designation')
      .populate('class', 'name grade section')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: assignment
    });

  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignment',
      error: error.message
    });
  }
};

// Update assignment
exports.updateAssignment = async (req, res) => {
  try {
    const {
      teacherId,
      classId,
      subject,
      day,
      startTime,
      endTime,
      academicYear,
      semester,
      notes,
      isActive
    } = req.body;

    const assignment = await TeacherAssignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check for time conflicts if time-related fields are being updated
    if (startTime || endTime || day || teacherId) {
      const conflicts = await TeacherAssignment.findConflicts(
        teacherId || assignment.teacher,
        day || assignment.day,
        startTime || assignment.startTime,
        endTime || assignment.endTime,
        academicYear || assignment.academicYear,
        semester || assignment.semester,
        req.params.id
      );

      if (conflicts.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Time conflict detected',
          conflicts: conflicts.map(conflict => ({
            day: conflict.day,
            startTime: conflict.startTime,
            endTime: conflict.endTime,
            subject: conflict.subject,
            className: conflict.class.name
          }))
        });
      }
    }

    // Update fields
    if (teacherId) assignment.teacher = teacherId;
    if (classId) assignment.class = classId;
    if (subject) assignment.subject = subject;
    if (day) assignment.day = day;
    if (startTime) assignment.startTime = startTime;
    if (endTime) assignment.endTime = endTime;
    if (academicYear) assignment.academicYear = academicYear;
    if (semester) assignment.semester = semester;
    if (notes !== undefined) assignment.notes = notes;
    if (isActive !== undefined) assignment.isActive = isActive;

    assignment.updatedBy = req.user.id;

    await assignment.save();

    // Populate references for response
    await assignment.populate([
      { path: 'teacher', select: 'name teacherId email' },
      { path: 'class', select: 'name grade section' },
      { path: 'createdBy', select: 'name email' },
      { path: 'updatedBy', select: 'name email' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Assignment updated successfully',
      data: assignment
    });

  } catch (error) {
    console.error('Error updating assignment:', error);
    
    if (error.message.includes('Time conflict')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating assignment',
      error: error.message
    });
  }
};

// Delete assignment
exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await TeacherAssignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    await TeacherAssignment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Assignment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting assignment',
      error: error.message
    });
  }
};

// Get assignments by teacher
exports.getAssignmentsByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { academicYear, semester, isActive = true } = req.query;

    const query = { teacher: teacherId };
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = semester;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const assignments = await TeacherAssignment.find(query)
      .populate('class', 'name grade section')
      .populate('teacher', 'name teacherId email')
      .sort({ day: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments
    });

  } catch (error) {
    console.error('Error fetching teacher assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching teacher assignments',
      error: error.message
    });
  }
};

// Get assignments by class
exports.getAssignmentsByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { academicYear, semester, isActive = true } = req.query;

    const query = { class: classId };
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = semester;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const assignments = await TeacherAssignment.find(query)
      .populate('teacher', 'name teacherId email designation')
      .populate('class', 'name grade section')
      .sort({ day: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments
    });

  } catch (error) {
    console.error('Error fetching class assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching class assignments',
      error: error.message
    });
  }
};

// Get weekly schedule for a teacher
exports.getTeacherWeeklySchedule = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { academicYear, semester } = req.query;

    const query = { 
      teacher: teacherId, 
      isActive: true 
    };
    
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = semester;

    const assignments = await TeacherAssignment.find(query)
      .populate('class', 'name grade section')
      .sort({ day: 1, startTime: 1 });

    // Group by day
    const weeklySchedule = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: []
    };

    assignments.forEach(assignment => {
      weeklySchedule[assignment.day].push({
        _id: assignment._id,
        subject: assignment.subject,
        class: assignment.class,
        startTime: assignment.startTime,
        endTime: assignment.endTime,
        notes: assignment.notes
      });
    });

    res.status(200).json({
      success: true,
      data: weeklySchedule
    });

  } catch (error) {
    console.error('Error fetching teacher weekly schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching teacher weekly schedule',
      error: error.message
    });
  }
};

// Get weekly schedule for a class
exports.getClassWeeklySchedule = async (req, res) => {
  try {
    const { classId } = req.params;
    const { academicYear, semester } = req.query;

    const query = { 
      class: classId, 
      isActive: true 
    };
    
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = semester;

    const assignments = await TeacherAssignment.find(query)
      .populate('teacher', 'name teacherId email designation')
      .sort({ day: 1, startTime: 1 });

    // Group by day
    const weeklySchedule = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: []
    };

    assignments.forEach(assignment => {
      weeklySchedule[assignment.day].push({
        _id: assignment._id,
        subject: assignment.subject,
        teacher: assignment.teacher,
        startTime: assignment.startTime,
        endTime: assignment.endTime,
        notes: assignment.notes
      });
    });

    res.status(200).json({
      success: true,
      data: weeklySchedule
    });

  } catch (error) {
    console.error('Error fetching class weekly schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching class weekly schedule',
      error: error.message
    });
  }
};

// Check for time conflicts
exports.checkTimeConflicts = async (req, res) => {
  try {
    const {
      teacherId,
      classId,
      day,
      startTime,
      endTime,
      academicYear,
      semester,
      excludeAssignmentId
    } = req.body;

    if (!teacherId || !day || !startTime || !endTime || !semester) {
      return res.status(400).json({
        success: false,
        message: 'Teacher ID, day, start time, end time, and semester are required'
      });
    }

    const conflicts = await TeacherAssignment.findConflicts(
      teacherId,
      day,
      startTime,
      endTime,
      academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      semester,
      excludeAssignmentId
    );

    res.status(200).json({
      success: true,
      hasConflicts: conflicts.length > 0,
      conflicts: conflicts.map(conflict => ({
        _id: conflict._id,
        day: conflict.day,
        startTime: conflict.startTime,
        endTime: conflict.endTime,
        subject: conflict.subject,
        className: conflict.class.name
      }))
    });

  } catch (error) {
    console.error('Error checking time conflicts:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking time conflicts',
      error: error.message
    });
  }
};

// Bulk create assignments
exports.bulkCreateAssignments = async (req, res) => {
  try {
    const { assignments } = req.body;

    if (!Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Assignments array is required and must not be empty'
      });
    }

    const results = [];
    const errors = [];

    for (const assignmentData of assignments) {
      try {
        const {
          teacherId,
          classId,
          subject,
          day,
          startTime,
          endTime,
          academicYear,
          semester,
          notes
        } = assignmentData;

        // Validate required fields
        if (!teacherId || !classId || !subject || !day || !startTime || !endTime || !semester) {
          errors.push({
            data: assignmentData,
            error: 'Missing required fields'
          });
          continue;
        }

        // Check for conflicts
        const conflicts = await TeacherAssignment.findConflicts(
          teacherId,
          day,
          startTime,
          endTime,
          academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
          semester
        );

        if (conflicts.length > 0) {
          errors.push({
            data: assignmentData,
            error: 'Time conflict detected',
            conflicts
          });
          continue;
        }

        // Create assignment
        const assignment = new TeacherAssignment({
          teacher: teacherId,
          class: classId,
          subject,
          day,
          startTime,
          endTime,
          academicYear: academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
          semester,
          notes,
          createdBy: req.user.id
        });

        await assignment.save();
        results.push(assignment);

      } catch (error) {
        errors.push({
          data: assignmentData,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully created ${results.length} assignments`,
      created: results.length,
      failed: errors.length,
      results: results.map(r => ({
        _id: r._id,
        teacher: r.teacher,
        class: r.class,
        subject: r.subject,
        day: r.day,
        startTime: r.startTime,
        endTime: r.endTime
      })),
      errors
    });

  } catch (error) {
    console.error('Error in bulk create assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Error in bulk create assignments',
      error: error.message
    });
  }
};