import React, { useState } from 'react';
import { Box, Typography, Button, Alert, Paper } from '@mui/material';
import StudentRegistrationForm from './StudentRegistrationForm';

const StudentCreationTest: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleStudentSubmit = async (data: any, faceData: any) => {
    try {
      console.log('Student data:', data);
      console.log('Face data:', faceData);
      
      setResult(`Student created successfully!
        Name: ${data.name}
        Email: ${data.email}
        Face captured: ${faceData ? 'Yes' : 'No'}
        Face descriptor length: ${faceData?.faceDescriptor?.length || 0}
        Face image: ${faceData?.faceImage ? 'Captured' : 'Not captured'}`);
      
      setError('');
    } catch (err: any) {
      setError(`Error creating student: ${err.message}`);
      setResult('');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Student Creation Test
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3 }}>
        This test simulates the complete student creation process including face capture.
        Fill out the form and test the face capture functionality.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{result}</pre>
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test Instructions:
        </Typography>
        <Typography variant="body2" component="div">
          1. Fill out the student information form<br/>
          2. Click "Next" to proceed to face capture<br/>
          3. Click "Start Camera" to begin face capture<br/>
          4. Allow camera permissions when prompted<br/>
          5. Position face in the circle and click "Capture Face"<br/>
          6. Click "Register Student" to complete the process
        </Typography>
      </Paper>

      <StudentRegistrationForm
        onSubmit={handleStudentSubmit}
        loading={false}
      />
    </Box>
  );
};

export default StudentCreationTest;