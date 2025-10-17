import React, { useState } from 'react';
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
  Box,
  Typography,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { homeworkService, CreateHomeworkRequest } from '../services/homeworkService';

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
    dueDate: '',
    instructions: '',
    totalMarks: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        dueDate: '',
        instructions: '',
        totalMarks: 0
      });
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
    <LocalizationProvider dateAdapter={AdapterDateFns}>
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
                <FormControl fullWidth required disabled={loading}>
                  <InputLabel>Class</InputLabel>
                  <Select
                    value={formData.class}
                    onChange={handleChange('class')}
                    label="Class"
                  >
                    <MenuItem value="68b04606cdb6905050d1c270">Class 10A</MenuItem>
                    <MenuItem value="68b04606cdb6905050d1c271">Class 10B</MenuItem>
                    <MenuItem value="68b04606cdb6905050d1c272">Class 11A</MenuItem>
                    <MenuItem value="68b04606cdb6905050d1c273">Class 11B</MenuItem>
                    <MenuItem value="68b04606cdb6905050d1c274">Class 12A</MenuItem>
                    <MenuItem value="68b04606cdb6905050d1c275">Class 12B</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Due Date"
                  value={formData.dueDate ? new Date(formData.dueDate) : null}
                  onChange={(date) => handleChange('dueDate')(date ? date.toISOString() : '')}
                  disabled={loading}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true
                    }
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
    </LocalizationProvider>
  );
};

export default HomeworkForm;