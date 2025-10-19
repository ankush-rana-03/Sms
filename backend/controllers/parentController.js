const Homework = require('../models/Homework');
const Test = require('../models/Test');
const Result = require('../models/Result');
const Student = require('../models/Student');
const Class = require('../models/Class');

// Get homework for parent's children only
exports.getParentHomework = async (req, res) => {
  try {
    if (req.user.role !== 'parent' || !req.parentChildrenIds) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This endpoint is for parents only.'
      });
    }

    if (req.parentChildrenIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No children found for this parent account'
      });
    }

    // Get all classes where parent's children are enrolled
    const children = await Student.find({ 
      _id: { $in: req.parentChildrenIds },
      deletedAt: null 
    }).select('grade section currentSession');

    if (children.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No children found for this parent account'
      });
    }

    // Get unique class combinations
    const classCombinations = [...new Set(children.map(child => 
      `${child.grade}-${child.section}-${child.currentSession}`
    ))];

    // Find classes that match parent's children
    const classes = await Class.find({
      $or: children.map(child => ({
        name: child.grade,
        section: child.section,
        session: child.currentSession
      }))
    }).select('_id name section session');

    const classIds = classes.map(cls => cls._id);

    // Get homework for these classes
    const homework = await Homework.find({
      class: { $in: classIds }
    })
      .populate('class', 'name section session')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ 
      success: true, 
      data: homework,
      childrenCount: children.length,
      classesCount: classes.length
    });
  } catch (error) {
    console.error('Error fetching parent homework:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching homework', 
      error: error.message 
    });
  }
};

// Get tests for parent's children only
exports.getParentTests = async (req, res) => {
  try {
    if (req.user.role !== 'parent' || !req.parentChildrenIds) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This endpoint is for parents only.'
      });
    }

    if (req.parentChildrenIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No children found for this parent account'
      });
    }

    // Get all classes where parent's children are enrolled
    const children = await Student.find({ 
      _id: { $in: req.parentChildrenIds },
      deletedAt: null 
    }).select('grade section currentSession');

    if (children.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No children found for this parent account'
      });
    }

    // Get unique class combinations
    const classCombinations = [...new Set(children.map(child => 
      `${child.grade}-${child.section}-${child.currentSession}`
    ))];

    // Find classes that match parent's children
    const classes = await Class.find({
      $or: children.map(child => ({
        name: child.grade,
        section: child.section,
        session: child.currentSession
      }))
    }).select('_id name section session');

    const classIds = classes.map(cls => cls._id);

    // Get tests for these classes
    const tests = await Test.find({
      class: { $in: classIds }
    })
      .populate('class', 'name section session')
      .sort({ createdAt: -1 });

    res.json({ 
      success: true, 
      data: tests,
      childrenCount: children.length,
      classesCount: classes.length
    });
  } catch (error) {
    console.error('Error fetching parent tests:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching tests', 
      error: error.message 
    });
  }
};

// Get results for parent's children only
exports.getParentResults = async (req, res) => {
  try {
    if (req.user.role !== 'parent' || !req.parentChildrenIds) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This endpoint is for parents only.'
      });
    }

    if (req.parentChildrenIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No children found for this parent account'
      });
    }

    // Get results for parent's children only
    const results = await Result.find({
      student: { $in: req.parentChildrenIds }
    })
      .populate('student', 'name email grade section rollNumber')
      .populate('test', 'subject name date')
      .sort({ createdAt: -1 });

    res.json({ 
      success: true, 
      data: results,
      childrenCount: req.parentChildrenIds.length
    });
  } catch (error) {
    console.error('Error fetching parent results:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching results', 
      error: error.message 
    });
  }
};

// Get parent's children summary
exports.getParentChildrenSummary = async (req, res) => {
  try {
    if (req.user.role !== 'parent' || !req.parentChildrenIds) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This endpoint is for parents only.'
      });
    }

    if (req.parentChildrenIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          children: [],
          summary: {
            totalChildren: 0,
            message: 'No children found for this parent account'
          }
        }
      });
    }

    // Get detailed children information
    const children = await Student.find({ 
      _id: { $in: req.parentChildrenIds },
      deletedAt: null 
    }).select('name email grade section rollNumber currentSession parentName parentPhone');

    // Get recent attendance for each child (last 7 days)
    const Attendance = require('../models/Attendance');
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 7);

    const childrenWithAttendance = await Promise.all(children.map(async (child) => {
      const recentAttendance = await Attendance.find({
        studentId: child._id,
        date: { $gte: recentDate.toISOString().split('T')[0] }
      }).sort({ date: -1 }).limit(7);

      return {
        ...child.toObject(),
        recentAttendance: recentAttendance.map(att => ({
          date: att.date,
          status: att.status
        }))
      };
    }));

    res.json({ 
      success: true, 
      data: {
        children: childrenWithAttendance,
        summary: {
          totalChildren: children.length,
          childrenByGrade: children.reduce((acc, child) => {
            acc[child.grade] = (acc[child.grade] || 0) + 1;
            return acc;
          }, {})
        }
      }
    });
  } catch (error) {
    console.error('Error fetching parent children summary:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching children summary', 
      error: error.message 
    });
  }
};
