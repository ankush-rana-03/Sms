import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Snackbar,
  Tooltip,
  CircularProgress,
  Pagination,
  InputAdornment
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  LockReset,
  History,
  OnlinePrediction,
  Search,
  Refresh,
  School,
  Person,
  Warning
} from '@mui/icons-material';


interface Teacher {
  _id: string;
  teacherId: string;
  name: string;
  email: string;
  phone: string;
  designation: 'TGT' | 'PGT' | 'JBT' | 'NTT';
  subjects: string[];
  assignedClasses: Array<{
    class: {
      _id: string;
      name: string;
      grade: string;
      section: string;
    };
    section: string;
    subject: string;
    grade: string;
  }>;
  qualification: {
    degree: string;
    institution: string;
    yearOfCompletion: number;
  };
  experience: {
    years: number;
    previousSchools: string[];
  };
  joiningDate: string;
  isActive: boolean;
  contactInfo?: {
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  onlineStatus: {
    isOnline: boolean;
    lastSeen: string;
    lastActivity: string;
  };
  passwordResetRequired: boolean;
  lastPasswordChange: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    lastLogin: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface LoginLog {
  _id: string;
  loginTime: string;
  logoutTime: string | null;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failed';
  sessionDuration: number;
}

interface TeacherStatistics {
  totalTeachers: number;
  activeTeachers: number;
  onlineTeachers: number;
  designationStats: Array<{
    _id: string;
    count: number;
  }>;
  recentLogins: Array<{
    teacherId: string;
    name: string;
    lastLogin: string;
  }>;
}

const TeacherManagement: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openLoginLogsDialog, setOpenLoginLogsDialog] = useState(false);
  const [openPasswordResetDialog, setOpenPasswordResetDialog] = useState(false);
  const [openClassAssignmentDialog, setOpenClassAssignmentDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [statistics, setStatistics] = useState<TeacherStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'success' });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    designation: 'TGT' as 'TGT' | 'PGT' | 'JBT' | 'NTT',
    subjects: '',
    qualification: {
      degree: '',
      institution: '',
      yearOfCompletion: new Date().getFullYear()
    },
    experience: {
      years: 0,
      previousSchools: [] as string[]
    },
    joiningDate: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });

  const [passwordResetData] = useState({
    forceReset: true
  });

  const [classAssignmentData, setClassAssignmentData] = useState({
    assignedClasses: [] as Array<{
      class: string;
      section: string;
      subject: string;
      grade: string;
    }>
  });

  useEffect(() => {
    fetchTeachers();
    fetchStatistics();
  }, [page, searchTerm, designationFilter, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(designationFilter && { designation: designationFilter }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await fetch(`/api/admin/teachers?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTeachers(data.data);
        setTotalPages(data.totalPages);
      } else {
        throw new Error('Failed to fetch teachers');
      }
    } catch (error) {
      showSnackbar('Error fetching teachers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/admin/teachers/statistics/overview', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStatistics(data.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchLoginLogs = async (teacherId: string) => {
    try {
      const response = await fetch(`/api/admin/teachers/${teacherId}/login-logs`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLoginLogs(data.data);
      }
    } catch (error) {
      showSnackbar('Error fetching login logs', 'error');
    }
  };

  const handleCreateTeacher = async () => {
    try {
      // Validate required fields
      if (!formData.name || !formData.email || !formData.phone || !formData.designation) {
        showSnackbar('Please fill in all required fields (Name, Email, Phone, Designation)', 'error');
        return;
      }

      // Format the data for backend
      const teacherData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        designation: formData.designation,
        subjects: formData.subjects.split(',').map(s => s.trim()).filter(s => s),
        qualification: formData.qualification,
        experience: formData.experience,
        joiningDate: formData.joiningDate || new Date().toISOString().split('T')[0],
        emergencyContact: formData.emergencyContact,
        specialization: [], // Empty array as default
        salary: 0 // Default salary
      };

      console.log('Creating teacher with data:', teacherData);

      const response = await fetch('/api/admin/teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(teacherData)
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (response.ok) {
        showSnackbar(`Teacher created successfully. Temporary password: ${responseData.data.temporaryPassword}`, 'success');
        setOpenDialog(false);
        resetForm();
        fetchTeachers();
      } else {
        throw new Error(responseData.message || 'Failed to create teacher');
      }
    } catch (error) {
      console.error('Error creating teacher:', error);
      showSnackbar(error instanceof Error ? error.message : 'Error creating teacher', 'error');
    }
  };

  const handleUpdateTeacher = async () => {
    if (!selectedTeacher) return;

    try {
      // Format the data for backend
      const teacherData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        designation: formData.designation,
        subjects: formData.subjects.split(',').map(s => s.trim()).filter(s => s),
        qualification: formData.qualification,
        experience: formData.experience,
        joiningDate: formData.joiningDate,
        emergencyContact: formData.emergencyContact,
        specialization: [], // Empty array as default
        salary: 0 // Default salary
      };

      const response = await fetch(`/api/admin/teachers/${selectedTeacher._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(teacherData)
      });

      if (response.ok) {
        showSnackbar('Teacher updated successfully', 'success');
        setOpenDialog(false);
        resetForm();
        fetchTeachers();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update teacher');
      }
    } catch (error) {
      showSnackbar(error instanceof Error ? error.message : 'Error updating teacher', 'error');
    }
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    if (!window.confirm('Are you sure you want to deactivate this teacher?')) return;

    try {
      const response = await fetch(`/api/admin/teachers/${teacherId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        showSnackbar('Teacher deactivated successfully', 'success');
        fetchTeachers();
      } else {
        throw new Error('Failed to deactivate teacher');
      }
    } catch (error) {
      showSnackbar('Error deactivating teacher', 'error');
    }
  };

  const handleResetPassword = async () => {
    if (!selectedTeacher) return;

    try {
      const response = await fetch(`/api/admin/teachers/${selectedTeacher._id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(passwordResetData)
      });

      if (response.ok) {
        const data = await response.json();
        showSnackbar(`Password reset successfully. New password: ${data.data.temporaryPassword}`, 'success');
        setOpenPasswordResetDialog(false);
        fetchTeachers();
      } else {
        throw new Error('Failed to reset password');
      }
    } catch (error) {
      showSnackbar('Error resetting password', 'error');
    }
  };

  const handleAssignClasses = async () => {
    if (!selectedTeacher) return;

    try {
      const response = await fetch(`/api/admin/teachers/${selectedTeacher._id}/assign-classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(classAssignmentData)
      });

      if (response.ok) {
        showSnackbar('Classes assigned successfully', 'success');
        setOpenClassAssignmentDialog(false);
        fetchTeachers();
      } else {
        throw new Error('Failed to assign classes');
      }
    } catch (error) {
      showSnackbar('Error assigning classes', 'error');
    }
  };

  const handleOpenEditDialog = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setDialogMode('edit');
    setFormData({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      designation: teacher.designation,
      subjects: teacher.subjects.join(', '),
      qualification: teacher.qualification,
      experience: teacher.experience,
      joiningDate: teacher.joiningDate,
      emergencyContact: teacher.contactInfo?.emergencyContact || {
        name: '',
        phone: '',
        relationship: ''
      }
    });
    setOpenDialog(true);
  };

  const handleOpenCreateDialog = () => {
    setSelectedTeacher(null);
    setDialogMode('create');
    resetForm();
    setOpenDialog(true);
  };

  const handleOpenLoginLogsDialog = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    fetchLoginLogs(teacher._id);
    setOpenLoginLogsDialog(true);
  };

  const handleOpenPasswordResetDialog = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setOpenPasswordResetDialog(true);
  };

  const handleOpenClassAssignmentDialog = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setClassAssignmentData({
      assignedClasses: teacher.assignedClasses.map(ac => ({
        class: ac.class._id,
        section: ac.section,
        subject: ac.subject,
        grade: ac.grade
      }))
    });
    setOpenClassAssignmentDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      designation: 'TGT',
      subjects: '',
      qualification: {
        degree: '',
        institution: '',
        yearOfCompletion: new Date().getFullYear()
      },
      experience: {
        years: 0,
        previousSchools: []
      },
      joiningDate: '',
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      }
    });
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getDesignationColor = (designation: string) => {
    switch (designation) {
      case 'PGT': return 'primary';
      case 'TGT': return 'secondary';
      case 'JBT': return 'success';
      case 'NTT': return 'warning';
      default: return 'default';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Teacher Management</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenCreateDialog}
        >
          Add Teacher
        </Button>
      </Box>

      {/* Statistics Cards */}
      {statistics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Teachers
                </Typography>
                <Typography variant="h4">{statistics.totalTeachers}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Teachers
                </Typography>
                <Typography variant="h4" color="success.main">
                  {statistics.activeTeachers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Online Teachers
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {statistics.onlineTeachers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Designations
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {statistics.designationStats.map((stat) => (
                    <Chip
                      key={stat._id}
                      label={`${stat._id}: ${stat.count}`}
                      size="small"
                      color={getDesignationColor(stat._id) as any}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search teachers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Designation</InputLabel>
                <Select
                  value={designationFilter}
                  onChange={(e) => setDesignationFilter(e.target.value)}
                  label="Designation"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="TGT">TGT</MenuItem>
                  <MenuItem value="PGT">PGT</MenuItem>
                  <MenuItem value="JBT">JBT</MenuItem>
                  <MenuItem value="NTT">NTT</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchTeachers}
                disabled={loading}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Teachers List */}
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Teacher</TableCell>
                      <TableCell>Designation</TableCell>
                      <TableCell>Subjects</TableCell>
                      <TableCell>Classes</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Last Login</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {teachers.map((teacher) => (
                      <TableRow key={teacher._id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2 }}>
                              <Person />
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2">{teacher.name}</Typography>
                              <Typography variant="body2" color="textSecondary">
                                {teacher.email}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {teacher.teacherId}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={teacher.designation}
                            color={getDesignationColor(teacher.designation)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {teacher.subjects.slice(0, 2).map((subject) => (
                              <Chip key={subject} label={subject} size="small" variant="outlined" />
                            ))}
                            {teacher.subjects.length > 2 && (
                              <Chip label={`+${teacher.subjects.length - 2}`} size="small" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {teacher.assignedClasses.slice(0, 2).map((ac, index) => (
                              <Chip
                                key={index}
                                label={`${ac.class.grade}${ac.section}`}
                                size="small"
                                color="primary"
                              />
                            ))}
                            {teacher.assignedClasses.length > 2 && (
                              <Chip label={`+${teacher.assignedClasses.length - 2}`} size="small" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={teacher.isActive ? 'Active' : 'Inactive'}
                              color={teacher.isActive ? 'success' : 'error'}
                              size="small"
                            />
                            {teacher.onlineStatus.isOnline && (
                              <Chip
                                label="Online"
                                color="primary"
                                size="small"
                                icon={<OnlinePrediction />}
                              />
                            )}
                            {teacher.passwordResetRequired && (
                              <Tooltip title="Password reset required">
                                <Warning color="warning" />
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {teacher.user.lastLogin ? formatDateTime(teacher.user.lastLogin) : 'Never'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                                                         <Tooltip title="View Details">
                               <IconButton
                                 size="small"
                                 onClick={() => handleOpenEditDialog(teacher)}
                               >
                                 <Visibility />
                               </IconButton>
                             </Tooltip>
                             <Tooltip title="Edit">
                               <IconButton
                                 size="small"
                                 onClick={() => handleOpenEditDialog(teacher)}
                               >
                                 <Edit />
                               </IconButton>
                             </Tooltip>
                                                         <Tooltip title="Login Logs">
                               <IconButton
                                 size="small"
                                 onClick={() => handleOpenLoginLogsDialog(teacher)}
                               >
                                 <History />
                               </IconButton>
                             </Tooltip>
                                                         <Tooltip title="Reset Password">
                               <IconButton
                                 size="small"
                                 onClick={() => handleOpenPasswordResetDialog(teacher)}
                               >
                                 <LockReset />
                               </IconButton>
                             </Tooltip>
                             <Tooltip title="Assign Classes">
                               <IconButton
                                 size="small"
                                 onClick={() => handleOpenClassAssignmentDialog(teacher)}
                               >
                                 <School />
                               </IconButton>
                             </Tooltip>
                            <Tooltip title="Deactivate">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteTeacher(teacher._id)}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, value) => setPage(value)}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Teacher Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Add New Teacher' : 'Edit Teacher'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Designation</InputLabel>
                  <Select
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value as any })}
                    label="Designation"
                    required
                  >
                    <MenuItem value="TGT">TGT</MenuItem>
                    <MenuItem value="PGT">PGT</MenuItem>
                    <MenuItem value="JBT">JBT</MenuItem>
                    <MenuItem value="NTT">NTT</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Experience (Years)"
                  type="number"
                  value={formData.experience.years}
                  onChange={(e) => setFormData({
                    ...formData,
                    experience: { ...formData.experience, years: Number(e.target.value) }
                  })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Subjects (comma separated)"
                  value={formData.subjects}
                  onChange={(e) => setFormData({
                    ...formData,
                    subjects: e.target.value
                  })}
                  helperText="Enter subjects separated by commas"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Degree"
                  value={formData.qualification.degree}
                  onChange={(e) => setFormData({
                    ...formData,
                    qualification: { ...formData.qualification, degree: e.target.value }
                  })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Institution"
                  value={formData.qualification.institution}
                  onChange={(e) => setFormData({
                    ...formData,
                    qualification: { ...formData.qualification, institution: e.target.value }
                  })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Year of Completion"
                  type="number"
                  value={formData.qualification.yearOfCompletion}
                  onChange={(e) => setFormData({
                    ...formData,
                    qualification: { ...formData.qualification, yearOfCompletion: Number(e.target.value) }
                  })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Joining Date"
                  type="date"
                  value={formData.joiningDate ? formData.joiningDate.split('T')[0] : ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    joiningDate: e.target.value ? new Date(e.target.value).toISOString() : ''
                  })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={dialogMode === 'create' ? handleCreateTeacher : handleUpdateTeacher}
            variant="contained"
          >
            {dialogMode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Login Logs Dialog */}
      <Dialog open={openLoginLogsDialog} onClose={() => setOpenLoginLogsDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Login Logs - {selectedTeacher?.name}
        </DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Login Time</TableCell>
                  <TableCell>Logout Time</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loginLogs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell>{formatDateTime(log.loginTime)}</TableCell>
                    <TableCell>
                      {log.logoutTime ? formatDateTime(log.logoutTime) : 'Active Session'}
                    </TableCell>
                    <TableCell>{formatDuration(log.sessionDuration)}</TableCell>
                    <TableCell>{log.ipAddress}</TableCell>
                    <TableCell>
                      <Chip
                        label={log.status}
                        color={log.status === 'success' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLoginLogsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={openPasswordResetDialog} onClose={() => setOpenPasswordResetDialog(false)}>
        <DialogTitle>Reset Password - {selectedTeacher?.name}</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            A new secure password will be generated and the teacher will be required to change it on next login.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPasswordResetDialog(false)}>Cancel</Button>
          <Button onClick={handleResetPassword} variant="contained" color="warning">
            Reset Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Class Assignment Dialog */}
      <Dialog open={openClassAssignmentDialog} onClose={() => setOpenClassAssignmentDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Assign Classes - {selectedTeacher?.name}</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Assign classes and subjects to this teacher. The teacher will be able to manage attendance and other activities for these classes.
          </Alert>
          {/* Class assignment form would go here */}
          <Typography variant="body2" color="textSecondary">
            Class assignment functionality will be implemented here.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenClassAssignmentDialog(false)}>Cancel</Button>
          <Button onClick={handleAssignClasses} variant="contained">
            Assign Classes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TeacherManagement;