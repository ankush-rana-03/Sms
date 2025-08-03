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
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// Simple interface for now
interface TeacherFormData {
  name: string;
  email: string;
  phone: string;
  designation: string;
  salary: number;
}

const schema = yup.object().shape({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone is required'),
  designation: yup.string().required('Designation is required'),
  salary: yup.number().positive('Salary must be positive').required('Salary is required'),
});

interface TeacherRegistrationFormProps {
  onSubmit: (data: TeacherFormData) => void;
  loading?: boolean;
  initialData?: Partial<TeacherFormData>;
  isEdit?: boolean;
}

const TeacherRegistrationForm: React.FC<TeacherRegistrationFormProps> = ({
  onSubmit,
  loading = false,
  initialData,
  isEdit = false
}) => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<TeacherFormData>({
    resolver: yupResolver(schema),
    defaultValues: initialData || {},
  });

  const onFormSubmit = async (data: TeacherFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      console.log('Submitting teacher data:', data);
      await onSubmit(data);
      
      setSuccess('Teacher registered successfully!');
    } catch (error: any) {
      console.error('Error registering teacher:', error);
      setError(error.message || 'Failed to register teacher');
    } finally {
      setIsSubmitting(false);
    }
  };

  const designations = ['TGT', 'PGT', 'JBT', 'NTT'];
  const commonSubjects = [
    'Mathematics', 'English', 'Science', 'Social Studies', 'Hindi', 'Computer Science',
    'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Economics', 'Commerce',
    'Accountancy', 'Business Studies', 'Physical Education', 'Art', 'Music', 'Dance'
  ];

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        {isEdit ? 'Edit Teacher' : 'Teacher Registration'}
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
            <FormControl fullWidth error={!!errors.designation}>
              <InputLabel>Designation</InputLabel>
              <Controller
                name="designation"
                control={control}
                render={({ field }) => (
                  <Select {...field} label="Designation">
                    {designations.map((designation) => (
                      <MenuItem key={designation} value={designation}>
                        {designation}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Salary"
              type="number"
              {...register('salary')}
              error={!!errors.salary}
              helperText={errors.salary?.message}
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
            {isSubmitting ? 'Saving...' : (isEdit ? 'Update Teacher' : 'Register Teacher')}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default TeacherRegistrationForm;