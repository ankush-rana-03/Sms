import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import {
  Person,
  ContactMail,
  School,
  CalendarToday,
  Bloodtype,
  FamilyRestroom,
  LocationOn,
  Phone,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { StudentFormData as ServiceStudentFormData } from '../services/studentService';
import classService, { ClassWithSections } from '../services/classService';

const schema = yup.object().shape({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone is required'),
  address: yup.string().required('Address is required'),
  grade: yup.string().required('Class is required'),
  section: yup.string().required('Section is required'),
  rollNumber: yup.string().required('Roll number is required'),
  dateOfBirth: yup.string().required('Date of birth is required'),
  gender: yup.string().required('Gender is required'),
  bloodGroup: yup.string().required('Blood group is required'),
  parentName: yup.string().required('Parent name is required'),
  parentPhone: yup.string().required('Parent phone is required'),
});

interface StudentFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  grade: string;
  section: string;
  rollNumber: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  parentName: string;
  parentPhone: string;
}

interface StudentRegistrationFormProps {
  onSubmit: (data: StudentFormData) => void;
  loading?: boolean;
  showTitle?: boolean;
  onSuccess?: () => void;
}

const StudentRegistrationForm: React.FC<StudentRegistrationFormProps> = ({
  onSubmit,
  loading = false,
  showTitle = true,
  onSuccess
}) => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<ClassWithSections[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [formKey, setFormKey] = useState(0); // For form reset

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: yupResolver(schema),
  });

  const watchedGrade = watch('grade');

  // Fetch available classes and sections
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoadingClasses(true);
        const response = await classService.getAvailableClassesForRegistration();
        if (response.success) {
          setAvailableClasses(response.data.classes);
        }
      } catch (error: any) {
        console.error('Error fetching classes:', error);
        setError('Failed to load available classes. Please try again.');
      } finally {
        setLoadingClasses(false);
      }
    };

    fetchClasses();
  }, []);

  // Update available sections when class changes
  useEffect(() => {
    if (watchedGrade) {
      const selectedClassData = availableClasses.find(cls => cls.name === watchedGrade);
      if (selectedClassData) {
        setSelectedClass(watchedGrade);
      }
    }
  }, [watchedGrade, availableClasses]);

  const onFormSubmit = async (data: StudentFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      // Prepare student data for API
      const studentData: ServiceStudentFormData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        dateOfBirth: data.dateOfBirth,
        grade: data.grade,
        parentName: data.parentName,
        parentPhone: data.parentPhone,
        section: data.section,
        rollNumber: data.rollNumber,
        gender: data.gender,
        bloodGroup: data.bloodGroup,
      };

      console.log('Submitting student data:', studentData);

      // Call the onSubmit prop
      await onSubmit(studentData);
      
      setSuccess('Student registered successfully!');
      
      // Reset the form
      reset();
      setFormKey(prev => prev + 1);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error registering student:', error);
      setError(error.message || 'Failed to register student');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get sections for selected class
  const getSectionsForClass = (className: string) => {
    const classData = availableClasses.find(cls => cls.name === className);
    return classData ? classData.sections : [];
  };

  if (loadingClasses) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {showTitle && (
        <Typography variant="h5" gutterBottom sx={{ mb: 3, color: 'primary.main', fontWeight: 600 }}>
          Student Registration
        </Typography>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {availableClasses.length === 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No classes are available for registration. Please create classes first.
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onFormSubmit)} key={formKey}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
          Please fill in all required fields to register the student
        </Typography>

        {/* Student Personal Information Section */}
        <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ pb: '16px !important' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Person sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Personal Information
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  {...register('name')}
                  error={!!errors.name}
                  helperText={errors.name?.message || "Enter the student's full name"}
                  size="small"
                  placeholder="e.g., John Doe"
                  required
                  InputProps={{
                    startAdornment: <Person sx={{ mr: 1, color: 'action.disabled' }} fontSize="small" />,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  {...register('email')}
                  error={!!errors.email}
                  helperText={errors.email?.message || "Enter a valid email address"}
                  size="small"
                  placeholder="student@example.com"
                  required
                  InputProps={{
                    startAdornment: <ContactMail sx={{ mr: 1, color: 'action.disabled' }} fontSize="small" />,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  {...register('phone')}
                  error={!!errors.phone}
                  helperText={errors.phone?.message || "Enter contact phone number"}
                  size="small"
                  placeholder="+1234567890"
                  required
                  InputProps={{
                    startAdornment: <Phone sx={{ mr: 1, color: 'action.disabled' }} fontSize="small" />,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  {...register('dateOfBirth')}
                  error={!!errors.dateOfBirth}
                  helperText={errors.dateOfBirth?.message}
                  size="small"
                  required
                  InputProps={{
                    startAdornment: <CalendarToday sx={{ mr: 1, color: 'action.disabled' }} fontSize="small" />,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Gender"
                  {...register('gender')}
                  error={!!errors.gender}
                  helperText={errors.gender?.message}
                  size="small"
                  required
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Blood Group"
                  {...register('bloodGroup')}
                  error={!!errors.bloodGroup}
                  helperText={errors.bloodGroup?.message}
                  size="small"
                  required
                  InputProps={{
                    startAdornment: <Bloodtype sx={{ mr: 1, color: 'action.disabled' }} fontSize="small" />,
                  }}
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => (
                    <MenuItem key={group} value={group}>
                      {group}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  {...register('address')}
                  error={!!errors.address}
                  helperText={errors.address?.message || "Enter complete address"}
                  size="small"
                  placeholder="Street, City, State, ZIP"
                  required
                  InputProps={{
                    startAdornment: <LocationOn sx={{ mr: 1, color: 'action.disabled' }} fontSize="small" />,
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Academic Information Section */}
        <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ pb: '16px !important' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <School sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Academic Information
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  select
                  label="Class"
                  {...register('grade')}
                  error={!!errors.grade}
                  helperText={errors.grade?.message}
                  disabled={availableClasses.length === 0}
                  size="small"
                  required
                  InputProps={{
                    startAdornment: <School sx={{ mr: 1, color: 'action.disabled' }} fontSize="small" />,
                  }}
                >
                  {availableClasses.map((cls) => (
                    <MenuItem key={cls.name} value={cls.name}>
                      {cls.displayName}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  select
                  label="Section"
                  {...register('section')}
                  error={!!errors.section}
                  helperText={errors.section?.message}
                  disabled={!selectedClass || availableClasses.length === 0}
                  size="small"
                  required
                >
                  {selectedClass && getSectionsForClass(selectedClass).map((section) => (
                    <MenuItem key={section} value={section}>
                      Section {section}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Roll Number"
                  {...register('rollNumber')}
                  error={!!errors.rollNumber}
                  helperText={errors.rollNumber?.message || "Enter unique roll number"}
                  size="small"
                  placeholder="001, 002, etc."
                  required
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Parent/Guardian Information Section */}
        <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ pb: '16px !important' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FamilyRestroom sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Parent/Guardian Information
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Parent Name"
                  {...register('parentName')}
                  error={!!errors.parentName}
                  helperText={errors.parentName?.message || "Enter parent/guardian name"}
                  size="small"
                  placeholder="e.g., Jane Doe"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Parent Phone"
                  {...register('parentPhone')}
                  error={!!errors.parentPhone}
                  helperText={errors.parentPhone?.message || "Enter parent/guardian phone"}
                  size="small"
                  placeholder="+1234567890"
                  required
                  InputProps={{
                    startAdornment: <Phone sx={{ mr: 1, color: 'action.disabled' }} fontSize="small" />,
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Submit Button Section */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mt: 4, 
          mb: 2,
          p: 3,
          backgroundColor: 'background.paper',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || isSubmitting || availableClasses.length === 0}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
            size="large"
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: 2,
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4,
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            {isSubmitting ? 'Creating Student...' : 'Register Student'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default StudentRegistrationForm;