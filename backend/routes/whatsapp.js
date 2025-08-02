const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const whatsappService = require('../services/whatsappService');

// @desc    Test endpoint (no auth required)
// @route   GET /api/whatsapp/test-endpoint
// @access  Public
router.get('/test-endpoint', (req, res) => {
  res.json({
    success: true,
    message: 'WhatsApp route is working',
    timestamp: new Date().toISOString(),
    whatsappStatus: whatsappService.getStatus()
  });
});

// @desc    Force WhatsApp QR generation (no auth required)
// @route   GET /api/whatsapp/force-qr
// @access  Public
router.get('/force-qr', async (req, res) => {
  try {
    console.log('=== Force QR Generation Request ===');
    
    // Check current status
    const currentStatus = whatsappService.getStatus();
    console.log('Current status:', currentStatus);
    
    // If not ready, try to reinitialize
    if (!currentStatus.isReady && !currentStatus.qrCode) {
      console.log('WhatsApp not ready, attempting reinitialization...');
      try {
        await whatsappService.initialize();
        console.log('Reinitialization completed');
      } catch (error) {
        console.error('Reinitialization failed:', error);
      }
    }
    
    // Get updated status
    const updatedStatus = whatsappService.getStatus();
    console.log('Updated status:', updatedStatus);
    
    res.json({
      success: true,
      message: 'QR generation attempt completed',
      status: updatedStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Force QR generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error forcing QR generation',
      error: error.message
    });
  }
});

// @desc    Get WhatsApp service status
// @route   GET /api/whatsapp/status
// @access  Private (Admin only)
router.get('/status', protect, authorize('admin'), async (req, res) => {
  try {
    const status = whatsappService.getStatus();
    console.log('=== WhatsApp Status Request ===');
    console.log('Status data:', status);
    console.log('QR Code present:', !!status.qrCode);
    console.log('QR Code length:', status.qrCode ? status.qrCode.length : 0);
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting WhatsApp status:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting WhatsApp status',
      error: error.message
    });
  }
});

// @desc    Get QR code for WhatsApp authentication
// @route   GET /api/whatsapp/qr
// @access  Private (Admin only)
router.get('/qr', protect, authorize('admin'), async (req, res) => {
  try {
    const status = whatsappService.getStatus();
    
    if (status.qrCode) {
      res.json({
        success: true,
        data: {
          qrCode: status.qrCode,
          message: 'Scan this QR code with WhatsApp to authenticate'
        }
      });
    } else if (status.isReady) {
      res.json({
        success: true,
        data: {
          message: 'WhatsApp is already authenticated and ready'
        }
      });
    } else {
      res.json({
        success: false,
        data: {
          message: 'QR code not available. Please wait for WhatsApp service to initialize.'
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting QR code',
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