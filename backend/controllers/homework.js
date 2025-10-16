const Homework = require('../models/Homework');
const Class = require('../models/Class');
const Student = require('../models/Student');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all homework with filtering
// @route   GET /api/homework
// @access  Private (All roles)
exports.getAllHomework = async (req, res, next) => {
  try {
    const { classId, subject, status } = req.query;
    
    const query = {};
    
    if (classId) {
      query.class = classId;
    }
    
    if (subject) {
      query.subject = { $regex: subject, $options: 'i' };
    }
    
    if (status) {
      const now = new Date();
      switch (status) {
        case 'upcoming':
          query.dueDate = { $gt: now };
          break;
        case 'due':
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          query.dueDate = { $lte: today, $gte: new Date(today.getTime() - 24 * 60 * 60 * 1000) };
          break;
        case 'overdue':
          query.dueDate = { $lt: new Date() };
          break;
        case 'completed':
          query.isActive = false;
          break;
      }
    }
    
    const homework = await Homework.find(query)
      .populate('class', 'name grade section')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: homework.length,
      data: homework
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new homework
// @route   POST /api/homework
// @access  Private (Teacher, Admin, Principal)
exports.createHomework = async (req, res, next) => {
  try {
    const {
      title,
      description,
      subject,
      classId,
      dueDate,
      instructions,
      totalMarks
    } = req.body;

    if (!title || !description || !subject || !classId || !dueDate) {
      return next(new ErrorResponse('Title, description, subject, class, and due date are required', 400));
    }

    const classExists = await Class.findById(classId);
    if (!classExists) {
      return next(new ErrorResponse('Class not found', 404));
    }

    const homeworkData = {
      title,
      description,
      subject,
      class: classId,
      assignedBy: req.user.id,
      dueDate: new Date(dueDate),
      instructions,
      totalMarks: totalMarks || 0
    };

    const homework = await Homework.create(homeworkData);

    const populatedHomework = await Homework.findById(homework._id)
      .populate('class', 'name grade section')
      .populate('assignedBy', 'name email');

    res.status(201).json({
      success: true,
      data: populatedHomework,
      message: 'Homework created successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get homework for parent's children
// @route   GET /api/homework/parent
// @access  Private (Parent)
exports.getParentHomework = async (req, res, next) => {
  try {
    const children = await Student.find({ parentPhone: req.user.phone });
    
    if (children.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: 'No children found for this parent'
      });
    }

    const classIds = children.map(child => child.grade).filter((value, index, self) => self.indexOf(value) === index);
    
    const homework = await Homework.find({
      class: { $in: classIds },
      isActive: true
    })
    .populate('class', 'name grade section')
    .populate('assignedBy', 'name email')
    .sort({ dueDate: 1 });

    const filteredHomework = homework.filter(hw => {
      return children.some(child => 
        child.grade === hw.class.grade && 
        (child.section === hw.class.section || !hw.class.section)
      );
    });

    res.status(200).json({
      success: true,
      count: filteredHomework.length,
      data: filteredHomework
    });
  } catch (err) {
    next(err);
  }
};
