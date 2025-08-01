import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Card, CardContent, Avatar, Dialog, DialogTitle, DialogContent, Alert, CircularProgress, Snackbar } from '@mui/material';
import { Add, Person, Refresh } from '@mui/icons-material';
import StudentRegistrationForm from '../components/StudentRegistrationForm';
import studentService, { Student } from '../services/studentService';

const Students: React.FC = () => {
  const [openRegistration, setOpenRegistration] = useState(false);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [fetchingStudents, setFetchingStudents] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error'>('success');

  // Fetch students on component mount
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setFetchingStudents(true);
      const response = await studentService.getStudents();
      setStudents(response.data);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching students:', error);
      setError('Failed to fetch students');
    } finally {
      setFetchingStudents(false);
    }
  };

  const handleRegisterStudent = async (data: any, faceData: any) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // The student is already saved in the form component
      // Just refresh the students list and show success
      await fetchStudents();
      
      // Show success toast
      setToastMessage('Student registered successfully with facial data!');
      setToastSeverity('success');
      setShowToast(true);
      
      setSuccess('Student registered successfully with facial data!');
      setOpenRegistration(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error handling student registration:', error);
      
      // Show error toast
      setToastMessage('Failed to complete registration');
      setToastSeverity('error');
      setShowToast(true);
      
      setError('Failed to complete registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Students Management</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<Refresh />}
            onClick={fetchStudents}
            disabled={fetchingStudents}
          >
            Refresh
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => setOpenRegistration(true)}
          >
            Add Student
          </Button>
        </Box>
      </Box>

      {/* Success/Error Messages */}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {fetchingStudents ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : students.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No students found. Add your first student!
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {students.map((student) => (
            <Grid item xs={12} sm={6} md={4} key={student._id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2 }}>
                      <Person />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{student.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Grade: {student.grade} | Email: {student.email}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Phone: {student.phone}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Face Registered: {student.facialData?.isFaceRegistered ? '✅ Yes' : '❌ No'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

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

      {/* Toast Notification */}
      <Snackbar
        open={showToast}
        autoHideDuration={4000}
        onClose={() => setShowToast(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowToast(false)} 
          severity={toastSeverity}
          sx={{ width: '100%' }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Students;