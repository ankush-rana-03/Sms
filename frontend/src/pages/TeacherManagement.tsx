import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import SubjectClassAssignment from '../components/SubjectClassAssignment';
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


// Enhanced interfaces for better type safety and data handling
interface Teacher {
  _id: string;
  teacherId: string;
  name: string;
  email: string;
  phone: string;
  designation: 'TGT' | 'PGT' | 'JBT' | 'NTT';
  subjects: string[];
  assignedClasses: Array<{
    class: string | { _id: string; name: string; grade: string; section: string };
    section: string;
    subject: string;
    grade: string;
    time?: string;
    day?: string;
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
  message?: string;
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
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openLoginLogsDialog, setOpenLoginLogsDialog] = useState(false);
  const [openPasswordResetDialog, setOpenPasswordResetDialog] = useState(false);

  const [openSubjectAssignmentDialog, setOpenSubjectAssignmentDialog] = useState(false)
  const [availableClasses, setAvailableClasses] = useState<any[]>([])
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [statistics, setStatistics] = useState<TeacherStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [count, setCount] = useState(0);
  const [limit] = useState(10);
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

  // Assignment module removed


  useEffect(() => {
    if (user) {
      fetchTeachers();
      fetchStatistics();
      fetchAvailableClasses();
    }
  }, [user, page, searchTerm, designationFilter, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<TeachersResponse>(`/admin/teachers?page=${page}&limit=${limit}&search=${searchTerm}`);
      
      if (response.success) {
        setTeachers(response.data);
        setTotalPages(response.totalPages);
        setCount(response.count);
        console.log(`Fetched ${response.count} teachers, ${response.totalPages} total pages`);
      } else {
        showSnackbar(response.message || 'Error fetching teachers', 'error');
      }
    } catch (error: any) {
      console.error('Error fetching teachers:', error);
      showSnackbar(error.response?.data?.message || error.message || 'Error fetching teachers', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Add function to refresh specific teacher data
  const refreshTeacherData = async (teacherId: string) => {
    try {
      const response = await apiService.get<{ success: boolean; data: Teacher }>(`/admin/teachers/${teacherId}`);
      if (response.success) {
        // Update the specific teacher in the teachers list
        setTeachers(prev => prev.map(t => t._id === teacherId ? response.data : t));
        
        // If this teacher is currently selected, update selectedTeacher as well
        if (selectedTeacher && selectedTeacher._id === teacherId) {
          setSelectedTeacher(response.data);
        }
        
        return response.data;
      }
    } catch (error: any) {
      console.error('Error refreshing teacher data:', error);
    }
    return null;
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
      // If we can't fetch classes, we'll work with empty array
      // The UI will still work by using class IDs directly
      setAvailableClasses([]);
    }
  };

  const handleDeleteSubject = async (classId: string, section: string, subject: string) => {
    if (!selectedTeacher) return;

    try {
      const response = await apiService.delete(`/admin/teachers/${selectedTeacher._id}/subject-assignment`, {
        data: { classId, section, subject }
      });

      if (response.success) {
        showSnackbar('Subject assignment deleted successfully', 'success');
        // Refresh teacher data
        await refreshTeacherData(selectedTeacher._id);
      } else {
        showSnackbar(response.message || 'Error deleting subject assignment', 'error');
      }
    } catch (error: any) {
      console.error('Error deleting subject assignment:', error);
      showSnackbar(error.response?.data?.message || 'Error deleting subject assignment', 'error');
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
        ...teacherFormData,
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
    setOpenSubjectAssignmentDialog(true);
    
    console.log('=== OPENING ASSIGNMENT DIALOG ===');
    console.log('Teacher:', teacher.name);
    console.log('Teacher assigned classes:', teacher.assignedClasses);
    
    try {
      // Transform backend data to frontend format
      const transformedAssignments = teacher.assignedClasses.reduce((acc, ac) => {
        // Extract class information - handle both string and object formats
        let className: string;
        let classId: string;
        
        if (typeof ac.class === 'object') {
          className = ac.class.name;
          classId = ac.class._id;
        } else {
          className = ac.class;
          classId = ac.class;
        }
        
        // Create unique key for grouping
        const key = `${classId}-${ac.section}`;
        
        if (!acc[key]) {
          acc[key] = {
            id: `${classId}-${ac.section}-${Date.now()}`, // Assign a temporary ID
            class: className,        // Use class name for form (e.g., "Nursery", "10")
            className: className,    // Keep for display
            section: ac.section,
            subjects: [],
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }
        
        // Add subject with time and day
        acc[key].subjects.push({
          id: `${classId}-${ac.section}-${Date.now()}-${acc[key].subjects.length}`, // Assign a temporary ID
          name: ac.subject,
          time: ac.time || '9:00 AM',
          day: ac.day || 'Monday',
          class: className, // Store individual class
          section: ac.section // Store individual section
        });
        
        return acc;
      }, {} as Record<string, any>); // Changed to any as AssignmentItem is removed

      const finalAssignments = Object.values(transformedAssignments);
      console.log('Transformed assignments:', finalAssignments);
      
      // setAssignments(finalAssignments); // This state is removed
      
      // Reset form with defaults
      // setAssignmentForm({ // This state is removed
      //   class: '',
      //   section: '',
      //   subjectName: '',
      //   subjectTime: '9:00 AM',
      //   subjectDay: 'Monday',
      //   editingIndex: -1
      // });
      
      console.log('=== DIALOG OPENED SUCCESSFULLY ===');
    } catch (error) {
      console.error('Error opening assignment dialog:', error);
      showSnackbar('Error loading assignments', 'error');
    }
  };

  const handleSaveAssignments = async (assignments: any[]) => {
    if (!selectedTeacher) return;

    try {
      // Transform assignments back to the format expected by the backend
      const backendAssignments = assignments.flatMap(assignment => 
        assignment.subjects.map(subject => ({
          class: assignment.classId,
          section: assignment.section,
          subject: subject,
          grade: assignment.grade,
          time: '',
          day: ''
        }))
      );

      const response = await apiService.post(`/admin/teachers/${selectedTeacher._id}/assign-classes`, {
        assignedClasses: backendAssignments
      });

      if (response.success) {
        showSnackbar('Assignments updated successfully', 'success');
        // Refresh teacher data
        fetchTeachers();
      } else {
        showSnackbar(response.message || 'Error updating assignments', 'error');
      }
    } catch (error: any) {
      console.error('Error saving assignments:', error);
      showSnackbar(error.response?.data?.message || 'Error saving assignments', 'error');
    }
  };

  const fetchAvailableClasses = async () => {
    try {
      const response = await apiService.get('/admin/classes');
      if (response.success) {
        setAvailableClasses(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching available classes:', error);
    }
  };



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
    
    // Reset assignment form
    // setAssignmentForm({ // This state is removed
    //   class: '',
    //   section: '',
    //   subjectName: '',
    //   subjectTime: '',
    //   subjectDay: '',
    //   editingIndex: -1
    // });
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



  // Comprehensive validation function with enhanced rules
  // const validateAssignmentForm = (): ValidationErrors => { // This function is removed
  //   const errors: ValidationErrors = {};
    
  //   // Validate class
  //   if (!assignmentForm.class.trim()) {
  //     errors.class = 'Class is required';
  //   } else if (!['Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].includes(assignmentForm.class)) {
  //     errors.class = 'Invalid class selected';
  //   }
    
  //   // Validate section
  //   if (!assignmentForm.section.trim()) {
  //     errors.section = 'Section is required';
  //   } else if (!['A', 'B', 'C', 'D', 'E'].includes(assignmentForm.section)) {
  //     errors.section = 'Invalid section selected';
  //   }
    
  //   // Validate subject name
  //   if (!assignmentForm.subjectName.trim()) {
  //     errors.subjectName = 'Subject name is required';
  //   } else if (assignmentForm.subjectName.trim().length < 2) {
  //     errors.subjectName = 'Subject name must be at least 2 characters';
  //   } else if (assignmentForm.subjectName.trim().length > 50) {
  //     errors.subjectName = 'Subject name must be less than 50 characters';
  //   }
    
  //   // Validate time
  //   if (!assignmentForm.subjectTime.trim()) {
  //     errors.time = 'Time is required';
  //   } else {
  //     const validTimes = [
  //       '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
  //       '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
  //       '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM'
  //     ];
  //     if (!validTimes.includes(assignmentForm.subjectTime)) {
  //       errors.time = 'Invalid time selected';
  //     }
  //   }
    
  //   // Validate day
  //   if (!assignmentForm.subjectDay.trim()) {
  //     errors.day = 'Day is required';
  //   } else {
  //     const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  //     if (!validDays.includes(assignmentForm.subjectDay)) {
  //       errors.day = 'Invalid day selected';
  //     }
  //   }
    
  //   // Additional business logic validation
  //   if (assignmentForm.class === 'Nursery' || assignmentForm.class === 'KG') {
  //     if (assignmentForm.section !== 'A' && assignmentForm.section !== 'B') {
  //       errors.section = 'Nursery and KG only support sections A and B';
  //     }
  //   }
    
  //   setAssignmentErrors(errors);
  //   return errors;
  // };

  // Enhanced time conflict detection with comprehensive checking
  // const checkTimeConflict = (newSubject: { id: string; name: string; time: string; day: string }): { hasConflict: boolean; conflictingSubjects: Array<{ name: string; class: string; section: string; time: string; day: string }> } => { // This function is removed
  //   console.log('=== ENHANCED TIME CONFLICT CHECK ===');
  //   console.log('Checking for conflicts with class:', assignmentForm.class, 'section:', assignmentForm.section);
  //   console.log('New subject:', newSubject);
    
  //   const conflictingSubjects: Array<{ name: string; class: string; section: string; time: string; day: string }> = [];
    
  //   const hasConflict = assignments.some((assignment, index) => {
  //     // Skip the assignment being edited
  //     if (assignmentForm.editingIndex !== -1 && index === assignmentForm.editingIndex) {
  //       console.log('Skipping assignment at index', index, '(being edited)');
  //       return false;
  //     }
      
  //     // Check if same class and section
  //     if (assignment.class === assignmentForm.class && assignment.section === assignmentForm.section) {
  //       console.log('Found matching class/section assignment:', assignment);
        
  //       // Check for time conflict
  //       const conflict = assignment.subjects.some(subject => 
  //         subject.day === newSubject.day && subject.time === newSubject.time
  //       );
        
  //       if (conflict) {
  //         const conflictingSubject = assignment.subjects.find(s => 
  //           s.day === newSubject.day && s.time === newSubject.time
  //         );
  //         console.log('Time conflict found with:', conflictingSubject);
          
  //         conflictingSubjects.push({
  //           name: conflictingSubject!.name,
  //           class: assignment.class,
  //           section: assignment.section,
  //           time: conflictingSubject!.time,
  //           day: conflictingSubject!.day
  //         });
  //       }
        
  //       return conflict;
  //     }
      
  //     return false;
  //   });
    
  //   console.log('Time conflict result:', hasConflict);
  //   console.log('Conflicting subjects:', conflictingSubjects);
  //   console.log('=== END ENHANCED TIME CONFLICT CHECK ===');
    
  //   return { hasConflict, conflictingSubjects };
  // };

  // const handleAddOrUpdateAssignment = async () => { // This function is removed
  //   if (!selectedTeacher) {
  //     showSnackbar('No teacher selected', 'error');
  //     return;
  //   }

  //   console.log('=== ADD/UPDATE ASSIGNMENT ===');
  //   console.log('Form data:', assignmentForm);
  //   console.log('Current assignments:', assignments);

  //   // Validate form
  //   const validation = validateAssignmentForm();
  //   if (Object.keys(validation).length > 0) {
  //     showSnackbar('Please fix the form errors', 'error');
  //     return;
  //   }

  //   const newSubject = {
  //     id: `${assignmentForm.class}-${assignmentForm.section}-${Date.now()}-${Date.now()}`, // Generate unique ID
  //     name: assignmentForm.subjectName.trim(),
  //     time: assignmentForm.subjectTime,
  //     day: assignmentForm.subjectDay,
  //     class: assignmentForm.class, // Store individual class
  //     section: assignmentForm.section // Store individual section
  //   };

  //   console.log('Subject to add/update:', newSubject);

  //   try {
  //     // Check for time conflicts with enhanced detection
  //     const conflictCheck = checkTimeConflict(newSubject);
  //     if (conflictCheck.hasConflict) {
  //       const conflictDetails = conflictCheck.conflictingSubjects.map(cs => 
  //         `${cs.name} (${cs.class}-${cs.section})`
  //       ).join(', ');
        
  //       showSnackbar(
  //         `Time conflict detected! The following subjects are already scheduled at ${newSubject.time} on ${newSubject.day}: ${conflictDetails}`,
  //         'error'
  //       );
  //       return;
  //     }

  //     let updatedAssignments: AssignmentItem[];

  //     if (assignmentForm.editingIndex === -1) {
  //       // Adding new assignment
  //       console.log('Adding new assignment');
  //       updatedAssignments = addNewAssignment(newSubject);
  //     } else {
  //       // Updating existing assignment
  //       console.log('Updating existing assignment at index:', assignmentForm.editingIndex);
  //       updatedAssignments = updateExistingAssignment(newSubject);
  //     }

  //     // Update local state
  //     setAssignments(updatedAssignments);
  //     console.log('Updated local assignments:', updatedAssignments);

  //     // Save to backend
  //     await saveAssignmentsToBackend(updatedAssignments);

  //     // Reset form and show success message
  //     const wasEditing = assignmentForm.editingIndex !== -1;
  //     resetAssignmentForm();
      
  //     showSnackbar(
  //       wasEditing ? 'Assignment updated successfully!' : 'Assignment added successfully!',
  //       'success'
  //     );

  //   } catch (error: any) {
  //     console.error('Error in handleAddOrUpdateAssignment:', error);
  //     showSnackbar('Error saving assignment. Please try again.', 'error');
  //   }
  // };

  // Helper function to add new assignment
  // const addNewAssignment = (newSubject: { id: string; name: string; time: string; day: string; class: string; section: string }): AssignmentItem[] => { // This function is removed
  //   // Check if class+section combination already exists
  //   const existingIndex = assignments.findIndex(a => 
  //     a.class === newSubject.class && a.section === newSubject.section
  //   );

  //   if (existingIndex !== -1) {
  //     // Add subject to existing assignment
  //     console.log('Adding subject to existing assignment at index:', existingIndex);
  //     return assignments.map((a, index) => 
  //       index === existingIndex 
  //         ? { ...a, subjects: [...a.subjects, newSubject] }
  //         : a
  //     );
  //   } else {
  //     // Create new assignment
  //     console.log('Creating new assignment');
  //     const newAssignment: AssignmentItem = {
  //       id: `${newSubject.class}-${newSubject.section}-${Date.now()}`, // Assign a temporary ID
  //       class: newSubject.class,
  //       className: newSubject.class,
  //       section: newSubject.section,
  //       subjects: [newSubject],
  //       createdAt: new Date(),
  //       updatedAt: new Date()
  //     };
      
  //     console.log('New assignment created:', newAssignment);
  //     return [...assignments, newAssignment];
  //   }
  // };

  // Helper function to update existing assignment - NOW SUBJECT-LEVEL EDITING
  // const updateExistingAssignment = (newSubject: { id: string; name: string; time: string; day: string; class: string; section: string }): AssignmentItem[] => { // This function is removed
  //   console.log('=== SUBJECT-LEVEL UPDATE ===');
  //   console.log('Current form values:', assignmentForm);
  //   console.log('New subject:', newSubject);
  //   console.log('Editing assignment index:', assignmentForm.editingIndex);
  //   console.log('Editing subject ID:', assignmentForm.editingSubjectId);
    
  //   // Find the assignment being edited
  //   const assignmentToEdit = assignments[assignmentForm.editingIndex];
  //   if (!assignmentToEdit) {
  //     console.error('Assignment to edit not found');
  //     return assignments;
  //   }
    
  //   console.log('Assignment being edited:', assignmentToEdit);
    
  //   // Find the specific subject being edited
  //   const subjectToEditIndex = assignmentToEdit.subjects.findIndex(s => s.id === assignmentForm.editingSubjectId);
  //   if (subjectToEditIndex === -1) {
  //     console.error('Subject to edit not found');
  //     return assignments;
  //   }
    
  //   console.log('Subject being edited (index):', subjectToEditIndex);
  //   console.log('Subject being edited:', assignmentToEdit.subjects[subjectToEditIndex]);
    
  //   // Check if class/section changed
  //   const oldClass = assignmentToEdit.subjects[subjectToEditIndex].class;
  //   const oldSection = assignmentToEdit.subjects[subjectToEditIndex].section;
  //   const newClass = newSubject.class;
  //   const newSection = newSubject.section;
    
  //   console.log('Class change:', oldClass, '->', newClass);
  //   console.log('Section change:', oldSection, '->', newSection);
    
  //   // If class or section changed, we need to handle this carefully
  //   if (oldClass !== newClass || oldSection !== newSection) {
  //     console.log('Class or section changed - handling subject migration');
      
  //     // Remove the subject from the old assignment
  //     const updatedOldAssignment = {
  //       ...assignmentToEdit,
  //       subjects: assignmentToEdit.subjects.filter((_, index) => index !== subjectToEditIndex),
  //       updatedAt: new Date()
  //     };
      
  //     // Find or create the new assignment for the new class/section
  //     let newAssignmentIndex = assignments.findIndex(a => 
  //       a.class === newClass && a.section === newSection
  //     );
      
  //     let updatedAssignments = assignments.map((assignment, index) => {
  //       if (index === assignmentForm.editingIndex) {
  //         // Return the old assignment without the edited subject
  //         return updatedOldAssignment;
  //       }
  //       return assignment;
  //     });
      
  //     if (newAssignmentIndex === -1) {
  //       // Create new assignment group for the new class/section
  //       const newAssignment: AssignmentItem = {
  //         id: `${newClass}-${newSection}-${Date.now()}`,
  //         class: newClass,
  //         className: newClass,
  //         section: newSection,
  //         subjects: [newSubject],
  //         createdAt: new Date(),
  //         updatedAt: new Date()
  //       };
        
  //       updatedAssignments.push(newAssignment);
  //       console.log('Created new assignment group:', newAssignment);
  //     } else {
  //       // Add subject to existing assignment group
  //       updatedAssignments = updatedAssignments.map((assignment, index) => {
  //         if (index === newAssignmentIndex) {
  //           return {
  //             ...assignment,
  //             subjects: [...assignment.subjects, newSubject],
  //             updatedAt: new Date()
  //           };
  //         }
  //         return assignment;
  //       });
  //       console.log('Added subject to existing assignment group');
  //     }
      
  //     // Remove empty assignment groups
  //     updatedAssignments = updatedAssignments.filter(assignment => assignment.subjects.length > 0);
      
  //     console.log('Final updated assignments:', updatedAssignments);
  //     return updatedAssignments;
      
  //   } else {
  //     // No class/section change - just update the subject
  //     console.log('No class/section change - updating subject in place');
      
  //     return assignments.map((assignment, index) => {
  //       if (index === assignmentForm.editingIndex) {
  //         return {
  //           ...assignment,
  //           subjects: assignment.subjects.map((subject, subIndex) => 
  //             subIndex === subjectToEditIndex ? newSubject : subject
  //           ),
  //           updatedAt: new Date()
  //         };
  //       }
  //       return assignment;
  //     });
  //   }
  // };

  // Helper function to save assignments to backend
  // const saveAssignmentsToBackend = async (assignmentsToSave: AssignmentItem[]) => { // This function is removed
  //   console.log('=== SAVING TO BACKEND ===');
  //   console.log('Assignments to save:', assignmentsToSave);
    
  //   setIsSavingAssignment(true);
    
  //   try {
  //     // Transform to backend format
  //     const backendData = assignmentsToSave.flatMap(assignment => 
  //       assignment.subjects.map(subject => ({
  //         class: subject.class,        // This should be the updated class name
  //         section: subject.section,    // This should be the updated section
  //         subject: subject.name,
  //         grade: subject.class === 'Nursery' || subject.class === 'KG' ? subject.class : subject.class,
  //         time: subject.time,
  //         day: subject.day
  //       }))
  //     );

  //     console.log('Backend data being sent:', backendData);
  //     console.log('Check if class changes are included:');
  //     backendData.forEach((item, index) => {
  //       console.log(`Item ${index}: class=${item.class}, section=${item.section}, subject=${item.subject}`);
  //     });

  //     const response = await apiService.post<{ success: boolean; message: string; data: Teacher }>(
  //       `/admin/teachers/${selectedTeacher!._id}/assign-classes`,
  //       { assignedClasses: backendData }
  //     );

  //     if (response.success) {
  //       console.log('Backend save successful:', response.data);
  //       console.log('Backend returned assignedClasses:', response.data.assignedClasses);
        
  //       // Check if the backend actually updated the class
  //       const backendClassUpdates = response.data.assignedClasses.map(ac => ({
  //         class: typeof ac.class === 'object' ? ac.class.name : ac.class,
  //         section: ac.section,
  //         subject: ac.subject
  //       }));
  //       console.log('Backend class updates:', backendClassUpdates);
        
  //       // Update teacher data
  //       setTeachers(prev => prev.map(t => t._id === selectedTeacher!._id ? response.data : t));
  //       setSelectedTeacher(response.data);
        
  //       // Refresh assignments from backend
  //       await refreshAssignmentsFromBackend(response.data);
  //     } else {
  //       throw new Error(response.message || 'Backend save failed');
  //     }
  //   } finally {
  //     setIsSavingAssignment(false);
  //   }
  // };

  // Helper function to refresh assignments from backend
  // const refreshAssignmentsFromBackend = async (teacherData: Teacher) => { // This function is removed
  //   try {
  //     console.log('=== REFRESHING FROM BACKEND ===');
  //     console.log('Backend teacher data:', teacherData);
  //     console.log('Backend assignedClasses:', teacherData.assignedClasses);
      
  //     // Transform backend data back to frontend format
  //     const refreshedAssignments = teacherData.assignedClasses.reduce((acc, ac) => {
  //       let className: string;
  //       let classId: string;
        
  //       if (typeof ac.class === 'object') {
  //         className = ac.class.name;
  //         classId = ac.class._id;
  //       } else {
  //         className = ac.class;
  //         classId = ac.class;
  //       }
        
  //       // Use class name + section as key to ensure proper grouping
  //       const key = `${className}-${ac.section}`;
        
  //       console.log(`Processing: class=${className}, section=${ac.section}, key=${key}`);
        
  //       if (!acc[key]) {
  //         acc[key] = {
  //           id: `${classId}-${ac.section}-${Date.now()}`, // Assign a temporary ID
  //           class: className,
  //           className: className,
  //           section: ac.section,
  //           subjects: [],
  //           createdAt: new Date(),
  //           updatedAt: new Date()
  //         };
  //       }
        
  //       acc[key].subjects.push({
  //         id: `${classId}-${ac.section}-${Date.now()}-${acc[key].subjects.length}`, // Assign a temporary ID
  //         name: ac.subject,
  //         time: ac.time || '9:00 AM',
  //         day: ac.day || 'Monday',
  //         class: className, // Store individual class
  //         section: ac.section // Store individual section
  //       });
        
  //       return acc;
  //     }, {} as Record<string, AssignmentItem>);

  //     const finalAssignments = Object.values(refreshedAssignments);
  //     console.log('Final refreshed assignments:', finalAssignments);
      
  //     setAssignments(finalAssignments);
  //     console.log('=== REFRESH COMPLETE ===');
  //   } catch (error) {
  //     console.error('Error refreshing assignments from backend:', error);
  //   }
  // };

  // Enhanced form reset with proper cleanup
  // const resetAssignmentForm = () => { // This function is removed
  //   setAssignmentForm({
  //     class: '',
  //     section: '',
  //     subjectName: '',
  //     subjectTime: '9:00 AM',
  //     subjectDay: 'Monday',
  //     editingIndex: -1,
  //     editingSubjectId: undefined,
  //     editingAssignmentId: undefined
  //   });
  //   setAssignmentErrors({});
  //   console.log('Form reset completed');
  // };

  // Enhanced form validation display
  // const renderFormErrors = () => { // This function is removed
  //   const hasErrors = Object.keys(assignmentErrors).length > 0;
    
  //   if (!hasErrors) return null;
    
  //   return (
  //     <Alert severity="error" sx={{ mb: 2 }}>
  //       <Typography variant="subtitle2" sx={{ mb: 1 }}>
  //         Please fix the following errors:
  //       </Typography>
  //       <ul style={{ margin: 0, paddingLeft: '20px' }}>
  //         {Object.entries(assignmentErrors).map(([field, error]) => (
  //           <li key={field}>
  //             <strong>{field.charAt(0).toUpperCase() + field.slice(1)}:</strong> {error}
  //           </li>
  //         ))}
  //       </ul>
  //     </Alert>
  //   );
  // };

  // Function to close assignment dialog
  // const handleCloseAssignmentDialog = () => { // This function is removed
  //   setOpenSubjectAssignmentDialog(false);
  //   resetAssignmentForm();
  //   setSelectedTeacher(null);
  // };

  // Function to cancel editing
  // const handleCancelEdit = () => { // This function is removed
  //   resetAssignmentForm();
  // };

  // Comprehensive testing function for quality assurance
  // const runComprehensiveTests = async () => { // This function is removed
  //   console.log('=== COMPREHENSIVE QUALITY TESTING STARTED ===');
    
  //   try {
  //     // Test 1: Form Validation
  //     console.log('🧪 Test 1: Form Validation');
  //     const emptyForm = { class: '', section: '', subjectName: '', subjectTime: '', subjectDay: '', editingIndex: -1 };
  //     setAssignmentForm(emptyForm);
  //     const validationErrors = validateAssignmentForm();
  //     console.log('Empty form validation errors:', validationErrors);
      
  //     // Test 2: Time Conflict Detection
  //     console.log('🧪 Test 2: Time Conflict Detection');
  //     const testSubject = { id: 'test-subject-1', name: 'Test Subject', time: '9:00 AM', day: 'Monday' };
  //     const conflictResult = checkTimeConflict(testSubject);
  //     console.log('Time conflict test result:', conflictResult);
      
  //     // Test 3: Data Transformation
  //     console.log('🧪 Test 3: Data Transformation');
  //     const testAssignments: AssignmentItem[] = [
  //       {
  //         id: 'test-1',
  //         class: 'Nursery',
  //         className: 'Nursery',
  //         section: 'A',
  //         subjects: [{ 
  //           id: 'sub-1', 
  //           name: 'Math', 
  //           time: '9:00 AM', 
  //           day: 'Monday',
  //           class: 'Nursery',
  //           section: 'A'
  //         }],
  //         createdAt: new Date(),
  //         updatedAt: new Date()
  //       }
  //     ];
  //     console.log('Test assignments:', testAssignments);
      
  //     // Test 4: Edge Cases
  //     console.log('🧪 Test 4: Edge Cases');
  //     console.log('Nursery with section C (should fail validation):', 
  //       ['Nursery', 'C'].every(val => ['Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].includes(val)));
      
  //     console.log('=== COMPREHENSIVE QUALITY TESTING COMPLETED ===');
      
  //   } catch (error) {
  //     console.error('Testing failed:', error);
  //   }
  // };

  // Auto-run tests in development mode
  // useEffect(() => { // This useEffect is removed
  //   if (process.env.NODE_ENV === 'development') {
  //     // Uncomment the next line to run comprehensive tests automatically
  //     // runComprehensiveTests();
  //   }
  // }, []);

  // Enhanced handleEditAssignment function for subject-level editing
  // const handleEditAssignment = (assignmentIndex: number, subjectIndex: number) => { // This function is removed
  //   const assignment = assignments[assignmentIndex];
  //   if (!assignment || !assignment.subjects[subjectIndex]) {
  //     showSnackbar('Invalid assignment selected for editing', 'error');
  //     return;
  //   }
    
  //   console.log('=== EDITING SUBJECT ===');
  //   console.log('Assignment index:', assignmentIndex);
  //   console.log('Subject index:', subjectIndex);
  //   console.log('Assignment:', assignment);
    
  //   const subjectToEdit = assignment.subjects[subjectIndex];
  //   console.log('Subject to edit:', subjectToEdit);
    
  //   // Clear any previous errors
  //   setAssignmentErrors({});
    
  //   // Set the form with the current subject data
  //   setAssignmentForm({
  //     class: subjectToEdit.class,           // Use subject's individual class
  //     section: subjectToEdit.section,       // Use subject's individual section
  //     subjectName: subjectToEdit.name,
  //     subjectTime: subjectToEdit.time,
  //     subjectDay: subjectToEdit.day,
  //     editingIndex: assignmentIndex,
  //     editingSubjectId: subjectToEdit.id,  // Track which specific subject
  //     editingAssignmentId: assignment.id   // Track which assignment group
  //   });
    
  //   console.log('Form populated for editing:', {
  //     class: subjectToEdit.class,
  //     section: subjectToEdit.section,
  //     subjectName: subjectToEdit.name,
  //     editingIndex: assignmentIndex,
  //     editingSubjectId: subjectToEdit.id
  //   });
  //   console.log('=== EDIT SUBJECT COMPLETE ===');
  // };



  // const handleDeleteSubject = async (assignmentIndex: number, subjectIndex: number) => { // This function is removed
  //   if (!selectedTeacher) {
  //     showSnackbar('No teacher selected', 'error');
  //     return;
  //   }

  //   try {
  //     console.log('=== DELETE SUBJECT ===');
  //     console.log('Deleting subject at assignment index:', assignmentIndex, 'subject index:', subjectIndex);
      
  //     // Update local state immediately for real-time UI update
  //     const updatedAssignments = assignments.map((assignment, idx) => {
  //       if (idx === assignmentIndex) {
  //         const newSubjects = assignment.subjects.filter((_, subIdx) => subIdx !== subjectIndex);
  //         if (newSubjects.length === 0) {
  //           // If no subjects left, remove the entire assignment
  //           console.log('No subjects left, removing entire assignment');
  //           return null;
  //         }
  //         console.log('Updated subjects:', newSubjects);
  //         return { ...assignment, subjects: newSubjects };
  //       }
  //       return assignment;
  //     }).filter(Boolean) as AssignmentItem[];

  //     console.log('Updated assignments after deletion:', updatedAssignments);
  //     setAssignments(updatedAssignments);

  //     // Save to backend
  //     await saveAssignmentsToBackend(updatedAssignments);

  //     showSnackbar('Subject deleted successfully', 'success');
  //     console.log('=== DELETE SUBJECT COMPLETE ===');
  //   } catch (error: any) {
  //     console.error('Error deleting subject:', error);
  //     showSnackbar('Error deleting subject. Please try again.', 'error');
  //   }
  // };


  // Check if user is authenticated
  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

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
                      <TableCell>Phone</TableCell>
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
                          <Typography variant="body2">
                            {teacher.phone || 'N/A'}
                          </Typography>
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

                            <Tooltip title="Manage Assignments">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenSubjectAssignmentDialog(teacher)}
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
                    <strong>Note:</strong> Subject assignments are now managed through the "Assign Subjects" button in the teacher list. 
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

      {/* Subject Class Assignment Dialog */}
      <SubjectClassAssignment
        open={openSubjectAssignmentDialog}
        onClose={() => setOpenSubjectAssignmentDialog(false)}
        teacherId={selectedTeacher?._id || ''}
        teacherName={selectedTeacher?.name || ''}
        availableClasses={availableClasses}
        currentAssignments={selectedTeacher?.assignedClasses ? selectedTeacher.assignedClasses.reduce((acc, ac) => {
          const key = `${ac.class}-${ac.section}`;
          if (!acc[key]) {
            acc[key] = {
              classId: typeof ac.class === 'string' ? ac.class : ac.class._id,
              className: typeof ac.class === 'string' ? ac.class : ac.class.name,
              grade: ac.grade,
              section: ac.section,
              subjects: []
            };
          }
          if (ac.subject && !acc[key].subjects.includes(ac.subject)) {
            acc[key].subjects.push(ac.subject);
          }
          return acc;
        }, {} as Record<string, any>) : []}
        onSave={handleSaveAssignments}
        onDeleteSubject={handleDeleteSubject}
      />

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