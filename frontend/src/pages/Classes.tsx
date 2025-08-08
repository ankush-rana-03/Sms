import React from 'react';
import { Box, Typography, Button, Grid, Card, CardContent, Avatar, Chip, List, ListItem, ListItemText } from '@mui/material';
import { Add, Class } from '@mui/icons-material';

const Classes: React.FC = () => {
  const mockClasses = [
    {
      id: '1',
      name: 'Class 10A',
      teacher: 'Dr. Sarah Johnson',
      students: 35,
      subjects: ['Mathematics', 'Physics', 'English', 'Chemistry'],
      schedule: [
        { day: 'Monday', time: '8:00 AM - 3:30 PM' },
        { day: 'Tuesday', time: '8:00 AM - 3:30 PM' },
        { day: 'Wednesday', time: '8:00 AM - 3:30 PM' },
      ]
    },
    {
      id: '2',
      name: 'Class 10B',
      teacher: 'Mr. Robert Smith',
      students: 32,
      subjects: ['Mathematics', 'Physics', 'English', 'Chemistry'],
      schedule: [
        { day: 'Monday', time: '8:00 AM - 3:30 PM' },
        { day: 'Tuesday', time: '8:00 AM - 3:30 PM' },
        { day: 'Wednesday', time: '8:00 AM - 3:30 PM' },
      ]
    },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Classes Management</Typography>
        <Button variant="contained" startIcon={<Add />}>
          Add Class
        </Button>
      </Box>

      <Grid container spacing={3}>
        {mockClasses.map((cls) => (
          <Grid item xs={12} md={6} key={cls.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    <Class />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{cls.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Teacher: {cls.teacher}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Students: {cls.students}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    class Subjects:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {cls.subjects.map((subject) => (
                      <Chip key={subject} label={`class ${subject}`} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Schedule:
                  </Typography>
                  <List dense>
                    {cls.schedule.map((item, index) => (
                      <ListItem key={index} sx={{ py: 0 }}>
                        <ListItemText
                          primary={item.day}
                          secondary={item.time}
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Classes;