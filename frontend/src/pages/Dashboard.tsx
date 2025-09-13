import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
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
  CalendarToday,
  Add,
  Visibility,
  BarChart,
  PieChart,
  ShowChart,
  Refresh,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
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
import studentService from '../services/studentService';
import classService from '../services/classService';
import attendanceService from '../services/attendanceService';
import teacherService from '../services/teacherService';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    attendanceRate: 0,
    activeTeachers: 0
  });
  const [attendanceData, setAttendanceData] = useState<Array<{
    name: string;
    present: number;
    absent: number;
    late: number;
    halfDay: number;
  }>>([]);
  const [classDistribution, setClassDistribution] = useState<Array<{
    name: string;
    value: number;
    color: string;
  }>>([]);
  // Removed unused recentAttendance state

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch total students
      const studentsRes = await studentService.getStudents({});
      const totalStudents = studentsRes.data?.length || 0;

      // Fetch total teachers
      const teachersRes = await teacherService.getAllTeachers();
      const totalTeachers = teachersRes.data?.length || 0;

      // Fetch total classes
      const classesRes = await classService.getClasses();
      const totalClasses = classesRes.data?.length || 0;

      // Fetch attendance data for the last 7 days
      const today = new Date();
      const sevenDaysAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
      const attendanceRes = await attendanceService.getAttendanceRecords({
        startDate: sevenDaysAgo.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      });

      // Process attendance data for charts
      const attendanceByDate: { [key: string]: { present: number; absent: number; late: number; halfDay: number } } = {};
      const totalAttendance = { present: 0, absent: 0, late: 0, halfDay: 0 };
      
      (attendanceRes.data || []).forEach(record => {
        const date = new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' });
        if (!attendanceByDate[date]) {
          attendanceByDate[date] = { present: 0, absent: 0, late: 0, halfDay: 0 };
        }
        // Map 'half-day' to 'halfDay' for consistency
        const status = record.status === 'half-day' ? 'halfDay' : record.status;
        if (status in attendanceByDate[date]) {
          attendanceByDate[date][status as keyof typeof attendanceByDate[string]]++;
        }
        if (status in totalAttendance) {
          totalAttendance[status as keyof typeof totalAttendance]++;
        }
      });

      // Convert to chart format
      const chartData = Object.keys(attendanceByDate).map(date => ({
        name: date,
        ...attendanceByDate[date]
      }));
      setAttendanceData(chartData);

      // Calculate attendance rate
      const totalMarked = totalAttendance.present + totalAttendance.absent + totalAttendance.late + totalAttendance.halfDay;
      const attendanceRate = totalMarked > 0 ? ((totalAttendance.present / totalMarked) * 100).toFixed(1) : '0';

      // Process class distribution
      const classCounts: { [key: string]: number } = {};
      (classesRes.data || []).forEach(cls => {
        const className = cls.name;
        classCounts[className] = (classCounts[className] || 0) + 1;
      });
      
      const classChartData = Object.keys(classCounts).map(className => ({
        name: className,
        value: classCounts[className],
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`
      }));
      setClassDistribution(classChartData);

      // Update stats
      setStats({
        totalStudents,
        totalTeachers,
        totalClasses,
        attendanceRate: parseFloat(attendanceRate),
        activeTeachers: 0 // Placeholder, will be updated based on teacher status
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
            value: stats.totalStudents.toLocaleString(), 
            icon: <School />, 
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            change: 'Active',
            changeType: 'positive',
            progress: 100
          },
          { 
            title: 'Total Teachers', 
            value: stats.totalTeachers.toString(), 
            icon: <People />, 
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            change: stats.totalTeachers > 0 ? 'Active' : 'None',
            changeType: 'positive',
            progress: stats.totalTeachers > 0 ? 100 : 0
          },
          { 
            title: 'Active Classes', 
            value: stats.totalClasses.toString(), 
            icon: <Assignment />, 
            gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            change: 'Active',
            changeType: 'positive',
            progress: 100
          },
          { 
            title: 'Attendance Rate', 
            value: `${stats.attendanceRate}%`, 
            icon: <TrendingUp />, 
            gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            change: 'Today',
            changeType: 'positive',
            progress: stats.attendanceRate
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
        {/* Stats Cards */}
        {getRoleBasedStats().map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ 
              background: stat.gradient,
              color: 'white',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              borderRadius: 3,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <CardContent sx={{ p: { xs: 2, md: 3 }, position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
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
                {isLoading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CircularProgress size={20} sx={{ color: 'white', mr: 1 }} />
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Loading...</Typography>
                  </Box>
                ) : (
                  <Typography variant={isMobile ? "h4" : "h3"} component="div" sx={{ fontWeight: 700, mb: 1 }}>
                    {stat.value}
                  </Typography>
                )}
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
            <Tab label="Class Distribution" icon={<PieChart />} />
          </Tabs>
        </Box>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" color="text.secondary">
              {activeTab === 0 ? 'Last 7 Days Attendance' : 'Class Distribution'}
            </Typography>
            <Button
              startIcon={<Refresh />}
              onClick={fetchDashboardData}
              disabled={isLoading}
              size="small"
              variant="outlined"
            >
              {isLoading ? <CircularProgress size={16} /> : 'Refresh'}
            </Button>
          </Box>

          {activeTab === 0 && (
            <Box sx={{ height: { xs: 250, md: 300 } }}>
              {attendanceData.length > 0 ? (
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
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography variant="body1" color="text.secondary">
                    {isLoading ? 'Loading attendance data...' : 'No attendance data available'}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
          
          {activeTab === 1 && (
            <Box sx={{ height: { xs: 250, md: 300 } }}>
              {classDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={classDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {classDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography variant="body1" color="text.secondary">
                    {isLoading ? 'Loading class data...' : 'No class data available'}
                  </Typography>
                </Box>
              )}
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
                    <IconButton onClick={fetchDashboardData} disabled={isLoading}>
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
                {getRecentActivities().map((activity, index) => (
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
                    {index < getRecentActivities().length - 1 && <Divider />}
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
                {getQuickActions().map((action, index) => (
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
                  System Status
                </Typography>
                <Avatar sx={{ bgcolor: 'success.main', width: { xs: 28, md: 32 }, height: { xs: 28, md: 32 } }}>
                  <CalendarToday />
                </Avatar>
              </Box>
              <List sx={{ p: 0 }}>
                <ListItem sx={{ px: 0, py: { xs: 1, md: 1.5 } }}>
                  <ListItemIcon sx={{ minWidth: { xs: 32, md: 40 }, color: 'success.main' }}>
                    <School />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant={isMobile ? "body2" : "body1"} sx={{ fontWeight: 500 }}>
                        Students Active
                      </Typography>
                    }
                    secondary={`${stats.totalStudents} students registered`}
                  />
                </ListItem>
                <Divider />
                <ListItem sx={{ px: 0, py: { xs: 1, md: 1.5 } }}>
                  <ListItemIcon sx={{ minWidth: { xs: 32, md: 40 }, color: 'primary.main' }}>
                    <Assignment />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant={isMobile ? "body2" : "body1"} sx={{ fontWeight: 500 }}>
                        Classes Active
                      </Typography>
                    }
                    secondary={`${stats.totalClasses} classes configured`}
                  />
                </ListItem>
                <Divider />
                <ListItem sx={{ px: 0, py: { xs: 1, md: 1.5 } }}>
                  <ListItemIcon sx={{ minWidth: { xs: 32, md: 40 }, color: 'info.main' }}>
                    <TrendingUp />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant={isMobile ? "body2" : "body1"} sx={{ fontWeight: 500 }}>
                        Attendance Rate
                      </Typography>
                    }
                    secondary={`${stats.attendanceRate}% current rate`}
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