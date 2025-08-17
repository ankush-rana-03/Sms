import React, { useState, useEffect } from 'react';
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
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  LinearProgress,
  CircularProgress,
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
  PieChart,
  ShowChart,
  Refresh,
  Download,
  FilterList,
  MoreVert,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import TeacherDashboard from './TeacherDashboard';

// Mock data for charts
const attendanceData = [
  { name: 'Mon', present: 95, absent: 5, late: 3 },
  { name: 'Tue', present: 92, absent: 8, late: 2 },
  { name: 'Wed', present: 98, absent: 2, late: 1 },
  { name: 'Thu', present: 94, absent: 6, late: 4 },
  { name: 'Fri', present: 96, absent: 4, late: 2 },
];

const performanceData = [
  { name: 'Math', score: 85, target: 90 },
  { name: 'Science', score: 88, target: 85 },
  { name: 'English', score: 92, target: 88 },
  { name: 'History', score: 78, target: 80 },
  { name: 'Geography', score: 91, target: 87 },
];

const subjectDistribution = [
  { name: 'Mathematics', value: 25, color: '#8884d8' },
  { name: 'Science', value: 20, color: '#82ca9d' },
  { name: 'English', value: 18, color: '#ffc658' },
  { name: 'History', value: 15, color: '#ff7300' },
  { name: 'Geography', value: 12, color: '#00ff00' },
  { name: 'Others', value: 10, color: '#ff0000' },
];

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

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
            changeType: 'positive',
            progress: 85
          },
          { 
            title: 'Total Teachers', 
            value: '45', 
            icon: <People />, 
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            change: '+5%',
            changeType: 'positive',
            progress: 92
          },
          { 
            title: 'Active Classes', 
            value: '32', 
            icon: <Assignment />, 
            gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            change: '+2',
            changeType: 'positive',
            progress: 78
          },
          { 
            title: 'Attendance Rate', 
            value: '94.5%', 
            icon: <TrendingUp />, 
            gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            change: '+1.2%',
            changeType: 'positive',
            progress: 94.5
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
            changeType: 'positive',
            progress: 88
          },
          { 
            title: 'Classes Today', 
            value: '4', 
            icon: <Assignment />, 
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            change: 'On Track',
            changeType: 'neutral',
            progress: 100
          },
          { 
            title: 'Pending Homework', 
            value: '12', 
            icon: <Assessment />, 
            gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            change: '-3',
            changeType: 'negative',
            progress: 65
          },
          { 
            title: 'Attendance Rate', 
            value: '96.2%', 
            icon: <TrendingUp />, 
            gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            change: '+0.8%',
            changeType: 'positive',
            progress: 96.2
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
            changeType: 'neutral',
            progress: 100
          },
          { 
            title: 'Attendance Rate', 
            value: '92.1%', 
            icon: <TrendingUp />, 
            gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            change: '+2.1%',
            changeType: 'positive',
            progress: 92.1
          },
          { 
            title: 'Pending Homework', 
            value: '3', 
            icon: <Assessment />, 
            gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            change: '-1',
            changeType: 'negative',
            progress: 75
          },
          { 
            title: 'Upcoming Tests', 
            value: '2', 
            icon: <BarChart />, 
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            change: 'This Week',
            changeType: 'neutral',
            progress: 50
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
            changeType: 'positive',
            progress: 95.2
          },
          { 
            title: 'Homework Due', 
            value: '2', 
            icon: <Assignment />, 
            gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            change: 'Due Today',
            changeType: 'warning',
            progress: 40
          },
          { 
            title: 'Tests This Week', 
            value: '1', 
            icon: <Assessment />, 
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            change: 'Tomorrow',
            changeType: 'neutral',
            progress: 25
          },
          { 
            title: 'Average Score', 
            value: '87.5%', 
            icon: <School />, 
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            change: '+2.5%',
            changeType: 'positive',
            progress: 87.5
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
        color: 'primary',
        priority: 'high'
      },
      { 
        text: 'New homework assigned in Mathematics', 
        time: '4 hours ago', 
        type: 'homework',
        icon: <Assignment color="secondary" />,
        color: 'secondary',
        priority: 'medium'
      },
      { 
        text: 'Test results published for Science', 
        time: '1 day ago', 
        type: 'test',
        icon: <Assessment color="success" />,
        color: 'success',
        priority: 'low'
      },
      { 
        text: 'New student enrolled in Class 9B', 
        time: '2 days ago', 
        type: 'student',
        icon: <School color="info" />,
        color: 'info',
        priority: 'medium'
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

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Welcome Header */}
      <Box sx={{ mb: { xs: 2, md: 4 }, textAlign: 'center' }}>
        <Typography 
          variant={isMobile ? "h4" : "h3"}
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
        <Typography variant={isMobile ? "body1" : "h6"} color="text.secondary" sx={{ opacity: 0.8 }}>
          Here's what's happening in your school today
        </Typography>
      </Box>

      {/* Enhanced Stats Cards */}
      <Grid container spacing={{ xs: 1, sm: 2, md: 3 }} sx={{ mb: { xs: 2, md: 4 } }}>
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
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      width: { xs: 40, md: 56 },
                      height: { xs: 40, md: 56 }
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
                <Typography variant={isMobile ? "h4" : "h3"} component="div" sx={{ fontWeight: 700, mb: 1 }}>
                  {stat.value}
                </Typography>
                <Typography variant={isMobile ? "body2" : "body1"} sx={{ opacity: 0.9, fontWeight: 500, mb: 2 }}>
                  {stat.title}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={stat.progress} 
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.3)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: 'rgba(255,255,255,0.8)'
                    }
                  }} 
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Analytics Tabs */}
      <Card sx={{ mb: { xs: 2, md: 3 }, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderRadius: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons={isMobile ? "auto" : false}
          >
            <Tab label="Attendance Trends" icon={<ShowChart />} />
            <Tab label="Performance Analysis" icon={<BarChart />} />
            <Tab label="Subject Distribution" icon={<PieChart />} />
          </Tabs>
        </Box>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          {activeTab === 0 && (
            <Box sx={{ height: { xs: 250, md: 300 } }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Area type="monotone" dataKey="present" stackId="1" stroke="#8884d8" fill="#8884d8" />
                  <Area type="monotone" dataKey="absent" stackId="1" stroke="#ff7300" fill="#ff7300" />
                  <Area type="monotone" dataKey="late" stackId="1" stroke="#ffc658" fill="#ffc658" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          )}
          
          {activeTab === 1 && (
            <Box sx={{ height: { xs: 250, md: 300 } }}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="score" fill="#8884d8" />
                  <Bar dataKey="target" fill="#82ca9d" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </Box>
          )}
          
          {activeTab === 2 && (
            <Box sx={{ height: { xs: 250, md: 300 } }}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={subjectDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {subjectDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </Box>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={{ xs: 1, sm: 2, md: 3 }}>
        {/* Enhanced Recent Activities */}
        <Grid item xs={12} md={8}>
          <Card sx={{ 
            height: '100%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            borderRadius: 3
          }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 600, color: 'primary.main' }}>
                  Recent Activities
                </Typography>
                <Box>
                  <Tooltip title="Refresh">
                    <IconButton onClick={handleRefresh} disabled={isLoading}>
                      {isLoading ? <CircularProgress size={20} /> : <Refresh />}
                    </IconButton>
                  </Tooltip>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Visibility />}
                    sx={{ borderRadius: 2, ml: 1 }}
                  >
                    View All
                  </Button>
                </Box>
              </Box>
              <List sx={{ p: 0 }}>
                {activities.map((activity, index) => (
                  <Box key={index}>
                    <ListItem sx={{ px: 0, py: { xs: 1, md: 2 } }}>
                      <ListItemIcon sx={{ minWidth: { xs: 32, md: 40 } }}>
                        {activity.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant={isMobile ? "body2" : "body1"} sx={{ fontWeight: 500 }}>
                            {activity.text}
                          </Typography>
                        }
                        secondary={
                          <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary">
                            {activity.time}
                          </Typography>
                        }
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={activity.type}
                          size="small"
                          color={activity.color as any}
                          variant="outlined"
                          sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                        />
                        <Chip
                          label={activity.priority}
                          size="small"
                          color={activity.priority === 'high' ? 'error' : activity.priority === 'medium' ? 'warning' : 'success'}
                          variant="filled"
                          sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                        />
                      </Box>
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
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 600, color: 'primary.main' }}>
                  Quick Actions
                </Typography>
                <Avatar sx={{ bgcolor: 'primary.main', width: { xs: 28, md: 32 }, height: { xs: 28, md: 32 } }}>
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
                    <ListItemIcon sx={{ minWidth: { xs: 32, md: 40 }, color: `${action.color}.main` }}>
                      {action.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Typography variant={isMobile ? "body2" : "body1"} sx={{ fontWeight: 500 }}>
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
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 600, color: 'primary.main' }}>
                  Today's Schedule
                </Typography>
                <Avatar sx={{ bgcolor: 'success.main', width: { xs: 28, md: 32 }, height: { xs: 28, md: 32 } }}>
                  <CalendarToday />
                </Avatar>
              </Box>
              <List sx={{ p: 0 }}>
                <ListItem sx={{ px: 0, py: { xs: 1, md: 1.5 } }}>
                  <ListItemIcon sx={{ minWidth: { xs: 32, md: 40 }, color: 'warning.main' }}>
                    <CalendarToday />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant={isMobile ? "body2" : "body1"} sx={{ fontWeight: 500 }}>
                        Morning Assembly
                      </Typography>
                    }
                    secondary="8:00 AM - 8:15 AM"
                  />
                </ListItem>
                <Divider />
                <ListItem sx={{ px: 0, py: { xs: 1, md: 1.5 } }}>
                  <ListItemIcon sx={{ minWidth: { xs: 32, md: 40 }, color: 'primary.main' }}>
                    <School />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant={isMobile ? "body2" : "body1"} sx={{ fontWeight: 500 }}>
                        Regular Classes
                      </Typography>
                    }
                    secondary="8:15 AM - 3:30 PM"
                  />
                </ListItem>
                <Divider />
                <ListItem sx={{ px: 0, py: { xs: 1, md: 1.5 } }}>
                  <ListItemIcon sx={{ minWidth: { xs: 32, md: 40 }, color: 'info.main' }}>
                    <LocationOn />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant={isMobile ? "body2" : "body1"} sx={{ fontWeight: 500 }}>
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