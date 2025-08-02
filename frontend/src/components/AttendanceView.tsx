import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  Schedule as LateIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { format, isToday, isFuture, parseISO } from 'date-fns';

interface Student {
  id: string;
  name: string;
  studentId: string;
}

interface AttendanceRecord {
  id: string;
  status: 'present' | 'absent' | 'late';
  remarks?: string;
  markedAt: string;
  markedBy: string;
  date: string;
  canEdit: boolean;
  isFuture: boolean;
  isToday: boolean;
}

interface AttendanceViewProps {
  classId: string;
  className?: string;
}

const AttendanceView: React.FC<AttendanceViewProps> = ({
  classId,
  className = 'Class'
}) => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<'present' | 'absent' | 'late'>('present');
  const [editRemarks, setEditRemarks] = useState<string>('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>('');

  const today = format(new Date(), 'yyyy-MM-dd');
  const isSelectedDateToday = selectedDate === today;
  const isSelectedDateFuture = isFuture(parseISO(selectedDate));

  useEffect(() => {
    // Get user role from token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role || '');
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchAttendanceByDate();
    }
  }, [selectedDate, classId]);

  const fetchAttendanceByDate = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/attendance/date/${selectedDate}?classId=${classId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch attendance data');
      }

      const data = await response.json();
      setAttendance(data.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch attendance data');
    } finally {
      setLoading(false);
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
      setAttendance(prev => prev.map(record => {
        if (record.id === attendanceId) {
          return {
            ...record,
            status,
            remarks
          };
        }
        return record;
      }));

      setIsEditDialogOpen(false);
      setEditingRecord(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update attendance');
    }
  };

  const handleEditClick = (record: AttendanceRecord) => {
    setEditingRecord(record.id);
    setEditStatus(record.status);
    setEditRemarks(record.remarks || '');
    setIsEditDialogOpen(true);
  };

  const handleEditSave = () => {
    if (!editingRecord) return;
    updateAttendance(editingRecord, editStatus, editRemarks);
  };

  const handleEditCancel = () => {
    setIsEditDialogOpen(false);
    setEditingRecord(null);
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

  const canEditRecord = (record: AttendanceRecord) => {
    const isAdmin = userRole === 'admin' || userRole === 'principal';
    return record.canEdit && (isAdmin || record.isToday);
  };

  const getPermissionMessage = () => {
    if (isSelectedDateFuture) {
      return 'Cannot access future attendance records';
    }
    if (!isSelectedDateToday && userRole === 'teacher') {
      return 'Teachers can only view today\'s attendance. Contact admin for historical data.';
    }
    return null;
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
          Attendance View - {className}
        </Typography>
        
        <Grid container spacing={2} alignItems="center" sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              type="date"
              label="Select Date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputProps={{
                startAdornment: <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={8}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {isSelectedDateToday && (
                <Chip label="Today" color="primary" size="small" />
              )}
              {isSelectedDateFuture && (
                <Chip label="Future Date" color="warning" size="small" />
              )}
              {!isSelectedDateToday && !isSelectedDateFuture && (
                <Chip label="Past Date" color="default" size="small" />
              )}
            </Box>
          </Grid>
        </Grid>

        {getPermissionMessage() && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {getPermissionMessage()}
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

      {attendance.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" align="center" color="text.secondary">
              No attendance records found for {format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Remarks</TableCell>
                <TableCell>Marked At</TableCell>
                <TableCell>Marked By</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attendance.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.student?.studentId || 'N/A'}</TableCell>
                  <TableCell>{record.student?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(record.status)}
                      label={record.status.toUpperCase()}
                      color={getStatusColor(record.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {record.remarks || '-'}
                  </TableCell>
                  <TableCell>
                    {format(parseISO(record.markedAt), 'HH:mm')}
                  </TableCell>
                  <TableCell>
                    {record.markedBy?.name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {canEditRecord(record) ? (
                      <Tooltip title="Edit Attendance">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditClick(record)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {record.isFuture ? 'Future' : 'Read Only'}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

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

export default AttendanceView;