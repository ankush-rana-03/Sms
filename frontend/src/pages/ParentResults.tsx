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
  Assessment, 
  TrendingUp,
  School,
  Grade
} from '@mui/icons-material';
import { useParentAuth } from '../contexts/ParentAuthContext';
import { useNavigate } from 'react-router-dom';

// Mock data interface - replace with actual API call
interface TestResult {
  _id: string;
  testName: string;
  subject: string;
  maxMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  date: string;
  remarks?: string;
}

const ParentResultsPage: React.FC = () => {
  const { parent, isLoggedIn } = useParentAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState<TestResult[]>([]);
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
      fetchResults(parent.children[0]._id);
    } else if (parent && (!parent.children || parent.children.length === 0)) {
      setError('No children found in your account. Please contact the administrator.');
      setLoading(false);
    }
  }, [isLoggedIn, parent, navigate]);

  const fetchResults = async (childId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data - replace with actual API call
      const mockResults: TestResult[] = [
        {
          _id: '1',
          testName: 'Mathematics Test 1',
          subject: 'Mathematics',
          maxMarks: 100,
          obtainedMarks: 85,
          percentage: 85,
          grade: 'A',
          date: '2024-01-15',
          remarks: 'Good performance'
        },
        {
          _id: '2',
          testName: 'English Test 1',
          subject: 'English',
          maxMarks: 100,
          obtainedMarks: 78,
          percentage: 78,
          grade: 'B+',
          date: '2024-01-20',
          remarks: 'Needs improvement in grammar'
        },
        {
          _id: '3',
          testName: 'Science Test 1',
          subject: 'Science',
          maxMarks: 100,
          obtainedMarks: 92,
          percentage: 92,
          grade: 'A+',
          date: '2024-01-25',
          remarks: 'Excellent work'
        }
      ];
      
      setResults(mockResults);
    } catch (err: any) {
      console.error('Results fetch error:', err);
      setError('Failed to fetch results data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChildChange = async (childId: string) => {
    setSelectedChild(childId);
    await fetchResults(childId);
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'success';
      case 'B+':
      case 'B':
        return 'warning';
      case 'C+':
      case 'C':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 80) return 'warning';
    if (percentage >= 70) return 'error';
    return 'default';
  };

  const calculateAveragePercentage = () => {
    if (results.length === 0) return 0;
    const total = results.reduce((sum, result) => sum + result.percentage, 0);
    return Math.round(total / results.length);
  };

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
            Test Results
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View your child's academic performance
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
                  <Assessment />
                </Avatar>
                <Box>
                  <Typography variant="h6">{results.length}</Typography>
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
                <Avatar sx={{ mr: 2, bgcolor: 'success.main' }}>
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography variant="h6">{calculateAveragePercentage()}%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Score
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
                  <Grade />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {results.length > 0 ? results[0].grade : '-'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Latest Grade
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
                <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
                  <School />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {results.length > 0 ? Math.max(...results.map(r => r.percentage)) : 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Highest Score
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Results Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Test Results
          </Typography>
          {results.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: 'grey.100' }}>
                <Assessment />
              </Avatar>
              <Typography variant="body1" color="text.secondary">
                No test results found.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Test Name</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Marks Obtained</TableCell>
                    <TableCell>Percentage</TableCell>
                    <TableCell>Grade</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.map((result) => (
                    <TableRow key={result._id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {result.testName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={result.subject} size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {result.obtainedMarks}/{result.maxMarks}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${result.percentage}%`}
                          color={getPercentageColor(result.percentage) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={result.grade}
                          color={getGradeColor(result.grade) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(result.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        {result.remarks || '-'}
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

export default ParentResultsPage;