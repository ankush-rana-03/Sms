const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const parentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide parent name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number']
  },
  address: {
    type: String,
    required: [true, 'Please provide an address']
  },
  // Relationship with students
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  // Parent credentials generation
  credentialsGenerated: {
    type: Boolean,
    default: false
  },
  credentialsGeneratedAt: {
    type: Date,
    default: null
  },
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  loginLocation: {
    type: String,
    default: ''
  },
  // Password reset functionality
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpire: Date
}, {
  timestamps: true
});

// Encrypt password before saving
parentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
parentSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, role: 'parent' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Match user entered password to hashed password in database
parentSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
parentSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Generate unique parent credentials
parentSchema.statics.generateCredentials = function() {
  const parentId = 'PAR' + Date.now().toString().slice(-6);
  const password = 'parent123'; // Simple password for all parents
  return { parentId, password };
};

module.exports = mongoose.model('Parent', parentSchema);