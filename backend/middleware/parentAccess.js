const Student = require('../models/Student');

// Middleware to filter data for parent users - only show their children's records
exports.filterParentData = async (req, res, next) => {
  // Only apply this filter for parent role users
  if (req.user.role !== 'parent') {
    return next();
  }

  try {
    // Find all students where the parent's phone number matches
    const children = await Student.find({ 
      parentPhone: req.user.phone,
      deletedAt: null 
    }).select('_id name email');

    // Store children IDs in request for use in controllers
    req.parentChildrenIds = children.map(child => child._id);
    req.parentChildrenNames = children.map(child => ({ id: child._id, name: child.name, email: child.email }));

    // If no children found, set empty array
    if (children.length === 0) {
      req.parentChildrenIds = [];
      req.parentChildrenNames = [];
    }

    console.log(`Parent ${req.user.name} has ${children.length} children:`, req.parentChildrenNames);
    next();
  } catch (error) {
    console.error('Error filtering parent data:', error);
    return res.status(500).json({
      success: false,
      message: 'Error filtering parent data',
      error: error.message
    });
  }
};

// Middleware to check if parent has access to specific student
exports.checkParentStudentAccess = (req, res, next) => {
  if (req.user.role !== 'parent') {
    return next();
  }

  const studentId = req.params.id || req.params.studentId;
  
  if (!studentId) {
    return res.status(400).json({
      success: false,
      message: 'Student ID is required'
    });
  }

  if (!req.parentChildrenIds.includes(studentId)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only view your own children\'s records.'
    });
  }

  next();
};

// Middleware to add parent-specific query filters
exports.addParentQueryFilter = (req, res, next) => {
  if (req.user.role !== 'parent') {
    return next();
  }

  // Add parent filter to existing query
  if (!req.query.parentFilter) {
    req.query.parentFilter = 'true';
  }

  next();
};
