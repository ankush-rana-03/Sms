import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { homeworkService, CreateHomeworkRequest } from '../services/homeworkService';
import classService, { ClassWithSections } from '../services/classService';

interface HomeworkFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const HomeworkForm: React.FC<HomeworkFormProps> = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<CreateHomeworkRequest>({
    title: '',
    description: '',
    subject: '',
    class: '',
    section: '',
    dueDate: '',
    instructions: '',
    totalMarks: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassWithSections[]>([]);
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  useEffect(() => {
    if (open) {
      fetchClasses();
    }
  }, [open]);

  const fetchClasses = async () => {
    try {
      setLoadingClasses(true);
      const response = await classService.getAvailableClassesForRegistration();
      setClasses(response.data.classes);
    } catch (err: any) {
      setError('Failed to load classes');
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleClassChange = (classId: string) => {
    const selectedClass = classes.find(c => c.name === classId);
    if (selectedClass) {
      setAvailableSections(selectedClass.sections);
      setFormData(prev => ({
        ...prev,
        class: classId,
        section: '' // Reset section when class changes
      }));
    }
  };

  const handleChange = (field: keyof CreateHomeworkRequest) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target ? event.target.value : event;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await homeworkService.createHomework(formData);
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        title: '',
        description: '',
        subject: '',
        class: '',
        section: '',
        dueDate: '',
        instructions: '',
        totalMarks: 0
      });
      setAvailableSections([]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create homework');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setError(null);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Assign New Homework</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Homework Title"
                  value={formData.title}
                  onChange={handleChange('title')}
                  required
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={formData.description}
                  onChange={handleChange('description')}
                  required
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required disabled={loading}>
                  <InputLabel>Subject</InputLabel>
                  <Select
                    value={formData.subject}
                    onChange={handleChange('subject')}
                    label="Subject"
                  >
                    <MenuItem value="Mathematics">Mathematics</MenuItem>
                    <MenuItem value="Science">Science</MenuItem>
                    <MenuItem value="English">English</MenuItem>
                    <MenuItem value="History">History</MenuItem>
                    <MenuItem value="Geography">Geography</MenuItem>
                    <MenuItem value="Physics">Physics</MenuItem>
                    <MenuItem value="Chemistry">Chemistry</MenuItem>
                    <MenuItem value="Biology">Biology</MenuItem>
                    <MenuItem value="Computer Science">Computer Science</MenuItem>
                    <MenuItem value="Art">Art</MenuItem>
                    <MenuItem value="Physical Education">Physical Education</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required disabled={loading || loadingClasses}>
                  <InputLabel>Class</InputLabel>
                  <Select
                    value={formData.class}
                    onChange={(e) => handleClassChange(e.target.value)}
                    label="Class"
                  >
                    {loadingClasses ? (
                      <MenuItem disabled>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Loading classes...
                      </MenuItem>
                    ) : (
                      classes.map((cls) => (
                        <MenuItem key={cls.name} value={cls.name}>
                          {cls.displayName}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required disabled={loading || !formData.class}>
                  <InputLabel>Section</InputLabel>
                  <Select
                    value={formData.section || ''}
                    onChange={handleChange('section')}
                    label="Section"
                  >
                    {availableSections.map((section) => (
                      <MenuItem key={section} value={section}>
                        Section {section}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Due Date"
                  type="datetime-local"
                  value={formData.dueDate ? new Date(formData.dueDate).toISOString().slice(0, 16) : ''}
                  onChange={(e) => handleChange('dueDate')(e.target.value ? new Date(e.target.value).toISOString() : '')}
                  required
                  disabled={loading}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Total Marks"
                  type="number"
                  value={formData.totalMarks}
                  onChange={handleChange('totalMarks')}
                  disabled={loading}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Instructions (Optional)"
                  value={formData.instructions}
                  onChange={handleChange('instructions')}
                  disabled={loading}
                />
              </Grid>
            </Grid>
          </DialogContent>
          
          <DialogActions>
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading}
              sx={{ minWidth: 120 }}
            >
              {loading ? 'Creating...' : 'Assign Homework'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
  );
};

export default HomeworkForm;