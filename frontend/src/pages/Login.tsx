import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Fade,
  Zoom,
  Divider,
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  School, 
  Lock, 
  Email, 
  Person,
  Security,
  TrendingUp,
  People,
  Assignment,
  Assessment,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const schema = yup.object().shape({
  role: yup.string().oneOf(['teacher', 'admin', 'parent'], 'Please select a valid role').required('Role is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

interface LoginFormData {
  role: 'teacher' | 'admin' | 'parent';
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      role: 'admin'
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      setError('');
      console.log('Attempting login with:', data.email, 'role:', data.role);
      await login(data.email, data.password, data.role);
      console.log('Login successful, navigating to dashboard');
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Security />;
      case 'teacher': return <People />;
      case 'parent': return <Person />;
      default: return <Person />;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin': return 'Full system access and management';
      case 'teacher': return 'Class management and attendance';
      case 'parent': return 'Student progress monitoring';
      default: return '';
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 3 },
      }}
    >
      <Container component="main" maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            alignItems: 'center',
            justifyContent: 'center',
            gap: { xs: 3, lg: 4 },
          }}
        >
          {/* Left Side - Features */}
          <Fade in timeout={1000}>
            <Box
              sx={{
                flex: 1,
                textAlign: { xs: 'center', lg: 'left' },
                color: 'white',
                maxWidth: { xs: '100%', lg: '400px' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', lg: 'flex-start' }, mb: 3 }}>
                <School sx={{ fontSize: { xs: 48, md: 56 }, mr: 2 }} />
                <Typography 
                  variant={isMobile ? "h4" : "h3"} 
                  sx={{ fontWeight: 700 }}
                >
                  School Management
                </Typography>
              </Box>
              
              <Typography 
                variant={isMobile ? "h6" : "h5"} 
                sx={{ mb: 3, opacity: 0.9, fontWeight: 500 }}
              >
                Comprehensive School Management Solution
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TrendingUp sx={{ fontSize: 24, opacity: 0.8 }} />
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    Real-time analytics and insights
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Assignment sx={{ fontSize: 24, opacity: 0.8 }} />
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    Efficient attendance tracking
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Assessment sx={{ fontSize: 24, opacity: 0.8 }} />
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    Comprehensive reporting system
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Fade>

          {/* Right Side - Login Form */}
          <Zoom in timeout={800}>
            <Card
              elevation={24}
              sx={{
                width: '100%',
                maxWidth: { xs: '100%', sm: '450px' },
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography 
                    component="h1" 
                    variant={isMobile ? "h5" : "h4"} 
                    sx={{ 
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1
                    }}
                  >
                    Welcome Back
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Sign in to your account
                  </Typography>
                </Box>

                {error && (
                  <Alert 
                    severity="error" 
                    sx={{ 
                      width: '100%', 
                      mb: 3,
                      borderRadius: 2,
                    }}
                  >
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
                  <FormControl fullWidth margin="normal" error={!!errors.role}>
                    <InputLabel id="role-label">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person fontSize="small" />
                        Role
                      </Box>
                    </InputLabel>
                    <Controller
                      name="role"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          labelId="role-label"
                          id="role"
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Person fontSize="small" />
                              Role
                            </Box>
                          }
                          disabled={loading}
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="admin">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Security fontSize="small" />
                              Admin
                            </Box>
                          </MenuItem>
                          <MenuItem value="teacher">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <People fontSize="small" />
                              Teacher
                            </Box>
                          </MenuItem>
                          <MenuItem value="parent">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Person fontSize="small" />
                              Parent
                            </Box>
                          </MenuItem>
                        </Select>
                      )}
                    />
                    {errors.role && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                        {errors.role.message}
                      </Typography>
                    )}
                  </FormControl>

                  <TextField
                    margin="normal"
                    fullWidth
                    id="email"
                    label="Email Address"
                    autoComplete="email"
                    autoFocus
                    {...register('email')}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ borderRadius: 2 }}
                  />

                  <TextField
                    margin="normal"
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="current-password"
                    {...register('password')}
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ borderRadius: 2 }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ 
                      mt: 4, 
                      mb: 2, 
                      py: 1.5,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      boxShadow: '0 4px 20px rgba(25, 118, 210, 0.3)',
                      '&:hover': {
                        boxShadow: '0 6px 25px rgba(25, 118, 210, 0.4)',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease-in-out',
                    }}
                    disabled={loading}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      'Sign In'
                    )}
                  </Button>

                  <Divider sx={{ my: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Secure Access
                    </Typography>
                  </Divider>

                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Protected by enterprise-grade security
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Zoom>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;