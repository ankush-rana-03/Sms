import React, { useState, useEffect, useCallback } from 'react';
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
  Chip,
  IconButton,
  Tooltip,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Schedule,
  People,
  Person,
  Save,
  Edit,
  Visibility,

} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import attendanceService from '../services/attendanceService';
import teacherService from '../services/teacherService';
import classService from '../services/classService';

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  parentPhone: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
}

interface AttendanceRecord {
  id: string;
  student: {
    id: string;
    name: string;
    rollNumber: string;
    parentPhone: string;
  };
  date: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  markedBy: string;
  remarks?: string;
}

const Attendance: React.FC = () => {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'mark' | 'view'>('mark');
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);

  const [editingAttendance, setEditingAttendance] = useState<AttendanceRecord | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editStatus, setEditStatus] = useState<'present' | 'absent' | 'late' | 'half-day'>('present');
  const [editRemarks, setEditRemarks] = useState('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  const [classes, setClasses] = useState<any[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  // Check if user can mark attendance for selected date
  const canMarkAttendance = (date: string) => {
    const selectedDateObj = new Date(date);
    const today = new Date();
    
    if (user?.role === 'teacher') {
      // Teachers can only mark attendance for today
      return selectedDateObj.toDateString() === today.toDateString();
    } else if (user?.role === 'admin') {
      // Admins can mark attendance for today and past dates, but not future
      return selectedDateObj <= today;
    }
    
    return false;
  };

  // Check if user can edit attendance for selected date
  const canEditAttendance = (date: string) => {
    const selectedDateObj = new Date(date);
    const today = new Date();
    
    if (user?.role === 'teacher') {
      // Teachers can only edit today's attendance
      return selectedDateObj.toDateString() === today.toDateString();
    } else if (user?.role === 'admin') {
      // Admins can edit past and current attendance, but not future
      return selectedDateObj <= today;
    }
    
    return false;
  };

  const handleClassChange = async (classId: string) => {
    setSelectedClass(classId);
    if (classId) {
      await fetchStudentsForClass(classId);
    } else {
      setStudents([]);
    }
  };

  const fetchStudentsForClass = async (classSelection: string) => {
    setLoading(true);
    try {
      // Parse the class selection (format: "grade-section")
      const [grade, section] = classSelection.split('-');
      
      const result = await teacherService.getStudentsByClass(grade, section);
      
      if (result.success) {
        // Transform the data to match our interface
        const transformedStudents = result.data.map((student: any) => ({
          id: student._id,
          name: student.name,
          rollNumber: student.rollNumber,
          parentPhone: student.parentPhone || '',
          status: 'present' as const
        }));
        setStudents(transformedStudents);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setSnackbar({
        open: true,
        message: 'Error loading students. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

    // Fetch available classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoadingClasses(true);
        const response = await classService.getAvailableClassesForRegistration();
        if (response.success) {
          // Transform classes to include all grade-section combinations
          const classOptions: any[] = [];
          response.data.classes.forEach(cls => {
            cls.sections.forEach(section => {
              classOptions.push({
                id: `${cls.name}-${section}`,
                name: `${cls.displayName} - Section ${section}`,
                grade: cls.name,
                section: section
              });
            });
          });
          setClasses(classOptions);
        }
      } catch (error: any) {
        console.error('Error fetching classes:', error);
        setSnackbar({
          open: true,
          message: 'Error loading classes. Please refresh the page.',
          severity: 'error'
        });
      } finally {
        setLoadingClasses(false);
      }
    };

    fetchClasses();
  }, []);

  const handleStatusChange = (studentId: string, status: Student['status']) => {
    setStudents(prev =>
      prev.map(student =>
        student.id === studentId ? { ...student, status } : student
      )
    );
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass || students.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please select a class and ensure students are loaded',
        severity: 'error'
      });
      return;
    }

    if (!canMarkAttendance(selectedDate)) {
      setSnackbar({
        open: true,
        message: user?.role === 'teacher' 
          ? 'Teachers can only mark attendance for the current day'
          : 'Cannot mark attendance for future dates',
        severity: 'error'
      });
      return;
    }

    setSaving(true);
    try {
      // Prepare bulk attendance data
      const attendanceData = students.map(student => ({
        studentId: student.id,
        status: student.status,
        date: selectedDate,
        remarks: ''
      }));

      const result = await attendanceService.markBulkAttendance(attendanceData);

      setSnackbar({
        open: true,
        message: result.message || 'Attendance marked successfully! Notifications sent to parents.',
        severity: 'success'
      });

      // Switch to view mode after saving
      setViewMode('view');
      fetchAttendanceHistory();
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error saving attendance. Please try again.',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const fetchAttendanceHistory = useCallback(async () => {
    if (!selectedClass || !selectedDate) return;

    setLoading(true);
    try {
      const result = await attendanceService.getAttendanceByDate(selectedDate, selectedClass);
      
      if (result.success) {
        // Transform the data to match our interface
        const transformedHistory: AttendanceRecord[] = result.data.map((record: any) => ({
          id: record._id,
          student: {
            id: record.studentId._id,
            name: record.studentId.name,
            rollNumber: record.studentId.rollNumber,
            parentPhone: record.studentId.parentPhone || ''
          },
          date: record.date,
          status: record.status,
          markedBy: record.markedBy?.name || 'Unknown',
          remarks: record.remarks || ''
        }));
        setAttendanceHistory(transformedHistory);
      } else {
        setAttendanceHistory([]);
      }
    } catch (error: any) {
      console.error('Error fetching attendance history:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error loading attendance history.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedDate]);

  const handleEditAttendance = async () => {
    if (!editingAttendance) return;

    setSaving(true);
    try {
      const result = await attendanceService.updateAttendance(editingAttendance.id, {
        status: editStatus,
        remarks: editRemarks
      });

      // Update local state
      setAttendanceHistory(prev =>
        prev.map(record =>
          record.id === editingAttendance.id
            ? { ...record, status: editStatus, remarks: editRemarks }
            : record
        )
      );

      setSnackbar({
        open: true,
        message: result.message || 'Attendance updated successfully! Notification sent to parent.',
        severity: 'success'
      });

      setEditDialogOpen(false);
      setEditingAttendance(null);
    } catch (error: any) {
      console.error('Error updating attendance:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error updating attendance. Please try again.',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status: Student['status']) => {
    switch (status) {
      case 'present': return <CheckCircle color="success" />;
      case 'absent': return <Cancel color="error" />;
      case 'late': return <Schedule color="warning" />;
      case 'half-day': return <People color="info" />;
      default: return <Person />;
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

  useEffect(() => {
    if (selectedClass && selectedDate) {
      if (viewMode === 'view') {
        fetchAttendanceHistory();
      }
    }
  }, [selectedClass, selectedDate, viewMode, fetchAttendanceHistory]);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Attendance Management
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant={viewMode === 'mark' ? 'contained' : 'outlined'}
            startIcon={<Edit />}
            onClick={() => setViewMode('mark')}
          >
            Mark Attendance
          </Button>
          <Button
            variant={viewMode === 'view' ? 'contained' : 'outlined'}
            startIcon={<Visibility />}
            onClick={() => setViewMode('view')}
          >
            View Attendance
          </Button>
        </Box>
      </Box>

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
                disabled={loadingClasses}
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
              disabled={viewMode === 'mark' && user?.role === 'teacher'}
            />

            {viewMode === 'mark' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                {user?.role === 'teacher' 
                  ? 'Teachers can only mark attendance for the current day'
                  : 'Admins can mark attendance for current and past dates'
                }
              </Alert>
            )}

            {viewMode === 'view' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                {user?.role === 'teacher' 
                  ? 'Teachers can view and edit today\'s attendance only'
                  : 'Admins can view and edit all attendance records'
                }
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Attendance Content */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            {viewMode === 'mark' ? (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Mark Student Attendance
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSaveAttendance}
                    disabled={saving || !canMarkAttendance(selectedDate)}
                  >
                    {saving ? <CircularProgress size={20} /> : 'Save Attendance'}
                  </Button>
                </Box>

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
                                <Chip
                                  label="Parent notified"
                                  size="small"
                                  color="success"
                                  sx={{ mt: 1 }}
                                />
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
              </>
            ) : (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Attendance Records
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedDate}
                  </Typography>
                </Box>

                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : attendanceHistory.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Student</TableCell>
                          <TableCell>Roll No</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Marked By</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {attendanceHistory.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{record.student.name}</TableCell>
                            <TableCell>{record.student.rollNumber}</TableCell>
                            <TableCell>
                              <Chip
                                icon={getStatusIcon(record.status)}
                                label={record.status}
                                color={getStatusColor(record.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{record.markedBy}</TableCell>
                            <TableCell>
                              {canEditAttendance(record.date) && (
                                <Tooltip title="Edit Attendance">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setEditingAttendance(record);
                                      setEditStatus(record.status);
                                      setEditRemarks(record.remarks || '');
                                      setEditDialogOpen(true);
                                    }}
                                  >
                                    <Edit />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">
                    No attendance records found for this date
                  </Alert>
                )}
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Edit Attendance Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Attendance</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="h6" gutterBottom>
              {editingAttendance?.student.name} - {editingAttendance?.student.rollNumber}
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={editStatus}
                label="Status"
                onChange={(e) => setEditStatus(e.target.value as any)}
              >
                <MenuItem value="present">Present</MenuItem>
                <MenuItem value="absent">Absent</MenuItem>
                <MenuItem value="late">Late</MenuItem>
                <MenuItem value="half-day">Half Day</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Remarks"
              value={editRemarks}
              onChange={(e) => setEditRemarks(e.target.value)}
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleEditAttendance}
            variant="contained"
            disabled={saving}
          >
            {saving ? <CircularProgress size={20} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Attendance;