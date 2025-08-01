import React, { useState } from 'react';
import { Box, Typography, Paper, Button, Grid, Card, CardContent, Avatar, Dialog, DialogTitle, DialogContent } from '@mui/material';
import { Add, School, Person } from '@mui/icons-material';
import StudentRegistrationForm from '../components/StudentRegistrationForm';

const Students: React.FC = () => {
  const [openRegistration, setOpenRegistration] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const mockStudents = [
    { id: '1', name: 'John Doe', class: '10A', rollNumber: '001', attendance: '95%' },
    { id: '2', name: 'Jane Smith', class: '10A', rollNumber: '002', attendance: '92%' },
    { id: '3', name: 'Mike Johnson', class: '10B', rollNumber: '003', attendance: '88%' },
    { id: '4', name: 'Sarah Wilson', class: '10B', rollNumber: '004', attendance: '96%' },
  ];

  const handleRegisterStudent = async (data: any, faceData: any) => {
    setLoading(true);
    try {
      // TODO: Implement API call to register student with face data
      console.log('Registering student:', data, faceData);
      setOpenRegistration(false);
    } catch (error) {
      console.error('Error registering student:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Students Management</Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={() => setOpenRegistration(true)}
        >
          Add Student
        </Button>
      </Box>

      <Grid container spacing={3}>
        {mockStudents.map((student) => (
          <Grid item xs={12} sm={6} md={4} key={student.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2 }}>
                    <Person />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{student.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Class: {student.class} | Roll: {student.rollNumber}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2">
                  Attendance: {student.attendance}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog 
        open={openRegistration} 
        onClose={() => setOpenRegistration(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Register New Student</DialogTitle>
        <DialogContent>
          <StudentRegistrationForm
            onSubmit={handleRegisterStudent}
            loading={loading}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Students;