import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Schedule,
  Person,
  School,
  Refresh,
  Face,
  Camera,
  Help
} from '@mui/icons-material';
import teacherService, { Student, TodayAttendanceRecord } from '../services/teacherService';
import FaceAttendanceMarking from '../components/FaceAttendanceMarking';

const TeacherAttendance: React.FC = () => {
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showFaceAttendance, setShowFaceAttendance] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const grades = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const sections = ['A', 'B', 'C', 'D', 'E'];

  const today = new Date().toISOString().split('T')[0];

  const fetchStudents = async () => {
    if (!selectedGrade) return;

    setLoading(true);
    setError(null);
    try {
      const result = await teacherService.getStudentsByClass(selectedGrade, selectedSection);
      setStudents(result.data);
      console.log('Students fetched:', result.count);
    } catch (error: any) {
      console.error('Error fetching students:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayAttendance = async () => {
    if (!selectedGrade) return;

    setLoading(true);
    setError(null);
    try {
      const result = await teacherService.getTodayAttendance(selectedGrade, selectedSection);
      setTodayAttendance(result.data);
      console.log('Today attendance fetched:', result.count);
    } catch (error: any) {
      console.error('Error fetching today attendance:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedGrade) {
      fetchStudents();
      fetchTodayAttendance();
    }
  }, [selectedGrade, selectedSection]);

  const handleMarkAttendance = async (studentId: string, status: 'present' | 'absent' | 'late') => {
    try {
      await teacherService.markAttendance({
        studentId,
        status,
        date: today
      });
      
      setSuccess(`Attendance marked as ${status} successfully`);
      fetchTodayAttendance(); // Refresh today's attendance
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error marking attendance:', error);
      setError(error.message);
    }
  };

  const handleFaceAttendance = (student: Student) => {
    setSelectedStudent(student);
    setShowFaceAttendance(true);
  };

  const handleFaceAttendanceMarked = async (studentId: string, status: 'present' | 'absent' | 'late') => {
    try {
      await teacherService.markAttendance({
        studentId,
        status,
        date: today,
        verifiedWithFace: true
      });
      
      setSuccess(`Face-verified attendance marked as ${status} successfully`);
      fetchTodayAttendance(); // Refresh today's attendance
      setShowFaceAttendance(false);
      setSelectedStudent(null);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error marking face attendance:', error);
      setError(error.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'success';
      case 'absent': return 'error';
      case 'late': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle />;
      case 'absent': return <Cancel />;
      case 'late': return <Schedule />;
      default: return <Help />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        📚 Teacher Attendance Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Class Selection */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🏫 Select Class & Section
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Grade</InputLabel>
              <Select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                label="Grade"
              >
                {grades.map((grade) => (
                  <MenuItem key={grade} value={grade}>
                    Grade {grade}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Section</InputLabel>
              <Select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                label="Section"
              >
                <MenuItem value="">All Sections</MenuItem>
                {sections.map((section) => (
                  <MenuItem key={section} value={section}>
                    Section {section}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Button
          variant="contained"
          onClick={() => {
            fetchStudents();
            fetchTodayAttendance();
          }}
          disabled={!selectedGrade || loading}
          startIcon={<Refresh />}
          sx={{ mt: 2 }}
        >
          Refresh Data
        </Button>
      </Paper>

      {/* Students List */}
      {selectedGrade && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            👥 Students ({students.length})
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : students.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Roll No</TableCell>
                    <TableCell>Grade/Section</TableCell>
                    <TableCell>Face Registered</TableCell>
                    <TableCell>Today's Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student) => {
                    const todayRecord = todayAttendance.find(
                      record => record.studentId === student.id
                    );
                    const todayStatus = todayRecord?.todayStatus || 'not_marked';

                    return (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body1" fontWeight="bold">
                              {student.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {student.email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{student.rollNumber}</TableCell>
                        <TableCell>
                          Grade {student.grade} - Section {student.section}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={student.facialData.isFaceRegistered ? <Face /> : <Cancel />}
                            label={student.facialData.isFaceRegistered ? 'Yes' : 'No'}
                            color={student.facialData.isFaceRegistered ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(todayStatus)}
                            label={todayStatus.replace('_', ' ')}
                            color={getStatusColor(todayStatus) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              onClick={() => handleMarkAttendance(student.id, 'present')}
                              disabled={todayStatus === 'present'}
                            >
                              Present
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              onClick={() => handleMarkAttendance(student.id, 'late')}
                              disabled={todayStatus === 'late'}
                            >
                              Late
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleMarkAttendance(student.id, 'absent')}
                              disabled={todayStatus === 'absent'}
                            >
                              Absent
                            </Button>
                            {student.facialData.isFaceRegistered && (
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleFaceAttendance(student)}
                                title="Mark attendance with face verification"
                              >
                                <Camera />
                              </IconButton>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">
              No students found for Grade {selectedGrade} {selectedSection && `Section ${selectedSection}`}
            </Alert>
          )}
        </Paper>
      )}

      {/* Face Attendance Dialog */}
      <Dialog
        open={showFaceAttendance}
        onClose={() => setShowFaceAttendance(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          📷 Face Attendance Verification
        </DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Student: {selectedStudent.name} (Roll: {selectedStudent.rollNumber})
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Grade {selectedStudent.grade} - Section {selectedStudent.section}
              </Typography>
              
              <FaceAttendanceMarking
                students={[{
                  ...selectedStudent,
                  studentId: selectedStudent.id,
                  class: selectedStudent.grade,
                  facialData: {
                    faceDescriptor: [],
                    faceImage: '',
                    isFaceRegistered: selectedStudent.facialData.isFaceRegistered
                  }
                }]}
                onAttendanceMarked={handleFaceAttendanceMarked}
                loading={loading}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFaceAttendance(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherAttendance;