const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const whatsappService = require('../services/whatsappService');

// @desc    Get WhatsApp service status
// @route   GET /api/whatsapp/status
// @access  Private (Admin only)
router.get('/status', protect, authorize('admin'), async (req, res) => {
  try {
    const status = whatsappService.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting WhatsApp status',
      error: error.message
    });
  }
});

// @desc    Test WhatsApp notification
// @route   POST /api/whatsapp/test
// @access  Private (Admin only)
router.post('/test', protect, authorize('admin'), async (req, res) => {
  try {
    const { phoneNumber, studentName, status, date } = req.body;
    
    if (!phoneNumber || !studentName || !status || !date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide phoneNumber, studentName, status, and date'
      });
    }

    const result = await whatsappService.sendAttendanceNotification(
      phoneNumber,
      studentName,
      status,
      date
    );

    res.json({
      success: true,
      data: {
        sent: result,
        message: result ? 'Test notification sent successfully' : 'Failed to send test notification'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending test notification',
      error: error.message
    });
  }
});

module.exports = router;