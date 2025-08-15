const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  section: {
    type: String,
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  // Session management fields
  session: {
    type: String,
    required: true
  },
  isActiveSession: {
    type: Boolean,
    default: true
  },
  sessionStartDate: {
    type: Date,
    default: Date.now
  },
  sessionEndDate: {
    type: Date,
    default: null
  },
  classTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  subjects: [{
    name: String,
    code: String,
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher'
    }
  }],
  schedule: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    },
    periods: [{
      time: String,
      subject: String,
      teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher'
      }
    }]
  }],
  roomNumber: String,
  capacity: {
    type: Number,
    default: 40
  },
  currentStrength: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for name, section, academic year, and session
classSchema.index({ name: 1, section: 1, academicYear: 1, session: 1 }, { unique: true });

module.exports = mongoose.model('Class', classSchema);