import React, { useState } from 'react';
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

const schema = yup.object().shape({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone is required'),
  address: yup.string().required('Address is required'),
  class: yup.string().required('Class is required'),
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
  class: string;
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
}

const StudentRegistrationForm: React.FC<StudentRegistrationFormProps> = ({
  onSubmit,
  loading = false
}) => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: yupResolver(schema),
  });

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
        class: data.class,
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

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Student Registration
      </Typography>
      
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
              {...register('class')}
              error={!!errors.class}
              helperText={errors.class?.message}
            >
              {['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((classValue) => (
                <MenuItem key={classValue} value={classValue}>
                  {classValue === 'Nursery' || classValue === 'LKG' || classValue === 'UKG' ? classValue : `Class ${classValue}`}
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
            >
              {['A', 'B', 'C', 'D', 'E'].map((section) => (
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
            disabled={loading || isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          >
            {isSubmitting ? 'Creating Student...' : 'Register Student'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default StudentRegistrationForm;