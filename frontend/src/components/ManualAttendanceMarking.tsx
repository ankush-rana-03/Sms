import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  Schedule as LateIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

interface Student {
  id: string;
  name: string;
  studentId: string;
}

interface AttendanceRecord {
  id?: string;
  status: 'present' | 'absent' | 'late';
  remarks?: string;
  markedAt?: string;
  markedBy?: string;
}

interface StudentAttendance {
  student: Student;
  attendance: AttendanceRecord | null;
  canEdit: boolean;
  isToday: boolean;
}

interface ManualAttendanceMarkingProps {
  classId: string;
  className?: string;
}

const ManualAttendanceMarking: React.FC<ManualAttendanceMarkingProps> = ({
  classId,
  className = 'Class'
}) => {
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<'present' | 'absent' | 'late'>('present');
  const [editRemarks, setEditRemarks] = useState<string>('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');
  const isToday = selectedDate === today;

  useEffect(() => {
    fetchTodayAttendance();
  }, [classId]);

  const fetchTodayAttendance = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/attendance/today/${classId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch attendance data');
      }

      const data = await response.json();
      setStudents(data.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (studentId: string, status: 'present' | 'absent' | 'late', remarks?: string) => {
    try {
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          studentId,
          status,
          remarks,
          attendanceDate: selectedDate
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark attendance');
      }

      const data = await response.json();
      setSuccess(`Attendance marked successfully for ${status}`);
      
      // Update local state
      setStudents(prev => prev.map(student => {
        if (student.student.id === studentId) {
          return {
            ...student,
            attendance: {
              status,
              remarks,
              markedAt: new Date().toISOString()
            }
          };
        }
        return student;
      }));

      // Close edit dialog if open
      if (editingStudent === studentId) {
        setIsEditDialogOpen(false);
        setEditingStudent(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to mark attendance');
    }
  };

  const updateAttendance = async (attendanceId: string, status: 'present' | 'absent' | 'late', remarks?: string) => {
    try {
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/attendance/${attendanceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status,
          remarks
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update attendance');
      }

      const data = await response.json();
      setSuccess('Attendance updated successfully');
      
      // Update local state
      setStudents(prev => prev.map(student => {
        if (student.student.id === editingStudent) {
          return {
            ...student,
            attendance: {
              ...student.attendance,
              status,
              remarks
            }
          };
        }
        return student;
      }));

      setIsEditDialogOpen(false);
      setEditingStudent(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update attendance');
    }
  };

  const handleEditClick = (student: StudentAttendance) => {
    setEditingStudent(student.student.id);
    setEditStatus(student.attendance?.status || 'present');
    setEditRemarks(student.attendance?.remarks || '');
    setIsEditDialogOpen(true);
  };

  const handleEditSave = () => {
    if (!editingStudent) return;

    const student = students.find(s => s.student.id === editingStudent);
    if (!student) return;

    if (student.attendance?.id) {
      // Update existing attendance
      updateAttendance(student.attendance.id, editStatus, editRemarks);
    } else {
      // Mark new attendance
      markAttendance(editingStudent, editStatus, editRemarks);
    }
  };

  const handleEditCancel = () => {
    setIsEditDialogOpen(false);
    setEditingStudent(null);
    setEditStatus('present');
    setEditRemarks('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'success';
      case 'absent':
        return 'error';
      case 'late':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <PresentIcon />;
      case 'absent':
        return <AbsentIcon />;
      case 'late':
        return <LateIcon />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Manual Attendance Marking - {className}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Date: {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
          {isToday && <Chip label="Today" color="primary" size="small" sx={{ ml: 2 }} />}
        </Typography>
        
        {!isToday && (
          <Alert severity="info" sx={{ mt: 2 }}>
            You can only mark attendance for today. This view is read-only for other dates.
          </Alert>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Remarks</TableCell>
              <TableCell>Marked At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((studentAttendance) => (
              <TableRow key={studentAttendance.student.id}>
                <TableCell>{studentAttendance.student.studentId}</TableCell>
                <TableCell>{studentAttendance.student.name}</TableCell>
                <TableCell>
                  {studentAttendance.attendance ? (
                    <Chip
                      icon={getStatusIcon(studentAttendance.attendance.status)}
                      label={studentAttendance.attendance.status.toUpperCase()}
                      color={getStatusColor(studentAttendance.attendance.status) as any}
                      size="small"
                    />
                  ) : (
                    <Chip label="NOT MARKED" color="default" size="small" />
                  )}
                </TableCell>
                <TableCell>
                  {studentAttendance.attendance?.remarks || '-'}
                </TableCell>
                <TableCell>
                  {studentAttendance.attendance?.markedAt 
                    ? format(new Date(studentAttendance.attendance.markedAt), 'HH:mm')
                    : '-'
                  }
                </TableCell>
                <TableCell>
                  {studentAttendance.canEdit && isToday ? (
                    <Box>
                      {!studentAttendance.attendance ? (
                        // Quick action buttons for unmarked attendance
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Mark Present">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => markAttendance(studentAttendance.student.id, 'present')}
                            >
                              <PresentIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Mark Absent">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => markAttendance(studentAttendance.student.id, 'absent')}
                            >
                              <AbsentIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Mark Late">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => markAttendance(studentAttendance.student.id, 'late')}
                            >
                              <LateIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ) : (
                        // Edit button for existing attendance
                        <Tooltip title="Edit Attendance">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditClick(studentAttendance)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {!isToday ? 'Read Only' : 'No Permission'}
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onClose={handleEditCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Attendance</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={editStatus}
                label="Status"
                onChange={(e) => setEditStatus(e.target.value as 'present' | 'absent' | 'late')}
              >
                <MenuItem value="present">Present</MenuItem>
                <MenuItem value="absent">Absent</MenuItem>
                <MenuItem value="late">Late</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Remarks (Optional)"
              value={editRemarks}
              onChange={(e) => setEditRemarks(e.target.value)}
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditCancel} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button 
            onClick={handleEditSave} 
            variant="contained" 
            startIcon={<SaveIcon />}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManualAttendanceMarking;