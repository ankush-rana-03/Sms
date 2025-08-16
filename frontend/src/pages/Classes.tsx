import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Grid, Card, CardContent, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Snackbar, Alert, CircularProgress } from '@mui/material';
import { Add, Class as ClassIcon } from '@mui/icons-material';
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
      
      if (e?.response?.status === 401) {
        errorMessage = 'You are not authorized to view teachers. Please log in as admin.';
      } else if (e?.response?.status === 500) {
        errorMessage = 'Server error occurred while fetching teachers.';
      } else if (e?.message) {
        errorMessage = e.message;
      }
      
      console.error(errorMessage);
      setTeachers([]);
    }
  };

  useEffect(() => { fetchClasses(); }, []);

  const handleOpenAssign = async (cls: ClassItem) => {
    setSelectedClass(cls);
    setTeacherId('');
    await fetchTeachers();
    setOpenAssign(true);
  };

  const handleAssign = async () => {
    if (!selectedClass || !teacherId) return;
    try {
      const res = await apiService.put<{ success: boolean; message: string; data: ClassItem }>(`/classes/${selectedClass._id}/class-teacher`, { teacherId });
      if ((res as any).success) {
        const updated = (res as any).data as ClassItem;
        setClasses(prev => prev.map(c => c._id === updated._id ? { ...c, classTeacher: updated.classTeacher } : c));
        setSnackbar({ open: true, message: 'Class teacher assigned', severity: 'success' });
        setOpenAssign(false);
        
        // Refresh the teacher list to remove the newly assigned teacher
        await fetchTeachers();
      } else {
        setSnackbar({ open: true, message: (res as any).message || 'Failed to assign', severity: 'error' });
      }
    } catch (e: any) {
      console.error('Error assigning class teacher:', e);
      let errorMessage = 'Failed to assign class teacher';
      
      if (e?.response?.data?.message) {
        errorMessage = e.response.data.message;
      } else if (e?.response?.status === 400) {
        errorMessage = 'Invalid teacher data provided.';
      } else if (e?.response?.status === 404) {
        errorMessage = 'Class or teacher not found.';
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
      const res = await apiService.delete<{ success: boolean; message: string }>(`/classes/${cls._id}/class-teacher`);
      if ((res as any).success) {
        setClasses(prev => prev.map(c => c._id === cls._id ? { ...c, classTeacher: null } : c));
        setSnackbar({ open: true, message: 'Class teacher unassigned', severity: 'success' });
        
        // Refresh the teacher list to include the newly unassigned teacher
        await fetchTeachers();
      } else {
        setSnackbar({ open: true, message: (res as any).message || 'Failed to unassign', severity: 'error' });
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

  const handleAddClass = async () => {
    try {
      const res = await apiService.post<{ success: boolean; message: string; data: ClassItem }>('/classes', newClass);
      if ((res as any).success) {
        const createdClass = (res as any).data as ClassItem;
        setClasses(prev => [...prev, createdClass]);
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
        
        // Refresh the teacher list to update teacher assignments after class deletion
        await fetchTeachers();
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
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Classes Management</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpenAddClass(true)}>
          Add Class
        </Button>
      </Box>

      {classes.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No classes found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create your first class to get started
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {classes.map((cls) => (
            <Grid item xs={12} md={6} key={cls._id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      <ClassIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {cls.name === 'nursery' ? 'Nursery' : 
                         cls.name === 'lkg' ? 'LKG' : 
                         cls.name === 'ukg' ? 'UKG' : 
                         `Class ${cls.name}`} - Section {cls.section}
                      </Typography>
                      {cls.classTeacher ? (
                        <Typography variant="body2" color="text.secondary">
                          Class Teacher: {cls.classTeacher.name}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">No class teacher assigned</Typography>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button variant="outlined" onClick={() => handleOpenAssign(cls)}>
                      {cls.classTeacher ? 'Reassign Class Teacher' : 'Assign Class Teacher'}
                    </Button>
                    {cls.classTeacher && (
                      <Button variant="outlined" color="error" onClick={() => handleUnassign(cls)}>
                        Unassign
                      </Button>
                    )}
                    <Button 
                      variant="outlined" 
                      color="error" 
                      onClick={() => {
                        setSelectedClass(cls);
                        setOpenDeleteClass(true);
                      }}
                    >
                      Delete Class
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add Class Dialog */}
      <Dialog open={openAddClass} onClose={() => setOpenAddClass(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Class</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            select
            label="Class Name"
            value={newClass.name}
            onChange={(e) => setNewClass(prev => ({ ...prev, name: e.target.value }))}
            margin="normal"
            required
          >
            {classOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            select
            label="Section"
            value={newClass.section}
            onChange={(e) => setNewClass(prev => ({ ...prev, section: e.target.value }))}
            margin="normal"
            required
          >
            {sectionOptions.map((section) => (
              <MenuItem key={section} value={section}>
                Section {section}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Academic Year"
            value={newClass.academicYear}
            onChange={(e) => setNewClass(prev => ({ ...prev, academicYear: e.target.value }))}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Room Number"
            value={newClass.roomNumber}
            onChange={(e) => setNewClass(prev => ({ ...prev, roomNumber: e.target.value }))}
            margin="normal"
            placeholder="e.g., 101, Lab 2"
          />
          <TextField
            fullWidth
            label="Capacity"
            type="number"
            value={newClass.capacity}
            onChange={(e) => setNewClass(prev => ({ ...prev, capacity: parseInt(e.target.value) || 40 }))}
            margin="normal"
            inputProps={{ min: 1, max: 100 }}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setOpenAddClass(false)} sx={{ mr: 'auto' }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleAddClass}
            disabled={!newClass.name || !newClass.section || !newClass.academicYear}
          >
            Create Class
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Class Teacher Dialog */}
      <Dialog open={openAssign} onClose={() => setOpenAssign(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Assign Class Teacher
          {teachers.length > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontWeight: 'normal' }}>
              Only available teachers are shown (teachers not already assigned to other classes)
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            select
            label="Select Teacher"
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            margin="normal"
            disabled={teachers.length === 0}
          >
            {teachers.length === 0 ? (
              <MenuItem disabled>No available teachers. All teachers are already assigned as class teachers.</MenuItem>
            ) : (
              teachers.map(t => (
                <MenuItem key={t._id} value={t._id} disabled={!t.isActive}>
                  {t.name} ({t.email}) {t.isActive ? '' : ' - inactive'}
                </MenuItem>
              ))
            )}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setOpenAssign(false)} sx={{ mr: 'auto' }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleAssign} disabled={!teacherId}>
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Class Dialog */}
      <Dialog open={openDeleteClass} onClose={() => setOpenDeleteClass(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Class</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this class?
          </Typography>
          <Typography variant="h6" sx={{ mt: 2, fontWeight: 'bold' }}>
            {selectedClass?.name === 'nursery' ? 'Nursery' : 
             selectedClass?.name === 'lkg' ? 'LKG' : 
             selectedClass?.name === 'ukg' ? 'UKG' : 
             `Class ${selectedClass?.name}`} - Section {selectedClass?.section}
          </Typography>
          <Typography sx={{ mt: 2, color: 'error.main', fontWeight: 'bold' }}>
            ⚠️ WARNING: This action cannot be undone!
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              This will permanently delete:
            </Typography>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>The class and all its settings</li>
              <li>Class teacher assignment (if any)</li>
              <li>All teacher assignments for this class</li>
              <li>Students will need to be reassigned to other classes</li>
            </ul>
          </Box>
          <Typography sx={{ mt: 2 }}>
            Are you absolutely sure you want to proceed?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setOpenDeleteClass(false)} sx={{ mr: 'auto' }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleDeleteClass}
          >
            Delete Class
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(prev => ({...prev, open:false}))}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({...prev, open:false}))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Classes;