import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import {
  School,
  Assignment,
  Quiz,
  Assessment,
  Person,
  CalendarToday,
  CheckCircle,
  Cancel,
  Schedule
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import parentService, { ParentChild, ParentChildrenSummary, ParentHomework, ParentTest, ParentResult } from '../services/parentService';

const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [childrenSummary, setChildrenSummary] = useState<ParentChildrenSummary | null>(null);
  const [homework, setHomework] = useState<ParentHomework[]>([]);
  const [tests, setTests] = useState<ParentTest[]>([]);
  const [results, setResults] = useState<ParentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [childrenData, homeworkData, testsData, resultsData] = await Promise.all([
          parentService.getChildrenSummary(),
          parentService.getHomework(),
          parentService.getTests(),
          parentService.getResults()
        ]);

        setChildrenSummary(childrenData);
        setHomework(homeworkData);
        setTests(testsData);
        setResults(resultsData);
      } catch (err) {
        console.error('Error fetching parent data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present':
        return 'success';
      case 'absent':
        return 'error';
      case 'late':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present':
        return <CheckCircle />;
      case 'absent':
        return <Cancel />;
      case 'late':
        return <Schedule />;
      default:
        return <CalendarToday />;
    }
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
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!childrenSummary || childrenSummary.children.length === 0) {
    return (
      <Box p={3}>
        <Alert severity="info">
          No children found for this parent account. Please contact the school administration.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Parent Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Welcome, {user?.name}! Here's an overview of your children's academic progress.
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Children Summary */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                Your Children ({childrenSummary.summary.totalChildren})
              </Typography>
              <List>
                {childrenSummary.children.map((child, index) => (
                  <React.Fragment key={child._id}>
                    <ListItem>
                      <ListItemIcon>
                        <School />
                      </ListItemIcon>
                      <ListItemText
                        primary={child.name}
                        secondary={`Grade ${child.grade} - Section ${child.section} | Roll: ${child.rollNumber}`}
                      />
                      <Chip
                        label={child.grade}
                        color="primary"
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </ListItem>
                    {child.recentAttendance && child.recentAttendance.length > 0 && (
                      <Box sx={{ ml: 4, mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Recent Attendance:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                          {child.recentAttendance.slice(0, 5).map((att, idx) => (
                            <Chip
                              key={idx}
                              icon={getStatusIcon(att.status)}
                              label={`${att.date} (${att.status})`}
                              color={getStatusColor(att.status) as any}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                    {index < childrenSummary.children.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Homework */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
                Recent Homework ({homework.length})
              </Typography>
              {homework.length === 0 ? (
                <Typography color="text.secondary">No homework assignments found.</Typography>
              ) : (
                <List>
                  {homework.slice(0, 5).map((hw, index) => (
                    <React.Fragment key={hw._id}>
                      <ListItem>
                        <ListItemText
                          primary={hw.title}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Class: {hw.class.name} - {hw.class.section}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Due: {new Date(hw.dueDate).toLocaleDateString()}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Assigned by: {hw.assignedBy.name}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < Math.min(homework.length, 5) - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Tests */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Quiz sx={{ mr: 1, verticalAlign: 'middle' }} />
                Upcoming Tests ({tests.length})
              </Typography>
              {tests.length === 0 ? (
                <Typography color="text.secondary">No tests scheduled.</Typography>
              ) : (
                <List>
                  {tests.slice(0, 5).map((test, index) => (
                    <React.Fragment key={test._id}>
                      <ListItem>
                        <ListItemText
                          primary={test.name}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Subject: {test.subject}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Date: {new Date(test.date).toLocaleDateString()}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Class: {test.class.name} - {test.class.section}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < Math.min(tests.length, 5) - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Results */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
                Recent Results ({results.length})
              </Typography>
              {results.length === 0 ? (
                <Typography color="text.secondary">No results available.</Typography>
              ) : (
                <List>
                  {results.slice(0, 5).map((result, index) => (
                    <React.Fragment key={result._id}>
                      <ListItem>
                        <ListItemText
                          primary={`${result.test.name} - ${result.student.name}`}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Subject: {result.test.subject}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Marks: {result.marksObtained}/{result.totalMarks} ({result.grade})
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Date: {new Date(result.test.date).toLocaleDateString()}
                              </Typography>
                            </Box>
                          }
                        />
                        <Chip
                          label={result.grade}
                          color={result.grade === 'A+' ? 'success' : result.grade === 'A' ? 'primary' : 'default'}
                          size="small"
                        />
                      </ListItem>
                      {index < Math.min(results.length, 5) - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ParentDashboard;
