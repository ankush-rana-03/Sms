const express = require('express');
const router = express.Router();
const {
  registerParent,
  loginParent,
  getParentProfile,
  updateParentProfile,
  changePassword,
  forgotPassword,
  resetPassword
} = require('../controllers/parentAuth');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', registerParent);
router.post('/login', loginParent);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resettoken', resetPassword);

// Protected routes
router.get('/profile', protect, getParentProfile);
router.put('/profile', protect, updateParentProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;