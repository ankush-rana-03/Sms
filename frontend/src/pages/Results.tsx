import React from 'react';
import { Box, Typography, Button, Grid, Card, CardContent, Chip, Avatar, LinearProgress } from '@mui/material';
import { Assessment, Person } from '@mui/icons-material';

const Results: React.FC = () => {
  const mockResults = [
    {
      id: '1',
      student: 'John Doe',
      class: '10A',
      term: 'First Term',
      totalMarks: 450,
      maxMarks: 500,
      percentage: 90,
      grade: 'A+',
      rank: 1,
      subjects: [
        { name: 'Mathematics', marks: 95, maxMarks: 100 },
        { name: 'Physics', marks: 88, maxMarks: 100 },
        { name: 'English', marks: 92, maxMarks: 100 },
        { name: 'Chemistry', marks: 90, maxMarks: 100 },
        { name: 'Biology', marks: 85, maxMarks: 100 },
      ]
    },
    {
      id: '2',
      student: 'Jane Smith',
      class: '10A',
      term: 'First Term',
      totalMarks: 420,
      maxMarks: 500,
      percentage: 84,
      grade: 'A',
      rank: 2,
      subjects: [
        { name: 'Mathematics', marks: 88, maxMarks: 100 },
        { name: 'Physics', marks: 85, maxMarks: 100 },
        { name: 'English', marks: 90, maxMarks: 100 },
        { name: 'Chemistry', marks: 87, maxMarks: 100 },
        { name: 'Biology', marks: 70, maxMarks: 100 },
      ]
    },
  ];

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': return 'success';
      case 'A': return 'success';
      case 'B+': return 'primary';
      case 'B': return 'primary';
      case 'C+': return 'warning';
      case 'C': return 'warning';
      default: return 'error';
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Results & Reports</Typography>
        <Button variant="contained" startIcon={<Assessment />}>
          Generate Report
        </Button>
      </Box>

      <Grid container spacing={3}>
        {mockResults.map((result) => (
          <Grid item xs={12} md={6} key={result.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    <Person />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">{result.student}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {result.class} - {result.term}
                    </Typography>
                  </Box>
                  <Chip
                    label={`Rank ${result.rank}`}
                    color="primary"
                    size="small"
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="h4" color="primary">
                    {result.percentage}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {result.totalMarks}/{result.maxMarks} marks
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={result.grade}
                    color={getGradeColor(result.grade)}
                    size="medium"
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    class Subject-wise Performance:
                  </Typography>
                  {result.subjects.map((subject, index) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">{subject.name}</Typography>
                        <Typography variant="body2">
                          {subject.marks}/{subject.maxMarks}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(subject.marks / subject.maxMarks) * 100}
                        sx={{ height: 6, borderRadius: 1 }}
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Results;