import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Alert,
  Divider
} from '@mui/material';
import {
  Add,
  Delete,
  Assignment,
  CheckCircle
} from '@mui/icons-material';

interface ClassData {
  _id: string;
  name: string;
  grade: string;
  section: string;
}

interface SubjectClassAssignmentData {
  classId: string;
  className: string;
  grade: string;
  section: string;
  subjects: string[];
}

interface SubjectClassAssignmentProps {
  open: boolean;
  onClose: () => void;
  teacherId: string;
  teacherName: string;
  availableClasses: ClassData[];
  currentAssignments: SubjectClassAssignmentData[];
  onSave: (assignments: SubjectClassAssignmentData[]) => void;
}

const SubjectClassAssignment: React.FC<SubjectClassAssignmentProps> = ({
  open,
  onClose,
  teacherId,
  teacherName,
  availableClasses,
  currentAssignments,
  onSave
}) => {
  const [assignments, setAssignments] = useState<SubjectClassAssignmentData[]>(currentAssignments);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubjects, setSelectedSubjects] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Common subjects for selection
  const commonSubjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi',
    'History', 'Geography', 'Civics', 'Economics', 'Computer Science',
    'Physical Education', 'Art', 'Music', 'Social Studies', 'Science',
    'Literature', 'Grammar', 'Environmental Studies', 'Value Education'
  ];

  useEffect(() => {
    setAssignments(currentAssignments);
  }, [currentAssignments]);

  const handleAddAssignment = () => {
    if (!selectedClass) {
      setError('Please select a class');
      return;
    }

    if (!selectedSubjects.trim()) {
      setError('Please enter subjects');
      return;
    }

    const subjects = selectedSubjects
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (subjects.length === 0) {
      setError('Please enter at least one subject');
      return;
    }

    const selectedClassData = availableClasses.find(c => c._id === selectedClass);
    if (!selectedClassData) {
      setError('Selected class not found');
      return;
    }

    // Check if class is already assigned
    const existingAssignment = assignments.find(a => a.classId === selectedClass);
    if (existingAssignment) {
      setError('This class is already assigned to the teacher');
      return;
    }

    const newAssignment: SubjectClassAssignmentData = {
      classId: selectedClass,
      className: selectedClassData.name,
      grade: selectedClassData.grade,
      section: selectedClassData.section,
      subjects: subjects
    };

    setAssignments([...assignments, newAssignment]);
    setSelectedClass('');
    setSelectedSubjects('');
    setError('');
  };

  const handleRemoveAssignment = (classId: string) => {
    setAssignments(assignments.filter(a => a.classId !== classId));
  };

  const handleSave = () => {
    onSave(assignments);
    onClose();
  };

  const getAvailableClassesForSelection = () => {
    const assignedClassIds = assignments.map(a => a.classId);
    return availableClasses.filter(c => !assignedClassIds.includes(c._id));
  };

  const getUnassignedClasses = () => {
    const assignedClassIds = assignments.map(a => a.classId);
    return availableClasses.filter(c => !assignedClassIds.includes(c._id));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Assignment color="primary" />
          <Typography variant="h6">
            Subject & Class Assignment for {teacherName}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Current Assignments */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Current Assignments
            </Typography>
            {assignments.length === 0 ? (
              <Alert severity="info">
                No classes assigned yet. Add assignments below.
              </Alert>
            ) : (
              <Box>
                {assignments.map((assignment) => (
                  <Card key={assignment.classId} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="h6" color="primary">
                            {assignment.className} - Section {assignment.section}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Grade {assignment.grade}
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            {assignment.subjects.map((subject, index) => (
                              <Chip
                                key={index}
                                label={subject}
                                size="small"
                                color="secondary"
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            ))}
                          </Box>
                        </Box>
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveAssignment(assignment.classId)}
                          size="small"
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Add New Assignment */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Add New Assignment
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Select Class</InputLabel>
                  <Select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    label="Select Class"
                  >
                    {getAvailableClassesForSelection().map((cls) => (
                      <MenuItem key={cls._id} value={cls._id}>
                        {cls.name} - Section {cls.section} (Grade {cls.grade})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Subjects (comma separated)"
                  value={selectedSubjects}
                  onChange={(e) => setSelectedSubjects(e.target.value)}
                  placeholder="Mathematics, Physics, English"
                  helperText="Enter subjects separated by commas"
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Common Subjects:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {commonSubjects.map((subject) => (
                    <Chip
                      key={subject}
                      label={subject}
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        const currentSubjects = selectedSubjects ? selectedSubjects.split(',').map(s => s.trim()) : [];
                        if (!currentSubjects.includes(subject)) {
                          const newSubjects = [...currentSubjects, subject];
                          setSelectedSubjects(newSubjects.join(', '));
                        }
                      }}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleAddAssignment}
                  disabled={!selectedClass || !selectedSubjects.trim()}
                >
                  Add Assignment
                </Button>
              </Grid>
            </Grid>
          </Grid>

          {/* Summary */}
          <Grid item xs={12}>
            <Divider />
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Summary
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Total Classes Assigned: {assignments.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Total Subjects: {assignments.reduce((total, a) => total + a.subjects.length, 0)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Available Classes: {getUnassignedClasses().length}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          startIcon={<CheckCircle />}
        >
          Save Assignments
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubjectClassAssignment;