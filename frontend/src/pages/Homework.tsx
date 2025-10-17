import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Card, CardContent, Chip, Avatar, CircularProgress, Alert } from '@mui/material';
import { Add, Assignment, Warning } from '@mui/icons-material';
import HomeworkForm from '../components/HomeworkForm';
import { homeworkService, Homework as HomeworkType } from '../services/homeworkService';

const Homework: React.FC = () => {
  const [homework, setHomework] = useState<HomeworkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    fetchHomework();
  }, []);

  const fetchHomework = async () => {
    try {
      setLoading(true);
      const response = await homeworkService.getAllHomework();
      setHomework(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch homework');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSuccess = () => {
    fetchHomework(); // Refresh the list
  };

  const getStatusColor = (homework: HomeworkType) => {
    const dueDate = new Date(homework.dueDate);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'error'; // overdue
    if (diffDays <= 1) return 'warning'; // due soon
    return 'primary'; // assigned
  };

  const getStatusText = (homework: HomeworkType) => {
    const dueDate = new Date(homework.dueDate);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays <= 1) return 'Due Soon';
    return 'Assigned';
  };

  const getStatusIcon = (homework: HomeworkType) => {
    const dueDate = new Date(homework.dueDate);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return <Warning color="error" />;
    if (diffDays <= 1) return <Warning color="warning" />;
    return <Assignment color="primary" />;
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString();
  };

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
        <Typography variant="h4">Homework Management</Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={() => setFormOpen(true)}
        >
          Assign Homework
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {homework.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No homework assignments found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Click "Assign Homework" to create your first assignment
          </Typography>
        </Box>
      ) : (
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
                        {hw.subject} - {typeof hw.class === 'object' ? `Class ${hw.class.name}` : `Class ${hw.class}`} {hw.section ? `Section ${hw.section}` : ''}
                      </Typography>
                    </Box>
                    {getStatusIcon(hw)}
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Due Date: {formatDate(hw.dueDate)}
                    </Typography>
                    {hw.instructions && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Instructions: {hw.instructions}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Submissions: {hw.submissions?.length || 0}
                    </Typography>
                    {hw.totalMarks && hw.totalMarks > 0 && (
                      <Typography variant="body2" color="text.secondary">
                        Total Marks: {hw.totalMarks}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      Assigned by: {typeof hw.assignedBy === 'object' ? hw.assignedBy.name : 'Unknown'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <HomeworkForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
      />
    </Box>
  );
};

export default Homework;