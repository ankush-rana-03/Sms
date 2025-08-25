const mongoose = require('mongoose');

const staffAttendanceSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Academic session identifier (e.g., '2025-2026')
  session: {
    type: String,
    default: null
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  checkIn: {
    time: {
      type: Date,
      required: true
    },
    location: {
      type: String,
      default: null
    },
    method: {
      type: String,
      enum: ['manual', 'qr-code', 'biometric', 'mobile'],
      default: 'manual'
    }
  },
  checkOut: {
    time: {
      type: Date,
      default: null
    },
    location: {
      type: String,
      default: null
    },
    method: {
      type: String,
      enum: ['manual', 'qr-code', 'biometric', 'mobile'],
      default: 'manual'
    }
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day', 'leave', 'holiday'],
    default: 'present'
  },
  leaveType: {
    type: String,
    enum: ['casual', 'sick', 'personal', 'maternity', 'paternity', 'other'],
    default: null
  },
  leaveReason: {
    type: String,
    default: null
  },
  workingHours: {
    type: Number, // in minutes
    default: 0
  },
  overtime: {
    type: Number, // in minutes
    default: 0
  },
  remarks: {
    type: String,
    default: null
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound index for staff, date, and session (one record per staff/day/session)
staffAttendanceSchema.index({ staffId: 1, date: 1, session: 1 }, { unique: true });

// Index for date-based queries
staffAttendanceSchema.index({ date: 1 });

// Index for staff-based queries
staffAttendanceSchema.index({ staffId: 1 });

// Virtual for total working hours in hours
staffAttendanceSchema.virtual('workingHoursInHours').get(function() {
  return this.workingHours / 60;
});

// Virtual for overtime in hours
staffAttendanceSchema.virtual('overtimeInHours').get(function() {
  return this.overtime / 60;
});

// Method to calculate working hours
staffAttendanceSchema.methods.calculateWorkingHours = function() {
  if (this.checkIn && this.checkOut) {
    const checkInTime = new Date(this.checkIn.time);
    const checkOutTime = new Date(this.checkOut.time);
    const diffInMinutes = Math.floor((checkOutTime - checkInTime) / (1000 * 60));
    this.workingHours = Math.max(0, diffInMinutes);
  }
  return this.workingHours;
};

// Pre-save middleware to calculate working hours
staffAttendanceSchema.pre('save', function(next) {
  if (this.checkIn && this.checkOut) {
    this.calculateWorkingHours();
  }
  next();
});

module.exports = mongoose.model('StaffAttendance', staffAttendanceSchema);