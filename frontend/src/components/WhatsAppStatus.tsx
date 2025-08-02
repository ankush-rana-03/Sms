import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import { WhatsApp, Refresh, Send } from '@mui/icons-material';

interface WhatsAppStatus {
  isReady: boolean;
  hasClient: boolean;
  status: string;
}

const WhatsAppStatus: React.FC = () => {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Test notification form
  const [testData, setTestData] = useState({
    phoneNumber: '',
    studentName: '',
    status: 'present',
    date: new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  });

  const checkStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/whatsapp/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to check WhatsApp status');
      }
      
      const data = await response.json();
      setStatus(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    if (!testData.phoneNumber || !testData.studentName) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/whatsapp/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(testData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to send test notification');
      }
      
      const data = await response.json();
      if (data.data.sent) {
        setSuccess('Test notification sent successfully!');
      } else {
        setError('Failed to send test notification');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        📱 WhatsApp Service Status
      </Typography>

      <Grid container spacing={3}>
        {/* Status Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <WhatsApp color={status?.isReady ? 'success' : 'error'} />
              <Typography variant="h6">
                Service Status
              </Typography>
              <Button
                startIcon={<Refresh />}
                onClick={checkStatus}
                disabled={loading}
                size="small"
              >
                Refresh
              </Button>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={20} />
                <Typography>Checking status...</Typography>
              </Box>
            ) : status ? (
              <Box>
                <Alert 
                  severity={status.isReady ? 'success' : 'warning'}
                  sx={{ mb: 2 }}
                >
                  Status: {status.status}
                </Alert>
                
                <Typography variant="body2" color="text.secondary">
                  Client Ready: {status.isReady ? 'Yes' : 'No'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Has Client: {status.hasClient ? 'Yes' : 'No'}
                </Typography>
              </Box>
            ) : (
              <Alert severity="error">
                Failed to load status
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Test Notification Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Test Notification
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Parent Phone Number"
                value={testData.phoneNumber}
                onChange={(e) => setTestData({ ...testData, phoneNumber: e.target.value })}
                placeholder="+919876543210"
                fullWidth
              />
              
              <TextField
                label="Student Name"
                value={testData.studentName}
                onChange={(e) => setTestData({ ...testData, studentName: e.target.value })}
                placeholder="John Doe"
                fullWidth
              />
              
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={testData.status}
                  label="Status"
                  onChange={(e) => setTestData({ ...testData, status: e.target.value })}
                >
                  <MenuItem value="present">Present</MenuItem>
                  <MenuItem value="absent">Absent</MenuItem>
                  <MenuItem value="late">Late</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                label="Date"
                value={testData.date}
                onChange={(e) => setTestData({ ...testData, date: e.target.value })}
                fullWidth
              />
              
              <Button
                variant="contained"
                startIcon={<Send />}
                onClick={sendTestNotification}
                disabled={loading || !status?.isReady}
                fullWidth
              >
                {loading ? <CircularProgress size={20} /> : 'Send Test Notification'}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}

      {!status?.isReady && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Note:</strong> WhatsApp service is not ready. This usually means:
          </Typography>
          <Typography variant="body2" component="ul" sx={{ mt: 1, pl: 2 }}>
            <li>The QR code needs to be scanned in the server console</li>
            <li>The WhatsApp client is still initializing</li>
            <li>There's an authentication issue</li>
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Check the server console for QR code or error messages.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default WhatsAppStatus;