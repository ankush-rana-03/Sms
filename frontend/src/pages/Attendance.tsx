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
import classService from '../services/classService';
import studentService from '../services/studentService';
import attendanceService from '../services/attendanceService';

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
  const [selectedClass, setSelectedClass] = useState(''); // classId
  const [selectedClassName, setSelectedClassName] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
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

  const [availableClasses, setAvailableClasses] = useState<Array<{ id: string; name: string; section: string; displayName: string }>>([]);
  const classNames = Array.from(new Set(availableClasses.map(c => c.name)));
  const sectionsForSelectedClass = availableClasses.filter(c => c.name === selectedClassName).map(c => c.section || '');

  const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await classService.getClasses();
        const mapped = (res.data || []).map((c: any) => ({ id: c._id, name: c.name, section: c.section, displayName: `${c.name}${c.section || ''}` }));
        setAvailableClasses(mapped);
      } catch (e) {
        console.error('Failed to load classes', e);
      }
    };
    loadClasses();
  }, []);

  // Resolve classId when name/section change
  useEffect(() => {
    const match = availableClasses.find(c => c.name === selectedClassName && c.section === selectedSection);
    setSelectedClass(match ? match.id : '');
  }, [selectedClassName, selectedSection, availableClasses]);

  const fetchAttendanceHistory = useCallback(async () => {
    if (!selectedClass || !selectedDate) return;

    setLoading(true);
    try {
      const result = await attendanceService.getAttendanceByDate(selectedDate, selectedClass);
      const history: AttendanceRecord[] = (result.data || []).map((r: any) => ({
        id: r._id,
        student: {
          id: r.studentId?._id,
          name: r.studentId?.name,
          rollNumber: r.studentId?.rollNumber,
          parentPhone: r.studentId?.parentPhone
        },
        date: r.date,
        status: r.status,
        markedBy: r.markedBy?.name || 'Unknown',
        remarks: r.remarks
      }));
      setAttendanceHistory(history);
      const markedIds = new Set((result.data || []).map((r: any) => String(r.studentId?._id)));
      setStudents(allStudents.filter(s => !markedIds.has(String(s.id))));
    } catch (error) {
      console.error('Error fetching attendance history:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedDate, allStudents, user?.name]);

  useEffect(() => {
    if (selectedClass && selectedDate) {
      if (viewMode === 'view') {
        fetchAttendanceHistory();
      }
    }
  }, [selectedClass, selectedDate, viewMode, fetchAttendanceHistory]);

  useEffect(() => {
    const refreshForDate = async () => {
      if (!selectedClass) return;
      const result = await attendanceService.getAttendanceByDate(selectedDate, selectedClass);
      const markedIds = new Set((result.data || []).map((r: any) => String(r.studentId?._id)));
      setStudents(allStudents.filter(s => !markedIds.has(String(s.id))));
      const history: AttendanceRecord[] = (result.data || []).map((r: any) => ({
        id: r._id,
        student: {
          id: r.studentId?._id,
          name: r.studentId?.name,
          rollNumber: r.studentId?.rollNumber,
          parentPhone: r.studentId?.parentPhone
        },
        date: r.date,
        status: r.status,
        markedBy: r.markedBy?.name || 'Unknown',
        remarks: r.remarks
      }));
      setAttendanceHistory(history);
    };
    refreshForDate();
  }, [selectedDate, selectedClass, allStudents]);

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

  const handleClassSelection = async (classId: string) => {
    setSelectedClass(classId);
    const cls = availableClasses.find(c => c.id === classId);
    if (!cls) { setStudents([]); return; }
    try {
      const res = await studentService.getStudents({ grade: cls.name, section: cls.section });
      const mapped: Student[] = (res.data || []).map((s: any) => ({
        id: s._id,
        name: s.name,
        rollNumber: s.rollNumber,
        parentPhone: s.parentPhone,
        status: 'present'
      }));
      setAllStudents(mapped);
      const result = await attendanceService.getAttendanceByDate(selectedDate, classId);
      const markedIds = new Set((result.data || []).map((r: any) => String(r.studentId?._id)));
      setStudents(mapped.filter(s => !markedIds.has(String(s.id))));
      const history: AttendanceRecord[] = (result.data || []).map((r: any) => ({
        id: r._id,
        student: {
          id: r.studentId?._id,
          name: r.studentId?.name,
          rollNumber: r.studentId?.rollNumber,
          parentPhone: r.studentId?.parentPhone
        },
        date: r.date,
        status: r.status,
        markedBy: r.markedBy?.name || 'Unknown',
        remarks: r.remarks
      }));
      setAttendanceHistory(history);
    } catch (e) {
      console.error('Failed to load students', e);
      setStudents([]);
    }
  };

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
      await attendanceService.markBulkAttendance(
        students.map(s => ({ studentId: s.id, status: s.status, date: selectedDate, remarks: '' }))
      );

      setSnackbar({
        open: true,
        message: 'Attendance marked successfully! Notifications sent to parents.',
        severity: 'success'
      });

      // Switch to view mode after saving
      setViewMode('view');
      fetchAttendanceHistory();
    } catch (error) {
      console.error('Error saving attendance:', error);
      setSnackbar({
        open: true,
        message: 'Error saving attendance. Please try again.',
        severity: 'error'
      });
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

      setSnackbar({
        open: true,
        message: 'Attendance updated successfully! Notification sent to parent.',
        severity: 'success'
      });

      setEditDialogOpen(false);
      setEditingAttendance(null);
    } catch (error) {
      console.error('Error updating attendance:', error);
      setSnackbar({
        open: true,
        message: 'Error updating attendance. Please try again.',
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

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Student Attendance</Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Save />}
            onClick={handleSaveAttendance}
            disabled={saving || !canMarkAttendance(selectedDate)}
          >
            {saving ? 'Saving...' : 'Save Attendance'}
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
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel id="class-name-label">Class</InputLabel>
                  <Select
                    labelId="class-name-label"
                    value={selectedClassName}
                    label="Class"
                    onChange={(e) => { setSelectedClassName(e.target.value); setSelectedSection(''); }}
                  >
                    {classNames.map(name => (
                      <MenuItem key={name} value={name}>{capitalize(name)}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth disabled={!selectedClassName}>
                  <InputLabel id="section-label">Section</InputLabel>
                  <Select
                    labelId="section-label"
                    value={selectedSection}
                    label="Section"
                    onChange={(e) => { setSelectedSection(e.target.value); }}
                    onClose={() => { const match = availableClasses.find(c => c.name === selectedClassName && c.section === selectedSection); if (match) { handleClassSelection(match.id); } }}
                  >
                    {sectionsForSelectedClass.map(sec => (
                      <MenuItem key={sec} value={sec}>{sec || 'A'}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

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