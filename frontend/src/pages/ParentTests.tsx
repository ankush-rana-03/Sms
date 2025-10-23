import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CircularProgress, 
  Alert,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  Quiz, 
  CalendarToday,
  School,
  AccessTime
} from '@mui/icons-material';
import { useParentAuth } from '../contexts/ParentAuthContext';
import { useNavigate } from 'react-router-dom';

// Mock data interface - replace with actual API call
interface Test {
  _id: string;
  testName: string;
  subject: string;
  class: string;
  section: string;
  maxMarks: number;
  duration: number; // in minutes
  testDate: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  instructions?: string;
}

const ParentTestsPage: React.FC = () => {
  const { parent, isLoggedIn } = useParentAuth();
  const navigate = useNavigate();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<string>('');

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/parent-login');
      return;
    }

    if (parent && parent.children && parent.children.length > 0) {
      setSelectedChild(parent.children[0]._id);
      fetchTests(parent.children[0]._id);
    } else if (parent && (!parent.children || parent.children.length === 0)) {
      setError('No children found in your account. Please contact the administrator.');
      setLoading(false);
    }
  }, [isLoggedIn, parent, navigate]);

  const fetchTests = async (childId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data - replace with actual API call
      const mockTests: Test[] = [
        {
          _id: '1',
          testName: 'Mathematics Test 1',
          subject: 'Mathematics',
          class: '10',
          section: 'A',
          maxMarks: 100,
          duration: 90,
          testDate: '2024-02-15',
          status: 'upcoming',
          instructions: 'Bring calculator and ruler'
        },
        {
          _id: '2',
          testName: 'English Test 1',
          subject: 'English',
          class: '10',
          section: 'A',
          maxMarks: 100,
          duration: 60,
          testDate: '2024-02-20',
          status: 'upcoming',
          instructions: 'No additional materials required'
        },
        {
          _id: '3',
          testName: 'Science Test 1',
          subject: 'Science',
          class: '10',
          section: 'A',
          maxMarks: 100,
          duration: 120,
          testDate: '2024-01-25',
          status: 'completed',
          instructions: 'Practical test - bring lab coat'
        }
      ];
      
      setTests(mockTests);
    } catch (err: any) {
      console.error('Tests fetch error:', err);
      setError('Failed to fetch tests data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChildChange = async (childId: string) => {
    setSelectedChild(childId);
    await fetchTests(childId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'info';
      case 'ongoing':
        return 'warning';
      case 'completed':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'Upcoming';
      case 'ongoing':
        return 'Ongoing';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const upcomingTests = tests.filter(test => test.status === 'upcoming');
  const completedTests = tests.filter(test => test.status === 'completed');

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
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

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Tests & Examinations
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View upcoming and completed tests
          </Typography>
        </Box>
      </Box>

      {/* Student Selection */}
      {parent && parent.children.length > 1 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <FormControl fullWidth>
              <InputLabel>Select Student</InputLabel>
              <Select
                value={selectedChild}
                onChange={(e) => handleChildChange(e.target.value)}
              >
                {parent.children.map((child) => (
                  <MenuItem key={child._id} value={child._id}>
                    {child.name} (Class {child.grade}-{child.section})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                  <Quiz />
                </Avatar>
                <Box>
                  <Typography variant="h6">{tests.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Tests
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ mr: 2, bgcolor: 'info.main' }}>
                  <CalendarToday />
                </Avatar>
                <Box>
                  <Typography variant="h6">{upcomingTests.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upcoming Tests
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ mr: 2, bgcolor: 'success.main' }}>
                  <School />
                </Avatar>
                <Box>
                  <Typography variant="h6">{completedTests.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed Tests
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ mr: 2, bgcolor: 'warning.main' }}>
                  <AccessTime />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {tests.length > 0 ? Math.round(tests.reduce((sum, test) => sum + test.duration, 0) / tests.length) : 0}m
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Duration
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Upcoming Tests */}
      {upcomingTests.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Upcoming Tests
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Test Name</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Max Marks</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {upcomingTests.map((test) => (
                    <TableRow key={test._id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {test.testName}
                        </Typography>
                        {test.instructions && (
                          <Typography variant="caption" color="text.secondary">
                            {test.instructions}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={test.subject} size="small" />
                      </TableCell>
                      <TableCell>
                        {formatDate(test.testDate)}
                      </TableCell>
                      <TableCell>
                        {formatTime(test.duration)}
                      </TableCell>
                      <TableCell>
                        {test.maxMarks}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusText(test.status)}
                          color={getStatusColor(test.status) as any}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Completed Tests */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Completed Tests
          </Typography>
          {completedTests.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: 'grey.100' }}>
                <Quiz />
              </Avatar>
              <Typography variant="body1" color="text.secondary">
                No completed tests found.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Test Name</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Max Marks</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {completedTests.map((test) => (
                    <TableRow key={test._id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {test.testName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={test.subject} size="small" />
                      </TableCell>
                      <TableCell>
                        {formatDate(test.testDate)}
                      </TableCell>
                      <TableCell>
                        {formatTime(test.duration)}
                      </TableCell>
                      <TableCell>
                        {test.maxMarks}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusText(test.status)}
                          color={getStatusColor(test.status) as any}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ParentTestsPage;