import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Avatar,
  Button,
  Divider,
} from '@mui/material';
import {
  People,
  School,
  Assignment,
  Assessment,
  TrendingUp,
  Notifications,
  CalendarToday,
  LocationOn,
  Add,
  Visibility,
  Edit,
  BarChart,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import TeacherDashboard from './TeacherDashboard';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // If user is a teacher, render the specialized TeacherDashboard
  if (user?.role === 'teacher') {
    return <TeacherDashboard />;
  }

  const getRoleBasedStats = () => {
    switch (user?.role) {
      case 'principal':
      case 'admin':
        return [
          { 
            title: 'Total Students', 
            value: '1,234', 
            icon: <School />, 
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            change: '+12%',
            changeType: 'positive'
          },
          { 
            title: 'Total Teachers', 
            value: '45', 
            icon: <People />, 
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            change: '+5%',
            changeType: 'positive'
          },
          { 
            title: 'Active Classes', 
            value: '32', 
            icon: <Assignment />, 
            gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            change: '+2',
            changeType: 'positive'
          },
          { 
            title: 'Attendance Rate', 
            value: '94.5%', 
            icon: <TrendingUp />, 
            gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            change: '+1.2%',
            changeType: 'positive'
          },
        ];
      case 'teacher':
        return [
          { 
            title: 'My Students', 
            value: '35', 
            icon: <School />, 
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            change: '+2',
            changeType: 'positive'
          },
          { 
            title: 'Classes Today', 
            value: '4', 
            icon: <Assignment />, 
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            change: 'On Track',
            changeType: 'neutral'
          },
          { 
            title: 'Pending Homework', 
            value: '12', 
            icon: <Assessment />, 
            gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            change: '-3',
            changeType: 'negative'
          },
          { 
            title: 'Attendance Rate', 
            value: '96.2%', 
            icon: <TrendingUp />, 
            gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            change: '+0.8%',
            changeType: 'positive'
          },
        ];
      case 'parent':
        return [
          { 
            title: 'Children', 
            value: '2', 
            icon: <School />, 
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            change: 'Active',
            changeType: 'neutral'
          },
          { 
            title: 'Attendance Rate', 
            value: '92.1%', 
            icon: <TrendingUp />, 
            gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            change: '+2.1%',
            changeType: 'positive'
          },
          { 
            title: 'Pending Homework', 
            value: '3', 
            icon: <Assessment />, 
            gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            change: '-1',
            changeType: 'negative'
          },
          { 
            title: 'Upcoming Tests', 
            value: '2', 
            icon: <BarChart />, 
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            change: 'This Week',
            changeType: 'neutral'
          },
        ];
      default:
        return [
          { 
            title: 'Attendance', 
            value: '95.2%', 
            icon: <TrendingUp />, 
            gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            change: '+1.2%',
            changeType: 'positive'
          },
          { 
            title: 'Homework Due', 
            value: '2', 
            icon: <Assignment />, 
            gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            change: 'Due Today',
            changeType: 'warning'
          },
          { 
            title: 'Tests This Week', 
            value: '1', 
            icon: <Assessment />, 
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            change: 'Tomorrow',
            changeType: 'neutral'
          },
          { 
            title: 'Average Score', 
            value: '87.5%', 
            icon: <School />, 
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            change: '+2.5%',
            changeType: 'positive'
          },
        ];
    }
  };

  const getRecentActivities = () => {
    const activities = [
      { 
        text: 'Attendance marked for Class 10A', 
        time: '2 hours ago', 
        type: 'attendance',
        icon: <CalendarToday color="primary" />,
        color: 'primary'
      },
      { 
        text: 'New homework assigned in Mathematics', 
        time: '4 hours ago', 
        type: 'homework',
        icon: <Assignment color="secondary" />,
        color: 'secondary'
      },
      { 
        text: 'Test results published for Science', 
        time: '1 day ago', 
        type: 'test',
        icon: <Assessment color="success" />,
        color: 'success'
      },
      { 
        text: 'New student enrolled in Class 9B', 
        time: '2 days ago', 
        type: 'student',
        icon: <School color="info" />,
        color: 'info'
      },
    ];

    return activities.slice(0, 4);
  };

  const getQuickActions = () => {
    switch (user?.role) {
      case 'teacher':
        return [
          { text: 'Mark Attendance', action: '/attendance', icon: <CalendarToday />, color: 'primary' },
          { text: 'Assign Homework', action: '/homework', icon: <Assignment />, color: 'secondary' },
          { text: 'Create Test', action: '/tests', icon: <Assessment />, color: 'success' },
          { text: 'View Results', action: '/results', icon: <BarChart />, color: 'info' },
        ];
      case 'principal':
      case 'admin':
        return [
          { text: 'Add Student', action: '/students', icon: <School />, color: 'primary' },
          { text: 'Add Teacher', action: '/teachers', icon: <People />, color: 'secondary' },
          { text: 'Manage Classes', action: '/classes', icon: <Assignment />, color: 'success' },
          { text: 'View Reports', action: '/results', icon: <BarChart />, color: 'info' },
        ];
      default:
        return [
          { text: 'View Attendance', action: '/attendance', icon: <Visibility />, color: 'primary' },
          { text: 'Check Homework', action: '/homework', icon: <Assignment />, color: 'secondary' },
          { text: 'View Tests', action: '/tests', icon: <Assessment />, color: 'success' },
          { text: 'View Results', action: '/results', icon: <BarChart />, color: 'info' },
        ];
    }
  };

  const stats = getRoleBasedStats();
  const activities = getRecentActivities();
  const quickActions = getQuickActions();

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'positive': return 'success.main';
      case 'negative': return 'error.main';
      case 'warning': return 'warning.main';
      default: return 'text.secondary';
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Welcome Header */}
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
          Welcome back, {user?.name}! 👋
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ opacity: 0.8 }}>
          Here's what's happening in your school today
        </Typography>
      </Box>

      {/* Enhanced Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                background: stat.gradient,
                color: 'white',
                transition: 'all 0.3s ease-in-out',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      width: 56,
                      height: 56
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Chip
                    label={stat.change}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.75rem'
                    }}
                  />
                </Box>
                <Typography variant="h3" component="div" sx={{ fontWeight: 700, mb: 1 }}>
                  {stat.value}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 500 }}>
                  {stat.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Enhanced Recent Activities */}
        <Grid item xs={12} md={8}>
          <Card sx={{ 
            height: '100%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            borderRadius: 3
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  Recent Activities
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Visibility />}
                  sx={{ borderRadius: 2 }}
                >
                  View All
                </Button>
              </Box>
              <List sx={{ p: 0 }}>
                {activities.map((activity, index) => (
                  <Box key={index}>
                    <ListItem sx={{ px: 0, py: 2 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {activity.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {activity.text}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            {activity.time}
                          </Typography>
                        }
                      />
                      <Chip
                        label={activity.type}
                        size="small"
                        color={activity.color as any}
                        variant="outlined"
                        sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                      />
                    </ListItem>
                    {index < activities.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Enhanced Quick Actions & Schedule */}
        <Grid item xs={12} md={4}>
          {/* Quick Actions */}
          <Card sx={{ 
            mb: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            borderRadius: 3
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  Quick Actions
                </Typography>
                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                  <Add />
                </Avatar>
              </Box>
              <List sx={{ p: 0 }}>
                {quickActions.map((action, index) => (
                  <ListItem 
                    key={index} 
                    button 
                    sx={{ 
                      borderRadius: 2, 
                      mb: 1,
                      '&:hover': {
                        bgcolor: 'action.hover',
                        transform: 'translateX(4px)',
                        transition: 'all 0.2s ease-in-out'
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: `${action.color}.main` }}>
                      {action.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {action.text}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <Card sx={{ 
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            borderRadius: 3
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  Today's Schedule
                </Typography>
                <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
                  <CalendarToday />
                </Avatar>
              </Box>
              <List sx={{ p: 0 }}>
                <ListItem sx={{ px: 0, py: 1.5 }}>
                  <ListItemIcon sx={{ minWidth: 40, color: 'warning.main' }}>
                    <CalendarToday />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        Morning Assembly
                      </Typography>
                    }
                    secondary="8:00 AM - 8:15 AM"
                  />
                </ListItem>
                <Divider />
                <ListItem sx={{ px: 0, py: 1.5 }}>
                  <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                    <School />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        Regular Classes
                      </Typography>
                    }
                    secondary="8:15 AM - 3:30 PM"
                  />
                </ListItem>
                <Divider />
                <ListItem sx={{ px: 0, py: 1.5 }}>
                  <ListItemIcon sx={{ minWidth: 40, color: 'info.main' }}>
                    <LocationOn />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        Staff Meeting
                      </Typography>
                    }
                    secondary="4:00 PM - 5:00 PM"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;