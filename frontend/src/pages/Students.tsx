import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Card, CardContent, Avatar, Dialog, DialogTitle, DialogContent, Alert, CircularProgress, Snackbar, TextField, MenuItem, DialogActions } from '@mui/material';
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
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');

  // Fetch students on component mount
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setError(null);
    try {
      setFetchingStudents(true);
      const response = await studentService.getStudents({ search, grade: gradeFilter, section: sectionFilter });
      setStudents(response.data);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching students:', error);
      setError('Failed to fetch students');
    } finally {
      setFetchingStudents(false);
    }
  };

  const handleRegisterStudent = async (data: any) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await studentService.createStudent(data);
      // Optimistic UI: prepend new student
      if (res?.data) {
        setStudents(prev => [res.data, ...prev]);
      } else {
        await fetchStudents();
      }
      setToastMessage('Student registered successfully!');
      setToastSeverity('success');
      setShowToast(true);
      setSuccess('Student registered successfully!');
      setOpenRegistration(false);
      setTimeout(() => setSuccess(null), 2000);
    } catch (error: any) {
      console.error('Error handling student registration:', error);
      const msg = error?.message || 'Failed to complete registration';
      setToastMessage(msg);
      setToastSeverity('error');
      setShowToast(true);
      setError(msg);
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

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField size="small" label="Search" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchStudents()} />
        <TextField size="small" select label="Grade" value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} sx={{ minWidth: 140 }}>
          <MenuItem value="">All Grades</MenuItem>
          {['1','2','3','4','5','6','7','8','9','10','11','12'].map(g => (
            <MenuItem key={g} value={g}>Grade {g}</MenuItem>
          ))}
        </TextField>
        <TextField size="small" select label="Section" value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} sx={{ minWidth: 140 }}>
          <MenuItem value="">All Sections</MenuItem>
          {['A','B','C','D','E'].map(s => (
            <MenuItem key={s} value={s}>Section {s}</MenuItem>
          ))}
        </TextField>
        <Button variant="outlined" onClick={fetchStudents}>Apply</Button>
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
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button size="small" variant="outlined" onClick={async () => {
                      // quick demo: toggle section between A/B
                      const nextSection = student.section === 'A' ? 'B' : 'A';
                      try {
                        const res = await studentService.updateStudent(student._id, { section: nextSection });
                        setStudents(prev => prev.map(s => s._id === student._id ? res.data : s));
                        setToastMessage('Student updated');
                        setToastSeverity('success');
                        setShowToast(true);
                      } catch (e: any) {
                        setToastMessage(e.message || 'Update failed');
                        setToastSeverity('error');
                        setShowToast(true);
                      }
                    }}>Edit</Button>
                    <Button size="small" color="error" variant="outlined" onClick={async () => {
                      if (!window.confirm('Delete this student?')) return;
                      try {
                        await studentService.deleteStudent(student._id);
                        setStudents(prev => prev.filter(s => s._id !== student._id));
                        setToastMessage('Student deleted');
                        setToastSeverity('success');
                        setShowToast(true);
                      } catch (e: any) {
                        setToastMessage(e.message || 'Delete failed');
                        setToastSeverity('error');
                        setShowToast(true);
                      }
                    }}>Delete</Button>
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
        <DialogActions>
          <Button variant="outlined" onClick={() => setOpenRegistration(false)} sx={{ mr: 'auto' }}>
            Cancel
          </Button>
        </DialogActions>
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