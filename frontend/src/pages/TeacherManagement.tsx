import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
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
  Assignment
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
    time?: string; // Add time field
    day?: string;  // Add day field
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

  // New state for Assign Classes & Subjects dialog
  const [assignments, setAssignments] = useState<{ 
    class: string, 
    className: string, 
    section: string, 
    subjects: Array<{ name: string, time: string, day: string }> 
  }[]>([]);
  const [assignmentForm, setAssignmentForm] = useState({
    class: '',
    section: '',
    subjectName: '',
    subjectTime: '',
    subjectDay: '',
    editingIndex: -1
  });


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
    
    console.log('Opening dialog for teacher:', teacher);
    console.log('Teacher assigned classes:', teacher.assignedClasses);
    
    // Group assignments by class and section to combine subjects
    const groupedAssignments = teacher.assignedClasses.reduce((acc, ac) => {
      // Handle both populated and unpopulated class data
      const classId = typeof ac.class === 'object' ? ac.class._id : ac.class;
      const className = typeof ac.class === 'object' ? ac.class.name : `Class ${ac.class}`;
      
      const key = `${classId}-${ac.section}`;
      if (!acc[key]) {
        acc[key] = {
          class: classId, // Use class ID instead of name
          className: className, // Keep class name for display
          section: ac.section,
          subjects: []
        };
      }
      // Convert string subject to object with time and day (preserve actual values if they exist)
      acc[key].subjects.push({
        name: ac.subject,
        time: ac.time || '9:00 AM', // Use actual time if available, otherwise default
        day: ac.day || 'Monday'     // Use actual day if available, otherwise default
      });
      return acc;
    }, {} as Record<string, { class: string; className: string; section: string; subjects: Array<{ name: string, time: string, day: string }> }>);

    const transformedAssignments = Object.values(groupedAssignments);
    console.log('Transformed assignments:', transformedAssignments);
    
    setAssignments(transformedAssignments);
    setAssignmentForm({ class: '', section: '', subjectName: '', subjectTime: '', subjectDay: '', editingIndex: -1 });
    setOpenSubjectAssignmentDialog(true);
    
    console.log('Form reset to:', { class: '', section: '', subjectName: '', subjectTime: '', subjectDay: '', editingIndex: -1 });
  };

  const handleSaveSubjectAssignments = async (assignmentsToSave: { 
    class: string, 
    className: string, 
    section: string, 
    subjects: Array<{ name: string, time: string, day: string }> 
  }[]) => {
    if (!selectedTeacher) return;

    try {
      console.log('Saving assignments:', assignmentsToSave);
      console.log('Available classes:', availableClasses);

      // Transform the data to match the backend expected format
      const transformedAssignments = assignmentsToSave.flatMap(assignment => 
        assignment.subjects.map(subject => {
          // Since we're now using class names, we can use them directly
          const className = assignment.class;
          
          // Extract grade from class name
          let grade = className;
          if (className === 'Nursery' || className === 'KG') {
            grade = className;
          } else {
            grade = className.replace('Class ', '').replace('Class', '').trim();
          }

          return {
            class: className,        // Send class name
            section: assignment.section,
            subject: subject.name,   // Extract just the subject name for backend
            grade: grade,
            time: subject.time,      // Include time
            day: subject.day         // Include day
          };
        })
      );

      console.log('Transformed assignments:', transformedAssignments);
      console.log('Sending to API:', { assignedClasses: transformedAssignments });

      console.log('Sending request to:', `/admin/teachers/${selectedTeacher._id}/assign-classes`);
      console.log('Request payload:', { assignedClasses: transformedAssignments });
      
      const response = await apiService.post<{ success: boolean; message: string; data: Teacher }>(
        `/admin/teachers/${selectedTeacher._id}/assign-classes`,
        { assignedClasses: transformedAssignments }
      );
      
      console.log('Response received:', response);

      if (response.success) {
        // Update teacher in UI - IMPORTANT: Update the teachers list first
        setTeachers(prev => prev.map(t => t._id === selectedTeacher._id ? response.data : t));
        
        // Update the selected teacher with the new data
        setSelectedTeacher(response.data);
        
        // CRITICAL FIX: Refresh teacher data to ensure complete synchronization
        await refreshTeacherData(selectedTeacher._id);
        
        // Update local assignments state to reflect the new data structure
        // Transform the response data back to our local format
        const updatedLocalAssignments = response.data.assignedClasses.reduce((acc, ac) => {
          // Handle both populated and unpopulated class data
          const classId = typeof ac.class === 'object' ? ac.class._id : ac.class;
          const className = typeof ac.class === 'object' ? ac.class.name : `Class ${ac.class}`;
          
          const key = `${classId}-${ac.section}`;
          if (!acc[key]) {
            acc[key] = {
              class: classId,
              className: className,
              section: ac.section,
              subjects: []
            };
          }
          // Use the time and day from response, or default values if not present
          acc[key].subjects.push({
            name: ac.subject,
            time: ac.time || '9:00 AM', // Use response time or default
            day: ac.day || 'Monday'     // Use response day or default
          });
          return acc;
        }, {} as Record<string, { class: string; className: string; section: string; subjects: Array<{ name: string, time: string, day: string }> }>);

        console.log('Response data assignedClasses:', response.data.assignedClasses);
        console.log('Transformed local assignments:', updatedLocalAssignments);

        const transformedLocalAssignments = Object.values(updatedLocalAssignments);
        console.log('Updated local assignments:', transformedLocalAssignments);
        console.log('Response data assignedClasses:', response.data.assignedClasses);
        
        // CRITICAL FIX: Update assignments state with the new data
        setAssignments(transformedLocalAssignments);
        
        // Refresh available classes in case new ones were created
        fetchAvailableClasses();
        
        // Show success message
        showSnackbar('Subject assignments updated successfully!', 'success');
        
        // Close the dialog after successful update
        setOpenSubjectAssignmentDialog(false);
      } else {
        showSnackbar(response.message || 'Error updating subject assignments', 'error');
      }
    } catch (error: any) {
      console.error('Error updating subject assignments:', error);
      showSnackbar(error.response?.data?.message || error.message || 'Error updating subject assignments', 'error');
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
    setAssignmentForm({
      class: '',
      section: '',
      subjectName: '',
      subjectTime: '',
      subjectDay: '',
      editingIndex: -1
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



  const handleAddOrUpdateAssignment = async () => {
    if (!selectedTeacher) return;

    console.log('Form data:', assignmentForm);
    console.log('Current assignments:', assignments);

    if (!assignmentForm.class || !assignmentForm.section || !assignmentForm.subjectName.trim() || !assignmentForm.subjectTime.trim() || !assignmentForm.subjectDay.trim()) {
      showSnackbar('Please fill in all fields', 'error');
      return;
    }

    const newSubject = {
      name: assignmentForm.subjectName.trim(),
      time: assignmentForm.subjectTime.trim(),
      day: assignmentForm.subjectDay.trim()
    };

    console.log('New subject to add/update:', newSubject);

    // Check for time conflicts (same class, section, day, and time)
    // When editing, exclude the current assignment being edited from conflict check
    const hasTimeConflict = assignments.some((assignment, assignmentIdx) => {
      // Skip the assignment being edited
      if (assignmentForm.editingIndex !== -1 && assignmentIdx === assignmentForm.editingIndex) {
        return false;
      }
      
      // Check if this assignment has the same class and section
      if (assignment.class === assignmentForm.class && assignment.section === assignmentForm.section) {
        // Check if any subject in this assignment has a time conflict
        return assignment.subjects.some(subject => 
          subject.day === newSubject.day && subject.time === newSubject.time
        );
      }
      
      return false;
    });

    if (hasTimeConflict) {
      showSnackbar('Time conflict detected! Another subject is already scheduled at this time for this class and section.', 'error');
      return;
    }

    try {
      let updatedAssignments: typeof assignments;

      if (assignmentForm.editingIndex === -1) {
        // Adding new subject
        console.log('Adding new subject to existing or new assignment');
        
        // Check if class and section combination already exists
        const existingAssignmentIndex = assignments.findIndex(a => 
          a.class === assignmentForm.class && a.section === assignmentForm.section
        );

        if (existingAssignmentIndex !== -1) {
          // Add subject to existing assignment
          console.log('Adding subject to existing assignment at index:', existingAssignmentIndex);
          updatedAssignments = assignments.map((a, index) => 
            index === existingAssignmentIndex ? {
              ...a,
              subjects: [...a.subjects, newSubject]
            } : a
          );
        } else {
          // Create new assignment
          console.log('Creating new assignment for class:', assignmentForm.class, 'section:', assignmentForm.section);
          
          // For standard classes, use the class name directly
          const className = assignmentForm.class;
          
          const newAssignment = {
            class: assignmentForm.class, // This is now the class name
            className: className,        // Same as class name
            section: assignmentForm.section,
            subjects: [newSubject]
          };
          
          console.log('New assignment created:', newAssignment);
          updatedAssignments = [...assignments, newAssignment];
        }
      } else {
        // Updating existing assignment
        console.log('Updating existing assignment at index:', assignmentForm.editingIndex);
        console.log('Current assignment being edited:', assignments[assignmentForm.editingIndex]);
        
        updatedAssignments = assignments.map((a, index) => {
          if (index === assignmentForm.editingIndex) {
            // Update the first subject (since we're editing the first one)
            const updatedSubjects = [...a.subjects];
            if (updatedSubjects.length > 0) {
              console.log('Updating subject from:', updatedSubjects[0], 'to:', newSubject);
              updatedSubjects[0] = newSubject;
            }
            
            // Keep the existing class and section, but update the subject
            const updatedAssignment = {
              ...a,
              class: assignmentForm.class,     // Keep the class name
              className: assignmentForm.class, // Keep the class name for display
              section: assignmentForm.section, // Keep the section
              subjects: updatedSubjects
            };
            
            console.log('Updated assignment:', updatedAssignment);
            return updatedAssignment;
          }
          return a;
        });
        
        console.log('Final updated assignments:', updatedAssignments);
      }

      // Update local state immediately for real-time UI update
      setAssignments(updatedAssignments);
      
      console.log('About to save assignments:', updatedAssignments);
      console.log('Selected teacher:', selectedTeacher);
      console.log('Available classes:', availableClasses);

      // Save to database
      await handleSaveSubjectAssignments(updatedAssignments);

      // Store the editing state before resetting form
      const wasEditing = assignmentForm.editingIndex !== -1;

      // Reset form
      setAssignmentForm({ 
        class: '', 
        section: '', 
        subjectName: '', 
        subjectTime: '', 
        subjectDay: '', 
        editingIndex: -1 
      });

      showSnackbar(
        wasEditing 
          ? 'Subject assignment updated successfully' 
          : 'Subject assignment added successfully', 
        'success'
      );
    } catch (error: any) {
      console.error('Error saving subject assignment:', error);
      showSnackbar('Error saving subject assignment. Please try again.', 'error');
    }
  };

  const handleEditAssignment = (index: number) => {
    const assignment = assignments[index];
    if (!assignment || assignment.subjects.length === 0) return;
    
    // For editing, we'll edit the first subject (you can enhance this to edit specific subjects)
    const firstSubject = assignment.subjects[0];
    
    // Set the form with the current assignment data
    setAssignmentForm({
      class: assignment.class, // This is the class name (e.g., "Nursery", "10")
      section: assignment.section,
      subjectName: firstSubject.name,
      subjectTime: firstSubject.time,
      subjectDay: firstSubject.day,
      editingIndex: index
    });
    
    console.log('Editing assignment:', assignment);
    console.log('Form set to:', {
      class: assignment.class,
      section: assignment.section,
      subjectName: firstSubject.name,
      subjectTime: firstSubject.time,
      subjectDay: firstSubject.day,
      editingIndex: index
    });
  };



  const handleDeleteSubject = async (assignmentIndex: number, subjectIndex: number) => {
    try {
      // Update local state immediately for real-time UI update
      const updatedAssignments = assignments.map((assignment, idx) => {
        if (idx === assignmentIndex) {
          const newSubjects = assignment.subjects.filter((_, subIdx) => subIdx !== subjectIndex);
          if (newSubjects.length === 0) {
            // If no subjects left, remove the entire assignment
            return null;
          }
          return { ...assignment, subjects: newSubjects };
        }
        return assignment;
      }).filter(Boolean) as typeof assignments;

      setAssignments(updatedAssignments);

      // Save to database
      await handleSaveSubjectAssignments(updatedAssignments);

      showSnackbar('Subject deleted successfully', 'success');
    } catch (error: any) {
      console.error('Error deleting subject:', error);
      showSnackbar('Error deleting subject. Please try again.', 'error');
    }
  };


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
                            <Tooltip title="Assign Classes & Subjects">
                              <IconButton size="small" onClick={() => handleOpenSubjectAssignmentDialog(teacher)}>
                                <Assignment />
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
            {/* Assignment Summary */}
            {assignments.length > 0 && (
              <Box sx={{ mb: 2, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Assignment Summary
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Classes: {assignments.length} | Total Subjects: {assignments.reduce((acc, a) => acc + a.subjects.length, 0)}
                </Typography>
              </Box>
            )}

            {/* List of current assignments */}
            {assignments.length > 0 && (
              <Box sx={{ mb: 2 }}>
                {assignments.map((a, idx) => (
                  <Box key={idx} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>
                      Class {a.className} - Section {a.section}
                    </Typography>
                    <Box sx={{ ml: 2 }}>
                      {a.subjects.map((subject, subjectIdx) => (
                        <Box key={subjectIdx} sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mb: 1, 
                          p: 1, 
                          backgroundColor: '#f5f5f5', 
                          borderRadius: 1 
                        }}>
                          <Typography sx={{ minWidth: 120, fontWeight: 'bold' }}>
                            {subject.name}
                          </Typography>
                          <Typography sx={{ minWidth: 100, color: 'text.secondary' }}>
                            {subject.day}
                          </Typography>
                          <Typography sx={{ minWidth: 80, color: 'text.secondary' }}>
                            {subject.time}
                          </Typography>
                          <Box sx={{ ml: 'auto' }}>
                            <Button size="small" color="primary" onClick={() => handleEditAssignment(idx)}>Edit</Button>
                            <Button size="small" color="error" onClick={() => handleDeleteSubject(idx, subjectIdx)}>Delete</Button>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
            {/* Common Subjects Quick Selection */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Quick Subject Selection:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi', 'History', 'Geography', 'Computer Science', 'Physical Education'].map((subject) => (
                  <Chip
                    key={subject}
                    label={subject}
                    size="small"
                    variant="outlined"
                    onClick={() => setAssignmentForm({ ...assignmentForm, subjectName: subject })}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Box>

            {/* Add/Edit Assignment Form */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Class</InputLabel>
                  <Select
                    value={assignmentForm.class}
                    onChange={e => {
                      const selectedClassId = e.target.value;
                      // For standard classes, we'll use the class name as both ID and name
                      setAssignmentForm({ 
                        ...assignmentForm, 
                        class: selectedClassId,
                        section: assignmentForm.section
                      });
                    }}
                    label="Class"
                  >
                    {['Nursery', 'KG', ...Array.from({ length: 12 }, (_, i) => (i + 1).toString())].map(className => (
                      <MenuItem key={className} value={className}>
                        {className === 'KG' ? 'KG' : className === 'Nursery' ? 'Nursery' : `Class ${className}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
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
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="Subject Name"
                  value={assignmentForm.subjectName}
                  onChange={e => setAssignmentForm({ ...assignmentForm, subjectName: e.target.value })}
                  placeholder="Mathematics"
                  helperText="Enter subject name"
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Day</InputLabel>
                  <Select
                    value={assignmentForm.subjectDay}
                    onChange={e => setAssignmentForm({ ...assignmentForm, subjectDay: e.target.value })}
                    label="Day"
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                      <MenuItem key={day} value={day}>
                        {day}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Time</InputLabel>
                  <Select
                    value={assignmentForm.subjectTime}
                    onChange={e => setAssignmentForm({ ...assignmentForm, subjectTime: e.target.value })}
                    label="Time"
                  >
                    {[
                      '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
                      '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
                      '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM'
                    ].map(time => (
                      <MenuItem key={time} value={time}>
                        {time}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={handleAddOrUpdateAssignment}
                  sx={{ mt: 1 }}
                >
                  {assignmentForm.editingIndex === -1 ? 'Add Subject Assignment' : 'Update Subject Assignment'}
                </Button>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenSubjectAssignmentDialog(false)}>Cancel</Button>
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