import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
  TextField,
  Grid,
  Chip
} from '@mui/material';
import { Person, Save, CheckCircle } from '@mui/icons-material';
import studentService from '../services/studentService';

interface LogMessage {
  id: number;
  timestamp: string;
  level: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

const StudentCreationDebug: React.FC = () => {
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [currentStep, setCurrentStep] = useState<'form' | 'saving' | 'complete'>('form');
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

  const handleSaveStudent = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setCurrentStep('saving');
      
      addLog('info', 'Starting student creation process...');
      addLog('info', `Form data: ${JSON.stringify(formData, null, 2)}`);

      const studentData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        dateOfBirth: formData.dateOfBirth,
        grade: formData.grade,
        section: formData.section,
        rollNumber: formData.rollNumber,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        parentName: formData.parentName,
        parentPhone: formData.parentPhone
      };

      addLog('info', 'Calling studentService.createStudent...');
      const result = await studentService.createStudent(studentData);
      
      addLog('success', 'Student created successfully!');
      addLog('info', `Response: ${JSON.stringify(result, null, 2)}`);
      
      setSavedStudent(result.data);
      setCurrentStep('complete');
      
    } catch (error: any) {
      addLog('error', `Failed to create student: ${error.message}`);
      setError(error.message);
      setCurrentStep('form');
    } finally {
      setIsSaving(false);
    }
  };

  const resetProcess = () => {
    setCurrentStep('form');
    setSavedStudent(null);
    setError(null);
    setLogs([]);
  };

  const getStepColor = (step: string) => {
    if (currentStep === step) return 'primary';
    if (step === 'form') return 'default';
    if (currentStep === 'complete') return 'success';
    return 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Student Creation Debug
      </Typography>

      {/* Progress Steps */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Chip
            icon={<Person />}
            label="Form Data"
            color={getStepColor('form')}
            variant={currentStep === 'form' ? 'filled' : 'outlined'}
          />
          <Box sx={{ width: 50, height: 2, bgcolor: 'grey.300', mx: 1 }} />
          <Chip
            icon={<Save />}
            label="Saving"
            color={getStepColor('saving')}
            variant={currentStep === 'saving' ? 'filled' : 'outlined'}
          />
          <Box sx={{ width: 50, height: 2, bgcolor: 'grey.300', mx: 1 }} />
          <Chip
            icon={<CheckCircle />}
            label="Complete"
            color={getStepColor('complete')}
            variant={currentStep === 'complete' ? 'filled' : 'outlined'}
          />
        </Box>
      </Box>

      {/* Form Section */}
      {currentStep === 'form' && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Student Information
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                value={formData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => handleFormChange('phone', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Address"
                value={formData.address}
                onChange={(e) => handleFormChange('address', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Grade"
                value={formData.grade}
                onChange={(e) => handleFormChange('grade', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Section"
                value={formData.section}
                onChange={(e) => handleFormChange('section', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Roll Number"
                value={formData.rollNumber}
                onChange={(e) => handleFormChange('rollNumber', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleFormChange('dateOfBirth', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Gender"
                value={formData.gender}
                onChange={(e) => handleFormChange('gender', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Blood Group"
                value={formData.bloodGroup}
                onChange={(e) => handleFormChange('bloodGroup', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Parent Name"
                value={formData.parentName}
                onChange={(e) => handleFormChange('parentName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Parent Phone"
                value={formData.parentPhone}
                onChange={(e) => handleFormChange('parentPhone', e.target.value)}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              onClick={handleSaveStudent}
              disabled={isSaving}
              startIcon={isSaving ? <CircularProgress size={20} /> : <Save />}
            >
              {isSaving ? 'Creating Student...' : 'Create Student'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* Saving Section */}
      {currentStep === 'saving' && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ ml: 2 }}>
              Creating Student...
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Complete Section */}
      {currentStep === 'complete' && savedStudent && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            Student created successfully!
          </Alert>
          
          <Typography variant="h6" gutterBottom>
            Created Student Details
          </Typography>
          
          <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
            <Typography><strong>ID:</strong> {savedStudent._id}</Typography>
            <Typography><strong>Name:</strong> {savedStudent.name}</Typography>
            <Typography><strong>Email:</strong> {savedStudent.email}</Typography>
            <Typography><strong>Phone:</strong> {savedStudent.phone}</Typography>
            <Typography><strong>Grade:</strong> {savedStudent.grade}</Typography>
            <Typography><strong>Section:</strong> {savedStudent.section}</Typography>
            <Typography><strong>Roll Number:</strong> {savedStudent.rollNumber}</Typography>
            <Typography><strong>Created At:</strong> {new Date(savedStudent.createdAt).toLocaleString()}</Typography>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Button variant="contained" onClick={resetProcess}>
              Create Another Student
            </Button>
          </Box>
        </Paper>
      )}

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Logs Section */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Debug Logs
        </Typography>
        
        <Box sx={{ maxHeight: 400, overflow: 'auto', bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
          {logs.map((log) => (
            <Box key={log.id} sx={{ mb: 1, fontFamily: 'monospace', fontSize: '0.875rem' }}>
              <span style={{ color: log.level === 'error' ? 'red' : log.level === 'success' ? 'green' : log.level === 'warning' ? 'orange' : 'black' }}>
                [{log.timestamp}] {log.level.toUpperCase()}: {log.message}
              </span>
            </Box>
          ))}
          {logs.length === 0 && (
            <Typography color="text.secondary">
              No logs yet. Start the process to see debug information.
            </Typography>
          )}
        </Box>

        {logs.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Button size="small" onClick={() => setLogs([])}>
              Clear Logs
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default StudentCreationDebug;