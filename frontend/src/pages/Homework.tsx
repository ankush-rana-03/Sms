import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Add,
  Assignment,
  CheckCircle,
  Warning,
  Edit,
  Delete,
  Visibility,
  School,
  Person
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import homeworkService, { Homework, CreateHomeworkData } from '../services/homeworkService';
import classService from '../services/classService';

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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Homework: React.FC = () => {
  const { user } = useAuth();
  const [homework, setHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHomework, setEditingHomework] = useState<Homework | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects] = useState(['Mathematics', 'English', 'Science', 'Social Studies', 'Hindi', 'Computer Science', 'Physics', 'Chemistry', 'Biology']);

  const [formData, setFormData] = useState<CreateHomeworkData>({
    title: '',
    description: '',
    subject: '',
    classId: '',
    dueDate: '',
    instructions: '',
    totalMarks: 0
  });

  useEffect(() => {
    fetchHomework();
    fetchClasses();
  }, []);

  const fetchHomework = async () => {
    try {
      setLoading(true);
      const response = await homeworkService.getAllHomework();
      setHomework(response.data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await classService.getAvailableClassesForRegistration();
      if (response.success) {
        setClasses(response.data.classes);
      }
    } catch (error: any) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleCreateHomework = async () => {
    try {
      await homeworkService.createHomework(formData);
      setDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        subject: '',
        classId: '',
        dueDate: '',
        instructions: '',
        totalMarks: 0
      });
      fetchHomework();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const getStatusColor = (homework: Homework) => {
    const now = new Date();
    const dueDate = new Date(homework.dueDate);
    
    if (!homework.isActive) return 'default';
    if (dueDate < now) return 'error';
    if (dueDate.toDateString() === now.toDateString()) return 'warning';
    return 'primary';
  };

  const getStatusText = (homework: Homework) => {
    const now = new Date();
    const dueDate = new Date(homework.dueDate);
    
    if (!homework.isActive) return 'Completed';
    if (dueDate < now) return 'Overdue';
    if (dueDate.toDateString() === now.toDateString()) return 'Due Today';
    return 'Upcoming';
  };

  const getStatusIcon = (homework: Homework) => {
    const now = new Date();
    const dueDate = new Date(homework.dueDate);
    
    if (!homework.isActive) return <CheckCircle color="success" />;
    if (dueDate < now) return <Warning color="error" />;
    if (dueDate.toDateString() === now.toDateString()) return <Warning color="warning" />;
    return <Assignment color="primary" />;
  };

  const canManageHomework = () => {
    return user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'principal';
  };

  const filteredHomework = homework.filter(hw => {
    if (tabValue === 0) return true; // All
    if (tabValue === 1) return hw.isActive && new Date(hw.dueDate) > new Date(); // Upcoming
    if (tabValue === 2) return hw.isActive && new Date(hw.dueDate).toDateString() === new Date().toDateString(); // Due Today
    if (tabValue === 3) return hw.isActive && new Date(hw.dueDate) < new Date(); // Overdue
    if (tabValue === 4) return !hw.isActive; // Completed
    return true;
  });

  // Parent view - show children's homework
  if (user?.role === 'parent') {
    return <ParentHomeworkView />;
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">📚 Homework Management</Typography>
        {canManageHomework() && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>
            Assign Homework
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="All" />
          <Tab label="Upcoming" />
          <Tab label="Due Today" />
          <Tab label="Overdue" />
          <Tab label="Completed" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <HomeworkGrid homework={filteredHomework} canManage={canManageHomework()} />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <HomeworkGrid homework={filteredHomework} canManage={canManageHomework()} />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <HomeworkGrid homework={filteredHomework} canManage={canManageHomework()} />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <HomeworkGrid homework={filteredHomework} canManage={canManageHomework()} />
        </TabPanel>
        <TabPanel value={tabValue} index={4}>
          <HomeworkGrid homework={filteredHomework} canManage={canManageHomework()} />
        </TabPanel>
      </Paper>

      {/* Create/Edit Homework Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Assign New Homework</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  label="Subject"
                >
                  {subjects.map((subject) => (
                    <MenuItem key={subject} value={subject}>
                      {subject}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Class</InputLabel>
                <Select
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  label="Class"
                >
                  {classes.map((cls) => (
                    <MenuItem key={cls._id} value={cls._id}>
                      {cls.displayName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Due Date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Total Marks"
                value={formData.totalMarks}
                onChange={(e) => setFormData({ ...formData, totalMarks: parseInt(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Instructions (Optional)"
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateHomework} variant="contained">
            Assign Homework
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

interface HomeworkGridProps {
  homework: Homework[];
  canManage: boolean;
}

const HomeworkGrid: React.FC<HomeworkGridProps> = ({ homework, canManage }) => {
  const getStatusColor = (homework: Homework) => {
    const now = new Date();
    const dueDate = new Date(homework.dueDate);
    
    if (!homework.isActive) return 'default';
    if (dueDate < now) return 'error';
    if (dueDate.toDateString() === now.toDateString()) return 'warning';
    return 'primary';
  };

  const getStatusText = (homework: Homework) => {
    const now = new Date();
    const dueDate = new Date(homework.dueDate);
    
    if (!homework.isActive) return 'Completed';
    if (dueDate < now) return 'Overdue';
    if (dueDate.toDateString() === now.toDateString()) return 'Due Today';
    return 'Upcoming';
  };

  const getStatusIcon = (homework: Homework) => {
    const now = new Date();
    const dueDate = new Date(homework.dueDate);
    
    if (!homework.isActive) return <CheckCircle color="success" />;
    if (dueDate < now) return <Warning color="error" />;
    if (dueDate.toDateString() === now.toDateString()) return <Warning color="warning" />;
    return <Assignment color="primary" />;
  };

  if (homework.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          No homework found
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {homework.map((hw) => (
        <Grid item xs={12} md={6} lg={4} key={hw._id}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                  <School />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6">{hw.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {hw.subject} - {hw.class.grade} {hw.class.section}
                  </Typography>
                </Box>
                {getStatusIcon(hw)}
              </Box>

              <Typography variant="body2" sx={{ mb: 2 }}>
                {hw.description}
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Due: {new Date(hw.dueDate).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Assigned by: {hw.assignedBy.name}
                </Typography>
                {hw.totalMarks > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Marks: {hw.totalMarks}
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip
                  label={getStatusText(hw)}
                  color={getStatusColor(hw)}
                  size="small"
                />
                <Chip
                  label={hw.subject}
                  variant="outlined"
                  size="small"
                />
              </Box>

              {hw.submissions && hw.submissions.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Submissions: {hw.submissions.length}
                  </Typography>
                </Box>
              )}

              {canManage && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="View Details">
                    <IconButton size="small">
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton size="small">
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error">
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

// Parent Homework View Component
const ParentHomeworkView: React.FC = () => {
  const [homework, setHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchParentHomework();
  }, []);

  const fetchParentHomework = async () => {
    try {
      setLoading(true);
      const response = await homeworkService.getParentHomework();
      setHomework(response.data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
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
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (homework.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          No homework assigned to your children yet
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        📚 Your Children's Homework
      </Typography>

      <Grid container spacing={3}>
        {homework.map((hw) => (
          <Grid item xs={12} md={6} lg={4} key={hw._id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    <Person />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">{hw.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {hw.subject} - Class {hw.class.grade} {hw.class.section}
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="body2" sx={{ mb: 2 }}>
                  {hw.description}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Due: {new Date(hw.dueDate).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Assigned by: {hw.assignedBy.name}
                  </Typography>
                  {hw.totalMarks > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Marks: {hw.totalMarks}
                    </Typography>
                  )}
                </Box>

                {hw.instructions && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight="medium">
                      Instructions:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {hw.instructions}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={hw.isActive ? 'Active' : 'Completed'}
                    color={hw.isActive ? 'primary' : 'default'}
                    size="small"
                  />
                  <Chip
                    label={hw.subject}
                    variant="outlined"
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Homework;