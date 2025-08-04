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
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const getRoleBasedStats = () => {
    switch (user?.role) {
      case 'principal':
      case 'admin':
        return [
          { title: 'Total Students', value: '1,234', icon: <School />, color: 'primary' },
          { title: 'Total Teachers', value: '45', icon: <People />, color: 'secondary' },
          { title: 'Active Classes', value: '32', icon: <Assignment />, color: 'success' },
          { title: 'Attendance Rate', value: '94.5%', icon: <TrendingUp />, color: 'info' },
        ];
      case 'teacher':
        return [
          { title: 'My Students', value: '35', icon: <School />, color: 'primary' },
          { title: 'Classes Today', value: '4', icon: <Assignment />, color: 'secondary' },
          { title: 'Pending Homework', value: '12', icon: <Assessment />, color: 'warning' },
          { title: 'Attendance Rate', value: '96.2%', icon: <TrendingUp />, color: 'success' },
        ];
      case 'parent':
        return [
          { title: 'Children', value: '2', icon: <School />, color: 'primary' },
          { title: 'Attendance Rate', value: '92.1%', icon: <TrendingUp />, color: 'success' },
          { title: 'Pending Homework', value: '3', icon: <Assignment />, color: 'warning' },
          { title: 'Upcoming Tests', value: '2', icon: <Assessment />, color: 'info' },
        ];
      default:
        return [
          { title: 'Attendance', value: '95.2%', icon: <TrendingUp />, color: 'success' },
          { title: 'Homework Due', value: '2', icon: <Assignment />, color: 'warning' },
          { title: 'Tests This Week', value: '1', icon: <Assessment />, color: 'info' },
          { title: 'Average Score', value: '87.5%', icon: <School />, color: 'primary' },
        ];
    }
  };

  const getRecentActivities = () => {
    const activities = [
      { text: 'Attendance marked for Class 10A', time: '2 hours ago', type: 'attendance' },
      { text: 'New homework assigned in Mathematics', time: '4 hours ago', type: 'homework' },
      { text: 'Test results published for Science', time: '1 day ago', type: 'test' },
      { text: 'New student enrolled in Class 9B', time: '2 days ago', type: 'student' },
    ];

    return activities.slice(0, 4);
  };

  const getQuickActions = () => {
    switch (user?.role) {
      case 'teacher':
        return [
          { text: 'Mark Attendance', action: '/attendance' },
          { text: 'Assign Homework', action: '/homework' },
          { text: 'Create Test', action: '/tests' },
          { text: 'View Results', action: '/results' },
        ];
      case 'principal':
      case 'admin':
        return [
          { text: 'Add Student', action: '/students' },
          { text: 'Add Teacher', action: '/teachers' },
          { text: 'Manage Classes', action: '/classes' },
          { text: 'View Reports', action: '/results' },
        ];
      default:
        return [
          { text: 'View Attendance', action: '/attendance' },
          { text: 'Check Homework', action: '/homework' },
          { text: 'View Tests', action: '/tests' },
          { text: 'View Results', action: '/results' },
        ];
    }
  };

  const stats = getRoleBasedStats();
  const activities = getRecentActivities();
  const quickActions = getQuickActions();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.name}!
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Here's what's happening in your school today.
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: `${stat.color}.main`, mr: 2 }}>
                    {stat.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h4" component="div">
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Activities */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activities
            </Typography>
            <List>
              {activities.map((activity, index) => (
                <ListItem key={index} divider>
                  <ListItemIcon>
                    <Notifications color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={activity.text}
                    secondary={activity.time}
                  />
                  <Chip
                    label={activity.type}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <List>
              {quickActions.map((action, index) => (
                <ListItem key={index} button>
                  <ListItemText primary={action.text} />
                </ListItem>
              ))}
            </List>
          </Paper>

          {/* Today's Schedule */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Today's Schedule
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <CalendarToday />
                </ListItemIcon>
                <ListItemText
                  primary="Morning Assembly"
                  secondary="8:00 AM - 8:15 AM"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <School />
                </ListItemIcon>
                <ListItemText
                  primary="Regular Classes"
                  secondary="8:15 AM - 3:30 PM"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <LocationOn />
                </ListItemIcon>
                <ListItemText
                  primary="Staff Meeting"
                  secondary="4:00 PM - 5:00 PM"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;