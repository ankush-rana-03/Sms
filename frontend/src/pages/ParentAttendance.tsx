import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CircularProgress, 
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { 
  CheckCircle, 
  RadioButtonUnchecked,
  AccessTime,
  TrendingUp,
  School
} from '@mui/icons-material';
import { parentAttendanceService, StudentAttendance, AttendanceSummary } from '../services/parentAttendanceService';
import { useParentAuth } from '../contexts/ParentAuthContext';
import { useNavigate } from 'react-router-dom';

const ParentAttendancePage: React.FC = () => {
  const { parent, isLoggedIn } = useParentAuth();
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState<StudentAttendance[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<string>('');

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/parent-login');
      return;
    }

    if (parent && parent.children && parent.children.length > 0) {
      setSelectedChild(parent.children[0]._id);
      fetchAttendanceData(parent.children[0]._id);
    } else if (parent && (!parent.children || parent.children.length === 0)) {
      setError('No children found in your account. Please contact the administrator.');
      setLoading(false);
    }
  }, [isLoggedIn, parent, navigate]);

  const fetchAttendanceData = async (childId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const [attendanceResponse, summaryResponse] = await Promise.all([
        parentAttendanceService.getStudentAttendance(childId),
        parentAttendanceService.getAttendanceSummary(childId)
      ]);
      
      setAttendance(attendanceResponse.data);
      setAttendanceSummary(summaryResponse.data);
    } catch (err: any) {
      console.error('Attendance fetch error:', err);
      setError(err.response?.data?.message || 'Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleChildChange = async (childId: string) => {
    setSelectedChild(childId);
    await fetchAttendanceData(childId);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle />;
      case 'absent':
        return <RadioButtonUnchecked />;
      case 'late':
        return <AccessTime />;
      default:
        return <RadioButtonUnchecked />;
    }
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

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Student Attendance
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your child's attendance records
          </Typography>
        </Box>
      </Box>

      {/* Student Selection */}
      {parent && parent.children.length > 1 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <FormControl fullWidth>
              <InputLabel>Select Student</InputLabel>
              <Select
                value={selectedChild}
                onChange={(e) => handleChildChange(e.target.value)}
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
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
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
          
          <Grid item xs={12} md={3}>
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
          
          <Grid item xs={12} md={3}>
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
          
          <Grid item xs={12} md={3}>
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
          <Typography variant="h6" gutterBottom>
            Attendance Records
          </Typography>
          {attendance.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: 'grey.100' }}>
                <School />
              </Avatar>
              <Typography variant="body1" color="text.secondary">
                No attendance records found for the selected period.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Remarks</TableCell>
                    <TableCell>Marked By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attendance.map((record) => (
                    <TableRow key={record._id} hover>
                      <TableCell>
                        {new Date(record.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(record.status)}
                          label={record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          color={getStatusColor(record.status) as any}
                          size="small"
                        />
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

export default ParentAttendancePage;