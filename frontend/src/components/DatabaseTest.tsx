import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Grid,
  Chip
} from '@mui/material';
import { Refresh, CheckCircle, Cancel } from '@mui/icons-material';

interface StudentTestData {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  grade: string;
  parentName: string;
  parentPhone: string;
  facialData: {
    hasFaceData: boolean;
    isFaceRegistered: boolean;
    faceId: string;
    faceDescriptorLength: number;
    hasFaceImage: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

const DatabaseTest: React.FC = () => {
  const [students, setStudents] = useState<StudentTestData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('https://sms-38ap.onrender.com/api/students/test/all');
      const data = await response.json();
      
      if (data.success) {
        setStudents(data.data);
        console.log('Database test - Students found:', data.count);
        console.log('Students data:', data.data);
      } else {
        setError(data.message || 'Failed to fetch students');
      }
    } catch (error: any) {
      console.error('Error fetching students:', error);
      setError(error.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Database Test - Check Students
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        This page shows all students currently saved in the database. Use this to verify that student creation is working.
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={fetchStudents}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh Database'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : students.length === 0 ? (
        <Alert severity="info">
          No students found in database. Try creating a student first!
        </Alert>
      ) : (
        <Box>
          <Typography variant="h6" gutterBottom>
            Students in Database ({students.length})
          </Typography>
          
          <Grid container spacing={2}>
            {students.map((student) => (
              <Grid item xs={12} md={6} key={student.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {student.name}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Email: {student.email}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Phone: {student.phone}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Grade: {student.grade}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Parent: {student.parentName} ({student.parentPhone})
                    </Typography>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Face Registration Status:
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          icon={student.facialData.hasFaceData ? <CheckCircle /> : <Cancel />}
                          label={student.facialData.hasFaceData ? 'Face Data Present' : 'No Face Data'}
                          color={student.facialData.hasFaceData ? 'success' : 'error'}
                          size="small"
                        />
                        
                        <Chip
                          icon={student.facialData.isFaceRegistered ? <CheckCircle /> : <Cancel />}
                          label={student.facialData.isFaceRegistered ? 'Face Registered' : 'Face Not Registered'}
                          color={student.facialData.isFaceRegistered ? 'success' : 'error'}
                          size="small"
                        />
                        
                        <Chip
                          label={`Descriptor: ${student.facialData.faceDescriptorLength} values`}
                          color="info"
                          size="small"
                        />
                        
                        <Chip
                          icon={student.facialData.hasFaceImage ? <CheckCircle /> : <Cancel />}
                          label={student.facialData.hasFaceImage ? 'Face Image Present' : 'No Face Image'}
                          color={student.facialData.hasFaceImage ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>
                    </Box>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Created: {formatDate(student.createdAt)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default DatabaseTest;