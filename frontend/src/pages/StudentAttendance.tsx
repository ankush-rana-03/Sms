import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Tabs,
  Tab,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Checkbox,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails
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
  ExpandMore,
  TrendingUp,
  Dashboard,
  CalendarToday,
  School,
  Notifications,
  Download,
  FilterList,
  Refresh
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import classService, { ClassWithSections } from '../services/classService';
import attendanceService from '../services/attendanceService';

interface Student {
  _id: string;
  name: string;
  rollNumber: string;
  parentPhone: string;
  grade: string;
  section: string;
  currentSession: string;
}

interface AttendanceRecord {
  _id: string;
  student: {
    _id: string;
    name: string;
    rollNumber: string;
    parentPhone: string;
  };
  class: {
    _id: string;
    name: string;
    section: string;
  };
  date: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  markedBy: {
    _id: string;
    name: string;
  };
  remarks?: string;
  isVerified: boolean;
  verifiedBy?: {
    _id: string;
    name: string;
  };
  verifiedAt?: string;
}

interface AttendanceStatistics {
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  halfDayCount: number;
  attendancePercentage: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`attendance-tabpanel-${index}`}
      aria-labelledby={`attendance-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const StudentAttendance: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [statistics, setStatistics] = useState<AttendanceStatistics | null>(null);
  const [availableClasses, setAvailableClasses] = useState<ClassWithSections[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Bulk operations
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<'present' | 'absent' | 'late' | 'half-day'>('present');
  const [bulkRemarks, setBulkRemarks] = useState('');

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<AttendanceRecord | null>(null);
  const [editStatus, setEditStatus] = useState<'present' | 'absent' | 'late' | 'half-day'>('present');
  const [editRemarks, setEditRemarks] = useState('');

  // View mode
  const [viewMode, setViewMode] = useState<'mark' | 'view'>('mark');

  useEffect(() => {
    fetchAvailableClasses();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSection) {
      fetchStudents();
      if (viewMode === 'view') {
        fetchAttendanceByDate();
      }
    }
  }, [selectedClass, selectedSection, selectedDate, viewMode]);

  const fetchAvailableClasses = async () => {
    try {
      const response = await classService.getAvailableClassesForRegistration();
      if (response.success) {
        setAvailableClasses(response.data.classes);
      }
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<{ success: boolean; data: Student[] }>(`/students?grade=${selectedClass}&section=${selectedSection}`);
      if (response.success) {
        setStudents(response.data);
      }
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Failed to fetch students', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceByDate = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<{ success: boolean; data: AttendanceRecord[] }>(`/attendance/date/${selectedDate}?classId=${selectedClass}`);
      if (response.success) {
        setAttendanceData(response.data);
        calculateStatistics(response.data);
      }
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Failed to fetch attendance', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (data: AttendanceRecord[]) => {
    const totalStudents = students.length;
    const presentCount = data.filter(record => record.status === 'present').length;
    const absentCount = data.filter(record => record.status === 'absent').length;
    const lateCount = data.filter(record => record.status === 'late').length;
    const halfDayCount = data.filter(record => record.status === 'half-day').length;
    const attendancePercentage = totalStudents > 0 ? ((presentCount + lateCount + halfDayCount) / totalStudents) * 100 : 0;

    setStatistics({
      totalStudents,
      presentCount,
      absentCount,
      lateCount,
      halfDayCount,
      attendancePercentage
    });
  };

  const handleBulkAttendance = async () => {
    if (selectedStudents.length === 0) {
      setSnackbar({ open: true, message: 'Please select students', severity: 'error' });
      return;
    }

    try {
      setSaving(true);
      const attendanceData = selectedStudents.map(studentId => ({
        studentId,
        status: bulkStatus,
        date: selectedDate,
        remarks: bulkRemarks
      }));

      const response = await apiService.post<{ success: boolean; message: string; data: any }>('/attendance/bulk', attendanceData);
      if (response.success) {
        setSnackbar({ open: true, message: 'Bulk attendance marked successfully!', severity: 'success' });
        setSelectedStudents([]);
        setBulkRemarks('');
        fetchAttendanceByDate();
      }
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleIndividualAttendance = async (studentId: string, status: 'present' | 'absent' | 'late' | 'half-day', remarks?: string) => {
    try {
      const response = await apiService.post<{ success: boolean; data: any; message: string }>('/attendance/mark', {
        studentId,
        status,
        date: selectedDate,
        remarks
      });
      if (response.success) {
        setSnackbar({ open: true, message: 'Attendance marked successfully!', severity: 'success' });
        fetchAttendanceByDate();
      }
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    }
  };

  const handleEditAttendance = async () => {
    if (!editingAttendance) return;

    try {
      setSaving(true);
      const response = await apiService.put<{ success: boolean; data: any; message: string }>(`/attendance/${editingAttendance._id}`, {
        status: editStatus,
        remarks: editRemarks
      });
      if (response.success) {
        setSnackbar({ open: true, message: 'Attendance updated successfully!', severity: 'success' });
        setEditDialogOpen(false);
        fetchAttendanceByDate();
      }
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(student => student._id));
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSectionsForClass = (className: string) => {
    const classData = availableClasses.find(cls => cls.name === className);
    return classData ? classData.sections : [];
  };

  const getStudentAttendance = (studentId: string) => {
    return attendanceData.find(record => record.student._id === studentId);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <School />
        Student Attendance
      </Typography>

      {/* Class and Date Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Class</InputLabel>
                <Select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setSelectedSection('');
                  }}
                  label="Class"
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
                  disabled={!selectedClass}
                >
                  {selectedClass && getSectionsForClass(selectedClass).map((section) => (
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
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant={viewMode === 'mark' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('mark')}
                  startIcon={<Edit />}
                >
                  Mark
                </Button>
                <Button
                  variant={viewMode === 'view' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('view')}
                  startIcon={<Visibility />}
                >
                  View
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {selectedClass && selectedSection && (
        <>
          {/* Statistics */}
          {statistics && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={2}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary.main">
                      {statistics.totalStudents}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Students
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={2}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {statistics.presentCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Present
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={2}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="error.main">
                      {statistics.absentCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Absent
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={2}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      {statistics.lateCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Late
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={2}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main">
                      {statistics.halfDayCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Half Day
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={2}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary.main">
                      {statistics.attendancePercentage.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Attendance Rate
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Bulk Operations */}
          {viewMode === 'mark' && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={bulkMode}
                        onChange={(e) => setBulkMode(e.target.checked)}
                      />
                    }
                    label="Bulk Mode"
                  />
                  {bulkMode && (
                    <>
                      <FormControl size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={bulkStatus}
                          onChange={(e) => setBulkStatus(e.target.value as any)}
                          label="Status"
                        >
                          <MenuItem value="present">Present</MenuItem>
                          <MenuItem value="absent">Absent</MenuItem>
                          <MenuItem value="late">Late</MenuItem>
                          <MenuItem value="half-day">Half Day</MenuItem>
                        </Select>
                      </FormControl>
                      <TextField
                        size="small"
                        label="Remarks"
                        value={bulkRemarks}
                        onChange={(e) => setBulkRemarks(e.target.value)}
                        placeholder="Optional remarks"
                      />
                      <Button
                        variant="contained"
                        onClick={handleBulkAttendance}
                        disabled={selectedStudents.length === 0 || saving}
                        startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                      >
                        {saving ? 'Saving...' : `Mark ${selectedStudents.length} Students`}
                      </Button>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Students Table */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {viewMode === 'mark' ? 'Mark Attendance' : 'Attendance Records'} - {selectedClass} Section {selectedSection}
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      {bulkMode && viewMode === 'mark' && (
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedStudents.length === students.length}
                            indeterminate={selectedStudents.length > 0 && selectedStudents.length < students.length}
                            onChange={handleSelectAll}
                          />
                        </TableCell>
                      )}
                      <TableCell>Student</TableCell>
                      <TableCell>Roll Number</TableCell>
                      <TableCell>Parent Phone</TableCell>
                      {viewMode === 'mark' ? (
                        <TableCell>Mark Attendance</TableCell>
                      ) : (
                        <TableCell>Status</TableCell>
                      )}
                      <TableCell>Remarks</TableCell>
                      {viewMode === 'view' && (
                        <TableCell>Actions</TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.map((student) => {
                      const attendance = getStudentAttendance(student._id);
                      return (
                        <TableRow key={student._id}>
                          {bulkMode && viewMode === 'mark' && (
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={selectedStudents.includes(student._id)}
                                onChange={() => handleStudentSelection(student._id)}
                              />
                            </TableCell>
                          )}
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 32, height: 32 }}>
                                {student.name.charAt(0)}
                              </Avatar>
                              {student.name}
                            </Box>
                          </TableCell>
                          <TableCell>{student.rollNumber}</TableCell>
                          <TableCell>{student.parentPhone}</TableCell>
                          {viewMode === 'mark' ? (
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                {['present', 'absent', 'late', 'half-day'].map((status) => (
                                  <Chip
                                    key={status}
                                    label={status}
                                    color={getStatusColor(status) as any}
                                    variant={attendance?.status === status ? 'filled' : 'outlined'}
                                    onClick={() => handleIndividualAttendance(student._id, status as any)}
                                    sx={{ cursor: 'pointer' }}
                                  />
                                ))}
                              </Box>
                            </TableCell>
                          ) : (
                            <TableCell>
                              {attendance ? (
                                <Chip
                                  icon={getStatusIcon(attendance.status)}
                                  label={attendance.status}
                                  color={getStatusColor(attendance.status) as any}
                                  size="small"
                                />
                              ) : (
                                <Chip label="Not Marked" color="default" size="small" />
                              )}
                            </TableCell>
                          )}
                          <TableCell>
                            {attendance?.remarks || '-'}
                          </TableCell>
                          {viewMode === 'view' && (
                            <TableCell>
                              {attendance && (
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setEditingAttendance(attendance);
                                    setEditStatus(attendance.status);
                                    setEditRemarks(attendance.remarks || '');
                                    setEditDialogOpen(true);
                                  }}
                                >
                                  <Edit />
                                </IconButton>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* Edit Attendance Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Attendance</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  label="Status"
                >
                  <MenuItem value="present">Present</MenuItem>
                  <MenuItem value="absent">Absent</MenuItem>
                  <MenuItem value="late">Late</MenuItem>
                  <MenuItem value="half-day">Half Day</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarks"
                value={editRemarks}
                onChange={(e) => setEditRemarks(e.target.value)}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleEditAttendance}
            variant="contained"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
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