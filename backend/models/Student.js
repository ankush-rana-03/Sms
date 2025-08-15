const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
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
  address: {
    type: String,
    required: true
  },
  dateOfBirth: {
    type: String,
    required: true
  },
  grade: {
    type: String,
    required: true
  },
  section: {
    type: String,
    default: 'A'
  },
  rollNumber: {
    type: String,
    default: '001'
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'male'
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    default: 'A+'
  },
  parentName: {
    type: String,
    required: true
  },
  parentPhone: {
    type: String,
    required: true
  },
  pendingApproval: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Session management fields
  currentSession: {
    type: String,
    default: null
  },
  promotionStatus: {
    type: String,
    enum: ['pending', 'promoted', 'retained', 'graduated'],
    default: 'pending'
  },
  promotionDate: {
    type: Date,
    default: null
  },
  promotionNotes: {
    type: String,
    default: ''
  },
  previousGrade: {
    type: String,
    default: null
  },
  previousSection: {
    type: String,
    default: null
  },
  attendance: [{
    date: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late'],
      default: 'present'
    },
    markedAt: {
      type: Date,
      default: Date.now
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);