const Homework = require('../models/Homework');
const Student = require('../models/Student');
const Parent = require('../models/Parent');

// @desc    Get homework for parent's children
// @route   GET /api/parents/homework
// @access  Private (Parent)
exports.getParentHomework = async (req, res) => {
  try {
    const parent = await Parent.findById(req.user.id).populate('children');
    
    if (!parent || !parent.children.length) {
      return res.status(404).json({
        success: false,
        message: 'No children found for this parent'
      });
    }

    // Get all children's grades and sections
    const childrenData = parent.children.map(child => ({
      grade: child.grade,
      section: child.section
    }));

    // Find homework assigned to any of the children's classes
    const homework = await Homework.find({
      isActive: true,
      $or: childrenData.map(child => ({
        'class.name': child.grade,
        section: child.section
      }))
    })
    .populate('class', 'name section')
    .populate('assignedBy', 'name email')
    .sort({ dueDate: 1 });

    // Add completion status for each child
    const homeworkWithCompletion = homework.map(hw => {
      const hwObj = hw.toObject();
      hwObj.childrenCompletion = parent.children.map(child => {
        const completion = hw.parentCompletions.find(
          comp => comp.student.toString() === child._id.toString()
        );
        return {
          studentId: child._id,
          studentName: child.name,
          grade: child.grade,
          section: child.section,
          completionStatus: completion ? completion.completionStatus : 'not_started',
          completedAt: completion ? completion.completedAt : null,
          parentComments: completion ? completion.parentComments : null,
          lastUpdated: completion ? completion.lastUpdated : null
        };
      });
      return hwObj;
    });

    res.status(200).json({
      success: true,
      data: homeworkWithCompletion
    });

  } catch (error) {
    console.error('Get parent homework error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching homework',
      error: error.message
    });
  }
};

// @desc    Get homework details for a specific child
// @route   GET /api/parents/homework/:homeworkId/child/:childId
// @access  Private (Parent)
exports.getChildHomeworkDetails = async (req, res) => {
  try {
    const { homeworkId, childId } = req.params;

    // Verify parent has access to this child
    const parent = await Parent.findById(req.user.id);
    if (!parent.children.includes(childId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This child is not associated with your account.'
      });
    }

    const homework = await Homework.findById(homeworkId)
      .populate('class', 'name section')
      .populate('assignedBy', 'name email');

    if (!homework) {
      return res.status(404).json({
        success: false,
        message: 'Homework not found'
      });
    }

    // Get completion status for this specific child
    const completion = homework.parentCompletions.find(
      comp => comp.student.toString() === childId
    );

    const homeworkWithCompletion = {
      ...homework.toObject(),
      childCompletion: completion ? {
        completionStatus: completion.completionStatus,
        completedAt: completion.completedAt,
        parentComments: completion.parentComments,
        lastUpdated: completion.lastUpdated
      } : {
        completionStatus: 'not_started',
        completedAt: null,
        parentComments: null,
        lastUpdated: null
      }
    };

    res.status(200).json({
      success: true,
      data: homeworkWithCompletion
    });

  } catch (error) {
    console.error('Get child homework details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching homework details',
      error: error.message
    });
  }
};

// @desc    Update homework completion status
// @route   PUT /api/parents/homework/:homeworkId/child/:childId/complete
// @access  Private (Parent)
exports.updateHomeworkCompletion = async (req, res) => {
  try {
    const { homeworkId, childId } = req.params;
    const { completionStatus, parentComments } = req.body;

    // Validate completion status
    if (!['not_started', 'half_complete', 'fully_complete'].includes(completionStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid completion status'
      });
    }

    // Verify parent has access to this child
    const parent = await Parent.findById(req.user.id);
    if (!parent.children.includes(childId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This child is not associated with your account.'
      });
    }

    const homework = await Homework.findById(homeworkId);
    if (!homework) {
      return res.status(404).json({
        success: false,
        message: 'Homework not found'
      });
    }

    // Find existing completion record
    const existingCompletionIndex = homework.parentCompletions.findIndex(
      comp => comp.student.toString() === childId
    );

    const completionData = {
      student: childId,
      parent: req.user.id,
      completionStatus,
      parentComments: parentComments || '',
      lastUpdated: new Date()
    };

    if (completionStatus !== 'not_started') {
      completionData.completedAt = new Date();
    } else {
      completionData.completedAt = null;
    }

    if (existingCompletionIndex >= 0) {
      // Update existing completion
      homework.parentCompletions[existingCompletionIndex] = completionData;
    } else {
      // Add new completion
      homework.parentCompletions.push(completionData);
    }

    await homework.save();

    res.status(200).json({
      success: true,
      message: 'Homework completion status updated successfully',
      data: completionData
    });

  } catch (error) {
    console.error('Update homework completion error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating homework completion',
      error: error.message
    });
  }
};

// @desc    Get homework statistics for parent
// @route   GET /api/parents/homework/statistics
// @access  Private (Parent)
exports.getHomeworkStatistics = async (req, res) => {
  try {
    const parent = await Parent.findById(req.user.id).populate('children');
    
    if (!parent || !parent.children.length) {
      return res.status(404).json({
        success: false,
        message: 'No children found for this parent'
      });
    }

    const childrenData = parent.children.map(child => ({
      grade: child.grade,
      section: child.section
    }));

    // Get all homework for children's classes
    const homework = await Homework.find({
      isActive: true,
      $or: childrenData.map(child => ({
        'class.name': child.grade,
        section: child.section
      }))
    });

    // Calculate statistics
    const statistics = {
      totalHomework: homework.length,
      children: parent.children.map(child => {
        const childHomework = homework.filter(hw => 
          hw.class.name === child.grade && hw.section === child.section
        );
        
        const completions = childHomework.map(hw => {
          const completion = hw.parentCompletions.find(
            comp => comp.student.toString() === child._id.toString()
          );
          return completion ? completion.completionStatus : 'not_started';
        });

        const notStarted = completions.filter(status => status === 'not_started').length;
        const halfComplete = completions.filter(status => status === 'half_complete').length;
        const fullyComplete = completions.filter(status => status === 'fully_complete').length;

        return {
          childId: child._id,
          childName: child.name,
          grade: child.grade,
          section: child.section,
          totalHomework: childHomework.length,
          notStarted,
          halfComplete,
          fullyComplete,
          completionRate: childHomework.length > 0 ? 
            ((halfComplete + fullyComplete) / childHomework.length * 100).toFixed(1) : 0
        };
      })
    };

    res.status(200).json({
      success: true,
      data: statistics
    });

  } catch (error) {
    console.error('Get homework statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching homework statistics',
      error: error.message
    });
  }
};