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

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await apiService.get<{ success: boolean; data: ClassItem[] }>('/classes');
      if (res && (res as any).data) setClasses((res as any).data);
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.message || 'Failed to fetch classes', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await apiService.get<{ success: boolean; data: any[]; count?: number }>('/admin/teachers');
      const list = (res as any).data?.map((t: any) => ({ _id: t._id, name: t.name, email: t.email, isActive: t.isActive })) || [];
      setTeachers(list);
    } catch (e) { /* noop */ }
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
      } else {
        setSnackbar({ open: true, message: (res as any).message || 'Failed to assign', severity: 'error' });
      }
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.response?.data?.message || e?.message || 'Failed to assign', severity: 'error' });
    }
  };

  const handleUnassign = async (cls: ClassItem) => {
    try {
      const res = await apiService.delete<{ success: boolean; message: string }>(`/classes/${cls._id}/class-teacher`);
      if ((res as any).success) {
        setClasses(prev => prev.map(c => c._id === cls._id ? { ...c, classTeacher: null } : c));
        setSnackbar({ open: true, message: 'Class teacher unassigned', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: (res as any).message || 'Failed to unassign', severity: 'error' });
      }
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.response?.data?.message || e?.message || 'Failed to unassign', severity: 'error' });
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
      setSnackbar({ open: true, message: e?.response?.data?.message || e?.message || 'Failed to create class', severity: 'error' });
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
                      <Typography variant="h6">{cls.name} - Section {cls.section}</Typography>
                      {cls.classTeacher ? (
                        <Typography variant="body2" color="text.secondary">
                          Class Teacher: {cls.classTeacher.name}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">No class teacher assigned</Typography>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" onClick={() => handleOpenAssign(cls)}>
                      {cls.classTeacher ? 'Reassign Class Teacher' : 'Assign Class Teacher'}
                    </Button>
                    {cls.classTeacher && (
                      <Button variant="outlined" color="error" onClick={() => handleUnassign(cls)}>
                        Unassign
                      </Button>
                    )}
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
            label="Class Name"
            value={newClass.name}
            onChange={(e) => setNewClass(prev => ({ ...prev, name: e.target.value }))}
            margin="normal"
            placeholder="e.g., Class 10"
            required
          />
          <TextField
            fullWidth
            label="Section"
            value={newClass.section}
            onChange={(e) => setNewClass(prev => ({ ...prev, section: e.target.value }))}
            margin="normal"
            placeholder="e.g., A, B, C"
            required
          />
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
        <DialogTitle>Assign Class Teacher</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            select
            label="Select Teacher"
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            margin="normal"
          >
            {teachers.map(t => (
              <MenuItem key={t._id} value={t._id} disabled={!t.isActive}>
                {t.name} ({t.email}) {t.isActive ? '' : ' - inactive'}
              </MenuItem>
            ))}
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

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(prev => ({...prev, open:false}))}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({...prev, open:false}))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Classes;