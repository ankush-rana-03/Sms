const mongoose = require('mongoose');

const teacherAssignmentSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  day: {
    type: String,
    required: true,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    lowercase: true
  },
  startTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,  // HH:MM format validation
    validate: {
      validator: function(v) {
        const time = v.split(':');
        const hours = parseInt(time[0]);
        const minutes = parseInt(time[1]);
        return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
      },
      message: 'Invalid time format. Use HH:MM format (24-hour)'
    }
  },
  endTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,  // HH:MM format validation
    validate: {
      validator: function(v) {
        const time = v.split(':');
        const hours = parseInt(time[0]);
        const minutes = parseInt(time[1]);
        return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
      },
      message: 'Invalid time format. Use HH:MM format (24-hour)'
    }
  },
  academicYear: {
    type: String,
    required: true,
    default: function() {
      const currentYear = new Date().getFullYear();
      return `${currentYear}-${currentYear + 1}`;
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Validate that end time is after start time
teacherAssignmentSchema.pre('save', function(next) {
  const startTime = this.startTime.split(':');
  const endTime = this.endTime.split(':');
  
  const startMinutes = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
  const endMinutes = parseInt(endTime[0]) * 60 + parseInt(endTime[1]);
  
  if (endMinutes <= startMinutes) {
    return next(new Error('End time must be after start time'));
  }
  
  next();
});

// Index for efficient queries
teacherAssignmentSchema.index({ teacher: 1, day: 1, startTime: 1 });
teacherAssignmentSchema.index({ class: 1, day: 1, startTime: 1 });
teacherAssignmentSchema.index({ teacher: 1, academicYear: 1 });
teacherAssignmentSchema.index({ class: 1, academicYear: 1 });

// Compound index to prevent duplicate assignments
teacherAssignmentSchema.index({ 
  teacher: 1, 
  class: 1, 
  subject: 1, 
  day: 1, 
  startTime: 1, 
  academicYear: 1 
}, { unique: true });

// Static method to check for time conflicts
teacherAssignmentSchema.statics.checkTimeConflict = async function(teacherId, day, startTime, endTime, excludeId = null) {
  const query = {
    teacher: teacherId,
    day: day,
    isActive: true,
    $or: [
      // New assignment starts during existing assignment
      {
        $and: [
          { startTime: { $lte: startTime } },
          { endTime: { $gt: startTime } }
        ]
      },
      // New assignment ends during existing assignment
      {
        $and: [
          { startTime: { $lt: endTime } },
          { endTime: { $gte: endTime } }
        ]
      },
      // New assignment completely contains existing assignment
      {
        $and: [
          { startTime: { $gte: startTime } },
          { endTime: { $lte: endTime } }
        ]
      }
    ]
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const conflictingAssignment = await this.findOne(query)
    .populate('class', 'name section')
    .populate('teacher', 'name');

  return conflictingAssignment;
};

// Instance method to get formatted time range
teacherAssignmentSchema.methods.getTimeRange = function() {
  return `${this.startTime} - ${this.endTime}`;
};

// Instance method to get day display name
teacherAssignmentSchema.methods.getDayDisplayName = function() {
  const dayNames = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday'
  };
  return dayNames[this.day] || this.day;
};

module.exports = mongoose.model('TeacherAssignment', teacherAssignmentSchema);