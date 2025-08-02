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
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { WhatsApp, Refresh, Send } from '@mui/icons-material';
import QRCode from 'qrcode';

interface WhatsAppServiceStatus {
  isReady: boolean;
  hasClient: boolean;
  status: string;
  qrCode?: string;
}

const WhatsAppStatus: React.FC = () => {
  const [status, setStatus] = useState<WhatsAppServiceStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [backendTest, setBackendTest] = useState<string | null>(null);
  
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
      console.log('=== Frontend: Checking WhatsApp Status ===');
      console.log('Token:', localStorage.getItem('token') ? 'Present' : 'Missing');
      
      const response = await fetch('/api/whatsapp/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error text:', errorText);
        throw new Error(`Failed to check WhatsApp status: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('=== Frontend: Status Response ===');
      console.log('Full response:', data);
      console.log('Status data:', data.data);
      console.log('QR Code present:', !!data.data.qrCode);
      console.log('QR Code length:', data.data.qrCode ? data.data.qrCode.length : 0);
      
      setStatus(data.data);
      
      // Generate QR code if available
      if (data.data.qrCode && !data.data.isReady) {
        console.log('=== Frontend: Generating QR Code ===');
        try {
          const qrUrl = await QRCode.toDataURL(data.data.qrCode);
          console.log('QR Code URL generated:', qrUrl.substring(0, 50) + '...');
          setQrCodeUrl(qrUrl);
        } catch (qrError) {
          console.error('Error generating QR code:', qrError);
        }
      } else {
        console.log('No QR code to generate or WhatsApp is ready');
        setQrCodeUrl(null);
      }
    } catch (err: any) {
      console.error('Error checking status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testBackendConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('=== Testing Backend Connection ===');
      const response = await fetch('/api/whatsapp/test-endpoint');
      console.log('Test response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Backend test failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Test response data:', data);
      setBackendTest('Backend is accessible');
      setSuccess('Backend connection test successful!');
    } catch (err: any) {
      console.error('Backend test error:', err);
      setBackendTest('Backend is not accessible');
      setError(`Backend test failed: ${err.message}`);
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
        const errorText = await response.text();
        throw new Error(`Failed to send test notification: ${response.status} ${errorText}`);
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
              <Button
                onClick={testBackendConnection}
                disabled={loading}
                size="small"
                variant="outlined"
              >
                Test Backend
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
                <Typography variant="body2" color="text.secondary">
                  QR Code Available: {status.qrCode ? 'Yes' : 'No'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  QR Code Length: {status.qrCode ? status.qrCode.length : 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  QR Code Preview: {status.qrCode ? status.qrCode.substring(0, 30) + '...' : 'None'}
                </Typography>
                {backendTest && (
                  <Typography variant="body2" color="text.secondary">
                    Backend Test: {backendTest}
                  </Typography>
                )}

                {/* QR Code Section */}
                {qrCodeUrl && !status.isReady && (
                  <Card sx={{ mt: 2, p: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        📱 Scan QR Code to Link WhatsApp
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        1. Open WhatsApp on your phone<br/>
                        2. Go to Settings → Linked Devices<br/>
                        3. Tap "Link a Device"<br/>
                        4. Scan this QR code:
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        p: 2, 
                        bgcolor: 'white',
                        border: '1px solid #ddd',
                        borderRadius: 1
                      }}>
                        <img 
                          src={qrCodeUrl}
                          alt="WhatsApp QR Code"
                          style={{ maxWidth: '200px', height: 'auto' }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        After scanning, refresh the status to check if authentication is complete.
                      </Typography>
                    </CardContent>
                  </Card>
                )}

                {/* Debug Section */}
                {status.qrCode && !status.isReady && !qrCodeUrl && (
                  <Card sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="error">
                        🔧 Debug: QR Code Available but Not Displayed
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        QR Code Data Length: {status.qrCode.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        QR Code Preview: {status.qrCode.substring(0, 50)}...
                      </Typography>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        onClick={async () => {
                          try {
                            console.log('Manual QR generation with data:', status.qrCode!.substring(0, 50) + '...');
                            const qrUrl = await QRCode.toDataURL(status.qrCode!);
                            console.log('Manual QR URL generated:', qrUrl.substring(0, 50) + '...');
                            setQrCodeUrl(qrUrl);
                          } catch (error) {
                            console.error('Manual QR generation failed:', error);
                            setError(`QR generation failed: ${error}`);
                          }
                        }}
                        sx={{ mt: 1 }}
                      >
                        Generate QR Code Manually
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Always show QR code if available */}
                {status.qrCode && !status.isReady && (
                  <Card sx={{ mt: 2, p: 2, bgcolor: '#e8f5e8' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        📱 QR Code Data Available
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        QR code data is available from backend. Click below to generate and display it:
                      </Typography>
                      <Button 
                        variant="contained" 
                        color="primary"
                        onClick={async () => {
                          try {
                            console.log('Generating QR from data length:', status.qrCode!.length);
                            const qrUrl = await QRCode.toDataURL(status.qrCode!);
                            setQrCodeUrl(qrUrl);
                            setSuccess('QR Code generated successfully!');
                          } catch (error) {
                            console.error('QR generation failed:', error);
                            setError(`QR generation failed: ${error}`);
                          }
                        }}
                      >
                        Generate QR Code
                      </Button>
                    </CardContent>
                  </Card>
                )}
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