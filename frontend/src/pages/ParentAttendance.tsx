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
  Avatar
} from '@mui/material';
import { 
  CheckCircle, 
  RadioButtonUnchecked,
  AccessTime,
  TrendingUp
} from '@mui/icons-material';
import { parentAttendanceService, StudentAttendance, AttendanceSummary } from '../services/parentAttendanceService';
import { useParentAuth } from '../contexts/ParentAuthContext';

const ParentAttendance: React.FC = () => {
  const { parent, isLoggedIn } = useParentAuth();
  const [attendance, setAttendance] = useState<StudentAttendance[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<string>('');

  useEffect(() => {
    if (!isLoggedIn) {
      window.location.href = '/parent-login';
      return;
    }

    if (parent && parent.children && parent.children.length > 0) {
      setSelectedChild(parent.children[0]._id);
      fetchAttendanceData();
    } else if (parent && (!parent.children || parent.children.length === 0)) {
      setError('No children found in your account. Please contact the administrator.');
    }
  }, [isLoggedIn, parent]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      
      if (selectedChild) {
        const [attendanceResponse, summaryResponse] = await Promise.all([
          parentAttendanceService.getStudentAttendance(selectedChild),
          parentAttendanceService.getAttendanceSummary(selectedChild)
        ]);
        
        setAttendance(attendanceResponse.data);
        setAttendanceSummary(summaryResponse.data);
      } else {
        // Fetch current month attendance for all children
        const attendanceResponse = await parentAttendanceService.getCurrentMonthAttendance();
        if (attendanceResponse.data && attendanceResponse.data.children && attendanceResponse.data.children.length > 0) {
          const firstChild = attendanceResponse.data.children[0];
          setAttendance(firstChild.attendance || []);
          setAttendanceSummary(firstChild.summary || null);
        } else {
          setAttendance([]);
          setAttendanceSummary(null);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Student Attendance
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View your child's attendance records
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
            Recent Attendance Records
          </Typography>
          {attendance.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No attendance records found for the selected period.
            </Typography>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Remarks</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Marked By</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((record) => (
                    <tr key={record._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px' }}>
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <Chip
                          label={record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          color={
                            record.status === 'present' ? 'success' :
                            record.status === 'absent' ? 'error' : 'warning'
                          }
                          size="small"
                        />
                      </td>
                      <td style={{ padding: '12px' }}>
                        {record.remarks || '-'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {record.markedBy?.name || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ParentAttendance;