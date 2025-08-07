import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
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
  LockReset,
  History,
  OnlinePrediction,
  Search,
  Refresh,
  School,
  Person,
  Warning,
  People,
  CheckCircle
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
  salary: number;
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

interface TeachersResponse {
  success: boolean;
  data: Teacher[];
  totalPages: number;
  count: number;
  total: number;
  page: number;
}

interface StatisticsResponse {
  success: boolean;
  data: TeacherStatistics;
}

interface CreateTeacherResponse {
  success: boolean;
  message: string;
  data: {
    teacher: Teacher;
    temporaryPassword: string;
    message: string;
  };
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

  // New state for password reset and class assignment
  const [newPassword, setNewPassword] = useState('');
  const [availableClasses, setAvailableClasses] = useState<Array<{
    _id: string;
    name: string;
    section: string;
    grade: string;
  }>>([]);
  const [selectedClasses, setSelectedClasses] = useState<Array<{
    class: string;
    section: string;
    subject: string;
    grade: string;
  }>>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    designation: 'TGT' as 'TGT' | 'PGT' | 'JBT' | 'NTT',
    subjects: [] as string[],
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
    salary: 0,
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });



  useEffect(() => {
    fetchTeachers();
    fetchStatistics();
    fetchAvailableClasses();
  }, [page, searchTerm, designationFilter, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      console.log('Fetching teachers...');
      console.log('Current page:', page);
      console.log('Search term:', searchTerm);
      console.log('Designation filter:', designationFilter);
      console.log('Status filter:', statusFilter);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(designationFilter && { designation: designationFilter }),
        ...(statusFilter && { status: statusFilter })
      });

      console.log('API URL:', `/admin/teachers?${params}`);
      
      const data = await apiService.get<TeachersResponse>(`/admin/teachers?${params}`);
      console.log('Fetched teachers data:', data);
      console.log('Teachers array:', data.data);
      console.log('Teachers count:', data.data?.length || 0);
      
      // Show all teachers returned by the API
      setTeachers(data.data || []);
      setTotalPages(data.totalPages);
      
      if (!data.data || data.data.length === 0) {
        console.log('No teachers found - this might be normal if no teachers exist yet');
      }
    } catch (error: any) {
      console.error('Error fetching teachers:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      showSnackbar(error.response?.data?.message || 'Error fetching teachers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const data = await apiService.get<StatisticsResponse>('/admin/teachers/statistics/overview');
      setStatistics(data.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchAvailableClasses = async () => {
    try {
      const data = await apiService.get<{ success: boolean; data: Array<{ _id: string; name: string; section: string; grade: string }> }>('/classes');
      setAvailableClasses(data.data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      // If classes API doesn't exist, create some dummy data
      setAvailableClasses([
        { _id: '1', name: 'Class 1', section: 'A', grade: '1' },
        { _id: '2', name: 'Class 2', section: 'A', grade: '2' },
        { _id: '3', name: 'Class 3', section: 'A', grade: '3' },
        { _id: '4', name: 'Class 4', section: 'A', grade: '4' },
        { _id: '5', name: 'Class 5', section: 'A', grade: '5' },
      ]);
    }
  };

  const fetchLoginLogs = async (teacherId: string) => {
    try {
      const data = await apiService.get<{ success: boolean; data: LoginLog[] }>(`/admin/teachers/${teacherId}/login-logs`);
      setLoginLogs(data.data);
    } catch (error) {
      console.error('Error fetching login logs:', error);
      showSnackbar('Error fetching login logs', 'error');
    }
  };

  const handleCreateTeacher = async () => {
    try {
      const teacherData = {
        ...formData,
        subjects: formData.subjects,
        contactInfo: {
          emergencyContact: formData.emergencyContact
        }
      };

      const response = await apiService.post<CreateTeacherResponse>('/admin/teachers', teacherData);
      
      if (response.success) {
        showSnackbar(`Teacher created successfully. Temporary password: ${response.data.temporaryPassword}`, 'success');
        setOpenDialog(false);
        resetForm();
        fetchTeachers();
        // Refresh statistics to update the count
        fetchStatistics();
      } else {
        showSnackbar(response.message || 'Error creating teacher', 'error');
      }
    } catch (error: any) {
      console.error('Error creating teacher:', error);
      showSnackbar(error.response?.data?.message || 'Error creating teacher', 'error');
    }
  };

  const handleUpdateTeacher = async () => {
    if (!selectedTeacher) return;

    try {
      const teacherData = {
        ...formData,
        subjects: formData.subjects,
        contactInfo: {
          emergencyContact: formData.emergencyContact
        }
      };

      const response = await apiService.put<{ success: boolean; message: string; data: Teacher }>(
        `/admin/teachers/${selectedTeacher._id}`,
        teacherData
      );

      if (response.success) {
        showSnackbar('Teacher updated successfully', 'success');
        setOpenDialog(false);
        resetForm();
        // Update the specific teacher in the UI instead of refetching all
        setTeachers(prev => prev.map(t => t._id === selectedTeacher._id ? response.data : t));
        // Refresh statistics to update designation counts and other stats
        fetchStatistics();
      } else {
        showSnackbar(response.message || 'Error updating teacher', 'error');
      }
    } catch (error: any) {
      console.error('Error updating teacher:', error);
      showSnackbar(error.response?.data?.message || 'Error updating teacher', 'error');
    }
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    if (!window.confirm('Are you sure you want to delete this teacher? This action cannot be undone.')) return;

    try {
      const response = await apiService.delete<{ success: boolean; message: string }>(`/admin/teachers/${teacherId}`);
      if (response.success) {
        showSnackbar('Teacher deleted successfully', 'success');
        // Remove from UI
        setTeachers(prev => prev.filter(t => t._id !== teacherId));
        // Refresh statistics to update the count
        fetchStatistics();
      } else {
        showSnackbar(response.message || 'Error deleting teacher', 'error');
      }
    } catch (error: any) {
      console.error('Error deleting teacher:', error);
      showSnackbar(error.response?.data?.message || 'Error deleting teacher', 'error');
    }
  };

  const handleResetPassword = async () => {
    if (!selectedTeacher) return;
    if (!newPassword.trim()) {
      showSnackbar('Please enter a new password', 'error');
      return;
    }

    try {
      const response = await apiService.post<{ success: boolean; message: string; data: { temporaryPassword: string; emailSent: boolean } }>(
        `/admin/teachers/${selectedTeacher._id}/reset-password`,
        { newPassword: newPassword.trim() }
      );

      if (response.success) {
        const emailMessage = response.data?.emailSent 
          ? 'Email notification sent to teacher with new password.'
          : 'Password reset successful.';
        
        showSnackbar(`Password reset successfully! ${emailMessage}`, 'success');
        setOpenPasswordResetDialog(false);
        setNewPassword('');
      } else {
        showSnackbar(response.message || 'Error resetting password', 'error');
      }
    } catch (error: any) {
      console.error('Error resetting password:', error);
      showSnackbar(error.response?.data?.message || 'Error resetting password', 'error');
    }
  };

  const handleAssignClasses = async () => {
    if (!selectedTeacher) return;
    
    // Allow assigning empty array (no classes)
    // Remove the validation that requires at least one class

    try {
      const response = await apiService.post<{ success: boolean; message: string; data: Teacher }>(
        `/admin/teachers/${selectedTeacher._id}/assign-classes`,
        { assignedClasses: selectedClasses }
      );

      if (response.success) {
        showSnackbar('Classes assigned successfully', 'success');
        setOpenClassAssignmentDialog(false);
        setSelectedClasses([]);
        // Update teacher in UI
        setTeachers(prev => prev.map(t => t._id === selectedTeacher._id ? response.data : t));
        // Removed fetchStatistics here
      } else {
        showSnackbar(response.message || 'Error assigning classes', 'error');
      }
    } catch (error: any) {
      console.error('Error assigning classes:', error);
      showSnackbar(error.response?.data?.message || 'Error assigning classes', 'error');
    }
  };

  const handleOpenEditDialog = (teacher: Teacher) => {
    console.log('Opening edit dialog for teacher:', teacher);
    console.log('Teacher contactInfo:', teacher.contactInfo);
    console.log('Teacher emergencyContact:', teacher.contactInfo?.emergencyContact);
    console.log('Teacher subjects:', teacher.subjects);
    
    setSelectedTeacher(teacher);
    setDialogMode('edit');
    
    // Better handling of emergency contact data
    const emergencyContact = teacher.contactInfo?.emergencyContact;
    const formDataToSet = {
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      designation: teacher.designation,
      subjects: Array.isArray(teacher.subjects) ? teacher.subjects : [],
      qualification: teacher.qualification || {
        degree: '',
        institution: '',
        yearOfCompletion: new Date().getFullYear()
      },
      experience: teacher.experience || {
        years: 0,
        previousSchools: []
      },
      joiningDate: teacher.joiningDate ? teacher.joiningDate.split('T')[0] : '',
      salary: teacher.salary || 0,
      emergencyContact: {
        name: emergencyContact?.name || '',
        phone: emergencyContact?.phone || '',
        relationship: emergencyContact?.relationship || ''
      }
    };
    
    console.log('Setting form data:', formDataToSet);
    setFormData(formDataToSet);
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
    setNewPassword('');
    setOpenPasswordResetDialog(true);
  };

  const handleOpenClassAssignmentDialog = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setSelectedClasses(teacher.assignedClasses.map(ac => ({
      class: ac.class._id,
      section: ac.section,
      subject: ac.subject,
      grade: ac.grade
    })));
    setOpenClassAssignmentDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      designation: 'TGT',
      subjects: [] as string[],
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
      salary: 0,
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

  const handleClassSelection = (classId: string, section: string, grade: string, subject: string) => {
    const existingIndex = selectedClasses.findIndex(
      sc => sc.class === classId && sc.section === section
    );

    if (existingIndex >= 0) {
      // Remove if already selected
      setSelectedClasses(selectedClasses.filter((_, index) => index !== existingIndex));
    } else {
      // Add new selection
      setSelectedClasses([...selectedClasses, { class: classId, section, subject, grade }]);
    }
  };

  const isClassSelected = (classId: string, section: string) => {
    return selectedClasses.some(sc => sc.class === classId && sc.section === section);
  };

  // Helper function to handle subjects input
  const handleSubjectsChange = (value: string) => {
    const subjects = value
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    setFormData({
      ...formData,
      subjects: subjects
    });
  };

  // Helper function to format subjects for display
  const formatSubjectsForDisplay = (subjects: string[]) => {
    if (!Array.isArray(subjects)) return '';
    return subjects.join(', ');
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
            <Card sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': { transform: 'translateY(-4px)' },
              height: '100%'
            }}>
              <CardContent sx={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <People sx={{ fontSize: 40, mr: 1 }} />
                </Box>
                <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
                  Total Teachers
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                  {statistics.totalTeachers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': { transform: 'translateY(-4px)' },
              height: '100%'
            }}>
              <CardContent sx={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <CheckCircle sx={{ fontSize: 40, mr: 1 }} />
                </Box>
                <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
                  Active Teachers
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                  {statistics.activeTeachers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
              color: '#333',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': { transform: 'translateY(-4px)' },
              height: '100%'
            }}>
              <CardContent sx={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <OnlinePrediction sx={{ fontSize: 40, mr: 1, color: '#2196f3' }} />
                </Box>
                <Typography variant="h6" sx={{ opacity: 0.8, mb: 1 }}>
                  Online Teachers
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                  {statistics.onlineTeachers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
              color: '#333',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': { transform: 'translateY(-4px)' },
              height: '100%'
            }}>
              <CardContent sx={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                    <School sx={{ fontSize: 40, mr: 1, color: '#ff9800' }} />
                  </Box>
                  <Typography variant="h6" sx={{ opacity: 0.8, mb: 1 }}>
                    Designations
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#ff9800', mb: 2 }}>
                    {statistics.designationStats.length}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                  {statistics.designationStats.map((stat) => (
                    <Chip
                      key={stat._id}
                      label={`${stat._id}: ${stat.count}`}
                      size="small"
                      color={getDesignationColor(stat._id) as any}
                      sx={{ fontSize: '0.7rem', mb: 0.5 }}
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
          ) : teachers.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <Typography variant="h6" color="textSecondary">
                No teachers found. {searchTerm || designationFilter || statusFilter ? 'Try adjusting your filters.' : 'Add your first teacher using the "Add Teacher" button above.'}
              </Typography>
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
                    {(teachers || []).map((teacher) => (
                      <TableRow key={teacher._id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2 }}>
                              <Person />
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2">{teacher.name || ''}</Typography>
                              <Typography variant="body2" color="textSecondary">
                                {teacher.email || ''}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {teacher.teacherId || ''}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={teacher.designation || ''}
                            color={getDesignationColor(teacher.designation || '')}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {(teacher.subjects || []).slice(0, 2).map((subject) => (
                              <Chip key={subject} label={subject} size="small" variant="outlined" />
                            ))}
                            {(teacher.subjects && teacher.subjects.length > 2) && (
                              <Chip label={`+${teacher.subjects.length - 2}`} size="small" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {(teacher.assignedClasses || []).slice(0, 2).map((ac, index) => (
                              <Chip
                                key={index}
                                label={`${ac.class?.grade || ''}${ac.section || ''}`}
                                size="small"
                                color="primary"
                              />
                            ))}
                            {(teacher.assignedClasses && teacher.assignedClasses.length > 2) && (
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
                            {teacher.onlineStatus?.isOnline && (
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
                            {teacher.user?.lastLogin ? formatDateTime(teacher.user.lastLogin) : 'Never'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Edit Teacher">
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
                  label="Assign Subjects (comma separated)"
                  value={formatSubjectsForDisplay(formData.subjects)}
                  onChange={(e) => handleSubjectsChange(e.target.value)}
                  helperText="Enter subjects separated by commas (e.g. Mathematics, Physics, English)"
                  placeholder="Mathematics, Physics, English"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title="Enter subjects separated by commas">
                          <School fontSize="small" color="action" />
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
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
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({
                    ...formData,
                    salary: Number(e.target.value)
                  })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Emergency Contact Name"
                  value={formData.emergencyContact.name}
                  onChange={(e) => setFormData({
                    ...formData,
                    emergencyContact: { ...formData.emergencyContact, name: e.target.value }
                  })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Emergency Contact Phone"
                  value={formData.emergencyContact.phone}
                  onChange={(e) => setFormData({
                    ...formData,
                    emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
                  })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Emergency Contact Relationship</InputLabel>
                  <Select
                    value={formData.emergencyContact.relationship}
                    onChange={(e) => setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, relationship: e.target.value as string }
                    })}
                    label="Relationship"
                  >
                    <MenuItem value="Father">Father</MenuItem>
                    <MenuItem value="Mother">Mother</MenuItem>
                    <MenuItem value="Guardian">Guardian</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
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
          <TextField
            fullWidth
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            margin="normal"
            required
          />
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
            Assign classes and subjects to this teacher. You can select multiple classes or leave empty to remove all assignments. The teacher will be able to manage attendance and other activities for these classes.
          </Alert>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Available Classes:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {availableClasses.map((cls) => (
                  <Chip
                    key={cls._id}
                    label={`${cls.grade}${cls.section}`}
                    size="small"
                    color={isClassSelected(cls._id, cls.section) ? 'primary' : 'default'}
                    onClick={() => handleClassSelection(cls._id, cls.section, cls.grade, cls.name)}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Selected Classes:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {selectedClasses.map((sc, index) => (
                  <Chip
                    key={index}
                    label={`${sc.grade}${sc.section}`}
                    size="small"
                    color="primary"
                    onDelete={() => handleClassSelection(sc.class, sc.section, sc.grade, sc.subject)}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenClassAssignmentDialog(false)}>Cancel</Button>
          <Button onClick={handleAssignClasses} variant="contained">
            {selectedClasses.length > 0 ? 'Assign Classes' : 'Remove All Classes'}
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