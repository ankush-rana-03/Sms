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
  CheckCircle,
  Assignment,
  Lock
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

  const [openSubjectAssignmentDialog, setOpenSubjectAssignmentDialog] = useState(false);
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




  // Add teacherFormData state for create/edit dialog
  const [teacherFormData, setTeacherFormData] = useState({
    name: '',
    email: '',
    phone: '',
    designation: 'TGT' as 'TGT' | 'PGT' | 'JBT' | 'NTT',
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

  // New state for Assign Classes & Subjects dialog
  // Define the type for assignments for clarity
  interface Assignment {
    class?: string | { _id?: string; name?: string; grade?: string; section?: string }; // Allow string or object with _id
    className?: string; // Store class name for display if class is just an ID
    section: string;
    subjects: string[];
  }

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentForm, setAssignmentForm] = useState({
    class: '',
    section: '',
    subjectsInput: '',
    editingIndex: -1
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
      console.log('Fetched classes from API:', data);
      setAvailableClasses(data.data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setAvailableClasses([]);
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
        ...teacherFormData,
        subjects: [], // Empty array since subjects are now managed through class assignments
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

  const handleUpdateTeacher = async (teacher: Teacher) => { // Added teacher parameter
    if (!teacher) return;

    try {
      const teacherData = {
        ...teacherFormData,
        subjects: teacher.subjects || [], // Keep existing subjects from teacher data
      };

      const response = await apiService.put<{ success: boolean; message: string; data: Teacher }>(
        `/admin/teachers/${teacher._id}`,
        teacherData
      );

      if (response.success) {
        showSnackbar('Teacher updated successfully', 'success');
        setOpenDialog(false);
        resetForm();
        // Update the specific teacher in the UI instead of refetching all
        setTeachers(prev => prev.map(t => t._id === teacher._id ? response.data : t));
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

  const handleResetPassword = async (teacherId: string) => { // Added teacherId parameter
    if (!teacherId) return;
    if (!newPassword.trim()) {
      showSnackbar('Please enter a new password', 'error');
      return;
    }

    try {
      const response = await apiService.post<{ success: boolean; message: string; data: { temporaryPassword: string; emailSent: boolean } }>(
        `/admin/teachers/${teacherId}/reset-password`,
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



  const handleOpenEditDialog = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setDialogMode('edit');
    setTeacherFormData({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      designation: teacher.designation,
      qualification: teacher.qualification || { degree: '', institution: '', yearOfCompletion: new Date().getFullYear() },
      experience: teacher.experience || { years: 0, previousSchools: [] },
      joiningDate: teacher.joiningDate ? teacher.joiningDate.split('T')[0] : '',
      salary: teacher.salary || 0,
      emergencyContact: teacher.contactInfo?.emergencyContact || { name: '', phone: '', relationship: '' }
    });
    setOpenDialog(true);
  };

  const handleOpenCreateDialog = () => {
    setSelectedTeacher(null);
    setDialogMode('create');
    setTeacherFormData({
      name: '',
      email: '',
      phone: '',
      designation: 'TGT',
      qualification: { degree: '', institution: '', yearOfCompletion: new Date().getFullYear() },
      experience: { years: 0, previousSchools: [] },
      joiningDate: '',
      salary: 0,
      emergencyContact: { name: '', phone: '', relationship: '' }
    });
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



  const handleOpenSubjectAssignmentDialog = (teacher: Teacher) => {
    setSelectedTeacher(teacher);

    // Group assignments by class and section to combine subjects
    const groupedAssignments = teacher.assignedClasses.reduce((acc, ac) => {
      const key = `${ac.class._id}-${ac.section}`;
      if (!acc[key]) {
        acc[key] = {
          class: ac.class, // Store the whole class object
          className: ac.class.name, // Keep class name for display
          section: ac.section,
          subjects: []
        };
      }
      acc[key].subjects.push(ac.subject);
      return acc;
    }, {} as Record<string, { class: any; className: string; section: string; subjects: string[] }>);

    setAssignments(Object.values(groupedAssignments));
    setAssignmentForm({ class: '', section: '', subjectsInput: '', editingIndex: -1 });
    setOpenSubjectAssignmentDialog(true);
  };

  const handleSaveSubjectAssignments = async (assignmentsToSave: Assignment[]) => {
    if (!selectedTeacher) return;

    try {
      console.log('Saving assignments:', assignmentsToSave);
      console.log('Available classes:', availableClasses);

      // Transform the data to match the backend expected format
      const transformedAssignments = assignmentsToSave.flatMap(assignment => {
        const subjects = assignment.subjects || [];
        return subjects.map(subject => {
          let classId = '';
          let grade = '';
          let section = assignment.section;

          // If we have a class object with an _id, use it
          if (assignment.class && typeof assignment.class === 'object' && assignment.class._id) {
            classId = assignment.class._id;
            grade = assignment.class.name?.replace('Class ', '') || assignment.className || '';
          } else if (typeof assignment.class === 'string') {
            // If class is just a string (e.g., a class name), try to find it
            const classData = availableClasses.find(c => c.name === assignment.class || c.grade === assignment.class);
            if (classData) {
              classId = classData._id;
              grade = classData.grade || classData.name?.replace('Class ', '') || '';
            } else {
              // If not found, use the string as class name and derive grade
              classId = assignment.class; // Use the name as ID for now, backend might handle creation
              grade = assignment.className || assignment.class; // Infer grade from name
            }
          }

          return {
            class: classId,
            section: section,
            subject: subject,
            grade: grade
          };
        });
      });

      console.log('Transformed assignments:', transformedAssignments);
      console.log('Sending to API:', { assignedClasses: transformedAssignments });

      const response = await apiService.post<{ success: boolean; message: string; data: Teacher }>(
        `/admin/teachers/${selectedTeacher._id}/assign-classes`,
        { assignedClasses: transformedAssignments }
      );

      if (response.success) {
        showSnackbar('Subject assignments updated successfully', 'success');
        // Update teacher in UI
        setTeachers(prev => prev.map(t => t._id === selectedTeacher._id ? response.data : t));
        // Close the dialog
        setOpenSubjectAssignmentDialog(false);
        // Refresh available classes in case new ones were created
        fetchAvailableClasses();
      } else {
        showSnackbar(response.message || 'Error updating subject assignments', 'error');
      }
    } catch (error: any) {
      console.error('Error updating subject assignments:', error);
      showSnackbar(error.response?.data?.message || error.message || 'Error updating subject assignments', 'error');
    }
  };

  // This function is not directly used in the UI but might be intended for deletion of specific assignments.
  // It's kept here for completeness but commented out as it's not explicitly called.
  // const handleDeleteSpecificAssignment = async (teacherId: string, classId: string, section: string) => {
  //   if (!window.confirm(`Are you sure you want to delete the assignment for Class ${classId} Section ${section}?`)) {
  //     return;
  //   }
  //
  //   try {
  //     const teacher = teachers.find(t => t._id === teacherId);
  //     if (!teacher) return;
  //
  //     // Remove assignments for the specific class and section
  //     const updatedAssignments = teacher.assignedClasses.filter(ac =>
  //       !(ac.class._id === classId && ac.section === section)
  //     );
  //
  //     // Transform to the format expected by the backend
  //     const transformedAssignments = updatedAssignments.map(ac => ({
  //       class: ac.class._id,
  //       section: ac.section,
  //       subject: ac.subject,
  //       grade: ac.grade || ac.class.grade
  //     }));
  //
  //     const response = await apiService.post<{ success: boolean; message: string; data: Teacher }>(
  //       `/admin/teachers/${teacherId}/assign-classes`,
  //       { assignedClasses: transformedAssignments }
  //     );
  //
  //     if (response.success) {
  //       showSnackbar('Assignment deleted successfully', 'success');
  //       // Update teacher in UI
  //       setTeachers(prev => prev.map(t => t._id === teacherId ? response.data : t));
  //     } else {
  //       showSnackbar(response.message || 'Error deleting assignment', 'error');
  //     }
  //   } catch (error: any) {
  //     console.error('Error deleting assignment:', error);
  //     showSnackbar(error.response?.data?.message || 'Error deleting assignment', 'error');
  //   }
  // };

  const resetForm = () => {
    setTeacherFormData({
      name: '',
      email: '',
      phone: '',
      designation: 'TGT',
      qualification: { degree: '', institution: '', yearOfCompletion: new Date().getFullYear() },
      experience: { years: 0, previousSchools: [] },
      joiningDate: '',
      salary: 0,
      emergencyContact: { name: '', phone: '', relationship: '' }
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



  const handleAddOrUpdateAssignment = () => {
    if (!selectedTeacher) return;

    if (!assignmentForm.class || !assignmentForm.section || !assignmentForm.subjectsInput.trim()) {
      showSnackbar('Please fill in all fields', 'error');
      return;
    }

    const subjects = assignmentForm.subjectsInput.split(',').map(s => s.trim()).filter(Boolean);

    if (assignmentForm.editingIndex === -1) {
      // Add new assignment
      const newAssignment: Assignment = {
        class: assignmentForm.class, // This will be the class name, we'll convert to ID when saving
        className: assignmentForm.class,
        section: assignmentForm.section,
        subjects
      };
      setAssignments(prev => [...prev, newAssignment]);
      showSnackbar('Assignment added successfully', 'success');
    } else {
      // Update existing assignment
      setAssignments(prev => prev.map((a, index) =>
        index === assignmentForm.editingIndex ? {
          ...a,
          class: assignmentForm.class,
          className: assignmentForm.class,
          section: assignmentForm.section,
          subjects
        } : a
      ));
      showSnackbar('Assignment updated successfully', 'success');
    }
    setAssignmentForm({ class: '', section: '', subjectsInput: '', editingIndex: -1 });
  };

  const handleEditAssignment = (index: number) => {
    const assignment = assignments[index];
    setAssignmentForm({
      class: assignment.className || assignment.class, // Use className if available, otherwise use class
      section: assignment.section,
      subjectsInput: assignment.subjects.join(', '),
      editingIndex: index
    });
  };

  const handleDeleteAssignment = (index: number) => {
    setAssignments(prev => prev.filter((_, i) => i !== index));
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
                      <TableCell>Phone</TableCell>
                      <TableCell>Experience</TableCell>
                      <TableCell>Salary</TableCell>
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
                        <TableCell>{teacher.phone || ''}</TableCell>
                        <TableCell>{teacher.experience?.years || 0} years</TableCell>
                        <TableCell>${teacher.salary?.toLocaleString() || 0}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Edit Teacher">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenEditDialog(teacher)}
                                color="primary"
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Assign Classes & Subjects">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenSubjectAssignmentDialog(teacher)}
                                color="secondary"
                              >
                                <Assignment />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reset Password">
                              <IconButton
                                size="small"
                                onClick={() => handleResetPassword(teacher._id)}
                                color="warning"
                              >
                                <Lock />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Teacher">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteTeacher(teacher._id)}
                                color="error"
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
                value={teacherFormData.name}
                onChange={(e) => setTeacherFormData({ ...teacherFormData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={teacherFormData.email}
                onChange={(e) => setTeacherFormData({ ...teacherFormData, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={teacherFormData.phone}
                onChange={(e) => setTeacherFormData({ ...teacherFormData, phone: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Designation</InputLabel>
                <Select
                  value={teacherFormData.designation}
                  onChange={(e) => setTeacherFormData({ ...teacherFormData, designation: e.target.value as any })}
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
                value={teacherFormData.experience.years}
                onChange={(e) => setTeacherFormData({
                  ...teacherFormData,
                  experience: { ...teacherFormData.experience, years: Number(e.target.value) }
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Note:</strong> Subject assignments are now managed through the "Assign Classes & Subjects" button in the teacher list.
                  This allows you to assign specific subjects to specific classes and sections.
                </Typography>
              </Alert>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Degree"
                value={teacherFormData.qualification.degree}
                onChange={(e) => setTeacherFormData({
                  ...teacherFormData,
                  qualification: { ...teacherFormData.qualification, degree: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Institution"
                value={teacherFormData.qualification.institution}
                onChange={(e) => setTeacherFormData({
                  ...teacherFormData,
                  qualification: { ...teacherFormData.qualification, institution: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Year of Completion"
                type="number"
                value={teacherFormData.qualification.yearOfCompletion}
                onChange={(e) => setTeacherFormData({
                  ...teacherFormData,
                  qualification: { ...teacherFormData.qualification, yearOfCompletion: Number(e.target.value) }
                })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Joining Date"
                type="date"
                value={teacherFormData.joiningDate ? teacherFormData.joiningDate.split('T')[0] : ''}
                onChange={(e) => setTeacherFormData({
                  ...teacherFormData,
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
                value={teacherFormData.salary}
                onChange={(e) => setTeacherFormData({
                  ...teacherFormData,
                  salary: Number(e.target.value)
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Emergency Contact Name"
                value={teacherFormData.emergencyContact.name}
                onChange={(e) => setTeacherFormData({
                  ...teacherFormData,
                  emergencyContact: { ...teacherFormData.emergencyContact, name: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Emergency Contact Phone"
                value={teacherFormData.emergencyContact.phone}
                onChange={(e) => setTeacherFormData({
                  ...teacherFormData,
                  emergencyContact: { ...teacherFormData.emergencyContact, phone: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Emergency Contact Relationship</InputLabel>
                <Select
                  value={teacherFormData.emergencyContact.relationship}
                  onChange={(e) => setTeacherFormData({
                    ...teacherFormData,
                    emergencyContact: { ...teacherFormData.emergencyContact, relationship: e.target.value as string }
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
            onClick={dialogMode === 'create' ? handleCreateTeacher : () => handleUpdateTeacher(selectedTeacher!)}
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
          <Button onClick={() => handleResetPassword(selectedTeacher?._id!)} variant="contained" color="warning">
            Reset Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Subject Assignment Dialog */}
      {openSubjectAssignmentDialog && selectedTeacher && (
        <Dialog open={openSubjectAssignmentDialog} onClose={() => setOpenSubjectAssignmentDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Assign Classes & Subjects - {selectedTeacher.name}</DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 2 }}>
              <Alert severity="info">
                Assign classes and subjects to this teacher. You can edit or delete existing assignments, or add new ones below.
              </Alert>
            </Box>
            {/* List of current assignments */}
            {assignments.length > 0 && (
              <Box sx={{ mb: 2 }}>
                {assignments.map((a, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography sx={{ minWidth: 150 }}>Class {a.className} - {a.section}</Typography>
                    <Typography sx={{ flex: 1, ml: 2 }}>Subjects: {a.subjects.join(', ')}</Typography>
                    <Button size="small" color="primary" onClick={() => handleEditAssignment(idx)}>Edit</Button>
                    <Button size="small" color="error" onClick={() => handleDeleteAssignment(idx)}>Delete</Button>
                  </Box>
                ))}
              </Box>
            )}
            {/* Add/Edit Assignment Form */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Class</InputLabel>
                  <Select
                    value={assignmentForm.class}
                    onChange={e => {
                      setAssignmentForm({ ...assignmentForm, class: e.target.value as string });
                    }}
                    label="Class"
                  >
                    {['Nursery', 'KG', ...Array.from({ length: 12 }, (_, i) => (i + 1).toString())].map(className => (
                      <MenuItem key={className} value={className}>
                        {className}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Section</InputLabel>
                  <Select
                    value={assignmentForm.section}
                    onChange={e => {
                      setAssignmentForm({ ...assignmentForm, section: e.target.value });
                    }}
                    label="Section"
                  >
                    {['A', 'B', 'C', 'D', 'E'].map(section => (
                      <MenuItem key={section} value={section}>
                        Section {section}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Subjects (comma separated)"
                  value={assignmentForm.subjectsInput}
                  onChange={e => setAssignmentForm({ ...assignmentForm, subjectsInput: e.target.value })}
                  placeholder="Mathematics, Physics, English"
                  helperText="Enter one or more subjects separated by commas."
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={handleAddOrUpdateAssignment}
                  sx={{ mt: 1 }}
                >
                  {assignmentForm.editingIndex === -1 ? 'Add Assignment' : 'Update Assignment'}
                </Button>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenSubjectAssignmentDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={async () => {
                await handleSaveSubjectAssignments(assignments);
              }}
            >
              Save All Assignments
            </Button>
          </DialogActions>
        </Dialog>
      )}

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