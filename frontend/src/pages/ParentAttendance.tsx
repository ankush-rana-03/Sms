import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Avatar, 
  CircularProgress, 
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton
} from '@mui/material';
import { 
  CheckCircle, 
  RadioButtonUnchecked,
  AccessTime,
  TrendingUp,
  ArrowBack,
  CalendarToday
} from '@mui/icons-material';
import { parentAttendanceService, StudentAttendance, AttendanceSummary } from '../services/parentAttendanceService';
import { useParentAuth } from '../contexts/ParentAuthContext';
import { useNavigate } from 'react-router-dom';

const ParentAttendance: React.FC = () => {
  const { parent, isLoggedIn } = useParentAuth();
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState<StudentAttendance[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<string>('');

  const fetchAttendanceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!selectedChild) return;

      const [attendanceResponse, summaryResponse] = await Promise.all([
        parentAttendanceService.getStudentAttendance(selectedChild),
        parentAttendanceService.getAttendanceSummary(selectedChild)
      ]);
      
      setAttendance(attendanceResponse.data);
      setAttendanceSummary(summaryResponse.data);
    } catch (err: any) {
      console.error('Attendance fetch error:', err);
      setError(err.response?.data?.message || 'Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  }, [selectedChild]);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/parent-login');
      return;
    }

    if (parent && parent.children && parent.children.length > 0) {
      setSelectedChild(parent.children[0]._id);
      fetchAttendanceData();
    } else if (parent && (!parent.children || parent.children.length === 0)) {
      setError('No children found in your account. Please contact the administrator.');
    }
  }, [isLoggedIn, parent, navigate, fetchAttendanceData]);

  const handleChildChange = async (childId: string) => {
    setSelectedChild(childId);
    try {
      const [attendanceResponse, summaryResponse] = await Promise.all([
        parentAttendanceService.getStudentAttendance(childId),
        parentAttendanceService.getAttendanceSummary(childId)
      ]);
      
      setAttendance(attendanceResponse.data);
      setAttendanceSummary(summaryResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch attendance data');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle color="success" />;
      case 'absent':
        return <RadioButtonUnchecked color="error" />;
      case 'late':
        return <AccessTime color="warning" />;
      default:
        return <RadioButtonUnchecked color="disabled" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'success';
      case 'absent':
        return 'error';
      case 'late':
        return 'warning';
      default:
        return 'default';
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  const selectedChildData = parent?.children?.find(child => child._id === selectedChild);

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton 
          onClick={() => navigate('/parent-dashboard')}
          sx={{ mr: 2 }}
        >
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" gutterBottom>
            Student Attendance
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View attendance records for your children
          </Typography>
        </Box>
      </Box>

      {/* Student Selection */}
      {parent && parent.children.length > 1 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <FormControl fullWidth>
              <InputLabel>Select Student</InputLabel>
              <Select
                value={selectedChild}
                onChange={(e) => handleChildChange(e.target.value)}
                label="Select Student"
              >
                {parent.children.map((child) => (
                  <MenuItem key={child._id} value={child._id}>
                    {child.name} (Class {child.grade}-{child.section})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </CardContent>
        </Card>
      )}

      {/* Attendance Summary */}
      {attendanceSummary && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'success.main' }}>
                    <CheckCircle />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{attendanceSummary.presentDays}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Present Days
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'error.main' }}>
                    <RadioButtonUnchecked />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{attendanceSummary.absentDays}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Absent Days
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'warning.main' }}>
                    <AccessTime />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{attendanceSummary.lateDays}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Late Days
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    <TrendingUp />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{attendanceSummary.attendancePercentage}%</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Attendance Rate
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Attendance Records */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CalendarToday sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">
              Attendance Records {selectedChildData && `- ${selectedChildData.name}`}
            </Typography>
          </Box>
          
          {attendance.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CalendarToday sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No attendance records found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Attendance records will appear here once they are marked by teachers.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Remarks</strong></TableCell>
                    <TableCell><strong>Marked By</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attendance.map((record) => (
                    <TableRow key={record._id} hover>
                      <TableCell>
                        {formatDate(record.date)}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getStatusIcon(record.status)}
                          <Chip
                            label={record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            color={getStatusColor(record.status) as any}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        {record.remarks || '-'}
                      </TableCell>
                      <TableCell>
                        {record.markedBy?.name || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ParentAttendance;