import React from 'react';
import { Box, Typography, Button, Grid, Card, CardContent, Chip, Avatar } from '@mui/material';
import { Add, Quiz } from '@mui/icons-material';

const Tests: React.FC = () => {
  const mockTests = [
    {
      id: '1',
      title: 'Mathematics Mid-Term',
      subject: 'Mathematics',
      class: '10A',
      date: '2024-01-20',
      duration: '2 hours',
      status: 'scheduled',
      totalMarks: 100,
      type: 'exam'
    },
    {
      id: '2',
      title: 'English Grammar Quiz',
      subject: 'English',
      class: '10B',
      date: '2024-01-18',
      duration: '45 minutes',
      status: 'completed',
      totalMarks: 50,
      type: 'quiz'
    },
    {
      id: '3',
      title: 'Physics Unit Test',
      subject: 'Physics',
      class: '10A',
      date: '2024-01-15',
      duration: '1 hour',
      status: 'completed',
      totalMarks: 75,
      type: 'test'
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'ongoing': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'exam': return 'error';
      case 'test': return 'warning';
      case 'quiz': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Tests & Exams</Typography>
        <Button variant="contained" startIcon={<Add />}>
          Create Test
        </Button>
      </Box>

      <Grid container spacing={3}>
        {mockTests.map((test) => (
          <Grid item xs={12} md={6} lg={4} key={test.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    <Quiz />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">{test.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {test.subject} - {test.class}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Date: {test.date}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Duration: {test.duration}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Marks: {test.totalMarks}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={test.status}
                    color={getStatusColor(test.status)}
                    size="small"
                  />
                  <Chip
                    label={test.type}
                    color={getTypeColor(test.type)}
                    variant="outlined"
                    size="small"
                  />
                  <Chip
                    label={test.subject}
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

export default Tests;