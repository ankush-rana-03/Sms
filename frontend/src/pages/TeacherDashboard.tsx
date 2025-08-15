import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Chip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  School,
  Class,
  Subject,
  People,
  Assignment,
  Assessment,
  TrendingUp,
  Notifications,
  CalendarToday,
  LocationOn,
  Book,
  Grade,
  Subject as SubjectIcon,
  Dashboard as DashboardIcon,
  Refresh
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

interface TeacherAssignment {
  class: string;
  section: string;
  subjects: string[];
}

interface TeacherAssignmentsResponse {
  success: boolean;
  message: string;
  data: {
    teacher: {
      name: string;
      email: string;
    };
    assignments: TeacherAssignment[];
    totalClasses: number;
    totalSubjects: number;
  };
}

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAssignments();
    }
  }, [user]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.get<TeacherAssignmentsResponse>('/teachers/my-assignments');
      
      if (response.success) {
        setAssignments(response.data.assignments);
      } else {
        setError(response.message || 'Failed to fetch assignments');
      }
    } catch (error: any) {
      console.error('Error fetching assignments:', error);
      setError(error.response?.data?.message || 'Error fetching assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAssignments();
    setRefreshing(false);
  };

  const getRoleBasedStats = () => {
    return [
      { 
        title: 'Total Classes', 
        value: assignments.length.toString(), 
        icon: <Class />, 
        color: 'primary',
        description: 'Classes you teach'
      },
      { 
        title: 'Total Subjects', 
        value: assignments.reduce((total, assignment) => total + assignment.subjects.length, 0).toString(), 
        icon: <Subject />, 
        color: 'secondary',
        description: 'Subjects you teach'
      },
      { 
        title: 'Total Students', 
        value: '0', // This would need to be calculated from actual student data
        icon: <People />, 
        color: 'success',
        description: 'Students in your classes'
      },
      { 
        title: 'Today\'s Classes', 
        value: '0', // This would need to be calculated from schedule
        icon: <CalendarToday />, 
        color: 'info',
        description: 'Classes scheduled today'
      },
    ];
  };

  const getQuickActions = () => {
    return [
      { text: 'Mark Attendance', action: '/attendance', icon: <Assignment /> },
      { text: 'Assign Homework', action: '/homework', icon: <Assessment /> },
      { text: 'Create Test', action: '/tests', icon: <Book /> },
      { text: 'View Results', action: '/results', icon: <TrendingUp /> },
    ];
  };

  const getRecentActivities = () => {
    return [
      { text: 'Attendance marked for Class 10A', time: '2 hours ago', type: 'attendance' },
      { text: 'New homework assigned in Mathematics', time: '4 hours ago', type: 'homework' },
      { text: 'Test results published for Science', time: '1 day ago', type: 'test' },
      { text: 'Class 9B schedule updated', time: '2 days ago', type: 'schedule' },
    ];
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchAssignments}>
          Retry
        </Button>
      </Box>
    );
  }

  const stats = getRoleBasedStats();
  const activities = getRecentActivities();
  const quickActions = getQuickActions();

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
            Welcome back, {user?.name}! 👨‍🏫
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's your teaching dashboard with all your class assignments and activities.
          </Typography>
        </Box>
        <Tooltip title="Refresh assignments">
          <IconButton 
            onClick={handleRefresh} 
            disabled={refreshing}
            sx={{ 
              bgcolor: 'primary.main', 
              color: 'white',
              '&:hover': { bgcolor: 'primary.dark' },
              '&:disabled': { bgcolor: 'grey.400' }
            }}
          >
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              elevation={2}
              sx={{ 
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  elevation: 4,
                  transform: 'translateY(-4px)'
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: `${stat.color}.main`, 
                      mr: 2,
                      width: 56,
                      height: 56
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {stat.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* My Assignments - Main Content */}
        <Grid item xs={12} lg={8}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <DashboardIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                My Class Assignments
              </Typography>
            </Box>
            
            {assignments.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <School sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No assignments yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your admin will assign classes and subjects to you soon.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {assignments.map((assignment, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Card 
                      elevation={1}
                      sx={{ 
                        height: '100%',
                        transition: 'all 0.3s ease',
                        '&:hover': { 
                          elevation: 3,
                          transform: 'translateY(-2px)',
                          borderColor: 'primary.main'
                        },
                        border: `1px solid ${theme.palette.divider}`
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: 'primary.main', 
                              mr: 2,
                              width: 48,
                              height: 48
                            }}
                          >
                            <Grade />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              Class {assignment.class}-{assignment.section}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {assignment.subjects.length} subject{assignment.subjects.length !== 1 ? 's' : ''}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Teaching Subjects:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {assignment.subjects.map((subject, subjectIndex) => (
                              <Chip
                                key={subjectIndex}
                                label={subject}
                                size="small"
                                icon={<SubjectIcon />}
                                color="primary"
                                variant="outlined"
                                sx={{ 
                                  fontWeight: 500,
                                  '&:hover': { 
                                    bgcolor: 'primary.main',
                                    color: 'white'
                                  }
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button 
                            variant="outlined" 
                            size="small" 
                            startIcon={<People />}
                            sx={{ flex: 1 }}
                          >
                            View Students
                          </Button>
                          <Button 
                            variant="outlined" 
                            size="small" 
                            startIcon={<Assignment />}
                            sx={{ flex: 1 }}
                          >
                            Mark Attendance
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>

        {/* Right Sidebar */}
        <Grid item xs={12} lg={4}>
          {/* Quick Actions */}
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              mb: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
              Quick Actions
            </Typography>
            <List>
              {quickActions.map((action, index) => (
                <ListItem 
                  key={index} 
                  button 
                  sx={{ 
                    borderRadius: 1,
                    mb: 1,
                    '&:hover': { 
                      bgcolor: 'action.hover',
                      transform: 'translateX(4px)',
                      transition: 'all 0.2s ease'
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: 'primary.main' }}>
                    {action.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={action.text} 
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>

          {/* Recent Activities */}
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
              Recent Activities
            </Typography>
            <List>
              {activities.map((activity, index) => (
                <ListItem key={index} divider sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Notifications color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={activity.text}
                    secondary={activity.time}
                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                  <Chip
                    label={activity.type}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>

          {/* Today's Schedule */}
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              mt: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
              Today's Schedule
            </Typography>
            <List>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <CalendarToday color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Morning Assembly"
                  secondary="8:00 AM - 8:15 AM"
                  primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                  secondaryTypographyProps={{ fontSize: '0.75rem' }}
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <School color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Regular Classes"
                  secondary="8:15 AM - 3:30 PM"
                  primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                  secondaryTypographyProps={{ fontSize: '0.75rem' }}
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <LocationOn color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Staff Meeting"
                  secondary="4:00 PM - 5:00 PM"
                  primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                  secondaryTypographyProps={{ fontSize: '0.75rem' }}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TeacherDashboard;