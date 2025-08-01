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
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import FaceCapture from './FaceCapture';
import studentService, { StudentFormData as ServiceStudentFormData } from '../services/studentService';

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
  onSubmit: (data: StudentFormData, faceData: any) => void;
  loading?: boolean;
}

const StudentRegistrationForm: React.FC<StudentRegistrationFormProps> = ({
  onSubmit,
  loading = false
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [faceData, setFaceData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: yupResolver(schema),
  });

  const steps = ['Student Information', 'Face Registration'];

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleFaceCaptured = (faceDescriptor: number[], faceImage: string) => {
    setFaceData({ faceDescriptor, faceImage });
    setError(null);
  };

  const handleFaceError = (error: string) => {
    setError(error);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onFormSubmit = async (data: StudentFormData) => {
    if (activeStep === 0) {
      handleNext();
    } else if (activeStep === 1) {
      if (!faceData) {
        setError('Please capture the student\'s face to complete registration');
        return;
      }

      try {
        setIsSubmitting(true);
        setError(null);

        // Prepare student data for API
        const studentData: ServiceStudentFormData = {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          dateOfBirth: data.dateOfBirth,
          grade: data.class, // Map class to grade
          parentName: data.parentName,
          parentPhone: data.parentPhone,
          facialData: {
            faceId: `face_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            faceDescriptor: faceData.faceDescriptor,
            faceImage: faceData.faceImage
          }
        };

        // Save to database
        const result = await studentService.createStudent(studentData);
        
        console.log('Student created successfully:', result);
        
        // Call the original onSubmit callback
        onSubmit(data, faceData);
        
      } catch (error: any) {
        console.error('Error creating student:', error);
        setError(error.message || 'Failed to create student');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleFormSubmit = handleSubmit(onFormSubmit);

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom align="center">
        Register New Student
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {activeStep === 0 && (
        <Box component="form" onSubmit={handleFormSubmit}>
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
                label="Phone Number"
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
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                  <MenuItem key={num} value={num}>
                    Class {num}
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
              variant="contained"
              onClick={handleFormSubmit}
              disabled={loading}
            >
              Next
            </Button>
          </Box>
        </Box>
      )}

      {activeStep === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Face Registration
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please capture the student's face for attendance verification. This will be used to verify the student's identity during attendance marking.
          </Typography>

          <FaceCapture
            onFaceCaptured={handleFaceCaptured}
            onError={handleFaceError}
            mode="register"
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button onClick={handleBack}>
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleFormSubmit}
              disabled={!faceData || isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
            >
              {isSubmitting ? 'Creating Student...' : 'Complete Registration'}
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default StudentRegistrationForm;