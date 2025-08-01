import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from '@mui/material';
import {
  CameraAlt,
  CheckCircle,
  Cancel,
  Schedule,
  People,
  Face,
} from '@mui/icons-material';
import Webcam from 'react-webcam';
import { useAuth } from '../contexts/AuthContext';
import FaceAttendanceMarking from '../components/FaceAttendanceMarking';

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
}

const Attendance: React.FC = () => {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const webcamRef = useRef<Webcam>(null);

  // Mock data - in real app, this would come from API
  const mockStudents: Student[] = [
    { id: '1', name: 'John Doe', rollNumber: '001', status: 'present' },
    { id: '2', name: 'Jane Smith', rollNumber: '002', status: 'absent' },
    { id: '3', name: 'Mike Johnson', rollNumber: '003', status: 'present' },
    { id: '4', name: 'Sarah Wilson', rollNumber: '004', status: 'late' },
  ];

  const classes = [
    { id: '1', name: 'Class 10A' },
    { id: '2', name: 'Class 10B' },
    { id: '3', name: 'Class 9A' },
    { id: '4', name: 'Class 9B' },
  ];

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    setStudents(mockStudents); // In real app, fetch students for this class
  };

  const handleStatusChange = (studentId: string, status: Student['status']) => {
    setStudents(prev =>
      prev.map(student =>
        student.id === studentId ? { ...student, status } : student
      )
    );
  };

  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setPhoto(imageSrc);
    }
  }, [webcamRef]);

  const handleMarkAttendance = async () => {
    if (!selectedStudent || !photo) return;

    setLoading(true);
    try {
      // In real app, send photo and attendance data to API
      console.log('Marking attendance with photo:', { student: selectedStudent, photo });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setShowCamera(false);
      setPhoto(null);
      setSelectedStudent(null);
      
      // Update student status
      handleStatusChange(selectedStudent.id, 'present');
    } catch (error) {
      console.error('Error marking attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFaceAttendanceMarked = async (studentId: string, status: 'present' | 'absent', faceImage?: string) => {
    setLoading(true);
    try {
      // In real app, send face attendance data to API
      console.log('Marking face-based attendance:', { studentId, status, faceImage });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update student status
      setStudents(prev =>
        prev.map(student =>
          student.id === studentId ? { ...student, status } : student
        )
      );
    } catch (error) {
      console.error('Error marking face attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Student['status']) => {
    switch (status) {
      case 'present': return 'success';
      case 'absent': return 'error';
      case 'late': return 'warning';
      case 'half-day': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: Student['status']) => {
    switch (status) {
      case 'present': return <CheckCircle color="success" />;
      case 'absent': return <Cancel color="error" />;
      case 'late': return <Schedule color="warning" />;
      case 'half-day': return <People color="info" />;
      default: return null;
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Attendance Management
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Manual Attendance" icon={<People />} />
          <Tab label="Face-Based Attendance" icon={<Face />} />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Grid container spacing={3}>
        {/* Class and Date Selection */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Select Class & Date
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Class</InputLabel>
              <Select
                value={selectedClass}
                label="Class"
                onChange={(e) => handleClassChange(e.target.value)}
              >
                {classes.map((cls) => (
                  <MenuItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              type="date"
              label="Date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Paper>
        </Grid>

        {/* Attendance List */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Student Attendance
            </Typography>

            {students.length > 0 ? (
              <Grid container spacing={2}>
                {students.map((student) => (
                  <Grid item xs={12} sm={6} key={student.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="h6">{student.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Roll No: {student.rollNumber}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getStatusIcon(student.status)}
                            <FormControl size="small">
                              <Select
                                value={student.status}
                                onChange={(e) => handleStatusChange(student.id, e.target.value as Student['status'])}
                              >
                                <MenuItem value="present">Present</MenuItem>
                                <MenuItem value="absent">Absent</MenuItem>
                                <MenuItem value="late">Late</MenuItem>
                                <MenuItem value="half-day">Half Day</MenuItem>
                              </Select>
                            </FormControl>
                            
                            {user?.role === 'teacher' && (
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<CameraAlt />}
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setShowCamera(true);
                                }}
                              >
                                Photo
                              </Button>
                            )}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Alert severity="info">
                Select a class to view students
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
      )}

      {activeTab === 1 && (
        <FaceAttendanceMarking
          students={students.map(student => ({
            ...student,
            studentId: student.id,
            class: '10A',
            section: 'A',
            facialData: {
              faceDescriptor: [0.1, 0.2, 0.3, 0.4, 0.5], // Mock face data
              faceImage: 'data:image/jpeg;base64,mock-image-data',
              isFaceRegistered: true
            }
          }))}
          onAttendanceMarked={handleFaceAttendanceMarked}
          loading={loading}
        />
      )}

      {/* Camera Dialog */}
      <Dialog
        open={showCamera}
        onClose={() => setShowCamera(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Mark Attendance with Photo - {selectedStudent?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            {!photo ? (
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width="100%"
                height="auto"
              />
            ) : (
              <img src={photo} alt="Captured" style={{ maxWidth: '100%', height: 'auto' }} />
            )}
            
            {!photo && (
              <Button
                variant="contained"
                startIcon={<CameraAlt />}
                onClick={capturePhoto}
              >
                Capture Photo
              </Button>
            )}
            
            {photo && (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => setPhoto(null)}
                >
                  Retake
                </Button>
                <Button
                  variant="contained"
                  onClick={handleMarkAttendance}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
                >
                  {loading ? 'Marking...' : 'Mark Attendance'}
                </Button>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCamera(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Attendance;