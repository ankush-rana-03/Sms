import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Camera, Person } from '@mui/icons-material';
import FaceCapture from './FaceCapture';
import studentService from '../services/studentService';

interface Student {
  id: string;
  name: string;
  studentId: string;
  class: string;
  section: string;
  rollNumber: string;
  facialData?: {
    faceDescriptor: number[];
    faceImage: string;
    isFaceRegistered?: boolean;
  };
}

interface FaceAttendanceMarkingProps {
  students: Student[];
  onAttendanceMarked: (studentId: string, status: 'present' | 'absent', faceImage?: string) => void;
  loading?: boolean;
}

const FaceAttendanceMarking: React.FC<FaceAttendanceMarkingProps> = ({
  students,
  onAttendanceMarked,
  loading = false
}) => {
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, 'present' | 'absent' | 'pending'>>({});
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Initialize attendance status for all students
    const initialStatus: Record<string, 'present' | 'absent' | 'pending'> = {};
    students.forEach(student => {
      initialStatus[student.id] = 'pending';
    });
    setAttendanceStatus(initialStatus);
  }, [students]);

  const handleStartAttendance = (student: Student) => {
    setCurrentStudent(student);
    setShowFaceCapture(true);
    setError(null);
  };

  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceStatus, setAttendanceStatus] = useState<'present' | 'absent' | 'late'>('present');

  const handleFaceCaptured = async (faceDescriptor: number[], faceImage: string) => {
    if (!currentStudent) return;

    setProcessing(true);
    setError(null);

    try {
      // Mark attendance with face verification using backend API
      const result = await studentService.markAttendanceWithFace({
        studentId: currentStudent.id,
        capturedFaceDescriptor: faceDescriptor,
        attendanceDate: attendanceDate,
        status: attendanceStatus
      });

      console.log('Attendance marked successfully:', result);

      // Update local state
      setAttendanceStatus(prev => ({
        ...prev,
        [currentStudent.id]: attendanceStatus
      }));

      // Call the callback
      onAttendanceMarked(currentStudent.id, attendanceStatus, faceImage);

      // Show success message
      setError(null);
      
    } catch (err: any) {
      console.error('Error marking attendance:', err);
      setError(err.message || 'Failed to mark attendance');
      
      // Mark as absent if face verification fails
      setAttendanceStatus(prev => ({
        ...prev,
        [currentStudent.id]: 'absent'
      }));
    } finally {
      setProcessing(false);
      setShowFaceCapture(false);
      setCurrentStudent(null);
    }
  };

  const handleFaceError = (error: string) => {
    setError(error);
    if (currentStudent) {
      setAttendanceStatus(prev => ({
        ...prev,
        [currentStudent.id]: 'absent'
      }));
    }
  };

  const getStatusColor = (status: 'present' | 'absent' | 'pending') => {
    switch (status) {
      case 'present': return 'success';
      case 'absent': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getStatusText = (status: 'present' | 'absent' | 'pending') => {
    switch (status) {
      case 'present': return 'Present';
      case 'absent': return 'Absent';
      case 'pending': return 'Pending';
      default: return 'Unknown';
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Face-Based Attendance Marking
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Click on a student to capture their face and mark attendance. Students must have registered faces to use this feature.
      </Typography>

      {/* Attendance Date and Status Controls */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          label="Attendance Date"
          type="date"
          value={attendanceDate}
          onChange={(e) => setAttendanceDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 200 }}
        />
        
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={attendanceStatus}
            label="Status"
            onChange={(e) => setAttendanceStatus(e.target.value as 'present' | 'absent' | 'late')}
          >
            <MenuItem value="present">Present</MenuItem>
            <MenuItem value="absent">Absent</MenuItem>
            <MenuItem value="late">Late</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        {students.map((student) => (
          <Grid item xs={12} sm={6} md={4} key={student.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2 }}>
                    <Person />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">{student.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {student.studentId} | Class {student.class}-{student.section}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Roll: {student.rollNumber}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip
                    label={getStatusText(attendanceStatus[student.id])}
                    color={getStatusColor(attendanceStatus[student.id])}
                    size="small"
                  />
                  
                  {attendanceStatus[student.id] === 'pending' && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Camera />}
                      onClick={() => handleStartAttendance(student)}
                      disabled={loading || processing}
                    >
                      Mark Attendance
                    </Button>
                  )}
                </Box>

                {!student.facialData?.isFaceRegistered && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    No face registered
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {showFaceCapture && currentStudent && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Marking attendance for: {currentStudent.name}
          </Typography>
          <FaceCapture
            onFaceCaptured={handleFaceCaptured}
            onError={handleFaceError}
            mode="verify"
            existingFaceDescriptor={currentStudent.facialData?.faceDescriptor}
          />
        </Box>
      )}

      {processing && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>
            Processing face verification...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default FaceAttendanceMarking;