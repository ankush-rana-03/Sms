import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
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
  DialogActions,
  TextField,
  Tooltip
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Schedule,
  Person,
  Refresh,
  Edit,
  Save,

  Visibility
} from '@mui/icons-material';
import teacherService, { Student, TodayAttendanceRecord } from '../services/teacherService';
import { useAuth } from '../contexts/AuthContext';

const TeacherAttendance: React.FC = () => {
  const { user } = useAuth();
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'mark' | 'view'>('mark');
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [editingAttendance, setEditingAttendance] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editStatus, setEditStatus] = useState<'present' | 'absent' | 'late' | 'half-day'>('present');
  const [editRemarks, setEditRemarks] = useState('');

  const grades = ['nursery', 'lkg', 'ukg', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const sections = ['A', 'B', 'C', 'D', 'E'];



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
    } catch (error) {
      console.error('Error fetching attendance history:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedGrade, selectedDate, students, user?.name]);

  useEffect(() => {
    if (selectedGrade) {
      fetchStudents();
      if (viewMode === 'mark') {
        fetchTodayAttendance();
      } else {
        fetchAttendanceHistory();
      }
    }
  }, [selectedGrade, selectedSection, selectedDate, viewMode, fetchStudents, fetchTodayAttendance, fetchAttendanceHistory]);

  const handleMarkAttendance = async (studentId: string, status: 'present' | 'absent' | 'late') => {
    if (!canMarkAttendance(selectedDate)) {
      setError(user?.role === 'teacher' 
        ? 'Teachers can only mark attendance for the current day'
        : 'Cannot mark attendance for future dates'
      );
      return;
    }

    try {
      await teacherService.markAttendance(studentId, status, selectedDate);
      
      setSuccess(`Attendance marked as ${status} successfully! Notification sent to parent.`);
      if (viewMode === 'mark') {
        fetchTodayAttendance();
      } else {
        fetchAttendanceHistory();
      }
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error marking attendance:', error);
      setError(error.message);
    }
  };

  const handleBulkSaveAttendance = async () => {
    if (!selectedGrade || students.length === 0) {
      setError('Please select a class and ensure students are loaded');
      return;
    }

    if (!canMarkAttendance(selectedDate)) {
      setError(user?.role === 'teacher' 
        ? 'Teachers can only mark attendance for the current day'
        : 'Cannot mark attendance for future dates'
      );
      return;
    }

    setSaving(true);
    try {
      // In real app, call the API
      // await attendanceService.bulkMarkAttendance({
      //   classId: selectedGrade,
      //   date: selectedDate,
      //   attendanceData: students.map(student => ({
      //     studentId: student.id,
      //     status: 'present' as const, // Default status, in real app this would be from UI
      //     remarks: ''
      //   }))
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      setSuccess('Attendance marked successfully! Notifications sent to all parents.');
      setViewMode('view');
      fetchAttendanceHistory();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      setError('Error saving attendance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditAttendance = async () => {
    if (!editingAttendance) return;

    setSaving(true);
    try {
      // In real app, call the API
      // await attendanceService.updateAttendance(editingAttendance.id, {
      //   status: editStatus,
      //   remarks: editRemarks
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update local state
      setAttendanceHistory(prev =>
        prev.map(record =>
          record.id === editingAttendance.id
            ? { ...record, status: editStatus, remarks: editRemarks }
            : record
        )
      );

      setSuccess('Attendance updated successfully! Notification sent to parent.');
      setEditDialogOpen(false);
      setEditingAttendance(null);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error updating attendance:', error);
      setError('Error updating attendance. Please try again.');
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
      case 'not_marked': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle />;
      case 'absent': return <Cancel />;
      case 'late': return <Schedule />;
      case 'not_marked': return <Person />;
      default: return <Person />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          📚 Teacher Attendance Management
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
              >
                {grades.map((grade) => (
                  <MenuItem key={grade} value={grade}>
                    {grade === 'nursery' ? 'Nursery' : 
                     grade === 'lkg' ? 'LKG' : 
                     grade === 'ukg' ? 'UKG' : 
                     `Class ${grade}`}
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
                    <TableCell>Parent Phone</TableCell>
                    <TableCell>Status</TableCell>
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
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">
                              {student.parentPhone || 'N/A'}
                            </Typography>
                            {student.parentPhone && (
                              <Chip
                                label="Notified"
                                size="small"
                                color="success"
                              />
                            )}
                          </Box>
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
                          {viewMode === 'mark' ? (
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
                            </Box>
                          ) : (
                            <Tooltip title="View/Edit Attendance">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  const record = attendanceHistory.find(r => r.student.id === student.id);
                                  if (record && canEditAttendance(record.date)) {
                                    setEditingAttendance(record);
                                    setEditStatus(record.status);
                                    setEditRemarks(record.remarks || '');
                                    setEditDialogOpen(true);
                                  }
                                }}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                          )}
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
    </Box>
  );
};

export default TeacherAttendance;