const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teacherId: {
    type: String,
    required: true,
    unique: true
  },
  subjects: [{
    type: String,
    required: true
  }],
  assignedClasses: [{
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class'
    },
    section: String,
    subject: String
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
  specialization: [String],
  joiningDate: {
    type: Date,
    default: Date.now
  },
  salary: {
    type: Number,
    required: true
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
  }
}, {
  timestamps: true
});

// Generate teacher ID
teacherSchema.pre('save', async function(next) {
  if (this.isNew && !this.teacherId) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.teacherId = `TCH${year}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Teacher', teacherSchema);