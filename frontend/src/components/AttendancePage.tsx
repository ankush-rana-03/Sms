import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent
} from '@mui/material';
import {
  HowToReg as MarkIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import ManualAttendanceMarking from './ManualAttendanceMarking';
import AttendanceView from './AttendanceView';

interface Class {
  id: string;
  name: string;
  section: string;
}

interface AttendancePageProps {
  userRole?: string;
}

const AttendancePage: React.FC<AttendancePageProps> = ({ userRole = 'teacher' }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = userRole === 'admin' || userRole === 'principal';

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/classes', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch classes');
      }

      const data = await response.json();
      setClasses(data.data);
      
      // Auto-select first class if available
      if (data.data.length > 0) {
        setSelectedClass(data.data[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getSelectedClassName = () => {
    const selectedClassData = classes.find(cls => cls.id === selectedClass);
    return selectedClassData ? `${selectedClassData.name} - ${selectedClassData.section}` : 'Select Class';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (classes.length === 0) {
    return (
      <Card sx={{ m: 2 }}>
        <CardContent>
          <Typography variant="h6" align="center" color="text.secondary">
            No classes available. Please contact your administrator.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Attendance Management
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Manage student attendance for your classes
        </Typography>

        <Box sx={{ mt: 3 }}>
          <FormControl fullWidth sx={{ maxWidth: 400 }}>
            <InputLabel>Select Class</InputLabel>
            <Select
              value={selectedClass}
              label="Select Class"
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              {classes.map((cls) => (
                <MenuItem key={cls.id} value={cls.id}>
                  {cls.name} - {cls.section}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {selectedClass && (
        <Paper elevation={3}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              aria-label="attendance tabs"
            >
              <Tab 
                icon={<MarkIcon />} 
                label="Mark Attendance" 
                iconPosition="start"
              />
              <Tab 
                icon={<ViewIcon />} 
                label="View Attendance" 
                iconPosition="start"
              />
            </Tabs>
          </Box>

          <Box sx={{ p: 3 }}>
            {activeTab === 0 && (
              <ManualAttendanceMarking
                classId={selectedClass}
                className={getSelectedClassName()}
              />
            )}
            
            {activeTab === 1 && (
              <AttendanceView
                classId={selectedClass}
                className={getSelectedClassName()}
              />
            )}
          </Box>
        </Paper>
      )}

      {!selectedClass && (
        <Card sx={{ m: 2 }}>
          <CardContent>
            <Typography variant="h6" align="center" color="text.secondary">
              Please select a class to manage attendance
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AttendancePage;