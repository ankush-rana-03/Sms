import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
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
  inDialog?: boolean;
}

const StudentRegistrationForm: React.FC<StudentRegistrationFormProps> = ({
  onSubmit,
  loading = false,
  inDialog = false,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<ClassWithSections[]>([]);
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
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
          setAvailableSections(response.data.sections);
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
    const loadingContent = (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Box>
    );
    
    return inDialog ? loadingContent : (
      <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
        {loadingContent}
      </Paper>
    );
  }

  const formContent = (
    <>
      {!inDialog && (
        <Typography variant="h5" gutterBottom>
          Student Registration
        </Typography>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {availableClasses.length === 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No classes are available for registration. Please create classes first.
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onFormSubmit)}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Full Name"
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone"
              {...register('phone')}
              error={!!errors.phone}
              helperText={errors.phone?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Address"
              {...register('address')}
              error={!!errors.address}
              helperText={errors.address?.message}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              select
              label="Class"
              {...register('grade')}
              error={!!errors.grade}
              helperText={errors.grade?.message}
              disabled={availableClasses.length === 0}
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
              helperText={errors.rollNumber?.message}
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
            >
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => (
                <MenuItem key={group} value={group}>
                  {group}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Parent Name"
              {...register('parentName')}
              error={!!errors.parentName}
              helperText={errors.parentName?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Parent Phone"
              {...register('parentPhone')}
              error={!!errors.parentPhone}
              helperText={errors.parentPhone?.message}
            />
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || isSubmitting || availableClasses.length === 0}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          >
            {isSubmitting ? 'Creating Student...' : 'Register Student'}
          </Button>
        </Box>
      </Box>
    </>
  );

  return inDialog ? formContent : (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      {formContent}
    </Paper>
  );
};

export default StudentRegistrationForm;