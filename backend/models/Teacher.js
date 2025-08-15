const mongoose = require('mongoose');
const Counter = require('./Counter');

const teacherSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teacherId: {
    type: String,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  designation: {
    type: String,
    enum: ['TGT', 'PGT', 'JBT', 'NTT'],
    required: true
  },
  subjects: {
    type: [String],
    default: []
  },
  assignedClasses: [{
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class'
    },
    section: String,
    subject: String,
    className: String,
    time: String,  // Add time field
    day: String    // Add day field
  }],
  qualification: {
    degree: String,
    institution: String,
    yearOfCompletion: Number
  },
  experience: {
    years: {
      type: Number,
      default: 0
    },
    previousSchools: [String]
  },

  joiningDate: {
    type: Date,
    default: Date.now
  },
  salary: {
    type: Number,
    default: 0
  },
  contactInfo: {
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    }
  },
  isClassTeacher: {
    type: Boolean,
    default: false
  },
  classTeacherOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  onlineStatus: {
    isOnline: {
      type: Boolean,
      default: false
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  passwordResetRequired: {
    type: Boolean,
    default: true
  },
  lastPasswordChange: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate teacher ID
teacherSchema.pre('save', async function(next) {
  if (this.isNew && !this.teacherId) {
    const year = new Date().getFullYear();
    // Atomically increment the counter for this year
    const counter = await Counter.findOneAndUpdate(
      { name: `teacher_${year}` },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.teacherId = `TCH${year}${String(counter.seq).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Teacher', teacherSchema);