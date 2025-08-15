const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  academicYear: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  },
  isCurrent: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  promotionCriteria: {
    minimumAttendance: {
      type: Number,
      default: 75
    },
    minimumGrade: {
      type: String,
      default: 'D'
    },
    requireAllSubjects: {
      type: Boolean,
      default: true
    }
  },
  archivedData: {
    students: [{
      studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
      },
      finalGrade: String,
      promotionStatus: String,
      attendancePercentage: Number,
      archivedAt: {
        type: Date,
        default: Date.now
      }
    }],
    classes: [{
      classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
      },
      archivedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }
}, {
  timestamps: true
});

// Ensure only one session is current at a time
sessionSchema.pre('save', async function(next) {
  if (this.isCurrent) {
    await mongoose.model('Session').updateMany(
      { _id: { $ne: this._id } },
      { isCurrent: false }
    );
  }
  next();
});

module.exports = mongoose.model('Session', sessionSchema);