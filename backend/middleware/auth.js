const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Check if user is active
exports.checkActive = (req, res, next) => {
  if (!req.user.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Your account has been deactivated. Please contact administrator.'
    });
  }
  next();
};

// Location-based access for teachers (admin and principal can bypass)
exports.teacherLocationCheck = (req, res, next) => {
  // Only apply location check for teachers
  if (req.user.role === 'teacher') {
    // This would typically check GPS coordinates against school location
    // For now, we'll allow access but log the location
    const location = req.body.location || req.query.location;
    if (location) {
      req.user.loginLocation = location;
      req.user.save();
    }
  }
  // Admin and principal users can bypass location check
  next();
};