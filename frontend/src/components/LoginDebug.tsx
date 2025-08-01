import React, { useState } from 'react';
import { Box, Typography, Button, TextField, Alert } from '@mui/material';
import { authService } from '../services/authService';

const LoginDebug: React.FC = () => {
  const [email, setEmail] = useState('admin@school.com');
  const [password, setPassword] = useState('password123');
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const testLogin = async () => {
    try {
      setResult('Testing login...');
      setError('');
      
      const response = await authService.login(email, password);
      setResult(`Login successful! User: ${response.user.name}, Role: ${response.user.role}`);
    } catch (err: any) {
      setError(`Login failed: ${err.response?.data?.message || err.message}`);
      setResult('');
    }
  };

  const testGetMe = async () => {
    try {
      setResult('Testing getMe...');
      setError('');
      
      const user = await authService.getMe();
      setResult(`GetMe successful! User: ${user.name}, Role: ${user.role}`);
    } catch (err: any) {
      setError(`GetMe failed: ${err.response?.data?.message || err.message}`);
      setResult('');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Login Debug</Typography>
      
      <TextField
        fullWidth
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        sx={{ mt: 2, mb: 2 }}
      />
      
      <TextField
        fullWidth
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        sx={{ mb: 2 }}
      />
      
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button onClick={testLogin} variant="contained">
          Test Login
        </Button>
        <Button onClick={testGetMe} variant="outlined">
          Test GetMe
        </Button>
      </Box>
      
      {result && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {result}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Typography variant="h6" sx={{ mt: 3 }}>
        Test Credentials:
      </Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        • admin@school.com / password123<br/>
        • teacher@school.com / password123<br/>
        • student@school.com / password123<br/>
        • parent@school.com / password123
      </Typography>
    </Box>
  );
};

export default LoginDebug;