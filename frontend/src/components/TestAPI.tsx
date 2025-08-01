import React, { useEffect, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { authService } from '../services/authService';

const TestAPI: React.FC = () => {
  const [status, setStatus] = useState<string>('Testing...');
  const [error, setError] = useState<string | null>(null);

  const testAPI = async () => {
    try {
      setStatus('Testing login...');
      const response = await authService.login('admin@school.com', 'password123');
      setStatus(`Login successful: ${response.user.name}`);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      setStatus('Login failed');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">API Test</Typography>
      <Button onClick={testAPI} variant="contained" sx={{ mt: 2 }}>
        Test Login
      </Button>
      <Typography sx={{ mt: 2 }}>Status: {status}</Typography>
      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          Error: {error}
        </Typography>
      )}
    </Box>
  );
};

export default TestAPI;