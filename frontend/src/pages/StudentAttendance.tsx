import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
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
  Avatar,
  Paper,
  Divider,
  Tooltip,
  Badge,
  Tabs,
  Tab,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Schedule,
  People,
  Person,
  Save,
  Edit,
  CalendarToday,
  School,
  Download,
  FilterList,
  Refresh,
  TrendingUp,
  Assignment,
  AccessTime,
  CheckCircleOutline,
  CancelOutlined,
  ScheduleOutlined,
  Warning,
  Info,
  Visibility,
  Print,
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
  profilePicture?: string;
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

interface ClassData {
  _id: string;
  name: string;
  section: string;
  session: string;
  isActive: boolean;
}

const StudentAttendance: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableClasses, setAvailableClasses] = useState<ClassData[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceData, setAttendanceData] = useState<{ [key: string]: 'present' | 'absent' | 'late' | 'half-day' }>({});
  const [remarks, setRemarks] = useState<{ [key: string]: string }>({});
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editForm, setEditForm] = useState({
    status: 'present' as 'present' | 'absent' | 'late' | 'half-day',
    remarks: '',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });
  const [activeTab, setActiveTab] = useState(0);
  const [attendanceStats, setAttendanceStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    halfDay: 0,
    percentage: 0,
  });

  // Fetch available classes on component mount
  useEffect(() => {
    fetchAvailableClasses();
  }, []);

  // Fetch students when class and section change
  useEffect(() => {
    if (selectedClass && selectedSection) {
      fetchStudents();
    }
  }, [selectedClass, selectedSection]);

  // Fetch attendance when date, class, or section change
  useEffect(() => {
    if (selectedClass && selectedSection && selectedDate) {
      fetchAttendanceByDate();
    }
  }, [selectedClass, selectedSection, selectedDate]);

  // Calculate attendance statistics when data changes
  useEffect(() => {
    calculateAttendanceStats();
  }, [attendanceData, students]);

  const fetchAvailableClasses = async () => {
    try {
      setLoadingClasses(true);
      console.log('Fetching available classes...');
      const response = await classService.getClasses();
      console.log('Classes response:', response);
      if (response.success) {
        // Filter only active classes
        const activeClasses = response.data.filter((cls: ClassData) => cls.isActive);
        console.log('Active classes:', activeClasses);
        setAvailableClasses(activeClasses);
      } else {
        console.error('Classes response not successful:', response);
        showSnackbar('Failed to fetch classes: Unknown error', 'error');
      }
    } catch (error: any) {
      console.error('Error fetching classes:', error);
      showSnackbar('Failed to fetch classes: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      console.log('Fetching students for:', selectedClass, selectedSection);
      const response = await apiService.get(`/students?grade=${selectedClass}&section=${selectedSection}&deletedAt=null`);
      console.log('Students response:', response);
      if (response && (response as any).data) {
        const studentData = (response as any).data;
        console.log('Student data:', studentData);
        setStudents(studentData);
        
        // Initialize attendance data for new students
        const newAttendanceData: { [key: string]: 'present' | 'absent' | 'late' | 'half-day' } = {};
        const newRemarks: { [key: string]: string } = {};
        
        studentData.forEach((student: Student) => {
          if (!attendanceData[student._id]) {
            newAttendanceData[student._id] = 'present';
            newRemarks[student._id] = '';
          }
        });
        
        setAttendanceData(prev => ({ ...prev, ...newAttendanceData }));
        setRemarks(prev => ({ ...prev, ...newRemarks }));
      } else {
        console.error('No student data in response:', response);
        showSnackbar('No student data received', 'error');
      }
    } catch (error: any) {
      console.error('Error fetching students:', error);
      showSnackbar('Failed to fetch students: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchAttendanceByDate = async () => {
    try {
      setLoadingAttendance(true);
      // Find the class ID for the selected class and section
      const selectedClassData = availableClasses.find(
        cls => cls.name === selectedClass && cls.section === selectedSection
      );
      
      if (!selectedClassData) {
        showSnackbar('Selected class not found', 'error');
        return;
      }

      const response = await attendanceService.getAttendanceByDate(selectedDate, selectedClassData._id);
      if (response && response.data) {
        setAttendanceRecords(response.data);
        
        // Update attendance data with existing records
        const existingData: { [key: string]: 'present' | 'absent' | 'late' | 'half-day' } = {};
        const existingRemarks: { [key: string]: string } = {};
        
        response.data.forEach((record: AttendanceRecord) => {
          existingData[record.student._id] = record.status;
          if (record.remarks) {
            existingRemarks[record.student._id] = record.remarks;
          }
        });
        
        setAttendanceData(prev => ({ ...prev, ...existingData }));
        setRemarks(prev => ({ ...prev, ...existingRemarks }));
      }
    } catch (error: any) {
      console.error('Error fetching attendance:', error);
      showSnackbar('Failed to fetch attendance records', 'error');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const calculateAttendanceStats = () => {
    const total = students.length;
    if (total === 0) {
      setAttendanceStats({ total: 0, present: 0, absent: 0, late: 0, halfDay: 0, percentage: 0 });
      return;
    }

    const present = Object.values(attendanceData).filter(status => status === 'present').length;
    const absent = Object.values(attendanceData).filter(status => status === 'absent').length;
    const late = Object.values(attendanceData).filter(status => status === 'late').length;
    const halfDay = Object.values(attendanceData).filter(status => status === 'half-day').length;
    const percentage = Math.round((present / total) * 100);

    setAttendanceStats({ total, present, absent, late, halfDay, percentage });
  };

  const handleAttendanceChange = (studentId: string, status: 'present' | 'absent' | 'late' | 'half-day') => {
    setAttendanceData(prev => ({ ...prev, [studentId]: status }));
  };

  const handleRemarksChange = (studentId: string, remark: string) => {
    setRemarks(prev => ({ ...prev, [studentId]: remark }));
  };

  const handleSubmitAttendance = async () => {
    if (students.length === 0) {
      showSnackbar('No students to mark attendance for', 'error');
      return;
    }

    try {
      setSavingAttendance(true);
      
      // Find the class ID for the selected class and section
      const selectedClassData = availableClasses.find(
        cls => cls.name === selectedClass && cls.section === selectedSection
      );
      
      if (!selectedClassData) {
        showSnackbar('Selected class not found', 'error');
        return;
      }

      const attendancePayload = students.map(student => ({
        studentId: student._id,
        date: selectedDate,
        status: attendanceData[student._id] || 'present',
        remarks: remarks[student._id] || '',
      }));

      const response = await attendanceService.markBulkAttendance(attendancePayload);
      if (response && response.success) {
        showSnackbar('Attendance marked successfully!', 'success');
        fetchAttendanceByDate(); // Refresh attendance data
      }
    } catch (error: any) {
      console.error('Error marking attendance:', error);
      showSnackbar(error.message || 'Failed to mark attendance', 'error');
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleEditAttendance = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setEditForm({
      status: record.status,
      remarks: record.remarks || '',
    });
    setEditDialogOpen(true);
  };

  const handleUpdateAttendance = async () => {
    if (!editingRecord) return;

    try {
      const response = await attendanceService.updateAttendance(editingRecord._id, {
        status: editForm.status,
        remarks: editForm.remarks,
      });

      if (response && response.success) {
        showSnackbar('Attendance updated successfully!', 'success');
        setEditDialogOpen(false);
        setEditingRecord(null);
        fetchAttendanceByDate();
      }
    } catch (error: any) {
      console.error('Error updating attendance:', error);
      showSnackbar(error.message || 'Failed to update attendance', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
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
      case 'half-day': return <AccessTime />;
      default: return <Info />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present': return 'Present';
      case 'absent': return 'Absent';
      case 'late': return 'Late';
      case 'half-day': return 'Half Day';
      default: return 'Unknown';
    }
  };

  const handleClassChange = (event: any) => {
    setSelectedClass(event.target.value);
    setSelectedSection(''); // Reset section when class changes
  };

  const handleSectionChange = (event: any) => {
    setSelectedSection(event.target.value);
  };

  const handleDateChange = (event: any) => {
    setSelectedDate(event.target.value);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleRefresh = () => {
    if (selectedClass && selectedSection) {
      fetchStudents();
    }
    if (selectedClass && selectedSection && selectedDate) {
      fetchAttendanceByDate();
    }
  };

  const handleExportAttendance = () => {
    // TODO: Implement export functionality
    showSnackbar('Export functionality coming soon!', 'info');
  };

  const handlePrintAttendance = () => {
    // TODO: Implement print functionality
    showSnackbar('Print functionality coming soon!', 'info');
  };

  // Get unique class names and sections from available classes
  const classNames = Array.from(new Set(availableClasses.map(cls => cls.name))).sort();
  const sectionsForClass = selectedClass 
    ? Array.from(new Set(availableClasses.filter(cls => cls.name === selectedClass).map(cls => cls.section))).sort()
    : [];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Student Attendance
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Mark and manage student attendance for your classes
        </Typography>
      </Box>

      {/* Class and Date Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Class</InputLabel>
                <Select
                  value={selectedClass}
                  onChange={handleClassChange}
                  label="Class"
                  disabled={loadingClasses}
                >
                  {classNames.map((className) => (
                    <MenuItem key={className} value={className}>
                      {className === 'nursery' ? 'Nursery' : 
                       className === 'lkg' ? 'LKG' : 
                       className === 'ukg' ? 'UKG' : 
                       `Class ${className}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth disabled={!selectedClass}>
                <InputLabel>Section</InputLabel>
                <Select
                  value={selectedSection}
                  onChange={handleSectionChange}
                  label="Section"
                >
                  {sectionsForClass.map((section) => (
                    <MenuItem key={section} value={section}>
                      {section}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                value={selectedDate}
                onChange={handleDateChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleRefresh}
                disabled={!selectedClass || !selectedSection}
                fullWidth
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
          
          {/* Debug Section */}
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Debug Info: {availableClasses.length} classes loaded, {students.length} students loaded
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                console.log('Available classes:', availableClasses);
                console.log('Selected class/section:', selectedClass, selectedSection);
                console.log('Students:', students);
                console.log('Attendance data:', attendanceData);
              }}
              sx={{ mr: 1 }}
            >
              Log Debug Info
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={async () => {
                try {
                  console.log('Testing API connection...');
                  const response = await apiService.get('/classes');
                  console.log('API test response:', response);
                  showSnackbar('API connection successful!', 'success');
                } catch (error: any) {
                  console.error('API test failed:', error);
                  showSnackbar('API connection failed: ' + error.message, 'error');
                }
              }}
            >
              Test API
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Attendance Statistics */}
      {selectedClass && selectedSection && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Attendance Statistics
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    {attendanceStats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Students
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="success.main">
                    {attendanceStats.present}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Present
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="error.main">
                    {attendanceStats.absent}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Absent
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="warning.main">
                    {attendanceStats.percentage}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Attendance Rate
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            <Box sx={{ mt: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={attendanceStats.percentage} 
                color="success"
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      {selectedClass && selectedSection && (
        <Box sx={{ width: '100%' }}>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
            <Tab label="Mark Attendance" />
            <Tab label="View Records" />
            <Tab label="Reports" />
          </Tabs>

          {/* Tab 1: Mark Attendance */}
          {activeTab === 0 && (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Mark Attendance - {selectedClass} {selectedSection}
                  </Typography>
                  <Box>
                    <Button
                      variant="outlined"
                      startIcon={<Print />}
                      onClick={handlePrintAttendance}
                      sx={{ mr: 1 }}
                    >
                      Print
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={handleExportAttendance}
                      sx={{ mr: 1 }}
                    >
                      Export
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Save />}
                      onClick={handleSubmitAttendance}
                      disabled={savingAttendance || students.length === 0}
                    >
                      {savingAttendance ? 'Saving...' : 'Save Attendance'}
                    </Button>
                  </Box>
                </Box>

                {loadingStudents ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : students.length === 0 ? (
                  <Alert severity="info">
                    No students found in {selectedClass} {selectedSection}
                  </Alert>
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Student</TableCell>
                          <TableCell>Roll Number</TableCell>
                          <TableCell align="center">Status</TableCell>
                          <TableCell>Remarks</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {students.map((student) => (
                          <TableRow key={student._id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar
                                  src={student.profilePicture}
                                  sx={{ mr: 2, width: 32, height: 32 }}
                                >
                                  {student.name.charAt(0)}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight="medium">
                                    {student.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {student.parentPhone}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>{student.rollNumber}</TableCell>
                            <TableCell align="center">
                              <FormControl size="small">
                                <Select
                                  value={attendanceData[student._id] || 'present'}
                                  onChange={(e) => handleAttendanceChange(student._id, e.target.value as any)}
                                  sx={{ minWidth: 100 }}
                                >
                                  <MenuItem value="present">
                                    <Chip 
                                      icon={<CheckCircle />} 
                                      label="Present" 
                                      color="success" 
                                      size="small"
                                    />
                                  </MenuItem>
                                  <MenuItem value="absent">
                                    <Chip 
                                      icon={<Cancel />} 
                                      label="Absent" 
                                      color="error" 
                                      size="small"
                                    />
                                  </MenuItem>
                                  <MenuItem value="late">
                                    <Chip 
                                      icon={<Schedule />} 
                                      label="Late" 
                                      color="warning" 
                                      size="small"
                                    />
                                  </MenuItem>
                                  <MenuItem value="half-day">
                                    <Chip 
                                      icon={<AccessTime />} 
                                      label="Half Day" 
                                      color="info" 
                                      size="small"
                                    />
                                  </MenuItem>
                                </Select>
                              </FormControl>
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                placeholder="Add remarks..."
                                value={remarks[student._id] || ''}
                                onChange={(e) => handleRemarksChange(student._id, e.target.value)}
                                fullWidth
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tab 2: View Records */}
          {activeTab === 1 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Attendance Records - {selectedDate}
                </Typography>
                
                {loadingAttendance ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : attendanceRecords.length === 0 ? (
                  <Alert severity="info">
                    No attendance records found for {selectedDate}
                  </Alert>
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Student</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Remarks</TableCell>
                          <TableCell>Marked By</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {attendanceRecords.map((record) => (
                          <TableRow key={record._id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                                  {record.student.name.charAt(0)}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight="medium">
                                    {record.student.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {record.student.rollNumber}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                icon={getStatusIcon(record.status)}
                                label={getStatusText(record.status)}
                                color={getStatusColor(record.status) as any}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {record.remarks || '-'}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {record.markedBy.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(record.date).toLocaleDateString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Tooltip title="Edit Attendance">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditAttendance(record)}
                                  color="primary"
                                >
                                  <Edit />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tab 3: Reports */}
          {activeTab === 2 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Attendance Reports
                </Typography>
                <Alert severity="info">
                  Detailed attendance reports and analytics will be available here.
                </Alert>
                {/* TODO: Implement detailed reports */}
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* No Class Selected Message */}
      {(!selectedClass || !selectedSection) && (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Select a Class and Section
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose a class and section from the dropdown above to start marking attendance
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Edit Attendance Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Attendance</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={editForm.status}
                onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as any }))}
                label="Status"
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
              value={editForm.remarks}
              onChange={(e) => setEditForm(prev => ({ ...prev, remarks: e.target.value }))}
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateAttendance} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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