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
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { TeacherFormData } from '../services/teacherService';

const schema = yup.object().shape({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone is required'),
  designation: yup.string().oneOf(['TGT', 'PGT', 'JBT', 'NTT']).required('Designation is required'),
  subjects: yup.array().of(yup.string()).min(1, 'At least one subject is required'),
  assignedClasses: yup.array().of(
    yup.object().shape({
      class: yup.string().required('Class is required'),
      section: yup.string().required('Section is required'),
      subject: yup.string().required('Subject is required'),
      grade: yup.string().required('Grade is required'),
    })
  ),
  qualification: yup.object().shape({
    degree: yup.string(),
    institution: yup.string(),
    yearOfCompletion: yup.number().positive('Year must be positive'),
  }),
  experience: yup.object().shape({
    years: yup.number().min(0, 'Years cannot be negative'),
    previousSchools: yup.array().of(yup.string()),
  }),
  specialization: yup.array().of(yup.string()),
  salary: yup.number().positive('Salary must be positive').required('Salary is required'),
  emergencyContact: yup.object().shape({
    name: yup.string(),
    phone: yup.string(),
    relationship: yup.string(),
  }),
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
    setValue,
  } = useForm<TeacherFormData>({
    resolver: yupResolver(schema),
    defaultValues: initialData || {
      subjects: [],
      assignedClasses: [],
      specialization: [],
      experience: {
        years: 0,
        previousSchools: [],
      },
    },
  });

  const { fields: subjectFields, append: appendSubject, remove: removeSubject } = useFieldArray({
    control,
    name: 'subjects',
  });

  const { fields: classFields, append: appendClass, remove: removeClass } = useFieldArray({
    control,
    name: 'assignedClasses',
  });

  const { fields: specializationFields, append: appendSpecialization, remove: removeSpecialization } = useFieldArray({
    control,
    name: 'specialization',
  });

  const { fields: schoolFields, append: appendSchool, remove: removeSchool } = useFieldArray({
    control,
    name: 'experience.previousSchools',
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

  const grades = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const sections = ['A', 'B', 'C', 'D', 'E'];
  const designations = ['TGT', 'PGT', 'JBT', 'NTT'];
  const commonSubjects = [
    'Mathematics', 'English', 'Science', 'Social Studies', 'Hindi', 'Computer Science',
    'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Economics', 'Commerce',
    'Accountancy', 'Business Studies', 'Physical Education', 'Art', 'Music', 'Dance'
  ];

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 1000, mx: 'auto' }}>
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
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
          </Grid>
          
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
              {errors.designation && (
                <FormHelperText>{errors.designation.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Subjects */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Subjects
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {subjectFields.map((field, index) => (
                <Chip
                  key={field.id}
                  label={field.value}
                  onDelete={() => removeSubject(index)}
                  color="primary"
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Add Subject</InputLabel>
                <Select
                  value=""
                  onChange={(e) => {
                    const subject = e.target.value;
                    if (subject && !watch('subjects').includes(subject)) {
                      appendSubject(subject);
                    }
                  }}
                  label="Add Subject"
                >
                  {commonSubjects.map((subject) => (
                    <MenuItem key={subject} value={subject}>
                      {subject}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                placeholder="Custom subject"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = e.target as HTMLInputElement;
                    const subject = input.value.trim();
                    if (subject && !watch('subjects').includes(subject)) {
                      appendSubject(subject);
                      input.value = '';
                    }
                  }
                }}
              />
            </Box>
          </Grid>

          {/* Assigned Classes */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Assigned Classes
            </Typography>
            {classFields.map((field, index) => (
              <Box key={field.id} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel>Grade</InputLabel>
                  <Controller
                    name={`assignedClasses.${index}.grade`}
                    control={control}
                    render={({ field }) => (
                      <Select {...field} label="Grade">
                        {grades.map((grade) => (
                          <MenuItem key={grade} value={grade}>
                            Grade {grade}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
                
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel>Section</InputLabel>
                  <Controller
                    name={`assignedClasses.${index}.section`}
                    control={control}
                    render={({ field }) => (
                      <Select {...field} label="Section">
                        {sections.map((section) => (
                          <MenuItem key={section} value={section}>
                            {section}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
                
                <TextField
                  label="Subject"
                  {...register(`assignedClasses.${index}.subject`)}
                  sx={{ minWidth: 150 }}
                />
                
                <IconButton
                  onClick={() => removeClass(index)}
                  color="error"
                >
                  <Delete />
                </IconButton>
              </Box>
            ))}
            <Button
              startIcon={<Add />}
              onClick={() => appendClass({ class: '', section: '', subject: '', grade: '' })}
              variant="outlined"
            >
              Add Class Assignment
            </Button>
          </Grid>

          {/* Qualification */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Qualification
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Degree"
              {...register('qualification.degree')}
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Institution"
              {...register('qualification.institution')}
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Year of Completion"
              type="number"
              {...register('qualification.yearOfCompletion')}
            />
          </Grid>

          {/* Experience */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Experience
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Years of Experience"
              type="number"
              {...register('experience.years')}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Previous Schools
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {schoolFields.map((field, index) => (
                <Chip
                  key={field.id}
                  label={field.value}
                  onDelete={() => removeSchool(index)}
                  color="secondary"
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                placeholder="Add previous school"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = e.target as HTMLInputElement;
                    const school = input.value.trim();
                    if (school && !watch('experience.previousSchools').includes(school)) {
                      appendSchool(school);
                      input.value = '';
                    }
                  }
                }}
              />
            </Box>
          </Grid>

          {/* Specialization */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Specialization
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {specializationFields.map((field, index) => (
                <Chip
                  key={field.id}
                  label={field.value}
                  onDelete={() => removeSpecialization(index)}
                  color="info"
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                placeholder="Add specialization"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = e.target as HTMLInputElement;
                    const specialization = input.value.trim();
                    if (specialization && !watch('specialization').includes(specialization)) {
                      appendSpecialization(specialization);
                      input.value = '';
                    }
                  }
                }}
              />
            </Box>
          </Grid>

          {/* Salary */}
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

          {/* Emergency Contact */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Emergency Contact
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Contact Name"
              {...register('emergencyContact.name')}
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Contact Phone"
              {...register('emergencyContact.phone')}
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Relationship"
              {...register('emergencyContact.relationship')}
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