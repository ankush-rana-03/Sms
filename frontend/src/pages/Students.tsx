import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
} from '@mui/material';
import { Add, Person } from '@mui/icons-material';
import StudentRegistrationForm from '../components/StudentRegistrationForm';
import studentService from '../services/studentService';
import classService, { ClassWithSections } from '../services/classService';
import { useAuth } from '../contexts/AuthContext';

const Students: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [openRegistration, setOpenRegistration] = useState(false);
  const [fetchingStudents, setFetchingStudents] = useState(true);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<ClassWithSections[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  useEffect(() => {
    fetchStudents();
    fetchAvailableClasses();
  }, []);

  const fetchAvailableClasses = async () => {
    try {
      setLoadingClasses(true);
      const response = await classService.getAvailableClassesForRegistration();
      if (response.success) {
        setAvailableClasses(response.data.classes);
      }
    } catch (error: any) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setFetchingStudents(true);
      setError(null);
      const response = await studentService.getStudents({ search, grade: gradeFilter, section: sectionFilter });
      setStudents(response.data);
    } catch (error: any) {
      console.error('Error fetching students:', error);
      setError(error.message || 'Failed to fetch students');
    } finally {
      setFetchingStudents(false);
    }
  };

  const handleRegisterStudent = async (data: any) => {
    try {
      const response = await studentService.createStudent(data);
      if (response.success) {
        setStudents(prev => [response.data, ...prev]);
        setToastMessage('Student registered successfully!');
        setToastSeverity('success');
        setShowToast(true);
        setSuccess('Student registered successfully!');
        setOpenRegistration(false);
      }
    } catch (error: any) {
      console.error('Error handling student registration:', error);
      const msg = error?.message || 'Failed to complete registration';
      setToastMessage(msg);
      setToastSeverity('error');
      setShowToast(true);
    }
  };

  // Get sections for selected class
  const getSectionsForClass = (className: string) => {
    const classData = availableClasses.find(cls => cls.name === className);
    return classData ? classData.sections : [];
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Students
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenRegistration(true)}
        >
          Add Student
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField size="small" label="Search" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchStudents()} />
        <TextField 
          size="small" 
          select 
          label="Class" 
          value={gradeFilter} 
          onChange={(e) => setGradeFilter(e.target.value)} 
          sx={{ minWidth: 140 }}
          disabled={loadingClasses}
        >
          <MenuItem value="">All Classes</MenuItem>
          {availableClasses.map(cls => (
            <MenuItem key={cls.name} value={cls.name}>
              {cls.displayName}
            </MenuItem>
          ))}
        </TextField>
        <TextField 
          size="small" 
          select 
          label="Section" 
          value={sectionFilter} 
          onChange={(e) => setSectionFilter(e.target.value)} 
          sx={{ minWidth: 140 }}
          disabled={!gradeFilter || loadingClasses}
        >
          <MenuItem value="">All Sections</MenuItem>
          {gradeFilter && getSectionsForClass(gradeFilter).map(s => (
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
                        Class: {student.grade === 'nursery' ? 'Nursery' : 
                                student.grade === 'lkg' ? 'LKG' : 
                                student.grade === 'ukg' ? 'UKG' : 
                                `Class ${student.grade}`} | Email: {student.email}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Phone: {student.phone}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    {Boolean((student as any).pendingApproval) && (
                      <Chip label="Pending Approval" color="warning" size="small" />
                    )}
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
                    {Boolean((student as any).pendingApproval) && (
                      <Button size="small" color="success" variant="contained" onClick={async () => {
                        try {
                          const res = await studentService.approveStudent(student._id);
                          setStudents(prev => prev.map(s => s._id === student._id ? res.data : s));
                          setToastMessage('Student approved');
                          setToastSeverity('success');
                          setShowToast(true);
                        } catch (e: any) {
                          setToastMessage(e.message || 'Approval failed');
                          setToastSeverity('error');
                          setShowToast(true);
                        }
                      }}>Approve</Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Registration Dialog */}
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
            loading={fetchingStudents}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setOpenRegistration(false)} sx={{ mr: 'auto' }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Notification */}
      {showToast && (
        <Alert
          severity={toastSeverity}
          sx={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            minWidth: 300
          }}
          onClose={() => setShowToast(false)}
        >
          {toastMessage}
        </Alert>
      )}
    </Box>
  );
};

export default Students;