import React, { useState, useEffect } from 'react';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const AttendanceDebug: React.FC = () => {
  const { user, loading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  useEffect(() => {
    addDebugInfo('Component mounted');
    addDebugInfo(`User: ${user ? JSON.stringify(user) : 'null'}`);
    addDebugInfo(`Loading: ${loading}`);
  }, [user, loading]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading authentication...</Typography>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No user found. Please log in to access the attendance page.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Attendance Debug Page
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        This is a debug version of the Attendance page to help identify issues.
      </Alert>

      <Typography variant="h6" gutterBottom>
        User Information:
      </Typography>
      <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
        <pre>{JSON.stringify(user, null, 2)}</pre>
      </Box>

      <Typography variant="h6" gutterBottom>
        Debug Log:
      </Typography>
      <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, maxHeight: '300px', overflow: 'auto' }}>
        {debugInfo.map((info, index) => (
          <Typography key={index} variant="body2" sx={{ fontFamily: 'monospace' }}>
            {info}
          </Typography>
        ))}
      </Box>

      <Alert severity="success" sx={{ mt: 3 }}>
        If you can see this page, the basic routing and authentication are working correctly.
        The issue might be with the main Attendance component or API calls.
      </Alert>
    </Box>
  );
};

export default AttendanceDebug;