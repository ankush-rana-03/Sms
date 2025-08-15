const { authorize } = require('./auth');

// Export the authorize function as checkRole for compatibility
exports.checkRole = authorize;