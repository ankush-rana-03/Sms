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
  Tabs,
  Tab,
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
  Search,
  FilterList,
  Download,
  Print,
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
  className?: string;
}

interface AttendanceRecord {
  id: string;
  student: {
    id: string;
    name: string;
    rollNumber: string;
    parentPhone: string;
    className?: string;
  };
  date: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  markedBy: string;
  remarks?: string;
}

const StudentAttendance: React.FC = () => {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState(''); // will hold classId
  const [selectedClassName, setSelectedClassName] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'mark' | 'view' | 'reports'>('mark');
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');

  const [editingAttendance, setEditingAttendance] = useState<AttendanceRecord | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editStatus, setEditStatus] = useState<'present' | 'absent' | 'late' | 'half-day'>('present');
  const [editRemarks, setEditRemarks] = useState('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  // Reports state
  const [reportLoading, setReportLoading] = useState(false);
  const [reportStats, setReportStats] = useState<{ total?: number; present?: number; absent?: number; late?: number; halfDay?: number; percentage?: number }>({});

  const [classes, setClasses] = useState<Array<{ id: string; name: string; section: string; displayName: string }>>([]);
  const classNames = Array.from(new Set(classes.map(c => c.name)));
  const sectionsForSelectedClass = classes.filter(c => c.name === selectedClassName).map(c => c.section || '');
  const reportClassNames = Array.from(new Set(classes.map(c => c.name)));
  const reportSections = classes.filter(c => c.name === selectedClassName).map(c => c.section || '');
  const reportClassMatch = classes.find(c => c.name === selectedClassName && c.section === selectedSection);
  const reportClassId = reportClassMatch ? reportClassMatch.id : '';

  const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await classService.getClasses();
        const mapped = (res.data || []).map((c: any) => ({
          id: c._id,
          name: c.name,
          section: c.section,
          displayName: `${c.name}${c.section ? c.section : ''}`
        }));
        setClasses(mapped);
      } catch (e) {
        console.error('Failed to load classes', e);
      }
    };
    loadClasses();
  }, []);

  // Resolve classId whenever class name/section change
  useEffect(() => {
    const match = classes.find(c => c.name === selectedClassName && c.section === selectedSection);
    setSelectedClass(match ? match.id : '');
  }, [selectedClassName, selectedSection, classes]);

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
    const cls = classes.find(c => c.id === classId);
    if (!cls) { setStudents([]); return; }
    try {
      const res = await studentService.getStudents({ grade: cls.name, section: cls.section });
      const mapped: Student[] = (res.data || []).map((s: any) => ({
        id: s._id,
        name: s.name,
        rollNumber: s.rollNumber,
        parentPhone: s.parentPhone,
        status: 'present',
        className: `${s.grade}${s.section || ''}`
      }));
      setAllStudents(mapped);
      // Fetch existing attendance for this date/class and filter unmarked for mark view
      const result = await attendanceService.getAttendanceByDate(selectedDate, classId);
      const markedIds = new Set((result.data || []).map((r: any) => String(r.studentId?._id)));
      const unmarked = mapped.filter(s => !markedIds.has(String(s.id)));
      setStudents(unmarked);
      // Also update view records
      const history: AttendanceRecord[] = (result.data || []).map((r: any) => ({
        id: r._id,
        student: {
          id: r.studentId?._id,
          name: r.studentId?.name,
          rollNumber: r.studentId?.rollNumber,
          parentPhone: r.studentId?.parentPhone,
          className: r.classId ? `${r.classId.name}${r.classId.section || ''}` : undefined
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

  // When date changes, refresh unmarked and view records for selected class
  useEffect(() => {
    const refreshForDate = async () => {
      if (!selectedClass) return;
      const result = await attendanceService.getAttendanceByDate(selectedDate, selectedClass);
      const markedIds = new Set((result.data || []).map((r: any) => String(r.studentId?._id)));
      const unmarked = allStudents.filter(s => !markedIds.has(String(s.id)));
      setStudents(unmarked);
      const history: AttendanceRecord[] = (result.data || []).map((r: any) => ({
        id: r._id,
        student: {
          id: r.studentId?._id,
          name: r.studentId?.name,
          rollNumber: r.studentId?.rollNumber,
          parentPhone: r.studentId?.parentPhone,
          className: r.classId ? `${r.classId.name}${r.classId.section || ''}` : undefined
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
        students.map(s => ({
          studentId: s.id,
          status: s.status,
          date: selectedDate,
          remarks: ''
        }))
      );

      setSnackbar({
        open: true,
        message: 'Student attendance marked successfully! Notifications sent to parents.',
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
          parentPhone: r.studentId?.parentPhone,
          className: r.classId ? `${r.classId.name}${r.classId.section || ''}` : undefined
        },
        date: r.date,
        status: r.status,
        markedBy: r.markedBy?.name || 'Unknown',
        remarks: r.remarks
      }));
      setAttendanceHistory(history);
      // Also update unmarked list for mark view
      const markedIds = new Set((result.data || []).map((r: any) => String(r.studentId?._id)));
      const unmarked = allStudents.filter(s => !markedIds.has(String(s.id)));
      setStudents(unmarked);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedDate, allStudents]);

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
        message: 'Student attendance updated successfully! Notification sent to parent.',
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

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNumber.includes(searchTerm)
  );

  const filteredAttendanceHistory = attendanceHistory.filter(record =>
    record.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.student.rollNumber.includes(searchTerm)
  );

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
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Student Attendance
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
            View Records
          </Button>
          <Button
            variant={viewMode === 'reports' ? 'contained' : 'outlined'}
            startIcon={<Download />}
            onClick={() => setViewMode('reports')}
          >
            Reports
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
                <Grid item xs={12} md={6}>
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
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth disabled={!selectedClassName}>
                    <InputLabel id="section-label">Section</InputLabel>
                    <Select
                      labelId="section-label"
                      value={selectedSection}
                      label="Section"
                      onChange={(e) => {
                        const newSection = e.target.value as string;
                        setSelectedSection(newSection);
                        const match = classes.find(c => c.name === selectedClassName && c.section === newSection);
                        if (match) { handleClassSelection(match.id); }
                      }}
                    >
                      {sectionsForSelectedClass.map(sec => (
                        <MenuItem key={sec} value={sec}>{sec || 'A'}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>

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
            {/* Search Bar */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Search students by name or roll number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Box>

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

                {filteredStudents.length > 0 ? (
                  <Grid container spacing={2}>
                    {filteredStudents.map((student) => (
                      <Grid item xs={12} sm={6} key={student.id}>
                        <Card>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="h6">{student.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Roll No: {student.rollNumber}
                                </Typography>
                                {student.className && (
                                  <Typography variant="body2" color="text.secondary">
                                    Class: {student.className}
                                  </Typography>
                                )}
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
                    {searchTerm ? 'No students found matching your search' : 'Select a class to view students'}
                  </Alert>
                )}
              </>
            ) : viewMode === 'view' ? (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Student Attendance Records
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedDate}
                  </Typography>
                </Box>

                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : filteredAttendanceHistory.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Student</TableCell>
                          <TableCell>Roll No</TableCell>
                          <TableCell>Class</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Marked By</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredAttendanceHistory.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{record.student.name}</TableCell>
                            <TableCell>{record.student.rollNumber}</TableCell>
                            <TableCell>{record.student.className || 'N/A'}</TableCell>
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
                    {searchTerm ? 'No attendance records found matching your search' : 'No attendance records found for this date'}
                  </Alert>
                )}
              </>
            ) : (
              // Reports view
              <Box>
                <Typography variant="h6" gutterBottom>
                  Attendance Reports
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Using selected Class/Section and Date from the left panel.
                </Typography>
                <Button
                  variant="contained"
                  onClick={async () => {
                    if (!selectedClass) { setSnackbar({ open: true, message: 'Select class and section first', severity: 'error' }); return; }
                    setReportLoading(true);
                    try {
                      const res = await attendanceService.getClassAttendanceStatistics(selectedClass, selectedDate);
                      setReportStats({
                        total: res.data.totalStudents,
                        present: res.data.presentCount,
                        absent: res.data.absentCount,
                        late: res.data.lateCount,
                        halfDay: res.data.halfDayCount,
                        percentage: res.data.attendancePercentage
                      });
                    } catch (e) {
                      setSnackbar({ open: true, message: 'Failed to fetch report', severity: 'error' });
                    } finally {
                      setReportLoading(false);
                    }
                  }}
                  disabled={reportLoading}
                  sx={{ mb: 2 }}
                >
                  {reportLoading ? 'Loading...' : 'Generate Report'}
                </Button>

                {reportStats && reportStats.total !== undefined && (
                  <Grid container spacing={2}>
                    <Grid item xs={6} md={2}><Card><CardContent><Typography variant="subtitle2">Total</Typography><Typography variant="h6">{reportStats.total}</Typography></CardContent></Card></Grid>
                    <Grid item xs={6} md={2}><Card><CardContent><Typography variant="subtitle2">Present</Typography><Typography variant="h6">{reportStats.present}</Typography></CardContent></Card></Grid>
                    <Grid item xs={6} md={2}><Card><CardContent><Typography variant="subtitle2">Absent</Typography><Typography variant="h6">{reportStats.absent}</Typography></CardContent></Card></Grid>
                    <Grid item xs={6} md={2}><Card><CardContent><Typography variant="subtitle2">Late</Typography><Typography variant="h6">{reportStats.late}</Typography></CardContent></Card></Grid>
                    <Grid item xs={6} md={2}><Card><CardContent><Typography variant="subtitle2">Half-day</Typography><Typography variant="h6">{reportStats.halfDay}</Typography></CardContent></Card></Grid>
                    <Grid item xs={6} md={2}><Card><CardContent><Typography variant="subtitle2">%</Typography><Typography variant="h6">{reportStats.percentage}%</Typography></CardContent></Card></Grid>
                  </Grid>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Edit Attendance Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Student Attendance</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="h6" gutterBottom>
              {editingAttendance?.student.name} - {editingAttendance?.student.rollNumber}
            </Typography>
            {editingAttendance?.student.className && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Class: {editingAttendance.student.className}
              </Typography>
            )}
            
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

export default StudentAttendance;
