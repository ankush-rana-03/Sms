import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CircularProgress, 
  Alert,
  Button,
  Avatar,
  Chip,
  Divider
} from '@mui/material';
import { 
  Assignment, 
  School, 
  CheckCircle, 
  RadioButtonUnchecked,
  Pending,
  CalendarToday,
  TrendingUp,
  AccessTime,
  Person
} from '@mui/icons-material';
import { parentHomeworkService, ParentHomework, HomeworkStatistics } from '../services/parentHomeworkService';
import { parentAttendanceService, StudentAttendance, AttendanceSummary } from '../services/parentAttendanceService';
import { useParentAuth } from '../contexts/ParentAuthContext';
import { useNavigate } from 'react-router-dom';

const ParentDashboardPage: React.FC = () => {
  const { parent, isLoggedIn } = useParentAuth();
  const navigate = useNavigate();
  const [homework, setHomework] = useState<ParentHomework[]>([]);
  const [statistics, setStatistics] = useState<HomeworkStatistics | null>(null);
  const [attendance, setAttendance] = useState<StudentAttendance[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/parent-login');
      return;
    }

    if (parent && parent.children && parent.children.length > 0) {
      fetchData();
    } else if (parent && (!parent.children || parent.children.length === 0)) {
      setError('No children found in your account. Please contact the administrator.');
      setLoading(false);
    }
  }, [isLoggedIn, parent, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch homework data
      try {
        const homeworkResponse = await parentHomeworkService.getParentHomework();
        setHomework(homeworkResponse.data);
      } catch (err: any) {
        console.error('Homework fetch error:', err);
      }

      // Fetch homework statistics
      try {
        const statsResponse = await parentHomeworkService.getHomeworkStatistics();
        setStatistics(statsResponse.data);
      } catch (err: any) {
        console.error('Statistics fetch error:', err);
      }

      // Fetch attendance data for first child
      if (parent?.children && parent.children.length > 0) {
        try {
          const attendanceResponse = await parentAttendanceService.getStudentAttendance(parent.children[0]._id);
          setAttendance(attendanceResponse.data);
        } catch (err: any) {
          console.error('Attendance fetch error:', err);
        }

        try {
          const summaryResponse = await parentAttendanceService.getAttendanceSummary(parent.children[0]._id);
          setAttendanceSummary(summaryResponse.data);
        } catch (err: any) {
          console.error('Attendance summary fetch error:', err);
        }
      }
    } catch (err: any) {
      console.error('General fetch error:', err);
      setError('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fully_complete':
        return <CheckCircle color="success" />;
      case 'half_complete':
        return <Pending color="warning" />;
      default:
        return <RadioButtonUnchecked color="disabled" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fully_complete':
        return 'success';
      case 'half_complete':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'fully_complete':
        return 'Complete';
      case 'half_complete':
        return 'In Progress';
      default:
        return 'Not Started';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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
            Welcome back, {parent?.name || 'Parent'}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's what's happening with your children's education
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={() => navigate('/parent-login')}
          startIcon={<Person />}
        >
          Logout
        </Button>
      </Box>

      {/* Statistics Cards */}
      {statistics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    <Assignment />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{statistics.totalHomework}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Homework
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {statistics.children.map((child) => (
            <Grid item xs={12} md={3} key={child.childId}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
                      <School />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{child.childName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Class {child.grade}-{child.section}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Completion: {child.completionRate}%
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={`${child.fullyComplete} Complete`} color="success" size="small" />
                    <Chip label={`${child.halfComplete} In Progress`} color="warning" size="small" />
                    <Chip label={`${child.notStarted} Not Started`} color="default" size="small" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Attendance Summary */}
      {attendanceSummary && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Attendance Summary
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
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
              </Grid>
              
              <Grid item xs={12} md={3}>
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
              </Grid>
              
              <Grid item xs={12} md={3}>
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
              </Grid>
              
              <Grid item xs={12} md={3}>
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
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => navigate('/parent/attendance')}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: 'primary.main' }}>
                <CalendarToday />
              </Avatar>
              <Typography variant="h6" gutterBottom>
                View Attendance
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Check your child's attendance records
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => navigate('/parent/homework')}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: 'secondary.main' }}>
                <Assignment />
              </Avatar>
              <Typography variant="h6" gutterBottom>
                View Homework
              </Typography>
              <Typography variant="body2" color="text.secondary">
                See all homework assignments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => navigate('/parent/results')}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: 'success.main' }}>
                <TrendingUp />
              </Avatar>
              <Typography variant="h6" gutterBottom>
                View Results
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Check test results and grades
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Homework */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Homework Assignments
          </Typography>
          {homework.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No homework assignments found.
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {homework.slice(0, 6).map((hw) => (
                <Grid item xs={12} md={6} key={hw._id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          <Assignment />
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6">{hw.title}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {hw.subject} - Class {hw.class.name} {hw.class.section}
                          </Typography>
                        </Box>
                      </Box>

                      <Typography variant="body2" sx={{ mb: 2 }}>
                        Due: {formatDate(hw.dueDate)}
                      </Typography>

                      {hw.instructions && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {hw.instructions}
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        {hw.childrenCompletion.map((childComp) => (
                          <Chip
                            key={childComp.studentId}
                            icon={getStatusIcon(childComp.completionStatus)}
                            label={`${childComp.studentName}: ${getStatusText(childComp.completionStatus)}`}
                            color={getStatusColor(childComp.completionStatus) as any}
                            size="small"
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ParentDashboardPage;