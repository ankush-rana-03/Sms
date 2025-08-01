import React from 'react';
import { Box, Typography, Button, Grid, Card, CardContent, Avatar, Chip } from '@mui/material';
import { Add, Person } from '@mui/icons-material';

const Teachers: React.FC = () => {
  const mockTeachers = [
    { 
      id: '1', 
      name: 'Dr. Sarah Johnson', 
      subjects: ['Mathematics', 'Physics'], 
      classes: ['10A', '10B'],
      status: 'active'
    },
    { 
      id: '2', 
      name: 'Mr. Robert Smith', 
      subjects: ['English', 'Literature'], 
      classes: ['9A', '9B'],
      status: 'active'
    },
    { 
      id: '3', 
      name: 'Ms. Emily Davis', 
      subjects: ['Chemistry', 'Biology'], 
      classes: ['11A', '11B'],
      status: 'active'
    },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Teachers Management</Typography>
        <Button variant="contained" startIcon={<Add />}>
          Add Teacher
        </Button>
      </Box>

      <Grid container spacing={3}>
        {mockTeachers.map((teacher) => (
          <Grid item xs={12} sm={6} md={4} key={teacher.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2 }}>
                    <Person />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{teacher.name}</Typography>
                    <Chip 
                      label={teacher.status} 
                      color="success" 
                      size="small" 
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Subjects:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {teacher.subjects.map((subject) => (
                      <Chip key={subject} label={subject} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Classes:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {teacher.classes.map((cls) => (
                      <Chip key={cls} label={cls} size="small" color="primary" />
                    ))}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Teachers;