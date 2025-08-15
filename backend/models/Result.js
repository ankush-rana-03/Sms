const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  session: {
    type: String,
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

// Compound index for student, session, academic year and term
resultSchema.index({ studentId: 1, session: 1, academicYear: 1, term: 1 }, { unique: true });

module.exports = mongoose.model('Result', resultSchema);