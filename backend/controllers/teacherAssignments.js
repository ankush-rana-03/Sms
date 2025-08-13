const TeacherAssignment = require('../models/TeacherAssignment');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const mongoose = require('mongoose');

// Helper function to format time for comparison
const timeToMinutes = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper function to validate time format
const isValidTimeFormat = (time) => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

// Create a new teacher assignment
exports.createAssignment = async (req, res) => {
  try {
    const { teacher, class: classId, subject, day, startTime, endTime, academicYear, notes } = req.body;

    // Validate required fields
    if (!teacher || !classId || !subject || !day || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Teacher, class, subject, day, start time, and end time are required'
      });
    }

    // Validate time format
    if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time format. Use HH:MM format (24-hour)'
      });
    }

    // Validate that end time is after start time
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    // Check if teacher exists
    const teacherExists = await Teacher.findById(teacher);
    if (!teacherExists) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Check if class exists
    const classExists = await Class.findById(classId);
    if (!classExists) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check for time conflicts
    const conflict = await TeacherAssignment.checkTimeConflict(teacher, day, startTime, endTime);
    if (conflict) {
      return res.status(409).json({
        success: false,
        message: 'Time is already assigned',
        details: `Teacher already has an assignment for ${conflict.subject} in ${conflict.class.name} ${conflict.class.section} from ${conflict.startTime} to ${conflict.endTime} on ${conflict.getDayDisplayName()}`
      });
    }

    // Create the assignment
    const assignment = new TeacherAssignment({
      teacher,
      class: classId,
      subject,
      day: day.toLowerCase(),
      startTime,
      endTime,
      academicYear: academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      notes
    });

    await assignment.save();

    // Populate the response
    await assignment.populate([
      { path: 'teacher', select: 'name email teacherId designation' },
      { path: 'class', select: 'name section academicYear roomNumber' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: assignment
    });

  } catch (error) {
    console.error('Error creating assignment:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate assignment. This exact assignment already exists.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating assignment',
      error: error.message
    });
  }
};

// Get all assignments with filtering and pagination
exports.getAllAssignments = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      teacher, 
      class: classId, 
      day, 
      subject, 
      academicYear,
      search 
    } = req.query;

    // Build query
    const query = { isActive: true };

    if (teacher) query.teacher = teacher;
    if (classId) query.class = classId;
    if (day) query.day = day.toLowerCase();
    if (subject) query.subject = { $regex: subject, $options: 'i' };
    if (academicYear) query.academicYear = academicYear;

    // Search across multiple fields
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const assignments = await TeacherAssignment.find(query)
      .populate('teacher', 'name email teacherId designation')
      .populate('class', 'name section academicYear roomNumber')
      .sort({ day: 1, startTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await TeacherAssignment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: assignments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
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
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment ID'
      });
    }

    const assignment = await TeacherAssignment.findById(id)
      .populate('teacher', 'name email teacherId designation phone')
      .populate('class', 'name section academicYear roomNumber capacity');

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
    const { id } = req.params;
    const { teacher, class: classId, subject, day, startTime, endTime, academicYear, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment ID'
      });
    }

    const assignment = await TeacherAssignment.findById(id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Validate time format if provided
    if (startTime && !isValidTimeFormat(startTime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start time format. Use HH:MM format (24-hour)'
      });
    }

    if (endTime && !isValidTimeFormat(endTime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid end time format. Use HH:MM format (24-hour)'
      });
    }

    // Validate that end time is after start time if both are provided
    const newStartTime = startTime || assignment.startTime;
    const newEndTime = endTime || assignment.endTime;
    
    if (timeToMinutes(newEndTime) <= timeToMinutes(newStartTime)) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    // Check if teacher exists if provided
    if (teacher) {
      const teacherExists = await Teacher.findById(teacher);
      if (!teacherExists) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }
    }

    // Check if class exists if provided
    if (classId) {
      const classExists = await Class.findById(classId);
      if (!classExists) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
        });
      }
    }

    // Check for time conflicts if teacher, day, or time is being changed
    const newTeacher = teacher || assignment.teacher;
    const newDay = day ? day.toLowerCase() : assignment.day;
    
    if (teacher || day || startTime || endTime) {
      const conflict = await TeacherAssignment.checkTimeConflict(
        newTeacher, 
        newDay, 
        newStartTime, 
        newEndTime, 
        id
      );
      
      if (conflict) {
        return res.status(409).json({
          success: false,
          message: 'Time is already assigned',
          details: `Teacher already has an assignment for ${conflict.subject} in ${conflict.class.name} ${conflict.class.section} from ${conflict.startTime} to ${conflict.endTime} on ${conflict.getDayDisplayName()}`
        });
      }
    }

    // Update fields
    if (teacher) assignment.teacher = teacher;
    if (classId) assignment.class = classId;
    if (subject) assignment.subject = subject;
    if (day) assignment.day = day.toLowerCase();
    if (startTime) assignment.startTime = startTime;
    if (endTime) assignment.endTime = endTime;
    if (academicYear) assignment.academicYear = academicYear;
    if (notes !== undefined) assignment.notes = notes;

    await assignment.save();

    // Populate the response
    await assignment.populate([
      { path: 'teacher', select: 'name email teacherId designation' },
      { path: 'class', select: 'name section academicYear roomNumber' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Assignment updated successfully',
      data: assignment
    });

  } catch (error) {
    console.error('Error updating assignment:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate assignment. This exact assignment already exists.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating assignment',
      error: error.message
    });
  }
};

// Delete assignment (soft delete)
exports.deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment ID'
      });
    }

    const assignment = await TeacherAssignment.findById(id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    assignment.isActive = false;
    await assignment.save();

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
    const { academicYear, day } = req.query;

    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid teacher ID'
      });
    }

    const query = { teacher: teacherId, isActive: true };
    if (academicYear) query.academicYear = academicYear;
    if (day) query.day = day.toLowerCase();

    const assignments = await TeacherAssignment.find(query)
      .populate('class', 'name section academicYear roomNumber')
      .sort({ day: 1, startTime: 1 });

    // Group by day for better organization
    const groupedAssignments = {};
    assignments.forEach(assignment => {
      const dayKey = assignment.getDayDisplayName();
      if (!groupedAssignments[dayKey]) {
        groupedAssignments[dayKey] = [];
      }
      groupedAssignments[dayKey].push(assignment);
    });

    res.status(200).json({
      success: true,
      data: {
        assignments,
        groupedByDay: groupedAssignments,
        totalAssignments: assignments.length
      }
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
    const { academicYear, day, subject } = req.query;

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class ID'
      });
    }

    const query = { class: classId, isActive: true };
    if (academicYear) query.academicYear = academicYear;
    if (day) query.day = day.toLowerCase();
    if (subject) query.subject = { $regex: subject, $options: 'i' };

    const assignments = await TeacherAssignment.find(query)
      .populate('teacher', 'name email teacherId designation')
      .sort({ day: 1, startTime: 1 });

    // Group by day and subject for timetable view
    const timetable = {};
    const subjects = new Set();
    
    assignments.forEach(assignment => {
      const dayKey = assignment.getDayDisplayName();
      if (!timetable[dayKey]) {
        timetable[dayKey] = [];
      }
      timetable[dayKey].push(assignment);
      subjects.add(assignment.subject);
    });

    res.status(200).json({
      success: true,
      data: {
        assignments,
        timetable,
        subjects: Array.from(subjects),
        totalAssignments: assignments.length
      }
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

// Get teacher's schedule for a specific day
exports.getTeacherDaySchedule = async (req, res) => {
  try {
    const { teacherId, day } = req.params;

    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid teacher ID'
      });
    }

    const assignments = await TeacherAssignment.find({
      teacher: teacherId,
      day: day.toLowerCase(),
      isActive: true
    })
      .populate('class', 'name section roomNumber')
      .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      data: {
        day: day.charAt(0).toUpperCase() + day.slice(1).toLowerCase(),
        assignments,
        totalPeriods: assignments.length
      }
    });

  } catch (error) {
    console.error('Error fetching teacher day schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching teacher day schedule',
      error: error.message
    });
  }
};

// Get assignment statistics
exports.getAssignmentStatistics = async (req, res) => {
  try {
    const { academicYear } = req.query;
    const query = { isActive: true };
    if (academicYear) query.academicYear = academicYear;

    const totalAssignments = await TeacherAssignment.countDocuments(query);
    
    const subjectStats = await TeacherAssignment.aggregate([
      { $match: query },
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const dayStats = await TeacherAssignment.aggregate([
      { $match: query },
      { $group: { _id: '$day', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const teacherStats = await TeacherAssignment.aggregate([
      { $match: query },
      { $group: { _id: '$teacher', count: { $sum: 1 } } },
      { $lookup: { from: 'teachers', localField: '_id', foreignField: '_id', as: 'teacher' } },
      { $unwind: '$teacher' },
      { $project: { teacherName: '$teacher.name', count: 1 } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalAssignments,
        subjectDistribution: subjectStats,
        dayDistribution: dayStats,
        topTeachers: teacherStats
      }
    });

  } catch (error) {
    console.error('Error fetching assignment statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignment statistics',
      error: error.message
    });
  }
};