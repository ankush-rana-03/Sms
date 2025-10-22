const Homework = require('../models/Homework');
const Class = require('../models/Class');
const Session = require('../models/Session');
const Student = require('../models/Student');

// @desc    Get all homework
// @route   GET /api/homework
// @access  Private
exports.getAllHomework = async (req, res) => {
  try {
    const { class: classFilter, section: sectionFilter, subject: subjectFilter } = req.query;
    
    let filter = { isActive: true };
    
    if (classFilter) {
      filter['class.name'] = classFilter;
    }
    if (sectionFilter) {
      filter.section = sectionFilter;
    }
    if (subjectFilter) {
      filter.subject = subjectFilter;
    }

    const homework = await Homework.find(filter)
      .populate('class', 'name section')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: homework });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching homework', error: error.message });
  }
};

// @desc    Get homework by ID
// @route   GET /api/homework/:id
// @access  Private
exports.getHomeworkById = async (req, res) => {
  try {
    const homework = await Homework.findById(req.params.id)
      .populate('class', 'name section')
      .populate('assignedBy', 'name email')
      .populate('submissions.student', 'name grade section rollNumber')
      .populate('parentCompletions.student', 'name grade section rollNumber')
      .populate('parentCompletions.parent', 'name email');

    if (!homework) {
      return res.status(404).json({ success: false, message: 'Homework not found' });
    }

    res.json({ success: true, data: homework });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching homework', error: error.message });
  }
};

// @desc    Create new homework
// @route   POST /api/homework
// @access  Private (Teacher, Admin, Principal)
exports.createHomework = async (req, res) => {
  try {
    // Add the assignedBy field from the authenticated user
    req.body.assignedBy = req.user.id;
    
    // If class and section are provided as strings, find the actual class ID
    if (req.body.class && req.body.section) {
      // Get current session
      const currentSession = await Session.findOne({ isCurrent: true });
      if (!currentSession) {
        return res.status(400).json({ 
          success: false, 
          message: 'No active session found' 
        });
      }
      
      // Find the class by name and section
      const classDoc = await Class.findOne({
        name: req.body.class,
        section: req.body.section,
        session: currentSession.name,
        isActive: true
      });
      
      if (!classDoc) {
        return res.status(400).json({ 
          success: false, 
          message: `Class ${req.body.class} Section ${req.body.section} not found` 
        });
      }
      
      // Replace class name with actual class ID
      req.body.class = classDoc._id;
    }
    
    const homework = new Homework(req.body);
    await homework.save();
    
    // Populate the created homework for response
    const populatedHomework = await Homework.findById(homework._id)
      .populate('class', 'name section')
      .populate('assignedBy', 'name email');
    
    res.status(201).json({ success: true, data: populatedHomework });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating homework', error: error.message });
  }
};

// @desc    Update homework
// @route   PUT /api/homework/:id
// @access  Private (Teacher, Admin, Principal)
exports.updateHomework = async (req, res) => {
  try {
    const homework = await Homework.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('class', 'name section')
      .populate('assignedBy', 'name email');
    
    if (!homework) {
      return res.status(404).json({ success: false, message: 'Homework not found' });
    }
    
    res.json({ success: true, data: homework });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating homework', error: error.message });
  }
};

// @desc    Delete homework
// @route   DELETE /api/homework/:id
// @access  Private (Teacher, Admin, Principal)
exports.deleteHomework = async (req, res) => {
  try {
    const homework = await Homework.findByIdAndDelete(req.params.id);
    if (!homework) {
      return res.status(404).json({ success: false, message: 'Homework not found' });
    }
    res.json({ success: true, message: 'Homework deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting homework', error: error.message });
  }
};

// @desc    Get homework by class and section
// @route   GET /api/homework/class/:className/section/:sectionName
// @access  Private
exports.getHomeworkByClassSection = async (req, res) => {
  try {
    const { className, sectionName } = req.params;
    
    // Get current session
    const currentSession = await Session.findOne({ isCurrent: true });
    if (!currentSession) {
      return res.status(400).json({ 
        success: false, 
        message: 'No active session found' 
      });
    }
    
    // Find the class
    const classDoc = await Class.findOne({
      name: className,
      section: sectionName,
      session: currentSession.name,
      isActive: true
    });
    
    if (!classDoc) {
      return res.status(404).json({ 
        success: false, 
        message: `Class ${className} Section ${sectionName} not found` 
      });
    }
    
    // Find homework for this class
    const homework = await Homework.find({
      class: classDoc._id,
      isActive: true
    })
    .populate('class', 'name section')
    .populate('assignedBy', 'name email')
    .sort({ dueDate: 1 });

    res.json({ success: true, data: homework });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching homework', error: error.message });
  }
};

// @desc    Get homework statistics
// @route   GET /api/homework/statistics
// @access  Private (Admin, Principal)
exports.getHomeworkStatistics = async (req, res) => {
  try {
    const totalHomework = await Homework.countDocuments({ isActive: true });
    
    // Get homework by class
    const homeworkByClass = await Homework.aggregate([
      { $match: { isActive: true } },
      { $lookup: { from: 'classes', localField: 'class', foreignField: '_id', as: 'classInfo' } },
      { $unwind: '$classInfo' },
      { $group: { 
        _id: { 
          className: '$classInfo.name', 
          section: '$section' 
        }, 
        count: { $sum: 1 },
        subjects: { $addToSet: '$subject' }
      }},
      { $sort: { '_id.className': 1, '_id.section': 1 } }
    ]);

    // Get completion statistics
    const completionStats = await Homework.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$parentCompletions' },
      { $group: {
        _id: '$parentCompletions.completionStatus',
        count: { $sum: 1 }
      }}
    ]);

    res.json({ 
      success: true, 
      data: { 
        totalHomework, 
        homeworkByClass, 
        completionStats 
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching statistics', error: error.message });
  }
};

// @desc    Submit homework (for students)
// @route   POST /api/homework/:id/submit
// @access  Private (Student)
exports.submitHomework = async (req, res) => {
  try {
    const { comments, attachments } = req.body;
    const studentId = req.user.id;

    const homework = await Homework.findById(req.params.id);
    if (!homework) {
      return res.status(404).json({ success: false, message: 'Homework not found' });
    }

    // Check if already submitted
    const existingSubmission = homework.submissions.find(
      sub => sub.student.toString() === studentId
    );

    if (existingSubmission) {
      return res.status(400).json({ 
        success: false, 
        message: 'Homework already submitted' 
      });
    }

    // Add submission
    homework.submissions.push({
      student: studentId,
      comments,
      attachments: attachments || [],
      isLate: new Date() > new Date(homework.dueDate)
    });

    await homework.save();

    res.status(200).json({ 
      success: true, 
      message: 'Homework submitted successfully',
      data: homework.submissions[homework.submissions.length - 1]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error submitting homework', error: error.message });
  }
};

// @desc    Grade homework (for teachers)
// @route   POST /api/homework/:id/grade
// @access  Private (Teacher, Admin, Principal)
exports.gradeHomework = async (req, res) => {
  try {
    const { studentId, marks, feedback } = req.body;

    const homework = await Homework.findById(req.params.id);
    if (!homework) {
      return res.status(404).json({ success: false, message: 'Homework not found' });
    }

    const submission = homework.submissions.find(
      sub => sub.student.toString() === studentId
    );

    if (!submission) {
      return res.status(404).json({ 
        success: false, 
        message: 'Submission not found' 
      });
    }

    submission.marks = marks;
    submission.feedback = feedback;

    await homework.save();

    res.status(200).json({ 
      success: true, 
      message: 'Homework graded successfully',
      data: submission
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error grading homework', error: error.message });
  }
};