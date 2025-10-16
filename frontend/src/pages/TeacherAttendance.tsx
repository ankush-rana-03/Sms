import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
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
  ToggleButton,
  ToggleButtonGroup,
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
  School
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import teacherService from '../services/teacherService';
import staffAttendanceService from '../services/staffAttendanceService';

const TeacherAttendance: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'mark' | 'view'>('mark');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [editingAttendance, setEditingAttendance] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editStatus, setEditStatus] = useState<'present' | 'absent' | 'late' | 'half-day' | 'leave'>('present');
  const [editRemarks, setEditRemarks] = useState('');
  const [loadingTeachers, setLoadingTeachers] = useState(true);

  // Fetch all teachers
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoadingTeachers(true);
        const response = await teacherService.getAllTeachers();
        if (response.success) {
          setTeachers(response.data);
        }
      } catch (error: any) {
        console.error('Error fetching teachers:', error);
      } finally {
        setLoadingTeachers(false);
      }
    };

    fetchTeachers();
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

  const fetchTodayAttendance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await staffAttendanceService.getAttendanceByDate(selectedDate);
      setTodayAttendance(result.data);
      console.log('Today attendance fetched:', result.count);
    } catch (error: any) {
      console.error('Error fetching today attendance:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  const fetchAttendanceHistory = useCallback(async () => {
    if (!selectedDate) return;

    setLoading(true);
    try {
      const result = await staffAttendanceService.getAttendanceByDate(selectedDate);
      setAttendanceHistory(result.data);
    } catch (error: any) {
      console.error('Error fetching attendance history:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // Fetch data when selections change
  useEffect(() => {
    fetchTodayAttendance();
  }, [selectedDate, viewMode, fetchTodayAttendance]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBulkSaveAttendance = async () => {
    if (teachers.length === 0) {
      return;
    }

    setSaving(true);
    try {
      // Mark attendance for all teachers who don't have attendance marked yet
      const unmarkedTeachers = teachers.filter(teacher => {
        const existingAttendance = todayAttendance.find(att => att.staffId._id === teacher._id);
        return !existingAttendance;
      });

      for (const teacher of unmarkedTeachers) {
        await staffAttendanceService.markAttendance({
          staffId: teacher._id,
          status: 'present',
          date: selectedDate,
          remarks: 'Bulk marked as present'
        });
      }
      
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
      // Call the API to update attendance
      console.log('Updating attendance:', editingAttendance._id, editStatus, editRemarks);
      
      await staffAttendanceService.updateAttendance(editingAttendance._id, {
        status: editStatus,
        remarks: editRemarks
      });
      
      // Update local state
      if (viewMode === 'mark') {
        setTodayAttendance(prev => prev.map(att => 
          att._id === editingAttendance._id 
            ? { ...att, status: editStatus, remarks: editRemarks }
            : att
        ));
      } else {
        setAttendanceHistory(prev => prev.map(att => 
          att._id === editingAttendance._id 
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
      case 'leave': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle />;
      case 'absent': return <Cancel />;
      case 'late': return <Schedule />;
      case 'half-day': return <Person />;
      case 'leave': return <Schedule />;
      default: return <Person />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        👨‍🏫 Teacher Attendance Management
      </Typography>

      {/* Date Selection */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          📅 Select Date
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
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

          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              onClick={() => {
                if (viewMode === 'mark') {
                  fetchTodayAttendance();
                } else {
                  fetchAttendanceHistory();
                }
              }}
              disabled={loading}
              startIcon={<Refresh />}
              fullWidth
            >
              Refresh
            </Button>
          </Grid>

          <Grid item xs={12} md={4}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newMode) => newMode && setViewMode(newMode)}
              fullWidth
            >
              <ToggleButton value="mark">Mark Attendance</ToggleButton>
              <ToggleButton value="view">View History</ToggleButton>
            </ToggleButtonGroup>
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

      {/* Teachers List */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            👨‍🏫 Teachers ({teachers.length})
          </Typography>
          
          {viewMode === 'mark' && (
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleBulkSaveAttendance}
              disabled={saving || !canMarkAttendance(selectedDate)}
            >
              {saving ? <CircularProgress size={20} /> : 'Mark All Present'}
            </Button>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loadingTeachers ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : teachers.length === 0 ? (
          <Alert severity="info">
            No teachers found.
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Teacher</TableCell>
                  <TableCell>Designation</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Marked By</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teachers.map((teacher) => {
                  const attendance = viewMode === 'mark' 
                    ? todayAttendance.find(att => att.staffId._id === teacher._id)
                    : attendanceHistory.find(att => att.staffId._id === teacher._id);

                  return (
                    <TableRow key={teacher._id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                            <School />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {teacher.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {teacher.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{teacher.designation}</TableCell>
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
                        {attendance?.markedBy?.name || '-'}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Edit Attendance">
                          <IconButton
                            size="small"
                            onClick={() => handleEditAttendance(attendance || { staffId: { _id: teacher._id }, status: 'present', remarks: '' })}
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
                <FormControlLabel value="leave" control={<Radio />} label="Leave" />
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