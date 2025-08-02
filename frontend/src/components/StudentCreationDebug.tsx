import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
  TextField,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip
} from '@mui/material';
import { Person, Camera, Save, CheckCircle, Error } from '@mui/icons-material';
import FaceCapture from './FaceCapture';
import studentService from '../services/studentService';

interface LogMessage {
  id: number;
  timestamp: string;
  level: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

const StudentCreationDebug: React.FC = () => {
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [currentStep, setCurrentStep] = useState<'form' | 'face-capture' | 'saving' | 'complete'>('form');
  const [formData, setFormData] = useState({
    name: 'Test Student',
    email: 'test.student@school.com',
    phone: '1234567890',
    address: '123 Test Street',
    dateOfBirth: '2005-01-01',
    grade: '10',
    section: 'A',
    rollNumber: '001',
    gender: 'male',
    bloodGroup: 'A+',
    parentName: 'Test Parent',
    parentPhone: '0987654321'
  });
  const [faceData, setFaceData] = useState<{ faceDescriptor: number[]; faceImage: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedStudent, setSavedStudent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const addLog = (level: 'info' | 'success' | 'error' | 'warning', message: string) => {
    const newLog: LogMessage = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message
    };
    setLogs(prev => [...prev, newLog]);
  };

  // Override console methods to capture logs
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      originalLog(...args);
      addLog('info', args.join(' '));
    };

    console.error = (...args) => {
      originalError(...args);
      addLog('error', args.join(' '));
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('warning', args.join(' '));
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFaceCaptured = (faceDescriptor: number[], faceImage: string) => {
    addLog('success', `Face captured successfully! Descriptor: ${faceDescriptor.length} values, Image: ${faceImage.length} chars`);
    setFaceData({ faceDescriptor, faceImage });
    setCurrentStep('saving');
  };

  const handleFaceError = (error: string) => {
    addLog('error', `Face capture error: ${error}`);
    setError(error);
  };

  const handleSaveStudent = async () => {
    if (!faceData) {
      addLog('error', 'No face data available for saving');
      return;
    }

    setIsSaving(true);
    setError(null);
    addLog('info', 'Starting student save process...');

    try {
      const studentData = {
        ...formData,
        facialData: {
          faceId: `face_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          faceDescriptor: faceData.faceDescriptor,
          faceImage: faceData.faceImage
        }
      };

      addLog('info', `Submitting student data to API...`);
      addLog('info', `Student name: ${studentData.name}`);
      addLog('info', `Student email: ${studentData.email}`);
      addLog('info', `Face descriptor length: ${studentData.facialData.faceDescriptor.length}`);
      addLog('info', `Face image length: ${studentData.facialData.faceImage.length}`);

      // Show alert with data being saved
      const alertData = {
        studentInfo: {
          name: studentData.name,
          email: studentData.email,
          phone: studentData.phone,
          address: studentData.address,
          dateOfBirth: studentData.dateOfBirth,
          grade: studentData.grade,
          section: studentData.section,
          rollNumber: studentData.rollNumber,
          gender: studentData.gender,
          bloodGroup: studentData.bloodGroup,
          parentName: studentData.parentName,
          parentPhone: studentData.parentPhone
        },
        faceData: {
          faceId: studentData.facialData.faceId,
          descriptorLength: studentData.facialData.faceDescriptor.length,
          imageLength: studentData.facialData.faceImage.length,
          imagePreview: studentData.facialData.faceImage.substring(0, 50) + '...',
          descriptorSample: studentData.facialData.faceDescriptor.slice(0, 5)
        }
      };

      const shouldProceed = window.confirm(
        `📋 DATA TO BE SAVED:\n\n` +
        `👤 STUDENT INFO:\n` +
        `Name: ${alertData.studentInfo.name}\n` +
        `Email: ${alertData.studentInfo.email}\n` +
        `Phone: ${alertData.studentInfo.phone}\n` +
        `Address: ${alertData.studentInfo.address}\n` +
        `DOB: ${alertData.studentInfo.dateOfBirth}\n` +
        `Grade: ${alertData.studentInfo.grade}\n` +
        `Section: ${alertData.studentInfo.section}\n` +
        `Roll: ${alertData.studentInfo.rollNumber}\n` +
        `Gender: ${alertData.studentInfo.gender}\n` +
        `Blood: ${alertData.studentInfo.bloodGroup}\n` +
        `Parent: ${alertData.studentInfo.parentName}\n` +
        `Parent Phone: ${alertData.studentInfo.parentPhone}\n\n` +
        `📷 FACE DATA:\n` +
        `Face ID: ${alertData.faceData.faceId}\n` +
        `Descriptor Length: ${alertData.faceData.descriptorLength}\n` +
        `Image Length: ${alertData.faceData.imageLength}\n` +
        `Image Preview: ${alertData.faceData.imagePreview}\n` +
        `Descriptor Sample: [${alertData.faceData.descriptorSample.join(', ')}]\n\n` +
        `✅ Click OK to save this data to database\n` +
        `❌ Click Cancel to abort`
      );

      if (!shouldProceed) {
        addLog('warning', 'User cancelled student save');
        return;
      }

      const result = await studentService.createStudent(studentData);
      
      addLog('success', `Student saved successfully! ID: ${result.data._id}`);
      
      // Show success alert with saved data
      const savedData = result.data;
      window.alert(
        `✅ STUDENT SAVED SUCCESSFULLY!\n\n` +
        `🆔 Database ID: ${savedData._id}\n` +
        `👤 Name: ${savedData.name}\n` +
        `📧 Email: ${savedData.email}\n` +
        `📱 Phone: ${savedData.phone}\n` +
        `🏠 Address: ${savedData.address}\n` +
        `📅 DOB: ${savedData.dateOfBirth}\n` +
        `📚 Grade: ${savedData.grade}\n` +
        `📋 Section: ${savedData.section}\n` +
        `🔢 Roll: ${savedData.rollNumber}\n` +
        `👥 Gender: ${savedData.gender}\n` +
        `🩸 Blood: ${savedData.bloodGroup}\n` +
        `👨‍👩‍👧‍👦 Parent: ${savedData.parentName}\n` +
        `📞 Parent Phone: ${savedData.parentPhone}\n\n` +
        `📷 FACE DATA SAVED:\n` +
        `Face ID: ${savedData.facialData?.faceId || 'N/A'}\n` +
        `Face Registered: ${savedData.facialData?.isFaceRegistered ? 'Yes' : 'No'}\n` +
        `Descriptor Length: ${savedData.facialData?.faceDescriptor?.length || 0}\n` +
        `Image Length: ${savedData.facialData?.faceImage?.length || 0}\n\n` +
        `⏰ Created At: ${new Date(savedData.createdAt).toLocaleString()}\n` +
        `🔄 Updated At: ${new Date(savedData.updatedAt).toLocaleString()}\n\n` +
        `🎉 Student registration completed successfully!`
      );
      
      setSavedStudent(result.data);
      setCurrentStep('complete');
    } catch (error: any) {
      addLog('error', `Failed to save student: ${error.message}`);
      setError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const resetProcess = () => {
    setLogs([]);
    setCurrentStep('form');
    setFaceData(null);
    setSavedStudent(null);
    setError(null);
    addLog('info', 'Process reset - starting fresh');
  };

  const getStepColor = (step: string) => {
    switch (step) {
      case 'form': return currentStep === 'form' ? 'primary' : 'default';
      case 'face-capture': return currentStep === 'face-capture' ? 'primary' : 'default';
      case 'saving': return currentStep === 'saving' ? 'primary' : 'default';
      case 'complete': return currentStep === 'complete' ? 'success' : 'default';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom align="center">
        🧪 Student Creation Debug Test
      </Typography>

      {/* Progress Steps */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Chip 
          label="1. Form Data" 
          color={getStepColor('form')}
          icon={<Person />}
        />
        <Chip 
          label="2. Face Capture" 
          color={getStepColor('face-capture')}
          icon={<Camera />}
        />
        <Chip 
          label="3. Save to DB" 
          color={getStepColor('saving')}
          icon={<Save />}
        />
        <Chip 
          label="4. Complete" 
          color={getStepColor('complete')}
          icon={<CheckCircle />}
        />
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Form and Face Capture */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              📝 Student Information
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={formData.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => handleFormChange('phone', e.target.value)}
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Grade"
                  value={formData.grade}
                  onChange={(e) => handleFormChange('grade', e.target.value)}
                  size="small"
                />
              </Grid>
            </Grid>

            <Button
              variant="contained"
              onClick={() => setCurrentStep('face-capture')}
              sx={{ mt: 2 }}
              disabled={!formData.name || !formData.email}
            >
              Next: Capture Face
            </Button>
          </Paper>

          {currentStep === 'face-capture' && (
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                📷 Face Capture
              </Typography>
              
              <FaceCapture
                onFaceCaptured={handleFaceCaptured}
                onError={handleFaceError}
                mode="register"
              />
            </Paper>
          )}

          {currentStep === 'saving' && (
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                💾 Save to Database
              </Typography>
              
              {isSaving ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CircularProgress size={20} />
                  <Typography>Saving student to database...</Typography>
                </Box>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleSaveStudent}
                  disabled={!faceData}
                  startIcon={<Save />}
                >
                  Save Student
                </Button>
              )}
            </Paper>
          )}

          {currentStep === 'complete' && savedStudent && (
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom color="success.main">
                ✅ Student Created Successfully!
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>ID:</strong> {savedStudent._id}
                </Typography>
                <Typography variant="body2">
                  <strong>Name:</strong> {savedStudent.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Email:</strong> {savedStudent.email}
                </Typography>
                <Typography variant="body2">
                  <strong>Face Registered:</strong> {savedStudent.facialData?.isFaceRegistered ? 'Yes' : 'No'}
                </Typography>
              </Box>
            </Paper>
          )}

          <Button
            variant="outlined"
            onClick={resetProcess}
            sx={{ mt: 2 }}
          >
            Reset Process
          </Button>
        </Grid>

        {/* Right Column - Live Logs */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '600px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              📊 Live Console Logs
            </Typography>
            
            <Box sx={{ 
              flex: 1, 
              overflow: 'auto', 
              bgcolor: '#1e1e1e', 
              p: 2, 
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.875rem'
            }}>
              {logs.map((log) => (
                <Box key={log.id} sx={{ mb: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: log.level === 'error' ? '#ff6b6b' : 
                             log.level === 'success' ? '#51cf66' :
                             log.level === 'warning' ? '#ffd43b' : '#adb5bd',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem'
                    }}
                  >
                    [{log.timestamp}] {log.message}
                  </Typography>
                </Box>
              ))}
              {logs.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No logs yet. Start the process to see live debugging...
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default StudentCreationDebug;