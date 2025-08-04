const mongoose = require('mongoose');

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
    grade: String
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
  specialization: {
    type: [String],
    default: []
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
    // Find the highest teacherId for this year
    const regex = new RegExp(`^TCH${year}(\\d{4})$`);
    const latest = await this.constructor.find({ teacherId: { $regex: `^TCH${year}` } })
      .sort({ teacherId: -1 })
      .limit(1);
    let nextNumber = 1;
    if (latest.length > 0) {
      const match = latest[0].teacherId.match(/TCH\d{4}(\d{4})/);
      if (match && match[1]) {
        nextNumber = parseInt(match[1], 10) + 1;
      } else {
        // fallback: extract last 4 digits
        nextNumber = parseInt(latest[0].teacherId.slice(-4), 10) + 1;
      }
    }
    this.teacherId = `TCH${year}${String(nextNumber).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Teacher', teacherSchema);