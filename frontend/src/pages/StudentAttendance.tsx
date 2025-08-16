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
  Checkbox,
  FormControlLabel,
  Switch,
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
  CheckBox,
  CancelOutlined,
  ScheduleOutlined,
  AccessTime,
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

const StudentAttendance: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableClasses, setAvailableClasses] = useState<ClassWithSections[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [attendanceData, setAttendanceData] = useState<{ [key: string]: 'present' | 'absent' | 'late' | 'half-day' }>({});
  const [remarks, setRemarks] = useState<{ [key: string]: string }>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editForm, setEditForm] = useState({
    status: 'present' as 'present' | 'absent' | 'late' | 'half-day',
    remarks: '',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    fetchAvailableClasses();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSection) {
      fetchStudents();
    }
  }, [selectedClass, selectedSection]);

  useEffect(() => {
    if (selectedClass && selectedSection && selectedDate) {
      fetchAttendanceByDate();
    }
  }, [selectedClass, selectedSection, selectedDate]);

  const fetchAvailableClasses = async () => {
    try {
      setLoadingClasses(true);
      const response = await classService.getClasses();
      if (response.success) {
        setAvailableClasses(response.data);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch classes',
        severity: 'error',
      });
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const response = await apiService.get(`/students?grade=${selectedClass}&section=${selectedSection}`);
      if (response && (response as any).data) {
        setStudents((response as any).data);
        // Initialize attendance data for new students
        const newAttendanceData: { [key: string]: 'present' | 'absent' | 'late' | 'half-day' } = {};
        (response as any).data.forEach((student: Student) => {
          if (!attendanceData[student._id]) {
            newAttendanceData[student._id] = 'present';
          }
        });
        setAttendanceData(prev => ({ ...prev, ...newAttendanceData }));
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch students',
        severity: 'error',
      });
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchAttendanceByDate = async () => {
    try {
      setLoadingAttendance(true);
      const response = await attendanceService.getAttendanceByDate(selectedDate, selectedClass);
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
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch attendance records',
        severity: 'error',
      });
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleAttendanceChange = (studentId: string, status: 'present' | 'absent' | 'late' | 'half-day') => {
    setAttendanceData(prev => ({ ...prev, [studentId]: status }));
  };

  const handleRemarksChange = (studentId: string, remark: string) => {
    setRemarks(prev => ({ ...prev, [studentId]: remark }));
  };

  const handleSubmitAttendance = async () => {
    try {
      const attendancePayload = students.map(student => ({
        studentId: student._id,
        date: selectedDate,
        status: attendanceData[student._id] || 'present',
        remarks: remarks[student._id] || '',
      }));

      const response = await attendanceService.markBulkAttendance(attendancePayload);
      if (response && response.success) {
        setSnackbar({
          open: true,
          message: 'Attendance marked successfully!',
          severity: 'success',
        });
        fetchAttendanceByDate();
      }
    } catch (error: any) {
      console.error('Error marking attendance:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to mark attendance',
        severity: 'error',
      });
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
        setSnackbar({
          open: true,
          message: 'Attendance updated successfully!',
          severity: 'success',
        });
        setEditDialogOpen(false);
        setEditingRecord(null);
        fetchAttendanceByDate();
      }
    } catch (error: any) {
      console.error('Error updating attendance:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to update attendance',
        severity: 'error',
      });
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
      case 'half-day': return <AccessTime />;
      default: return <Person />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present': return 'Present';
      case 'absent': return 'Absent';
      case 'late': return 'Late';
      case 'half-day': return 'Half Day';
      default: return 'Unknown';
    }
  };

  const getSectionsForClass = (className: string) => {
    const classData = availableClasses.find(cls => cls.name === className);
    return classData ? classData.sections : [];
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Enhanced Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography 
          variant="h3" 
          gutterBottom 
          sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2
          }}
        >
          Student Attendance 📚
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ opacity: 0.8 }}>
          Mark and manage student attendance for your classes
        </Typography>
      </Box>

      {/* Enhanced Filters */}
      <Card sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Select Class</InputLabel>
              <Select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedSection('');
                }}
                disabled={loadingClasses}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: 'white'
                  }
                }}
              >
                <MenuItem value="">Select a class</MenuItem>
                {availableClasses.map(cls => (
                  <MenuItem key={cls.name} value={cls.name}>
                    {cls.displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Select Section</InputLabel>
              <Select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                disabled={!selectedClass || loadingClasses}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: 'white'
                  }
                }}
              >
                <MenuItem value="">Select a section</MenuItem>
                {selectedClass && getSectionsForClass(selectedClass).map(section => (
                  <MenuItem key={section} value={section}>
                    Section {section}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Select Date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: 'white'
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              onClick={fetchAttendanceByDate}
              disabled={!selectedClass || !selectedSection || !selectedDate}
              startIcon={<Refresh />}
              sx={{ 
                borderRadius: 2,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none'
              }}
            >
              Load Attendance
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Attendance Summary Cards */}
      {selectedClass && selectedSection && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
              }
            }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <People sx={{ fontSize: 40, mb: 2, opacity: 0.8 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {students.length}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Total Students
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
              }
            }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 40, mb: 2, opacity: 0.8 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {Object.values(attendanceData).filter(status => status === 'present').length}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Present Today
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
              color: 'text.primary',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
              }
            }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Schedule sx={{ fontSize: 40, mb: 2, opacity: 0.8 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {Object.values(attendanceData).filter(status => status === 'late').length}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Late Today
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
              color: 'text.primary',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
              }
            }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Cancel sx={{ fontSize: 40, mb: 2, opacity: 0.8 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {Object.values(attendanceData).filter(status => status === 'absent').length}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Absent Today
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Loading States */}
      {loadingStudents ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Loading students...
          </Typography>
        </Box>
      ) : loadingAttendance ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Loading attendance records...
          </Typography>
        </Box>
      ) : students.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 4, py: 8 }}>
          <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 3, bgcolor: 'primary.main' }}>
            <School sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No students found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Please select a class and section to view students
          </Typography>
        </Box>
      ) : (
        <>
          {/* Enhanced Attendance Table */}
          <Card sx={{ mb: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  Attendance for {selectedDate}
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleSubmitAttendance}
                  startIcon={<Save />}
                  disabled={students.length === 0}
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    py: 1.5,
                    fontWeight: 600,
                    textTransform: 'none'
                  }}
                >
                  Save Attendance
                </Button>
              </Box>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'primary.main' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Student</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Roll No</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Remarks</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student._id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                              <Person />
                            </Avatar>
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {student.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {student.grade === 'nursery' ? 'Nursery' : 
                                 student.grade === 'lkg' ? 'LKG' : 
                                 student.grade === 'ukg' ? 'UKG' : 
                                 `Class ${student.grade}`} - Section {student.section}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {student.rollNumber}
                          </Typography>
                        </TableCell>
                        
                        <TableCell>
                          <FormControl size="small" sx={{ minWidth: 120 }}>
                            <Select
                              value={attendanceData[student._id] || 'present'}
                              onChange={(e) => handleAttendanceChange(student._id, e.target.value as any)}
                              sx={{ borderRadius: 2 }}
                            >
                              <MenuItem value="present">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <CheckCircle color="success" fontSize="small" />
                                  Present
                                </Box>
                              </MenuItem>
                              <MenuItem value="absent">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Cancel color="error" fontSize="small" />
                                  Absent
                                </Box>
                              </MenuItem>
                              <MenuItem value="late">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Schedule color="warning" fontSize="small" />
                                  Late
                                </Box>
                              </MenuItem>
                              <MenuItem value="half-day">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <AccessTime color="info" fontSize="small" />
                                  Half Day
                                </Box>
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
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                              }
                            }}
                          />
                        </TableCell>
                        
                        <TableCell>
                          <IconButton
                            color="primary"
                            onClick={() => handleEditAttendance({
                              _id: 'temp',
                              student: {
                                _id: student._id,
                                name: student.name,
                                rollNumber: student.rollNumber,
                                parentPhone: student.parentPhone,
                              },
                              class: {
                                _id: selectedClass,
                                name: selectedClass,
                                section: selectedSection,
                              },
                              date: selectedDate,
                              status: attendanceData[student._id] || 'present',
                              markedBy: { _id: user?.id || '', name: user?.name || '' },
                              remarks: remarks[student._id] || '',
                              isVerified: false,
                            } as AttendanceRecord)}
                            sx={{ borderRadius: 2 }}
                          >
                            <Edit />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Enhanced Attendance Records Table */}
          {attendanceRecords.length > 0 && (
            <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main', mb: 3 }}>
                  Recent Attendance Records
                </Typography>
                
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'primary.main' }}>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Student</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Date</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Remarks</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attendanceRecords.slice(0, 10).map((record) => (
                        <TableRow key={record._id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                                <Person />
                              </Avatar>
                              <Box>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                  {record.student.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Roll: {record.student.rollNumber}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(record.date).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          
                          <TableCell>
                            <Chip
                              icon={getStatusIcon(record.status)}
                              label={getStatusLabel(record.status)}
                              color={getStatusColor(record.status) as any}
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {record.remarks || 'No remarks'}
                            </Typography>
                          </TableCell>
                          
                          <TableCell>
                            <IconButton
                              color="primary"
                              onClick={() => handleEditAttendance(record)}
                              sx={{ borderRadius: 2 }}
                            >
                              <Edit />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Enhanced Edit Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1, 
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          borderRadius: '12px 12px 0 0'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Edit Attendance
            </Typography>
            <IconButton
              size="small"
              onClick={() => setEditDialogOpen(false)}
              sx={{ 
                minWidth: 'auto', 
                p: 0.5,
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              ✕
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Update attendance status and remarks for {editingRecord?.student.name}
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={editForm.status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as any }))}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="present">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle color="success" fontSize="small" />
                      Present
                    </Box>
                  </MenuItem>
                  <MenuItem value="absent">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Cancel color="error" fontSize="small" />
                      Absent
                    </Box>
                  </MenuItem>
                  <MenuItem value="late">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Schedule color="warning" fontSize="small" />
                      Late
                    </Box>
                  </MenuItem>
                  <MenuItem value="half-day">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTime color="info" fontSize="small" />
                      Half Day
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarks"
                value={editForm.remarks}
                onChange={(e) => setEditForm(prev => ({ ...prev, remarks: e.target.value }))}
                multiline
                rows={3}
                size="small"
                placeholder="Add any additional remarks..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
          <Button 
            variant="outlined" 
            onClick={() => setEditDialogOpen(false)}
            sx={{ mr: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateAttendance}
            variant="contained"
            size="large"
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: 2,
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4,
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            Update Attendance
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
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