import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  Snackbar,
  Alert,
} from '@mui/material';
import { Add, Delete, Edit, Schedule } from '@mui/icons-material';
import { apiService } from '../services/api';

interface TeacherOption {
  _id: string;
  name: string;
  teacherId: string;
}

interface ClassOption {
  _id: string;
  name: string;
  section: string;
}

interface TeacherDetail {
  _id: string;
  name: string;
  teacherId: string;
  assignedClasses: Array<{
    class: string | { _id: string; name: string; section: string };
    section: string;
    subject: string;
    grade: string;
    time?: string;
    day?: string;
  }>;
}

interface AssignmentRow {
  class: string;   // class id or name
  section: string;
  subject: string;
  grade: string;
  day: string;
  time: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIMES = [
  '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
  '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM'
];

const Actions: React.FC = () => {
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [teacherDetail, setTeacherDetail] = useState<TeacherDetail | null>(null);

  const [form, setForm] = useState<AssignmentRow>({
    class: '',
    section: '',
    subject: '',
    grade: '',
    day: '',
    time: ''
  });

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({ open: false, message: '', severity: 'success' });
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => setSnackbar({ open: true, message, severity });

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await apiService.get<{ success: boolean; data: any[]; total: number; page: number; totalPages: number; count: number }>(`/admin/teachers?page=1&limit=100`);
        const teacherOptions = (res.data || []).map(t => ({ _id: t._id, name: t.name, teacherId: t.teacherId }));
        setTeachers(teacherOptions);
      } catch (e) {
        showSnackbar('Failed to load teachers', 'error');
      }
    };

    const fetchClasses = async () => {
      try {
        const res = await apiService.get<{ success: boolean; data: ClassOption[] }>(`/classes`);
        setClasses(res.data || []);
      } catch (e) {
        showSnackbar('Failed to load classes', 'error');
      }
    };

    fetchTeachers();
    fetchClasses();
  }, []);

  useEffect(() => {
    const fetchTeacherDetail = async () => {
      if (!selectedTeacherId) {
        setTeacherDetail(null);
        return;
      }
      try {
        const res = await apiService.get<{ success: boolean; data: TeacherDetail }>(`/admin/teachers/${selectedTeacherId}`);
        setTeacherDetail(res.data);
      } catch (e) {
        showSnackbar('Failed to load teacher detail', 'error');
      }
    };
    fetchTeacherDetail();
  }, [selectedTeacherId]);

  const timetable = useMemo(() => {
    const table: Record<string, AssignmentRow[]> = {};
    DAYS.forEach(d => { table[d] = []; });
    if (!teacherDetail) return table;

    for (const ac of teacherDetail.assignedClasses || []) {
      table[ac.day || 'Monday'].push({
        class: typeof ac.class === 'object' ? ac.class.name : (ac.class as string),
        section: ac.section,
        subject: ac.subject,
        grade: ac.grade,
        day: ac.day || 'Monday',
        time: ac.time || '9:00 AM'
      });
    }
    // Sort by time within day
    Object.keys(table).forEach(day => {
      table[day] = table[day].sort((a, b) => TIMES.indexOf(a.time) - TIMES.indexOf(b.time));
    });
    return table;
  }, [teacherDetail]);

  const validateForm = (): string | null => {
    if (!selectedTeacherId) return 'Select a teacher';
    if (!form.class) return 'Select a class';
    if (!form.section) return 'Select a section';
    if (!form.subject.trim()) return 'Enter a subject';
    if (!form.day) return 'Select a day';
    if (!form.time) return 'Select a time';

    // Check conflict with current timetable
    const conflicts = (timetable[form.day] || []).some(row => row.time === form.time);
    if (conflicts) return `Time conflict: ${form.day} at ${form.time} already assigned`;
    return null;
  };

  const handleAdd = async () => {
    const err = validateForm();
    if (err) { showSnackbar(err, 'error'); return; }
    try {
      const payload = { assignedClasses: [{
        class: form.class,
        section: form.section,
        subject: form.subject,
        grade: form.grade || form.class,
        day: form.day,
        time: form.time,
      }]};
      const res = await apiService.post<{ success: boolean; data: TeacherDetail; message: string }>(`/admin/teachers/${selectedTeacherId}/assign-classes`, payload);
      setTeacherDetail(res.data);
      showSnackbar('Assigned successfully');
      setForm({ class: '', section: '', subject: '', grade: '', day: '', time: '' });
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to assign';
      showSnackbar(msg, 'error');
    }
  };

  const handleDelete = async (row: AssignmentRow) => {
    if (!teacherDetail) return;
    try {
      // Build remaining assignments excluding the target
      const remaining = (teacherDetail.assignedClasses || []).filter(ac => {
        const className = typeof ac.class === 'object' ? ac.class.name : (ac.class as string);
        return !(className === row.class && ac.section === row.section && ac.subject === row.subject && (ac.day || 'Monday') === row.day && (ac.time || '9:00 AM') === row.time);
      }).map(ac => ({
        class: typeof ac.class === 'object' ? (ac.class as any)._id || (ac.class as any).name : (ac.class as string),
        section: ac.section,
        subject: ac.subject,
        grade: ac.grade,
        day: ac.day || 'Monday',
        time: ac.time || '9:00 AM'
      }));

      // Repost entire set to controller to overwrite
      const res = await apiService.post<{ success: boolean; data: TeacherDetail }>(`/admin/teachers/${teacherDetail._id}/assign-classes`, { assignedClasses: remaining });
      setTeacherDetail(res.data);
      showSnackbar('Deleted entry');
    } catch (e) {
      showSnackbar('Failed to delete', 'error');
    }
  };

  const [editTarget, setEditTarget] = useState<AssignmentRow | null>(null);
  const [editForm, setEditForm] = useState<AssignmentRow | null>(null);

  const openEdit = (row: AssignmentRow) => {
    setEditTarget(row);
    setEditForm(row);
  };

  const handleEditSave = async () => {
    if (!teacherDetail || !editForm) return;
    // Conflict check
    const err = (!editForm.day || !editForm.time) ? 'Select day and time' : null;
    if (err) { showSnackbar(err, 'error'); return; }

    try {
      // Build new list: replace target row with editForm
      const updated = (teacherDetail.assignedClasses || []).map(ac => {
        const className = typeof ac.class === 'object' ? ac.class.name : (ac.class as string);
        if (editTarget && className === editTarget.class && ac.section === editTarget.section && ac.subject === editTarget.subject && (ac.day || 'Monday') === editTarget.day && (ac.time || '9:00 AM') === editTarget.time) {
          return {
            class: editForm.class,
            section: editForm.section,
            subject: editForm.subject,
            grade: editForm.grade || editForm.class,
            day: editForm.day,
            time: editForm.time,
          };
        }
        return {
          class: typeof ac.class === 'object' ? (ac.class as any)._id || (ac.class as any).name : (ac.class as string),
          section: ac.section,
          subject: ac.subject,
          grade: ac.grade,
          day: ac.day || 'Monday',
          time: ac.time || '9:00 AM'
        };
      });

      const res = await apiService.post<{ success: boolean; data: TeacherDetail }>(`/admin/teachers/${teacherDetail._id}/assign-classes`, { assignedClasses: updated });
      setTeacherDetail(res.data);
      setEditTarget(null);
      setEditForm(null);
      showSnackbar('Updated assignment');
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to update';
      showSnackbar(msg, 'error');
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Schedule fontSize="small" /> Teacher Timetable Actions
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Teacher</InputLabel>
            <Select value={selectedTeacherId} label="Teacher" onChange={(e) => setSelectedTeacherId(e.target.value)}>
              {teachers.map(t => (
                <MenuItem key={t._id} value={t._id}>{t.name} ({t.teacherId})</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Add Assignment</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Class</InputLabel>
                <Select value={form.class} label="Class" onChange={(e) => setForm({ ...form, class: e.target.value })}>
                  {classes.map(c => (
                    <MenuItem key={c._id} value={c._id}>{c.name} - {c.section}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField label="Section" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} fullWidth />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} fullWidth />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Day</InputLabel>
                <Select value={form.day} label="Day" onChange={(e) => setForm({ ...form, day: e.target.value })}>
                  {DAYS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Time</InputLabel>
                <Select value={form.time} label="Time" onChange={(e) => setForm({ ...form, time: e.target.value })}>
                  {TIMES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" startIcon={<Add />} onClick={handleAdd} disabled={!selectedTeacherId}>Add</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Current Timetable</Typography>
          {DAYS.map(day => (
            <Box key={day} sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>{day}</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>Class</TableCell>
                    <TableCell>Section</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(timetable[day] || []).map((row) => (
                    <TableRow key={`${row.day}-${row.time}-${row.class}-${row.section}-${row.subject}`}>
                      <TableCell>{row.time}</TableCell>
                      <TableCell>{row.class}</TableCell>
                      <TableCell>{row.section}</TableCell>
                      <TableCell>{row.subject}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => openEdit(row)}><Edit fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => handleDelete(row)}><Delete fontSize="small" color="error" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ))}
        </CardContent>
      </Card>

      {editForm && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Edit Assignment</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Class</InputLabel>
                  <Select value={editForm.class} label="Class" onChange={(e) => setEditForm({ ...editForm, class: e.target.value })}>
                    {classes.map(c => (
                      <MenuItem key={c._id} value={c._id}>{c.name} - {c.section}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField label="Section" value={editForm.section} onChange={(e) => setEditForm({ ...editForm, section: e.target.value })} fullWidth />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField label="Subject" value={editForm.subject} onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })} fullWidth />
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Day</InputLabel>
                  <Select value={editForm.day} label="Day" onChange={(e) => setEditForm({ ...editForm, day: e.target.value })}>
                    {DAYS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Time</InputLabel>
                  <Select value={editForm.time} label="Time" onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}>
                    {TIMES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button variant="contained" onClick={handleEditSave}>Save Changes</Button>
                  <Button variant="outlined" color="inherit" onClick={() => { setEditForm(null); setEditTarget(null); }}>Cancel</Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Actions;