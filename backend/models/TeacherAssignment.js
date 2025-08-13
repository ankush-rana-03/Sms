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
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    trim: true
  },
  startTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // Validate time format (HH:MM)
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(v);
      },
      message: 'Start time must be in HH:MM format'
    }
  },
  endTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // Validate time format (HH:MM)
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(v);
      },
      message: 'End time must be in HH:MM format'
    }
  },
  academicYear: {
    type: String,
    required: true,
    default: () => {
      const currentYear = new Date().getFullYear();
      return `${currentYear}-${currentYear + 1}`;
    }
  },
  semester: {
    type: String,
    enum: ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index to ensure unique teacher-class-subject-day-time combination
teacherAssignmentSchema.index(
  { 
    teacher: 1, 
    class: 1, 
    subject: 1, 
    day: 1, 
    startTime: 1, 
    endTime: 1,
    academicYear: 1,
    semester: 1
  }, 
  { unique: true }
);

// Index for efficient queries
teacherAssignmentSchema.index({ teacher: 1, day: 1, startTime: 1 });
teacherAssignmentSchema.index({ class: 1, day: 1, startTime: 1 });
teacherAssignmentSchema.index({ academicYear: 1, semester: 1 });

// Pre-save middleware to validate time conflicts
teacherAssignmentSchema.pre('save', async function(next) {
  if (this.isModified('startTime') || this.isModified('endTime') || this.isModified('day') || this.isModified('teacher')) {
    // Check if start time is before end time
    if (this.startTime >= this.endTime) {
      return next(new Error('Start time must be before end time'));
    }

    // Check for time conflicts for the same teacher on the same day
    const conflictingAssignment = await this.constructor.findOne({
      _id: { $ne: this._id },
      teacher: this.teacher,
      day: this.day,
      academicYear: this.academicYear,
      semester: this.semester,
      isActive: true,
      $or: [
        // New assignment starts during existing assignment
        {
          startTime: { $lte: this.startTime },
          endTime: { $gt: this.startTime }
        },
        // New assignment ends during existing assignment
        {
          startTime: { $lt: this.endTime },
          endTime: { $gte: this.endTime }
        },
        // New assignment completely contains existing assignment
        {
          startTime: { $gte: this.startTime },
          endTime: { $lte: this.endTime }
        }
      ]
    });

    if (conflictingAssignment) {
      return next(new Error(`Time conflict: Teacher already has an assignment on ${this.day} from ${conflictingAssignment.startTime} to ${conflictingAssignment.endTime}`));
    }

    // Check for time conflicts for the same class on the same day
    const conflictingClassAssignment = await this.constructor.findOne({
      _id: { $ne: this._id },
      class: this.class,
      day: this.day,
      academicYear: this.academicYear,
      semester: this.semester,
      isActive: true,
      $or: [
        {
          startTime: { $lte: this.startTime },
          endTime: { $gt: this.startTime }
        },
        {
          startTime: { $lt: this.endTime },
          endTime: { $gte: this.endTime }
        },
        {
          startTime: { $gte: this.startTime },
          endTime: { $lte: this.endTime }
        }
      ]
    });

    if (conflictingClassAssignment) {
      return next(new Error(`Time conflict: Class already has an assignment on ${this.day} from ${conflictingClassAssignment.startTime} to ${conflictingClassAssignment.endTime}`));
    }
  }
  next();
});

// Instance method to check if assignment conflicts with given time
teacherAssignmentSchema.methods.hasTimeConflict = function(startTime, endTime, day) {
  if (this.day !== day) return false;
  
  return (
    (this.startTime <= startTime && this.endTime > startTime) ||
    (this.startTime < endTime && this.endTime >= endTime) ||
    (this.startTime >= startTime && this.endTime <= endTime)
  );
};

// Static method to find conflicting assignments
teacherAssignmentSchema.statics.findConflicts = async function(teacherId, day, startTime, endTime, academicYear, semester, excludeId = null) {
  const query = {
    teacher: teacherId,
    day: day,
    academicYear: academicYear,
    semester: semester,
    isActive: true,
    $or: [
      {
        startTime: { $lte: startTime },
        endTime: { $gt: startTime }
      },
      {
        startTime: { $lt: endTime },
        endTime: { $gte: endTime }
      },
      {
        startTime: { $gte: startTime },
        endTime: { $lte: endTime }
      }
    ]
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return await this.find(query);
};

module.exports = mongoose.model('TeacherAssignment', teacherAssignmentSchema);