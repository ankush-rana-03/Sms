import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CircularProgress, 
  Alert,
  Chip,
  Avatar,
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
  CheckCircle, 
  RadioButtonUnchecked,
  Pending,
  CalendarToday
} from '@mui/icons-material';
import { parentHomeworkService, ParentHomework, HomeworkStatistics } from '../services/parentHomeworkService';
import { useParentAuth } from '../contexts/ParentAuthContext';
import { useNavigate } from 'react-router-dom';

const ParentHomeworkPage: React.FC = () => {
  const { parent, isLoggedIn } = useParentAuth();
  const navigate = useNavigate();
  const [homework, setHomework] = useState<ParentHomework[]>([]);
  const [statistics, setStatistics] = useState<HomeworkStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      
      const [homeworkResponse, statsResponse] = await Promise.all([
        parentHomeworkService.getParentHomework(),
        parentHomeworkService.getHomeworkStatistics()
      ]);
      
      setHomework(homeworkResponse.data);
      setStatistics(statsResponse.data);
    } catch (err: any) {
      console.error('Homework fetch error:', err);
      setError('Failed to fetch homework data. Please try again.');
    } finally {
      setLoading(false);
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
        return 'Complete';
      case 'half_complete':
        return 'In Progress';
      default:
        return 'Not Started';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
            Homework Assignments
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your children's homework progress
          </Typography>
        </Box>
      </Box>

      {/* Statistics */}
      {statistics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
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
                      <CheckCircle />
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

      {/* Homework List */}
      <Grid container spacing={3}>
        {homework.map((hw) => (
          <Grid item xs={12} md={6} lg={4} key={hw._id}>
            <Card sx={{ height: '100%' }}>
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

                <Typography variant="body2" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <CalendarToday sx={{ mr: 1, fontSize: 16 }} />
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

                {hw.attachments && hw.attachments.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Attachments:
                    </Typography>
                    {hw.attachments.map((attachment, index) => (
                      <Chip
                        key={index}
                        label={attachment.fileName}
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {homework.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: 'grey.100' }}>
            <Assignment />
          </Avatar>
          <Typography variant="body1" color="text.secondary">
            No homework assignments found.
          </Typography>
        </Box>
      )}

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
              <MenuItem value="half_complete">In Progress</MenuItem>
              <MenuItem value="fully_complete">Complete</MenuItem>
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

export default ParentHomeworkPage;