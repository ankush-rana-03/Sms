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
  ListItemAvatar
} from '@mui/material';
import {
  Login,
  Logout,
  Schedule,
  People,
  Person,
  Save,
  Edit,
  Visibility,
  CheckCircle,
  Cancel,
  Warning,
  AccessTime,
  CalendarToday,
  TrendingUp,
  Dashboard
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import staffAttendanceService, { StaffAttendance, StaffAttendanceStatistics, StaffAttendanceDashboard } from '../services/staffAttendanceService';

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

const StaffAttendance: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<StaffAttendance[]>([]);
  const [statistics, setStatistics] = useState<StaffAttendanceStatistics | null>(null);
  const [dashboard, setDashboard] = useState<StaffAttendanceDashboard | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Check-in/Check-out dialog states
  const [checkInDialog, setCheckInDialog] = useState(false);
  const [checkOutDialog, setCheckOutDialog] = useState(false);
  const [location, setLocation] = useState('');

  // Admin states
  const [markAttendanceDialog, setMarkAttendanceDialog] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [staffList, setStaffList] = useState<any[]>([]);
  const [markAttendanceData, setMarkAttendanceData] = useState({
    status: 'present',
    date: new Date().toISOString().split('T')[0],
    checkInTime: '',
    checkOutTime: '',
    leaveType: '',
    leaveReason: '',
    remarks: ''
  });

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'principal') {
      fetchDashboard();
      fetchAttendanceByDate();
    } else {
      fetchMyAttendance();
    }
  }, [user, selectedDate]);

  const fetchMyAttendance = async () => {
    try {
      setLoading(true);
      const response = await staffAttendanceService.getMyAttendance({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      });
      setAttendanceData(response.data);
      setStatistics(response.statistics);
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await staffAttendanceService.getDashboard(selectedDate);
      setDashboard(response.data);
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceByDate = async () => {
    try {
      const response = await staffAttendanceService.getAttendanceByDate(selectedDate);
      setAttendanceData(response.data);
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    }
  };

  const handleCheckIn = async () => {
    try {
      setCheckingIn(true);
      await staffAttendanceService.checkIn(location || undefined);
      setSnackbar({ open: true, message: 'Check-in successful!', severity: 'success' });
      setCheckInDialog(false);
      setLocation('');
      fetchMyAttendance();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setCheckingOut(true);
      await staffAttendanceService.checkOut(location || undefined);
      setSnackbar({ open: true, message: 'Check-out successful!', severity: 'success' });
      setCheckOutDialog(false);
      setLocation('');
      fetchMyAttendance();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    } finally {
      setCheckingOut(false);
    }
  };

  const handleMarkAttendance = async () => {
    try {
      setLoading(true);
      await staffAttendanceService.markAttendance({
        staffId: selectedStaff,
        ...markAttendanceData
      });
      setSnackbar({ open: true, message: 'Attendance marked successfully!', severity: 'success' });
      setMarkAttendanceDialog(false);
      fetchAttendanceByDate();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'success';
      case 'absent': return 'error';
      case 'late': return 'warning';
      case 'leave': return 'info';
      case 'half-day': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle />;
      case 'absent': return <Cancel />;
      case 'late': return <Warning />;
      case 'leave': return <Schedule />;
      case 'half-day': return <AccessTime />;
      default: return <Person />;
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
        <Dashboard />
        Staff Attendance
      </Typography>

      {/* Check-in/Check-out Cards for Staff */}
      {user?.role !== 'admin' && user?.role !== 'principal' && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Login sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Check In
                </Typography>
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  onClick={() => setCheckInDialog(true)}
                  disabled={checkingIn}
                  startIcon={checkingIn ? <CircularProgress size={20} /> : <Login />}
                >
                  {checkingIn ? 'Checking In...' : 'Check In'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Logout sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Check Out
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  size="large"
                  onClick={() => setCheckOutDialog(true)}
                  disabled={checkingOut}
                  startIcon={checkingOut ? <CircularProgress size={20} /> : <Logout />}
                >
                  {checkingOut ? 'Checking Out...' : 'Check Out'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Dashboard" icon={<Dashboard />} />
          <Tab label="Attendance Records" icon={<Schedule />} />
          {user?.role === 'admin' || user?.role === 'principal' ? (
            <Tab label="Mark Attendance" icon={<Edit />} />
          ) : (
            <Tab label="My Statistics" icon={<TrendingUp />} />
          )}
        </Tabs>
      </Box>

      {/* Dashboard Tab */}
      <TabPanel value={tabValue} index={0}>
        {user?.role === 'admin' || user?.role === 'principal' ? (
          dashboard && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {dashboard.presentCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Present Today
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="error.main">
                      {dashboard.absentCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Absent Today
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      {dashboard.lateCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Late Today
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary.main">
                      {dashboard.attendancePercentage.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Attendance Rate
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Today's Attendance ({formatDate(dashboard.date)})
                    </Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Staff Member</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Check In</TableCell>
                            <TableCell>Check Out</TableCell>
                            <TableCell>Working Hours</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {dashboard.attendance.map((record) => (
                            <TableRow key={record._id}>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Avatar sx={{ width: 32, height: 32 }}>
                                    {record.staffId.name.charAt(0)}
                                  </Avatar>
                                  {record.staffId.name}
                                </Box>
                              </TableCell>
                              <TableCell>{record.staffId.role}</TableCell>
                              <TableCell>
                                <Chip
                                  icon={getStatusIcon(record.status)}
                                  label={record.status}
                                  color={getStatusColor(record.status) as any}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                {record.checkIn ? formatTime(record.checkIn.time) : '-'}
                              </TableCell>
                              <TableCell>
                                {record.checkOut ? formatTime(record.checkOut.time) : '-'}
                              </TableCell>
                              <TableCell>
                                {record.workingHours > 0 ? `${Math.round(record.workingHours / 60 * 100) / 100}h` : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )
        ) : (
          statistics && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {statistics.presentDays}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Present Days
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="error.main">
                      {statistics.absentDays}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Absent Days
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
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
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main">
                      {statistics.totalWorkingHours.toFixed(1)}h
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Hours
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )
        )}
      </TabPanel>

      {/* Attendance Records Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 2 }}>
          <TextField
            type="date"
            label="Select Date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Attendance Records
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Staff Member</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Check In</TableCell>
                    <TableCell>Check Out</TableCell>
                    <TableCell>Working Hours</TableCell>
                    <TableCell>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attendanceData.map((record) => (
                    <TableRow key={record._id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {record.staffId.name.charAt(0)}
                          </Avatar>
                          {record.staffId.name}
                        </Box>
                      </TableCell>
                      <TableCell>{formatDate(record.date)}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(record.status)}
                          label={record.status}
                          color={getStatusColor(record.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {record.checkIn ? formatTime(record.checkIn.time) : '-'}
                      </TableCell>
                      <TableCell>
                        {record.checkOut ? formatTime(record.checkOut.time) : '-'}
                      </TableCell>
                      <TableCell>
                        {record.workingHours > 0 ? `${Math.round(record.workingHours / 60 * 100) / 100}h` : '-'}
                      </TableCell>
                      <TableCell>{record.remarks || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Mark Attendance Tab (Admin/Principal) or My Statistics Tab (Staff) */}
      <TabPanel value={tabValue} index={2}>
        {user?.role === 'admin' || user?.role === 'principal' ? (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Mark Staff Attendance
              </Typography>
              <Button
                variant="contained"
                onClick={() => setMarkAttendanceDialog(true)}
                startIcon={<Edit />}
              >
                Mark Attendance
              </Button>
            </CardContent>
          </Card>
        ) : (
          statistics && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  My Attendance Statistics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body1">
                      <strong>Total Days:</strong> {statistics.totalDays}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Present Days:</strong> {statistics.presentDays}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Absent Days:</strong> {statistics.absentDays}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Late Days:</strong> {statistics.lateDays}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body1">
                      <strong>Leave Days:</strong> {statistics.leaveDays}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Attendance Rate:</strong> {statistics.attendancePercentage.toFixed(1)}%
                    </Typography>
                    <Typography variant="body1">
                      <strong>Total Working Hours:</strong> {statistics.totalWorkingHours.toFixed(1)}h
                    </Typography>
                    <Typography variant="body1">
                      <strong>Total Overtime:</strong> {statistics.totalOvertime.toFixed(1)}h
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )
        )}
      </TabPanel>

      {/* Check-in Dialog */}
      <Dialog open={checkInDialog} onClose={() => setCheckInDialog(false)}>
        <DialogTitle>Check In</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Location (Optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            margin="normal"
            placeholder="e.g., Main Office, Classroom 101"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckInDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCheckIn}
            variant="contained"
            color="success"
            disabled={checkingIn}
          >
            {checkingIn ? 'Checking In...' : 'Check In'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Check-out Dialog */}
      <Dialog open={checkOutDialog} onClose={() => setCheckOutDialog(false)}>
        <DialogTitle>Check Out</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Location (Optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            margin="normal"
            placeholder="e.g., Main Office, Classroom 101"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckOutDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCheckOut}
            variant="contained"
            color="error"
            disabled={checkingOut}
          >
            {checkingOut ? 'Checking Out...' : 'Check Out'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mark Attendance Dialog */}
      <Dialog open={markAttendanceDialog} onClose={() => setMarkAttendanceDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Mark Staff Attendance</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Staff Member</InputLabel>
                <Select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  label="Staff Member"
                >
                  {staffList.map((staff) => (
                    <MenuItem key={staff._id} value={staff._id}>
                      {staff.name} ({staff.role})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={markAttendanceData.status}
                  onChange={(e) => setMarkAttendanceData(prev => ({ ...prev, status: e.target.value }))}
                  label="Status"
                >
                  <MenuItem value="present">Present</MenuItem>
                  <MenuItem value="absent">Absent</MenuItem>
                  <MenuItem value="late">Late</MenuItem>
                  <MenuItem value="half-day">Half Day</MenuItem>
                  <MenuItem value="leave">Leave</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                value={markAttendanceData.date}
                onChange={(e) => setMarkAttendanceData(prev => ({ ...prev, date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="time"
                label="Check In Time"
                value={markAttendanceData.checkInTime}
                onChange={(e) => setMarkAttendanceData(prev => ({ ...prev, checkInTime: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="time"
                label="Check Out Time"
                value={markAttendanceData.checkOutTime}
                onChange={(e) => setMarkAttendanceData(prev => ({ ...prev, checkOutTime: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Leave Type</InputLabel>
                <Select
                  value={markAttendanceData.leaveType}
                  onChange={(e) => setMarkAttendanceData(prev => ({ ...prev, leaveType: e.target.value }))}
                  label="Leave Type"
                >
                  <MenuItem value="casual">Casual Leave</MenuItem>
                  <MenuItem value="sick">Sick Leave</MenuItem>
                  <MenuItem value="personal">Personal Leave</MenuItem>
                  <MenuItem value="maternity">Maternity Leave</MenuItem>
                  <MenuItem value="paternity">Paternity Leave</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Leave Reason"
                value={markAttendanceData.leaveReason}
                onChange={(e) => setMarkAttendanceData(prev => ({ ...prev, leaveReason: e.target.value }))}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarks"
                value={markAttendanceData.remarks}
                onChange={(e) => setMarkAttendanceData(prev => ({ ...prev, remarks: e.target.value }))}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMarkAttendanceDialog(false)}>Cancel</Button>
          <Button
            onClick={handleMarkAttendance}
            variant="contained"
            disabled={!selectedStaff || loading}
          >
            {loading ? 'Marking...' : 'Mark Attendance'}
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

export default StaffAttendance;