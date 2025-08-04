const isToday = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  
  return today.getFullYear() === checkDate.getFullYear() &&
         today.getMonth() === checkDate.getMonth() &&
         today.getDate() === checkDate.getDate();
};

const isPastDate = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  
  // Set time to start of day for comparison
  today.setHours(0, 0, 0, 0);
  checkDate.setHours(0, 0, 0, 0);
  
  return checkDate < today;
};

const isFutureDate = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  
  // Set time to start of day for comparison
  today.setHours(0, 0, 0, 0);
  checkDate.setHours(0, 0, 0, 0);
  
  return checkDate > today;
};

const validateAttendanceDate = (date, userRole) => {
  const attendanceDate = new Date(date);
  
  if (userRole === 'teacher') {
    // Teachers can only mark attendance for today
    if (!isToday(attendanceDate)) {
      return {
        isValid: false,
        message: 'Teachers can only mark attendance for the current day'
      };
    }
  } else if (userRole === 'admin') {
    // Admins can mark attendance for today and past dates, but not future dates
    if (isFutureDate(attendanceDate)) {
      return {
        isValid: false,
        message: 'Cannot mark attendance for future dates'
      };
    }
  }
  
  return {
    isValid: true,
    message: 'Date is valid'
  };
};

const canEditAttendance = (attendanceDate, userRole) => {
  const date = new Date(attendanceDate);
  
  if (userRole === 'teacher') {
    // Teachers can only edit today's attendance
    return isToday(date);
  } else if (userRole === 'admin') {
    // Admins can edit past and current attendance, but not future
    return !isFutureDate(date);
  }
  
  return false;
};

module.exports = {
  isToday,
  isPastDate,
  isFutureDate,
  validateAttendanceDate,
  canEditAttendance
};