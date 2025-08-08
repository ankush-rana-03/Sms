import React from 'react';
import { Box, Typography, Button, Grid, Card, CardContent, Chip, Avatar } from '@mui/material';
import { Add, Assignment, CheckCircle, Warning } from '@mui/icons-material';

const Homework: React.FC = () => {
  const mockHomework = [
    {
      id: '1',
      title: 'Mathematics Chapter 5 Problems',
      subject: 'Mathematics',
      class: '10A',
      dueDate: '2024-01-15',
      status: 'assigned',
      submissions: 28,
      totalStudents: 35
    },
    {
      id: '2',
      title: 'English Essay Writing',
      subject: 'English',
      class: '10B',
      dueDate: '2024-01-12',
      status: 'due',
      submissions: 30,
      totalStudents: 32
    },
    {
      id: '3',
      title: 'Physics Lab Report',
      subject: 'Physics',
      class: '10A',
      dueDate: '2024-01-10',
      status: 'overdue',
      submissions: 25,
      totalStudents: 35
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'primary';
      case 'due': return 'warning';
      case 'overdue': return 'error';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned': return <Assignment color="primary" />;
      case 'due': return <Warning color="warning" />;
      case 'overdue': return <Warning color="error" />;
      case 'completed': return <CheckCircle color="success" />;
      default: return <Assignment />;
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Homework Management</Typography>
        <Button variant="contained" startIcon={<Add />}>
          Assign Homework
        </Button>
      </Box>

      <Grid container spacing={3}>
        {mockHomework.map((homework) => (
          <Grid item xs={12} md={6} lg={4} key={homework.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    <Assignment />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">{homework.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      class {homework.subject} - {homework.class}
                    </Typography>
                  </Box>
                  {getStatusIcon(homework.status)}
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Due Date: {homework.dueDate}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Submissions: {homework.submissions}/{homework.totalStudents}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Box
                      sx={{
                        width: '100%',
                        height: 8,
                        bgcolor: 'grey.200',
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}
                    >
                      <Box
                        sx={{
                          width: `${(homework.submissions / homework.totalStudents) * 100}%`,
                          height: '100%',
                          bgcolor: 'primary.main'
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ ml: 1 }}>
                      {Math.round((homework.submissions / homework.totalStudents) * 100)}%
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={homework.status}
                    color={getStatusColor(homework.status)}
                    size="small"
                  />
                  <Chip
                    label={`class ${homework.subject}`}
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