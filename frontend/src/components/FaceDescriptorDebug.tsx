import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { BugReport, Refresh } from '@mui/icons-material';
import studentService from '../services/studentService';

interface FaceDescriptorDebugInfo {
  studentId: string;
  studentName: string;
  hasFacialData: boolean;
  isFaceRegistered: boolean;
  faceDescriptorType: string;
  faceDescriptorLength: number;
  faceDescriptorSample: number[];
  faceDescriptorValid: boolean;
  allElementsNumbers: boolean;
}

const FaceDescriptorDebug: React.FC = () => {
  const [studentId, setStudentId] = useState('');
  const [debugInfo, setDebugInfo] = useState<FaceDescriptorDebugInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debugFaceDescriptor = async () => {
    if (!studentId.trim()) {
      setError('Please enter a student ID');
      return;
    }

    setLoading(true);
    setError(null);
    setDebugInfo(null);

    try {
      const response = await fetch(`/api/students/${studentId}/debug-face`);
      const data = await response.json();

      if (data.success) {
        setDebugInfo(data.data);
      } else {
        setError(data.message || 'Failed to debug face descriptor');
      }
    } catch (err: any) {
      console.error('Error debugging face descriptor:', err);
      setError(err.message || 'Failed to debug face descriptor');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (valid: boolean) => valid ? 'success' : 'error';
  const getStatusText = (valid: boolean) => valid ? 'Valid' : 'Invalid';

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom align="center">
        🐛 Face Descriptor Debug Tool
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Debug Student Face Descriptor
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Student ID"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Enter student ID to debug"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              onClick={debugFaceDescriptor}
              disabled={loading || !studentId.trim()}
              startIcon={loading ? <CircularProgress size={20} /> : <BugReport />}
            >
              {loading ? 'Debugging...' : 'Debug Face Descriptor'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {debugInfo && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Debug Results for {debugInfo.studentName}
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Basic Information
                  </Typography>
                  <Typography variant="body2">
                    <strong>Student ID:</strong> {debugInfo.studentId}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Student Name:</strong> {debugInfo.studentName}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Has Facial Data:</strong> {debugInfo.hasFacialData ? 'Yes' : 'No'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Face Registered:</strong> {debugInfo.isFaceRegistered ? 'Yes' : 'No'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Face Descriptor Analysis
                  </Typography>
                  <Typography variant="body2">
                    <strong>Type:</strong> {debugInfo.faceDescriptorType}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Length:</strong> {debugInfo.faceDescriptorLength}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Sample Values:</strong> [{debugInfo.faceDescriptorSample.join(', ')}]
                  </Typography>
                  <Typography variant="body2" color={getStatusColor(debugInfo.faceDescriptorValid)}>
                    <strong>Valid Array:</strong> {getStatusText(debugInfo.faceDescriptorValid)}
                  </Typography>
                  <Typography variant="body2" color={getStatusColor(debugInfo.allElementsNumbers)}>
                    <strong>All Numbers:</strong> {getStatusText(debugInfo.allElementsNumbers)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Issues Found
            </Typography>
            
            {!debugInfo.hasFacialData && (
              <Alert severity="error" sx={{ mb: 1 }}>
                ❌ Student has no facial data object
              </Alert>
            )}
            
            {!debugInfo.isFaceRegistered && (
              <Alert severity="warning" sx={{ mb: 1 }}>
                ⚠️ Face is not registered
              </Alert>
            )}
            
            {debugInfo.faceDescriptorType !== 'object' && (
              <Alert severity="error" sx={{ mb: 1 }}>
                ❌ Face descriptor is not an array (type: {debugInfo.faceDescriptorType})
              </Alert>
            )}
            
            {debugInfo.faceDescriptorLength === 0 && (
              <Alert severity="error" sx={{ mb: 1 }}>
                ❌ Face descriptor is empty
              </Alert>
            )}
            
            {debugInfo.faceDescriptorLength !== 128 && debugInfo.faceDescriptorLength > 0 && (
              <Alert severity="warning" sx={{ mb: 1 }}>
                ⚠️ Face descriptor length is {debugInfo.faceDescriptorLength} (expected 128)
              </Alert>
            )}
            
            {!debugInfo.allElementsNumbers && (
              <Alert severity="error" sx={{ mb: 1 }}>
                ❌ Face descriptor contains non-numeric values
              </Alert>
            )}
            
            {debugInfo.faceDescriptorValid && debugInfo.allElementsNumbers && debugInfo.faceDescriptorLength === 128 && (
              <Alert severity="success" sx={{ mb: 1 }}>
                ✅ Face descriptor appears to be valid
              </Alert>
            )}
          </Box>

          <Box sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              onClick={debugFaceDescriptor}
              startIcon={<Refresh />}
            >
              Refresh Debug Info
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default FaceDescriptorDebug;