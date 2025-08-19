import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextareaAutosize,
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Tooltip,
  Snackbar
} from '@mui/material';
import {
  Save,
  Refresh,
  Edit,
  CheckCircle,
  Cancel,
  Schedule,
  Person,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import teacherService from '../services/teacherService';
import classService, { ClassWithSections } from '../services/classService';

const TeacherAttendance: React.FC = () => {
  const { user } = useAuth();
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'mark' | 'view'>('mark');
  const [students, setStudents] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [editingAttendance, setEditingAttendance] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editStatus, setEditStatus] = useState<'present' | 'absent' | 'late' | 'half-day'>('present');
  const [editRemarks, setEditRemarks] = useState('');
  const [availableClasses, setAvailableClasses] = useState<ClassWithSections[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  const sections = ['A', 'B', 'C', 'D', 'E'];

  // Fetch available classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoadingClasses(true);
        const response = await classService.getAvailableClassesForRegistration();
        if (response.success) {
          setAvailableClasses(response.data.classes);
        }
      } catch (error: any) {
        console.error('Error fetching classes:', error);
      } finally {
        setLoadingClasses(false);
      }
    };

    fetchClasses();
  }, []);

  // Check if user can mark attendance for selected date
  const canMarkAttendance = (date: string) => {
    const selectedDateObj = new Date(date);
    const todayObj = new Date();
    
    if (user?.role === 'teacher') {
      // Teachers can only mark attendance for today
      return selectedDateObj.toDateString() === todayObj.toDateString();
    } else if (user?.role === 'admin') {
      // Admins can mark attendance for today and past dates, but not future
      return selectedDateObj <= todayObj;
    }
    
    return false;
  };

  // Check if user can edit attendance for selected date
  const canEditAttendance = (date: string) => {
    const selectedDateObj = new Date(date);
    const todayObj = new Date();
    
    if (user?.role === 'teacher') {
      // Teachers can only edit today's attendance
      return selectedDateObj.toDateString() === todayObj.toDateString();
    } else if (user?.role === 'admin') {
      // Admins can edit past and current attendance, but not future
      return selectedDateObj <= todayObj;
    }
    
    return false;
  };

  const fetchStudents = useCallback(async () => {
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
  }, [selectedGrade, selectedSection]);

  const fetchTodayAttendance = useCallback(async () => {
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
  }, [selectedGrade, selectedSection]);

  const fetchAttendanceHistory = useCallback(async () => {
    if (!selectedGrade || !selectedDate) return;

    setLoading(true);
    try {
      // Find the class ID for the selected grade and section
      const selectedClass = availableClasses.find(cls => 
        cls.name === selectedGrade && (!selectedSection || cls.section === selectedSection)
      );
      
      if (!selectedClass) {
        setAttendanceHistory([]);
        return;
      }

      const result = await attendanceService.getAttendanceByDate(selectedDate, selectedClass._id);
      
      if (result.success) {
        // Transform the data to match our interface
        const transformedHistory = result.data.map((record: any) => ({
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
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [selectedGrade, selectedSection, selectedDate, availableClasses]);

  // Fetch data when selections change
  useEffect(() => {
    if (selectedGrade) {
      fetchStudents();
      fetchTodayAttendance();
    }
  }, [selectedGrade, selectedSection, selectedDate, viewMode, fetchStudents, fetchTodayAttendance, fetchAttendanceHistory]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  const handleBulkSaveAttendance = async () => {
    if (!selectedGrade || students.length === 0) {
      setError('Please select a class and ensure students are loaded');
      return;
    }

    if (!canMarkAttendance(selectedDate)) {
      setError(user?.role === 'teacher' 
        ? 'Teachers can only mark attendance for the current day'
        : 'Cannot mark attendance for future dates');
      return;
    }

    setSaving(true);
    try {
      // Prepare bulk attendance data using today's attendance status
      const attendanceData = students.map(student => {
        const existingAttendance = todayAttendance.find(att => att.studentId === student.id);
        return {
          studentId: student.id,
          status: existingAttendance?.todayStatus === 'not_marked' ? 'present' : existingAttendance?.todayStatus || 'present',
          date: selectedDate,
          remarks: ''
        };
      });

      const result = await attendanceService.markBulkAttendance(attendanceData);
      
      setError(null);
      setSnackbar({
        open: true,
        message: result.message || 'Attendance saved successfully! Notifications sent to parents.',
        severity: 'success'
      });
      
      // Refresh data
      fetchTodayAttendance();
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      setError(error.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleEditAttendance = (attendance: any) => {
    setEditingAttendance(attendance);
    setEditStatus(attendance.status);
    setEditRemarks(attendance.remarks || '');
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingAttendance) return;

    setSaving(true);
    try {
      if (editingAttendance.id) {
        // Update existing attendance record
        const result = await attendanceService.updateAttendance(editingAttendance.id, {
          status: editStatus,
          remarks: editRemarks
        });
        
        setSnackbar({
          open: true,
          message: result.message || 'Attendance updated successfully!',
          severity: 'success'
        });
      } else {
        // Mark new attendance
        const result = await attendanceService.markAttendance({
          studentId: editingAttendance.studentId,
          status: editStatus,
          date: selectedDate,
          remarks: editRemarks
        });
        
        setSnackbar({
          open: true,
          message: result.message || 'Attendance marked successfully!',
          severity: 'success'
        });
      }
      
      // Update local state
      if (viewMode === 'mark') {
        setTodayAttendance(prev => prev.map(att => 
          att.studentId === editingAttendance.studentId 
            ? { ...att, status: editStatus, remarks: editRemarks }
            : att
        ));
      } else {
        setAttendanceHistory(prev => prev.map(att => 
          att.id === editingAttendance.id 
            ? { ...att, status: editStatus, remarks: editRemarks }
            : att
        ));
      }
      
      setEditDialogOpen(false);
      setEditingAttendance(null);
      setError(null);
    } catch (error: any) {
      console.error('Error updating attendance:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to update attendance',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'success';
      case 'absent': return 'error';
      case 'late': return 'warning';
      case 'half-day': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle />;
      case 'absent': return <Cancel />;
      case 'late': return <Schedule />;
      case 'half-day': return <Person />;
      default: return <Person />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        📊 Attendance Management
      </Typography>

      {/* Class Selection */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🏫 Select Class & Date
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Class</InputLabel>
              <Select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                label="Class"
                disabled={loadingClasses}
              >
                {availableClasses.map((cls) => (
                  <MenuItem key={cls.name} value={cls.name}>
                    {cls.displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
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

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={viewMode === 'mark' && user?.role === 'teacher'}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Button
              variant="contained"
              onClick={() => {
                if (viewMode === 'mark') {
                  fetchStudents();
                  fetchTodayAttendance();
                } else {
                  fetchAttendanceHistory();
                }
              }}
              disabled={!selectedGrade || loading}
              startIcon={<Refresh />}
              fullWidth
            >
              Refresh
            </Button>
          </Grid>
        </Grid>

        <Alert severity="info" sx={{ mt: 2 }}>
          {viewMode === 'mark' 
            ? (user?.role === 'teacher' 
                ? 'Teachers can only mark attendance for the current day'
                : 'Admins can mark attendance for current and past dates')
            : (user?.role === 'teacher' 
                ? 'Teachers can view and edit today\'s attendance only'
                : 'Admins can view and edit all attendance records')
          }
        </Alert>
      </Paper>

      {/* Students List */}
      {selectedGrade && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              👥 Students ({students.length})
            </Typography>
            
            {viewMode === 'mark' && (
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleBulkSaveAttendance}
                disabled={saving || !canMarkAttendance(selectedDate)}
              >
                {saving ? <CircularProgress size={20} /> : 'Save All Attendance'}
              </Button>
            )}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : students.length === 0 ? (
            <Alert severity="info">
              No students found for the selected class and section.
            </Alert>
          ) : (
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
                  {students.map((student) => {
                    const attendance = viewMode === 'mark' 
                      ? todayAttendance.find(att => att.studentId === student.id)
                      : attendanceHistory.find(att => att.student.id === student.id);

                    return (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                              <Person />
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {student.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {student.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{student.rollNumber}</TableCell>
                        <TableCell>
                          {attendance ? (
                            <Chip
                              icon={getStatusIcon(attendance.status)}
                              label={attendance.status.toUpperCase()}
                              color={getStatusColor(attendance.status) as any}
                              size="small"
                            />
                          ) : (
                            <Chip label="NOT MARKED" color="default" size="small" />
                          )}
                        </TableCell>
                        <TableCell>
                          {attendance?.markedBy || '-'}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Edit Attendance">
                            <IconButton
                              size="small"
                              onClick={() => handleEditAttendance(attendance || { studentId: student.id, status: 'present', remarks: '' })}
                              disabled={!canEditAttendance(selectedDate)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Edit Attendance Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Attendance</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl component="fieldset" fullWidth>
              <Typography variant="subtitle1" gutterBottom>
                Status
              </Typography>
              <RadioGroup
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as any)}
                row
              >
                <FormControlLabel value="present" control={<Radio />} label="Present" />
                <FormControlLabel value="absent" control={<Radio />} label="Absent" />
                <FormControlLabel value="late" control={<Radio />} label="Late" />
                <FormControlLabel value="half-day" control={<Radio />} label="Half Day" />
              </RadioGroup>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Remarks"
              value={editRemarks}
              onChange={(e) => setEditRemarks(e.target.value)}
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveEdit} 
            variant="contained"
            disabled={saving}
          >
            {saving ? <CircularProgress size={20} /> : 'Save'}
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

export default TeacherAttendance;