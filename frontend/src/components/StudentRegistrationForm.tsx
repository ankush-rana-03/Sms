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
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
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
    console.log('=== FACE CAPTURED IN FORM ===');
    console.log('Face descriptor length:', faceDescriptor.length);
    console.log('Face image length:', faceImage.length);
    console.log('Face image preview:', faceImage.substring(0, 100) + '...');
    
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
          section: data.section || 'A',
          rollNumber: data.rollNumber || '001',
          gender: data.gender || 'male',
          bloodGroup: data.bloodGroup || 'A+',
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
        
        // Show success message
        setError(null);
        setSuccess('Student saved to database successfully!');
        
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

  const handleCompleteRegistration = async () => {
    if (!faceData) {
      setError('Please capture the student\'s face to complete registration');
      return;
    }

    // Get the current form values
    const formValues = getValues();

    // Prepare student data for API
    const studentData: ServiceStudentFormData = {
      name: formValues.name,
      email: formValues.email,
      phone: formValues.phone,
      address: formValues.address,
      dateOfBirth: formValues.dateOfBirth,
      grade: formValues.class, // Map class to grade
      parentName: formValues.parentName,
      parentPhone: formValues.parentPhone,
      // Add missing required fields
      section: formValues.section || 'A',
      rollNumber: formValues.rollNumber || '001',
      gender: formValues.gender || 'male',
      bloodGroup: formValues.bloodGroup || 'A+',
      facialData: {
        faceId: `face_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        faceDescriptor: faceData.faceDescriptor,
        faceImage: faceData.faceImage
      }
    };

    try {
      setIsSubmitting(true);
      setError(null);

      console.log('Submitting student data:', studentData);
      console.log('Face data being sent:', {
        faceId: studentData.facialData.faceId,
        descriptorLength: studentData.facialData.faceDescriptor.length,
        imageLength: studentData.facialData.faceImage.length,
        imagePreview: studentData.facialData.faceImage.substring(0, 100) + '...'
      });

      // Show alert with data being saved
      const alertData = {
        studentInfo: {
          name: studentData.name,
          email: studentData.email,
          phone: studentData.phone,
          address: studentData.address,
          dateOfBirth: studentData.dateOfBirth,
          grade: studentData.grade,
          section: studentData.section,
          rollNumber: studentData.rollNumber,
          gender: studentData.gender,
          bloodGroup: studentData.bloodGroup,
          parentName: studentData.parentName,
          parentPhone: studentData.parentPhone
        },
        faceData: {
          faceId: studentData.facialData.faceId,
          descriptorLength: studentData.facialData.faceDescriptor.length,
          imageLength: studentData.facialData.faceImage.length,
          imagePreview: studentData.facialData.faceImage.substring(0, 50) + '...',
          descriptorSample: studentData.facialData.faceDescriptor.slice(0, 5)
        }
      };

      const shouldProceed = window.confirm(
        `📋 DATA TO BE SAVED:\n\n` +
        `👤 STUDENT INFO:\n` +
        `Name: ${alertData.studentInfo.name}\n` +
        `Email: ${alertData.studentInfo.email}\n` +
        `Phone: ${alertData.studentInfo.phone}\n` +
        `Address: ${alertData.studentInfo.address}\n` +
        `DOB: ${alertData.studentInfo.dateOfBirth}\n` +
        `Grade: ${alertData.studentInfo.grade}\n` +
        `Section: ${alertData.studentInfo.section}\n` +
        `Roll: ${alertData.studentInfo.rollNumber}\n` +
        `Gender: ${alertData.studentInfo.gender}\n` +
        `Blood: ${alertData.studentInfo.bloodGroup}\n` +
        `Parent: ${alertData.studentInfo.parentName}\n` +
        `Parent Phone: ${alertData.studentInfo.parentPhone}\n\n` +
        `📷 FACE DATA:\n` +
        `Face ID: ${alertData.faceData.faceId}\n` +
        `Descriptor Length: ${alertData.faceData.descriptorLength}\n` +
        `Image Length: ${alertData.faceData.imageLength}\n` +
        `Image Preview: ${alertData.faceData.imagePreview}\n` +
        `Descriptor Sample: [${alertData.faceData.descriptorSample.join(', ')}]\n\n` +
        `✅ Click OK to save this data to database\n` +
        `❌ Click Cancel to abort`
      );

      if (!shouldProceed) {
        console.log('User cancelled student save');
        return;
      }

      // Save to database
      const result = await studentService.createStudent(studentData);
      
      console.log('Student created successfully:', result);
      
      // Show success message
      setError(null);
      setSuccess('Student saved to database successfully!');
      
      // Show success alert with saved data
      const savedData = result.data;
      window.alert(
        `✅ STUDENT SAVED SUCCESSFULLY!\n\n` +
        `🆔 Database ID: ${savedData._id}\n` +
        `👤 Name: ${savedData.name}\n` +
        `📧 Email: ${savedData.email}\n` +
        `📱 Phone: ${savedData.phone}\n` +
        `🏠 Address: ${savedData.address}\n` +
        `📅 DOB: ${savedData.dateOfBirth}\n` +
        `📚 Grade: ${savedData.grade}\n` +
        `📋 Section: ${savedData.section}\n` +
        `🔢 Roll: ${savedData.rollNumber}\n` +
        `👥 Gender: ${savedData.gender}\n` +
        `🩸 Blood: ${savedData.bloodGroup}\n` +
        `👨‍👩‍👧‍👦 Parent: ${savedData.parentName}\n` +
        `📞 Parent Phone: ${savedData.parentPhone}\n\n` +
        `📷 FACE DATA SAVED:\n` +
        `Face ID: ${savedData.facialData?.faceId || 'N/A'}\n` +
        `Face Registered: ${savedData.facialData?.isFaceRegistered ? 'Yes' : 'No'}\n` +
        `Descriptor Length: ${savedData.facialData?.faceDescriptor?.length || 0}\n` +
        `Image Length: ${savedData.facialData?.faceImage?.length || 0}\n\n` +
        `⏰ Created At: ${new Date(savedData.createdAt).toLocaleString()}\n` +
        `🔄 Updated At: ${new Date(savedData.updatedAt).toLocaleString()}\n\n` +
        `🎉 Student registration completed successfully!`
      );
      
      // Call the original onSubmit callback
      onSubmit(formValues, faceData);
      
    } catch (error: any) {
      console.error('Error creating student:', error);
      setError(error.message || 'Failed to create student');
      
      // Show error alert with details
      window.alert(
        `❌ FAILED TO SAVE STUDENT!\n\n` +
        `Error: ${error.message || 'Unknown error'}\n\n` +
        `🔍 Debug Info:\n` +
        `- API Response: ${error.response?.data?.message || 'No response data'}\n` +
        `- Status Code: ${error.response?.status || 'Unknown'}\n` +
        `- Network Error: ${error.code || 'None'}\n\n` +
        `📋 Data that failed to save:\n` +
        `- Student Name: ${studentData.name}\n` +
        `- Student Email: ${studentData.email}\n` +
        `- Face Data Present: ${faceData ? 'Yes' : 'No'}\n` +
        `- Face Image Length: ${faceData?.faceImage?.length || 0}\n` +
        `- Face Descriptor Length: ${faceData?.faceDescriptor?.length || 0}\n\n` +
        `Please check the console for more details.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
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
              onClick={handleCompleteRegistration}
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