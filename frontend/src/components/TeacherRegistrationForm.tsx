import React, { useState } from 'react';
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
  Work,
  FamilyRestroom,
  LocationOn,
  Phone,
  AttachMoney,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object().shape({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone is required'),
  address: yup.string().required('Address is required'),
  designation: yup.string().required('Designation is required'),
  experience: yup.number().positive('Experience must be positive').required('Experience is required'),
  joiningDate: yup.string().required('Joining date is required'),
  salary: yup.number().positive('Salary must be positive').required('Salary is required'),
  degree: yup.string().required('Degree is required'),
  institution: yup.string().required('Institution is required'),
  yearOfCompletion: yup.number().positive('Year must be positive').required('Year of completion is required'),
  emergencyContactName: yup.string().required('Emergency contact name is required'),
  emergencyContactPhone: yup.string().required('Emergency contact phone is required'),
  emergencyContactRelationship: yup.string().required('Emergency contact relationship is required'),
});

interface TeacherFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  designation: string;
  experience: number;
  joiningDate: string;
  salary: number;
  degree: string;
  institution: string;
  yearOfCompletion: number;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
}

interface TeacherRegistrationFormProps {
  onSubmit: (data: TeacherFormData) => void;
  loading?: boolean;
  showTitle?: boolean;
  onSuccess?: () => void;
  initialData?: Partial<TeacherFormData>;
  isEdit?: boolean;
}

const TeacherRegistrationForm: React.FC<TeacherRegistrationFormProps> = ({
  onSubmit,
  loading = false,
  showTitle = true,
  onSuccess,
  initialData,
  isEdit = false
}) => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0); // For form reset

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
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
      
      // Reset the form
      reset();
      setFormKey(prev => prev + 1);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error registering teacher:', error);
      setError(error.message || 'Failed to register teacher');
    } finally {
      setIsSubmitting(false);
    }
  };

  const designations = ['TGT', 'PGT', 'JBT', 'NTT'];
  const relationships = ['Father', 'Mother', 'Guardian', 'Other'];

  return (
    <Box>
      {showTitle && (
        <Typography variant="h5" gutterBottom sx={{ mb: 3, color: 'primary.main', fontWeight: 600 }}>
          {isEdit ? 'Edit Teacher' : 'Teacher Registration'}
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

      <Box component="form" onSubmit={handleSubmit(onFormSubmit)} key={formKey}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
          Please fill in all required fields to {isEdit ? 'update' : 'register'} the teacher
        </Typography>

        {/* Personal Information Section */}
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
                  helperText={errors.name?.message || "Enter the teacher's full name"}
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
                  placeholder="teacher@example.com"
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
                  select
                  label="Designation"
                  {...register('designation')}
                  error={!!errors.designation}
                  helperText={errors.designation?.message}
                  size="small"
                  required
                >
                  {designations.map((designation) => (
                    <MenuItem key={designation} value={designation}>
                      {designation}
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

        {/* Professional Information Section */}
        <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ pb: '16px !important' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Work sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Professional Information
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Experience (Years)"
                  type="number"
                  {...register('experience')}
                  error={!!errors.experience}
                  helperText={errors.experience?.message || "Enter years of experience"}
                  size="small"
                  placeholder="0"
                  required
                  InputProps={{
                    startAdornment: <Work sx={{ mr: 1, color: 'action.disabled' }} fontSize="small" />,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Joining Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  {...register('joiningDate')}
                  error={!!errors.joiningDate}
                  helperText={errors.joiningDate?.message}
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
                  label="Salary"
                  type="number"
                  {...register('salary')}
                  error={!!errors.salary}
                  helperText={errors.salary?.message || "Enter monthly salary"}
                  size="small"
                  placeholder="0"
                  required
                  InputProps={{
                    startAdornment: <AttachMoney sx={{ mr: 1, color: 'action.disabled' }} fontSize="small" />,
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Educational Qualification Section */}
        <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ pb: '16px !important' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <School sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Educational Qualification
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Degree"
                  {...register('degree')}
                  error={!!errors.degree}
                  helperText={errors.degree?.message || "Enter highest degree"}
                  size="small"
                  placeholder="e.g., B.Ed, M.Ed"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Institution"
                  {...register('institution')}
                  error={!!errors.institution}
                  helperText={errors.institution?.message || "Enter institution name"}
                  size="small"
                  placeholder="University/College name"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Year of Completion"
                  type="number"
                  {...register('yearOfCompletion')}
                  error={!!errors.yearOfCompletion}
                  helperText={errors.yearOfCompletion?.message || "Enter completion year"}
                  size="small"
                  placeholder="2020"
                  required
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Emergency Contact Section */}
        <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ pb: '16px !important' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FamilyRestroom sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Emergency Contact
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Emergency Contact Name"
                  {...register('emergencyContactName')}
                  error={!!errors.emergencyContactName}
                  helperText={errors.emergencyContactName?.message || "Enter emergency contact name"}
                  size="small"
                  placeholder="Contact person name"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Emergency Contact Phone"
                  {...register('emergencyContactPhone')}
                  error={!!errors.emergencyContactPhone}
                  helperText={errors.emergencyContactPhone?.message || "Enter emergency contact phone"}
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
                  select
                  label="Emergency Contact Relationship"
                  {...register('emergencyContactRelationship')}
                  error={!!errors.emergencyContactRelationship}
                  helperText={errors.emergencyContactRelationship?.message}
                  size="small"
                  required
                >
                  {relationships.map((relationship) => (
                    <MenuItem key={relationship} value={relationship}>
                      {relationship}
                    </MenuItem>
                  ))}
                </TextField>
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
            disabled={loading || isSubmitting}
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
            {isSubmitting ? 'Saving...' : (isEdit ? 'Update Teacher' : 'Register New Teacher')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default TeacherRegistrationForm;