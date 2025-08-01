const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentId: {
    type: String,
    required: true,
    unique: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  section: {
    type: String,
    required: true
  },
  rollNumber: {
    type: String,
    required: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  medicalInfo: {
    allergies: [String],
    conditions: [String],
    medications: [String]
  },
  academicInfo: {
    admissionDate: {
      type: Date,
      default: Date.now
    },
    previousSchool: String,
    transferCertificate: String
  },
  attendance: {
    totalDays: {
      type: Number,
      default: 0
    },
    presentDays: {
      type: Number,
      default: 0
    },
    absentDays: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  facialData: {
    faceId: String,
    faceDescriptor: [Number], // Array of facial features
    faceImage: {
      url: String,
      publicId: String
    },
    isFaceRegistered: {
      type: Boolean,
      default: false
    }
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
    },
    verifiedWithFace: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true
});

// Generate student ID
studentSchema.pre('save', async function(next) {
  if (this.isNew && !this.studentId) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.studentId = `STU${year}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Student', studentSchema);