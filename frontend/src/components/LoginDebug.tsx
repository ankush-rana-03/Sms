import React, { useState } from 'react';
import { Box, Typography, Button, TextField, Alert, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { authService } from '../services/authService';

const LoginDebug: React.FC = () => {
  const [email, setEmail] = useState('admin@school.com');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<'teacher' | 'admin' | 'parent'>('admin');
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const testLogin = async () => {
    try {
      setResult('Testing login...');
      setError('');
      
      const response = await authService.login(email, password, role);
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

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="role-label">Role</InputLabel>
        <Select
          labelId="role-label"
          value={role}
          label="Role"
          onChange={(e) => setRole(e.target.value as 'teacher' | 'admin' | 'parent')}
        >
          <MenuItem value="teacher">Teacher</MenuItem>
          <MenuItem value="admin">Admin</MenuItem>
          <MenuItem value="parent">Parent</MenuItem>
        </Select>
      </FormControl>
      
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
        • admin@school.com / password123 (Role: admin)<br/>
        • teacher@school.com / password123 (Role: teacher)<br/>
        • parent@school.com / password123 (Role: parent)
      </Typography>
    </Box>
  );
};

export default LoginDebug;