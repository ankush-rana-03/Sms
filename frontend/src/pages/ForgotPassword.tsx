import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  ArrowBack,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('token');
  
  const [activeStep, setActiveStep] = useState(resetToken ? 1 : 0);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });

  // Step 0: Request password reset
  const [email, setEmail] = useState('');
  
  // Step 1: Reset password
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirmPassword: false,
  });

  const steps = ['Request Reset', 'Reset Password'];

  const handleRequestReset = async () => {
    if (!email.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter your email address',
        severity: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.post('/auth/forgotpassword', {
        email: email.trim(),
      });

      if (response.success) {
        setSnackbar({
          open: true,
          message: 'Password reset email sent! Check your inbox.',
          severity: 'success',
        });
        setActiveStep(1);
      } else {
        setSnackbar({
          open: true,
          message: response.message || 'Failed to send reset email',
          severity: 'error',
        });
      }
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error sending reset email',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!passwordData.password || !passwordData.confirmPassword) {
      setSnackbar({
        open: true,
        message: 'Please fill in all password fields',
        severity: 'error',
      });
      return;
    }

    if (passwordData.password.length < 6) {
      setSnackbar({
        open: true,
        message: 'Password must be at least 6 characters long',
        severity: 'error',
      });
      return;
    }

    if (passwordData.password !== passwordData.confirmPassword) {
      setSnackbar({
        open: true,
        message: 'Passwords do not match',
        severity: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.put(`/auth/resetpassword/${resetToken}`, {
        password: passwordData.password,
      });

      if (response.success) {
        setSnackbar({
          open: true,
          message: 'Password reset successfully! You can now login with your new password.',
          severity: 'success',
        });
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setSnackbar({
          open: true,
          message: response.message || 'Failed to reset password',
          severity: 'error',
        });
      }
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error resetting password',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Enter your email address and we'll send you a link to reset your password.
            </Typography>
            
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ mb: 3 }}
            />
            
            <Button
              fullWidth
              variant="contained"
              onClick={handleRequestReset}
              disabled={loading || !email.trim()}
              sx={{ mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Send Reset Email'}
            </Button>
          </Box>
        );
      
      case 1:
        return (
          <Box>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Enter your new password below.
            </Typography>
            
            <TextField
              fullWidth
              label="New Password"
              type={showPasswords.password ? 'text' : 'password'}
              value={passwordData.password}
              onChange={(e) => setPasswordData(prev => ({ ...prev, password: e.target.value }))}
              helperText="Password must be at least 6 characters long"
              InputProps={{
                startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />,
                endAdornment: (
                  <Button
                    onClick={() => handleTogglePasswordVisibility('password')}
                    sx={{ minWidth: 'auto', p: 0.5 }}
                  >
                    {showPasswords.password ? <VisibilityOff /> : <Visibility />}
                  </Button>
                ),
              }}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Confirm New Password"
              type={showPasswords.confirmPassword ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              error={passwordData.password !== '' && passwordData.confirmPassword !== '' && passwordData.password !== passwordData.confirmPassword}
              helperText={passwordData.password !== '' && passwordData.confirmPassword !== '' && passwordData.password !== passwordData.confirmPassword ? 'Passwords do not match' : ''}
              InputProps={{
                startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />,
                endAdornment: (
                  <Button
                    onClick={() => handleTogglePasswordVisibility('confirmPassword')}
                    sx={{ minWidth: 'auto', p: 0.5 }}
                  >
                    {showPasswords.confirmPassword ? <VisibilityOff /> : <Visibility />}
                  </Button>
                ),
              }}
              sx={{ mb: 3 }}
            />
            
            <Button
              fullWidth
              variant="contained"
              onClick={handleResetPassword}
              disabled={loading || !passwordData.password || !passwordData.confirmPassword || passwordData.password !== passwordData.confirmPassword}
              sx={{ mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Reset Password'}
            </Button>
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 500, width: '100%', boxShadow: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              {resetToken ? 'Reset Password' : 'Forgot Password'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {resetToken ? 'Enter your new password' : 'Reset your password'}
            </Typography>
          </Box>

          {!resetToken && (
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          )}

          {renderStepContent(activeStep)}

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/login')}
              sx={{ color: 'text.secondary' }}
            >
              Back to Login
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ForgotPassword;