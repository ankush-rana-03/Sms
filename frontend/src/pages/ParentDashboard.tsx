import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Chip, 
  Avatar, 
  CircularProgress, 
  Alert,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  Assignment, 
  School, 
  Person, 
  CheckCircle, 
  RadioButtonUnchecked,
  Pending,
  CalendarToday,
  TrendingUp,
  AccessTime
} from '@mui/icons-material';
import { parentHomeworkService, ParentHomework, HomeworkStatistics } from '../services/parentHomeworkService';
import { parentAttendanceService, StudentAttendance, AttendanceSummary } from '../services/parentAttendanceService';
import { useParentAuth } from '../contexts/ParentAuthContext';

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
      id={`homework-tabpanel-${index}`}
      aria-labelledby={`homework-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ParentDashboard: React.FC = () => {
  const { parent, isLoggedIn, logout } = useParentAuth();
  const [homework, setHomework] = useState<ParentHomework[]>([]);
  const [statistics, setStatistics] = useState<HomeworkStatistics | null>(null);
  const [attendance, setAttendance] = useState<StudentAttendance[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [completionDialog, setCompletionDialog] = useState<{
    open: boolean;
    homeworkId: string;
    childId: string;
    currentStatus: string;
    comments: string;
  }>({
    open: false,
    homeworkId: '',
    childId: '',
    currentStatus: 'not_started',
    comments: ''
  });

  useEffect(() => {
    if (!isLoggedIn) {
      console.log('Parent not logged in, redirecting to login');
      window.location.href = '/parent-login';
      return;
    }

    if (parent && parent.children.length > 0) {
      setSelectedChild(parent.children[0]._id);
      console.log('Fetching data...');
      fetchData();
    }
  }, [isLoggedIn, parent]);

  const fetchData = async () => {
    try {
      console.log('Starting fetchData...');
      setLoading(true);
      
      // Fetch data individually to handle errors gracefully
      try {
        console.log('Fetching homework...');
        const homeworkResponse = await parentHomeworkService.getParentHomework();
        console.log('Homework response:', homeworkResponse);
        setHomework(homeworkResponse.data);
      } catch (err: any) {
        console.error('Homework fetch error:', err);
        setError('Failed to fetch homework data');
      }

      try {
        console.log('Fetching statistics...');
        const statsResponse = await parentHomeworkService.getHomeworkStatistics();
        console.log('Statistics response:', statsResponse);
        setStatistics(statsResponse.data);
      } catch (err: any) {
        console.error('Statistics fetch error:', err);
        // Don't set error for statistics as it's not critical
      }

      try {
        console.log('Fetching attendance...');
        const attendanceResponse = await parentAttendanceService.getCurrentMonthAttendance();
        console.log('Attendance response:', attendanceResponse);
        // Process attendance data
        if (attendanceResponse.data.children.length > 0) {
          const firstChild = attendanceResponse.data.children[0];
          setAttendance(firstChild.attendance);
          setAttendanceSummary(firstChild.summary);
        }
      } catch (err: any) {
        console.error('Attendance fetch error:', err);
        setError('Failed to fetch attendance data');
      }
    } catch (err: any) {
      console.error('General fetch error:', err);
      setError('Failed to fetch data');
    } finally {
      console.log('FetchData completed');
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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

  const handleCompletionClick = (homeworkId: string, childId: string, currentStatus: string, comments: string) => {
    setCompletionDialog({
      open: true,
      homeworkId,
      childId,
      currentStatus,
      comments: comments || ''
    });
  };

  const handleCompletionUpdate = async () => {
    try {
      await parentHomeworkService.updateHomeworkCompletion(
        completionDialog.homeworkId,
        completionDialog.childId,
        {
          completionStatus: completionDialog.currentStatus as any,
          parentComments: completionDialog.comments
        }
      );
      
      setCompletionDialog({ ...completionDialog, open: false });
      fetchData(); // Refresh data
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update completion status');
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
        return 'Fully Complete';
      case 'half_complete':
        return 'Half Complete';
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Parent Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome, {parent?.name}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={() => {
            logout();
            window.location.href = '/parent-login';
          }}
        >
          Logout
        </Button>
      </Box>

      {/* Statistics Cards */}
      {statistics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
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
            <Grid item xs={12} md={4} key={child.childId}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
                      <School />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{child.childName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Class {child.grade} - {child.section}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      Completion Rate: {child.completionRate}%
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={`${child.fullyComplete} Complete`} color="success" size="small" />
                    <Chip label={`${child.halfComplete} Half`} color="warning" size="small" />
                    <Chip label={`${child.notStarted} Not Started`} color="default" size="small" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Homework Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="All Homework" />
            <Tab label="Attendance" />
            {parent?.children.map((child) => (
              <Tab key={child._id} label={`${child.name} (Class ${child.grade}-${child.section})`} />
            ))}
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {homework.map((hw) => (
              <Grid item xs={12} md={6} lg={4} key={hw._id}>
                <Card>
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

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Children Progress:
                      </Typography>
                      {hw.childrenCompletion.map((childComp) => (
                        <Box key={childComp.studentId} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          {getStatusIcon(childComp.completionStatus)}
                          <Typography variant="body2" sx={{ ml: 1, flexGrow: 1 }}>
                            {childComp.studentName}
                          </Typography>
                          <Chip
                            label={getStatusText(childComp.completionStatus)}
                            color={getStatusColor(childComp.completionStatus) as any}
                            size="small"
                            onClick={() => handleCompletionClick(
                              hw._id,
                              childComp.studentId,
                              childComp.completionStatus,
                              childComp.parentComments || ''
                            )}
                            sx={{ cursor: 'pointer' }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {parent?.children.map((child, index) => (
          <TabPanel key={child._id} value={tabValue} index={index + 2}>
            <Grid container spacing={3}>
              {homework
                .filter(hw => hw.childrenCompletion.some(comp => comp.studentId === child._id))
                .map((hw) => {
                  const childComp = hw.childrenCompletion.find(comp => comp.studentId === child._id);
                  return (
                    <Grid item xs={12} md={6} lg={4} key={hw._id}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                              <Assignment />
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="h6">{hw.title}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {hw.subject}
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

                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            {getStatusIcon(childComp?.completionStatus || 'not_started')}
                            <Typography variant="body2" sx={{ ml: 1, flexGrow: 1 }}>
                              Status: {getStatusText(childComp?.completionStatus || 'not_started')}
                            </Typography>
                            <Chip
                              label={getStatusText(childComp?.completionStatus || 'not_started')}
                              color={getStatusColor(childComp?.completionStatus || 'not_started') as any}
                              size="small"
                              onClick={() => handleCompletionClick(
                                hw._id,
                                child._id,
                                childComp?.completionStatus || 'not_started',
                                childComp?.parentComments || ''
                              )}
                              sx={{ cursor: 'pointer' }}
                            />
                          </Box>

                          {childComp?.parentComments && (
                            <Typography variant="body2" color="text.secondary">
                              Your comments: {childComp.parentComments}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
            </Grid>
          </TabPanel>
        ))}

        {/* Attendance Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Student Attendance
            </Typography>
            {parent && parent.children.length > 1 && (
              <FormControl fullWidth sx={{ mb: 3 }}>
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
            )}
          </Box>

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
        </TabPanel>
      </Card>

      {/* Completion Dialog */}
      <Dialog open={completionDialog.open} onClose={() => setCompletionDialog({ ...completionDialog, open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Update Homework Completion</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Completion Status</InputLabel>
            <Select
              value={completionDialog.currentStatus}
              onChange={(e) => setCompletionDialog({ ...completionDialog, currentStatus: e.target.value })}
            >
              <MenuItem value="not_started">Not Started</MenuItem>
              <MenuItem value="half_complete">Half Complete</MenuItem>
              <MenuItem value="fully_complete">Fully Complete</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Comments (Optional)"
            value={completionDialog.comments}
            onChange={(e) => setCompletionDialog({ ...completionDialog, comments: e.target.value })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompletionDialog({ ...completionDialog, open: false })}>
            Cancel
          </Button>
          <Button onClick={handleCompletionUpdate} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ParentDashboard;