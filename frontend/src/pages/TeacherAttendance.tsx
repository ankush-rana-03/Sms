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
  Tooltip
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
      // In real app, call the API
      // const result = await attendanceService.getAttendanceByDate(selectedDate, selectedGrade);
      
      // Mock data
      const mockHistory = students.map(student => ({
        id: `att_${student.id}_${selectedDate}`,
        student: {
          id: student.id,
          name: student.name,
          rollNumber: student.rollNumber,
          parentPhone: student.parentPhone || '+919876543210'
        },
        date: selectedDate,
        status: 'present' as const,
        markedBy: user?.name || 'Unknown',
        remarks: ''
      }));

      setAttendanceHistory(mockHistory);
    } catch (error: any) {
      console.error('Error fetching attendance history:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [selectedGrade, selectedDate, students, user?.name]);

  // Fetch data when selections change
  useEffect(() => {
    if (selectedGrade) {
      fetchStudents();
      fetchTodayAttendance();
    }
  }, [selectedGrade, selectedSection, selectedDate, viewMode, fetchStudents, fetchTodayAttendance, fetchAttendanceHistory]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBulkSaveAttendance = async () => {
    if (!selectedGrade || students.length === 0) {
      return;
    }

    setSaving(true);
    try {
      // In real app, call the API to save all attendance
      console.log('Saving attendance for all students...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setError(null);
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
      // In real app, call the API to update attendance
      console.log('Updating attendance:', editingAttendance.id, editStatus, editRemarks);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
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
    } catch (error: any) {
      console.error('Error updating attendance:', error);
      setError(error.message || 'Failed to update attendance');
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
    </Box>
  );
};

export default TeacherAttendance;