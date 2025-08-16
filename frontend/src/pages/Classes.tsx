import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  Avatar, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  MenuItem, 
  Snackbar, 
  Alert, 
  CircularProgress,
  Chip,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Add, 
  Class as ClassIcon, 
  School, 
  People, 
  LocationOn, 
  CalendarToday,
  Assignment,
  Delete,
  Edit,
  Person
} from '@mui/icons-material';
import { apiService } from '../services/api';

interface ClassItem {
  _id: string;
  name: string;
  section: string;
  grade: string;
  academicYear: string;
  roomNumber?: string;
  capacity?: number;
  currentStrength?: number;
  classTeacher?: { _id: string; name: string; email: string } | null;
}

interface TeacherLite { _id: string; name: string; email: string; isActive: boolean }

const Classes: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAssign, setOpenAssign] = useState(false);
  const [openAddClass, setOpenAddClass] = useState(false);
  const [openDeleteClass, setOpenDeleteClass] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [teachers, setTeachers] = useState<TeacherLite[]>([]);
  const [teacherId, setTeacherId] = useState('');
  const [snackbar, setSnackbar] = useState<{open: boolean; message: string; severity: 'success'|'error'}>({open:false, message:'', severity:'success'});
  
  // Add Class form state
  const [newClass, setNewClass] = useState({
    name: '',
    section: '',
    academicYear: new Date().getFullYear().toString(),
    roomNumber: '',
    capacity: 40
  });

  // Predefined class options
  const classOptions = [
    { value: 'nursery', label: 'Nursery' },
    { value: 'lkg', label: 'LKG' },
    { value: 'ukg', label: 'UKG' },
    { value: '1', label: 'Class 1' },
    { value: '2', label: 'Class 2' },
    { value: '3', label: 'Class 3' },
    { value: '4', label: 'Class 4' },
    { value: '5', label: 'Class 5' },
    { value: '6', label: 'Class 6' },
    { value: '7', label: 'Class 7' },
    { value: '8', label: 'Class 8' },
    { value: '9', label: 'Class 9' },
    { value: '10', label: 'Class 10' },
    { value: '11', label: 'Class 11' },
    { value: '12', label: 'Class 12' }
  ];

  const sectionOptions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await apiService.get<{ success: boolean; data: ClassItem[] }>('/classes');
      if (res && (res as any).data) setClasses((res as any).data);
    } catch (e: any) {
      console.error('Error fetching classes:', e);
      let errorMessage = 'Failed to fetch classes';
      
      if (e?.response?.status === 401) {
        errorMessage = 'You are not authorized to view classes. Please log in.';
      } else if (e?.response?.status === 500) {
        errorMessage = 'Server error occurred while fetching classes. Please try again later.';
      } else if (e?.message) {
        errorMessage = e.message;
      }
      
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await apiService.get<{ success: boolean; data: any[]; count?: number }>('/admin/teachers');
      const allTeachers = (res as any).data?.map((t: any) => ({ _id: t._id, name: t.name, email: t.email, isActive: t.isActive })) || [];
      
      // Filter out teachers who are already assigned as class teachers
      const availableTeachers = allTeachers.filter((teacher: { _id: string; name: string; email: string; isActive: boolean }) => {
        // Check if this teacher is already assigned to any class
        const isAlreadyAssigned = classes.some(cls => cls.classTeacher?._id === teacher._id);
        return !isAlreadyAssigned && teacher.isActive;
      });
      
      setTeachers(availableTeachers);
      console.log('Available teachers for assignment:', availableTeachers);
    } catch (e: any) { 
      console.error('Error fetching teachers:', e);
      let errorMessage = 'Failed to fetch teachers';
      
      if (e?.response?.data?.message) {
        errorMessage = e.response.data.message;
      } else if (e?.response?.status === 401) {
        errorMessage = 'You are not authorized to view teachers. Please log in as admin.';
      } else if (e?.response?.status === 500) {
        errorMessage = 'Server error occurred. Please try again later.';
      } else if (e?.message) {
        errorMessage = e.message;
      }
      
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (openAssign) {
      fetchTeachers();
    }
  }, [openAssign, classes]);

  const handleOpenAssign = (cls: ClassItem) => {
    setSelectedClass(cls);
    setTeacherId(cls.classTeacher?._id || '');
    setOpenAssign(true);
  };

  const handleAssignTeacher = async () => {
    if (!selectedClass || !teacherId) return;
    
    try {
      const res = await apiService.put<{ success: boolean; message: string; data: ClassItem }>(`/classes/${selectedClass._id}/assign-teacher`, { teacherId });
      if ((res as any).success) {
        setClasses(prev => prev.map(c => c._id === selectedClass._id ? (res as any).data : c));
        setSnackbar({ open: true, message: 'Class teacher assigned successfully', severity: 'success' });
        setOpenAssign(false);
        setSelectedClass(null);
        setTeacherId('');
      } else {
        setSnackbar({ open: true, message: (res as any).message || 'Failed to assign class teacher', severity: 'error' });
      }
    } catch (e: any) {
      console.error('Error assigning class teacher:', e);
      let errorMessage = 'Failed to assign class teacher';
      
      if (e?.response?.data?.message) {
        errorMessage = e.response.data.message;
      } else if (e?.response?.status === 404) {
        errorMessage = 'Class or teacher not found.';
      } else if (e?.response?.status === 400) {
        errorMessage = 'Invalid data provided.';
      } else if (e?.response?.status === 401) {
        errorMessage = 'You are not authorized to assign class teachers.';
      } else if (e?.response?.status === 500) {
        errorMessage = 'Server error occurred. Please try again later.';
      } else if (e?.message) {
        errorMessage = e.message;
      }
      
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const handleUnassign = async (cls: ClassItem) => {
    try {
      const res = await apiService.delete<{ success: boolean; message: string; data: ClassItem }>(`/classes/${cls._id}/unassign-teacher`);
      if ((res as any).success) {
        setClasses(prev => prev.map(c => c._id === cls._id ? (res as any).data : c));
        setSnackbar({ open: true, message: 'Class teacher unassigned successfully', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: (res as any).message || 'Failed to unassign class teacher', severity: 'error' });
      }
    } catch (e: any) {
      console.error('Error unassigning class teacher:', e);
      let errorMessage = 'Failed to unassign class teacher';
      
      if (e?.response?.data?.message) {
        errorMessage = e.response.data.message;
      } else if (e?.response?.status === 404) {
        errorMessage = 'Class not found.';
      } else if (e?.response?.status === 401) {
        errorMessage = 'You are not authorized to unassign class teachers.';
      } else if (e?.response?.status === 500) {
        errorMessage = 'Server error occurred. Please try again later.';
      } else if (e?.message) {
        errorMessage = e.message;
      }
      
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const handleCreateClass = async () => {
    if (!newClass.name || !newClass.section || !newClass.academicYear) {
      setSnackbar({ open: true, message: 'Please fill in all required fields', severity: 'error' });
      return;
    }
    
    try {
      const res = await apiService.post<{ success: boolean; message: string; data: ClassItem }>('/classes', newClass);
      if ((res as any).success) {
        setClasses(prev => [(res as any).data, ...prev]);
        setSnackbar({ open: true, message: 'Class created successfully', severity: 'success' });
        setOpenAddClass(false);
        setNewClass({
          name: '',
          section: '',
          academicYear: new Date().getFullYear().toString(),
          roomNumber: '',
          capacity: 40
        });
      } else {
        setSnackbar({ open: true, message: (res as any).message || 'Failed to create class', severity: 'error' });
      }
    } catch (e: any) {
      console.error('Error creating class:', e);
      let errorMessage = 'Failed to create class';
      
      if (e?.response?.data?.message) {
        errorMessage = e.response.data.message;
      } else if (e?.message) {
        errorMessage = e.message;
      } else if (e?.response?.status === 400) {
        errorMessage = 'Invalid data provided. Please check your input.';
      } else if (e?.response?.status === 409) {
        errorMessage = 'A class with this name, section, and academic year already exists.';
      } else if (e?.response?.status === 401) {
        errorMessage = 'You are not authorized to create classes. Please log in as admin.';
      } else if (e?.response?.status === 500) {
        errorMessage = 'Server error occurred. Please try again later.';
      }
      
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const handleDeleteClass = async () => {
    if (!selectedClass) return;
    
    try {
      const res = await apiService.delete<{ success: boolean; message: string }>(`/classes/${selectedClass._id}`);
      if ((res as any).success) {
        setClasses(prev => prev.filter(c => c._id !== selectedClass._id));
        setSnackbar({ open: true, message: 'Class deleted successfully', severity: 'success' });
        setOpenDeleteClass(false);
        setSelectedClass(null);
      } else {
        setSnackbar({ open: true, message: (res as any).message || 'Failed to delete class', severity: 'error' });
      }
    } catch (e: any) {
      console.error('Error deleting class:', e);
      let errorMessage = 'Failed to delete class';
      
      if (e?.response?.data?.message) {
        errorMessage = e.response.data.message;
      } else if (e?.response?.status === 404) {
        errorMessage = 'Class not found.';
      } else if (e?.response?.status === 401) {
        errorMessage = 'You are not authorized to delete classes.';
      } else if (e?.response?.status === 400) {
        errorMessage = 'Cannot delete class with enrolled students.';
      } else if (e?.response?.status === 500) {
        errorMessage = 'Server error occurred. Please try again later.';
      } else if (e?.message) {
        errorMessage = e.message;
      }
      
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Enhanced Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography 
          variant="h3" 
          gutterBottom 
          sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2
          }}
        >
          Classes Management 🏫
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ opacity: 0.8, mb: 3 }}>
          Manage your school classes, sections, and teacher assignments
        </Typography>
        <Button 
          variant="contained" 
          size="large"
          startIcon={<Add />} 
          onClick={() => setOpenAddClass(true)}
          sx={{
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 600,
            borderRadius: 2,
            boxShadow: 2,
            '&:hover': {
              boxShadow: 4,
              transform: 'translateY(-2px)',
            },
            transition: 'all 0.2s ease-in-out'
          }}
        >
          Add New Class
        </Button>
      </Box>

      {classes.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 3, bgcolor: 'primary.main' }}>
            <School sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No classes found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Create your first class to get started with class management
          </Typography>
          <Button 
            variant="outlined" 
            size="large"
            startIcon={<Add />}
            onClick={() => setOpenAddClass(true)}
            sx={{ borderRadius: 2 }}
          >
            Create First Class
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {classes.map((cls) => (
            <Grid item xs={12} md={6} lg={4} key={cls._id}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'all 0.3s ease-in-out',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Header with gradient background */}
                  <Box sx={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    p: 2,
                    borderRadius: 2,
                    mb: 3,
                    textAlign: 'center'
                  }}>
                    <Avatar sx={{ 
                      mr: 2, 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      width: 48,
                      height: 48,
                      mx: 'auto',
                      mb: 1
                    }}>
                      <ClassIcon />
                    </Avatar>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      {cls.name === 'nursery' ? 'Nursery' : 
                       cls.name === 'lkg' ? 'LKG' : 
                       cls.name === 'ukg' ? 'UKG' : 
                       `Class ${cls.name}`}
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9 }}>
                      Section {cls.section}
                    </Typography>
                  </Box>

                  {/* Class Details */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CalendarToday sx={{ mr: 1, color: 'primary.main' }} fontSize="small" />
                      <Typography variant="body2" color="text.secondary">
                        Academic Year: {cls.academicYear}
                      </Typography>
                    </Box>
                    
                    {cls.roomNumber && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <LocationOn sx={{ mr: 1, color: 'primary.main' }} fontSize="small" />
                        <Typography variant="body2" color="text.secondary">
                          Room: {cls.roomNumber}
                        </Typography>
                      </Box>
                    )}
                    
                    {cls.capacity && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <People sx={{ mr: 1, color: 'primary.main' }} fontSize="small" />
                        <Typography variant="body2" color="text.secondary">
                          Capacity: {cls.capacity} students
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Class Teacher Status */}
                  <Box sx={{ mb: 3 }}>
                    {cls.classTeacher ? (
                      <Box sx={{ 
                        bgcolor: 'success.light', 
                        color: 'success.contrastText',
                        p: 2,
                        borderRadius: 2,
                        textAlign: 'center'
                      }}>
                        <Person sx={{ fontSize: 20, mb: 1 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Class Teacher: {cls.classTeacher.name}
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ 
                        bgcolor: 'warning.light', 
                        color: 'warning.contrastText',
                        p: 2,
                        borderRadius: 2,
                        textAlign: 'center'
                      }}>
                        <Assignment sx={{ fontSize: 20, mb: 1 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          No class teacher assigned
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button 
                      variant="contained" 
                      size="small"
                      onClick={() => handleOpenAssign(cls)}
                      startIcon={cls.classTeacher ? <Edit /> : <Assignment />}
                      sx={{ 
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600
                      }}
                    >
                      {cls.classTeacher ? 'Reassign' : 'Assign'}
                    </Button>
                    
                    {cls.classTeacher && (
                      <Button 
                        variant="outlined" 
                        size="small"
                        color="warning" 
                        onClick={() => handleUnassign(cls)}
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                      >
                        Unassign
                      </Button>
                    )}
                    
                    <Tooltip title="Delete Class">
                      <IconButton 
                        color="error" 
                        size="small"
                        onClick={() => {
                          setSelectedClass(cls);
                          setOpenDeleteClass(true);
                        }}
                        sx={{ borderRadius: 2 }}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Enhanced Add Class Dialog */}
      <Dialog 
        open={openAddClass} 
        onClose={() => setOpenAddClass(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1, 
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          borderRadius: '12px 12px 0 0'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Add New Class
            </Typography>
            <IconButton
              size="small"
              onClick={() => setOpenAddClass(false)}
              sx={{ 
                minWidth: 'auto', 
                p: 0.5,
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              ✕
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Fill in the details to create a new class
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Class Name"
                value={newClass.name}
                onChange={(e) => setNewClass(prev => ({ ...prev, name: e.target.value }))}
                size="small"
                required
                placeholder="Select class"
              >
                {classOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Section"
                value={newClass.section}
                onChange={(e) => setNewClass(prev => ({ ...prev, section: e.target.value }))}
                size="small"
                required
                placeholder="Select section"
              >
                {sectionOptions.map((section) => (
                  <MenuItem key={section} value={section}>
                    Section {section}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Academic Year"
                value={newClass.academicYear}
                onChange={(e) => setNewClass(prev => ({ ...prev, academicYear: e.target.value }))}
                size="small"
                required
                placeholder="e.g., 2024"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Room Number"
                value={newClass.roomNumber}
                onChange={(e) => setNewClass(prev => ({ ...prev, roomNumber: e.target.value }))}
                size="small"
                placeholder="e.g., 101, Lab 2"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Capacity"
                type="number"
                value={newClass.capacity}
                onChange={(e) => setNewClass(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                size="small"
                required
                placeholder="Maximum number of students"
                helperText="Default capacity is 40 students"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
          <Button 
            variant="outlined" 
            onClick={() => setOpenAddClass(false)}
            sx={{ mr: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateClass}
            variant="contained"
            size="large"
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: 2,
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4,
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            Create Class
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Assign Teacher Dialog */}
      <Dialog open={openAssign} onClose={() => setOpenAssign(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          pb: 1, 
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          borderRadius: '12px 12px 0 0'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Assign Class Teacher
            </Typography>
            <IconButton
              size="small"
              onClick={() => setOpenAssign(false)}
              sx={{ 
                minWidth: 'auto', 
                p: 0.5,
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              ✕
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Select a teacher to assign as class teacher for {selectedClass?.name === 'nursery' ? 'Nursery' : 
             selectedClass?.name === 'lkg' ? 'LKG' : 
             selectedClass?.name === 'ukg' ? 'UKG' : 
             `Class ${selectedClass?.name}`} - Section {selectedClass?.section}
          </Typography>
          
          <TextField
            fullWidth
            select
            label="Select Teacher"
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            size="small"
            required
            placeholder="Choose a teacher"
          >
            {teachers.map((teacher) => (
              <MenuItem key={teacher._id} value={teacher._id}>
                {teacher.name} ({teacher.email})
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
          <Button 
            variant="outlined" 
            onClick={() => setOpenAssign(false)}
            sx={{ mr: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssignTeacher}
            variant="contained"
            disabled={!teacherId}
            size="large"
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: 2,
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4,
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            Assign Teacher
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Delete Confirmation Dialog */}
      <Dialog open={openDeleteClass} onClose={() => setOpenDeleteClass(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          pb: 1, 
          background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)',
          color: 'white',
          borderRadius: '12px 12px 0 0'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Confirm Delete
            </Typography>
            <IconButton
              size="small"
              onClick={() => setOpenDeleteClass(false)}
              sx={{ 
                minWidth: 'auto', 
                p: 0.5,
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              ✕
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete{' '}
            <strong>
              {selectedClass?.name === 'nursery' ? 'Nursery' : 
               selectedClass?.name === 'lkg' ? 'LKG' : 
               selectedClass?.name === 'ukg' ? 'UKG' : 
               `Class ${selectedClass?.name}`} - Section {selectedClass?.section}
            </strong>?
          </Typography>
          <Typography variant="body2" color="error" sx={{ fontWeight: 500 }}>
            This action cannot be undone and will remove all associated data.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
          <Button 
            variant="outlined" 
            onClick={() => setOpenDeleteClass(false)}
            sx={{ mr: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteClass}
            variant="contained"
            color="error"
            size="large"
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: 2,
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4,
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            Delete Class
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Classes;