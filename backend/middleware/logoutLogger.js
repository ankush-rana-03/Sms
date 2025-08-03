const Teacher = require('../models/Teacher');
const LoginLog = require('../models/LoginLog');

const logoutLogger = async (req, res, next) => {
  // Store the original end function
  const originalEnd = res.end;
  
  // Override the end function to capture logout
  res.end = function(chunk, encoding) {
    // Call the original end function
    originalEnd.call(this, chunk, encoding);
    
    // Check if this is a logout request for a teacher
    if (req.user && req.user.role === 'teacher' && req.path === '/logout') {
      handleTeacherLogout(req.user.id);
    }
  };
  
  next();
};

const handleTeacherLogout = async (userId) => {
  try {
    // Find the teacher
    const teacher = await Teacher.findOne({ user: userId });
    if (!teacher) return;

    // Update teacher online status
    teacher.onlineStatus.isOnline = false;
    teacher.onlineStatus.lastSeen = new Date();
    teacher.onlineStatus.lastActivity = new Date();
    await teacher.save();

    // Find the most recent active login log and update it
    const activeLog = await LoginLog.findOne({
      teacher: teacher._id,
      status: 'success',
      logoutTime: null
    }).sort({ loginTime: -1 });

    if (activeLog) {
      activeLog.logoutTime = new Date();
      await activeLog.save();
    }

    console.log(`Teacher ${teacher.name} logged out at ${new Date()}`);
  } catch (error) {
    console.error('Error logging teacher logout:', error);
  }
};

module.exports = logoutLogger;