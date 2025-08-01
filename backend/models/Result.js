const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  term: {
    type: String,
    enum: ['first', 'second', 'third', 'final'],
    required: true
  },
  subjects: [{
    name: String,
    theoryMarks: Number,
    practicalMarks: Number,
    totalMarks: Number,
    maxMarks: Number,
    percentage: Number,
    grade: String
  }],
  totalMarks: {
    type: Number,
    default: 0
  },
  maxMarks: {
    type: Number,
    default: 0
  },
  percentage: {
    type: Number,
    default: 0
  },
  grade: {
    type: String,
    default: ''
  },
  rank: {
    type: Number,
    default: 0
  },
  attendance: {
    totalDays: Number,
    presentDays: Number,
    percentage: Number
  },
  remarks: String,
  compiledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  compiledAt: {
    type: Date,
    default: Date.now
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for student, academic year and term
resultSchema.index({ student: 1, academicYear: 1, term: 1 }, { unique: true });

module.exports = mongoose.model('Result', resultSchema);