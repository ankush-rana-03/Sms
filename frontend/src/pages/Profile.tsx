import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Grid,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Snackbar,
  Chip,
  Paper,
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  LocationOn,
  Edit,
  Save,
  Cancel,
  School,
  Work,
  Lock,
  Visibility,
  VisibilityOff,
  Security,
  AccountCircle,
  Settings,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    // In real app, save to API
    console.log('Saving profile:', formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
    });
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordInputChange = (field: string, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSnackbar({
        open: true,
        message: 'New passwords do not match',
        severity: 'error',
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setSnackbar({
        open: true,
        message: 'New password must be at least 6 characters long',
        severity: 'error',
      });
      return;
    }

    try {
      await authService.updatePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setSnackbar({
        open: true,
        message: 'Password updated successfully',
        severity: 'success',
      });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordForm(false);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to update password',
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'principal': return 'Principal';
      case 'admin': return 'Administrator';
      case 'teacher': return 'Teacher';
      case 'parent': return 'Parent';
      case 'student': return 'Student';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'principal': return 'error';
      case 'admin': return 'warning';
      case 'teacher': return 'primary';
      case 'parent': return 'success';
      case 'student': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Enhanced Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography 
          variant="h3" 
          gutterBottom 
          sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2
          }}
        >
          My Profile 👤
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ opacity: 0.8 }}>
          Manage your personal information and account settings
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Enhanced Profile Card */}
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
              }
            }}
          >
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              {/* Profile Avatar with gradient background */}
              <Box sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                p: 2,
                mb: 3,
                display: 'inline-block'
              }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    mx: 'auto',
                    fontSize: '3rem',
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: '4px solid rgba(255,255,255,0.3)'
                  }}
                >
                  {user?.name?.charAt(0) || 'U'}
                </Avatar>
              </Box>
              
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                {user?.name}
              </Typography>
              
                              <Chip
                  label={getRoleDisplayName(user?.role || '')}
                  color={getRoleColor(user?.role || '') as any}
                  size="medium"
                  sx={{ 
                    mb: 2, 
                    fontWeight: 600,
                    fontSize: '1rem',
                    py: 1
                  }}
                />

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mt: 3 }}>
                <Button
                  variant={isEditing ? 'outlined' : 'contained'}
                  startIcon={isEditing ? <Cancel /> : <Edit />}
                  onClick={isEditing ? handleCancel : handleEdit}
                  sx={{ 
                    mr: 1,
                    borderRadius: 2,
                    px: 3,
                    fontWeight: 600,
                    textTransform: 'none'
                  }}
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
                
                {isEditing && (
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSave}
                    sx={{ 
                      borderRadius: 2,
                      px: 3,
                      fontWeight: 600,
                      textTransform: 'none'
                    }}
                  >
                    Save
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Enhanced Profile Details */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            {/* Personal Information */}
            <Grid item xs={12}>
              <Card sx={{ 
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                borderRadius: 3
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <AccountCircle sx={{ mr: 2, color: 'primary.main', fontSize: 28 }} />
                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      Personal Information
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        disabled={!isEditing}
                        size="small"
                        InputProps={{
                          startAdornment: <Person sx={{ mr: 1, color: 'action.disabled' }} fontSize="small" />,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          }
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled={!isEditing}
                        size="small"
                        InputProps={{
                          startAdornment: <Email sx={{ mr: 1, color: 'action.disabled' }} fontSize="small" />,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          }
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={!isEditing}
                        size="small"
                        InputProps={{
                          startAdornment: <Phone sx={{ mr: 1, color: 'action.disabled' }} fontSize="small" />,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          }
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        disabled={!isEditing}
                        size="small"
                        InputProps={{
                          startAdornment: <LocationOn sx={{ mr: 1, color: 'action.disabled' }} fontSize="small" />,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Account Information */}
            <Grid item xs={12}>
              <Card sx={{ 
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                borderRadius: 3
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Settings sx={{ mr: 2, color: 'secondary.main', fontSize: 28 }} />
                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                      Account Information
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                                              <TextField
                          fullWidth
                          label="User ID"
                          value={user?.id || ''}
                          disabled
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              bgcolor: 'action.hover'
                            }
                          }}
                        />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Role"
                        value={getRoleDisplayName(user?.role || '')}
                        disabled
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            bgcolor: 'action.hover'
                          }
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Account Status"
                        value={user?.isActive ? 'Active' : 'Inactive'}
                        disabled
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            bgcolor: 'action.hover'
                          }
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email Verification"
                        value={user?.emailVerified ? 'Verified' : 'Not Verified'}
                        disabled
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            bgcolor: 'action.hover'
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Password Change Section */}
            <Grid item xs={12}>
              <Card sx={{ 
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                borderRadius: 3
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Security sx={{ mr: 2, color: 'warning.main', fontSize: 28 }} />
                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'warning.main' }}>
                      Security Settings
                    </Typography>
                  </Box>
                  
                  {!showPasswordForm ? (
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                        Keep your account secure by regularly updating your password
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<Lock />}
                        onClick={() => setShowPasswordForm(true)}
                        sx={{ 
                          borderRadius: 2,
                          px: 3,
                          fontWeight: 600,
                          textTransform: 'none'
                        }}
                      >
                        Change Password
                      </Button>
                    </Box>
                  ) : (
                    <Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Current Password"
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={passwordForm.currentPassword}
                            onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                            size="small"
                            InputProps={{
                              startAdornment: <Lock sx={{ mr: 1, color: 'action.disabled' }} fontSize="small" />,
                              endAdornment: (
                                <Button
                                  size="small"
                                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                  sx={{ minWidth: 'auto', p: 0.5 }}
                                >
                                  {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                                </Button>
                              ),
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                              }
                            }}
                          />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="New Password"
                            type={showNewPassword ? 'text' : 'password'}
                            value={passwordForm.newPassword}
                            onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                            size="small"
                            InputProps={{
                              startAdornment: <Lock sx={{ mr: 1, color: 'action.disabled' }} fontSize="small" />,
                              endAdornment: (
                                <Button
                                  size="small"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                  sx={{ minWidth: 'auto', p: 0.5 }}
                                >
                                  {showNewPassword ? <VisibilityOff /> : <Visibility />}
                                </Button>
                              ),
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                              }
                            }}
                          />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Confirm New Password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={passwordForm.confirmPassword}
                            onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                            size="small"
                            InputProps={{
                              startAdornment: <Lock sx={{ mr: 1, color: 'action.disabled' }} fontSize="small" />,
                              endAdornment: (
                                <Button
                                  size="small"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  sx={{ minWidth: 'auto', p: 0.5 }}
                                >
                                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                </Button>
                              ),
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                              }
                            }}
                          />
                        </Grid>
                      </Grid>
                      
                      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <Button
                          variant="outlined"
                          onClick={() => setShowPasswordForm(false)}
                          sx={{ 
                            borderRadius: 2,
                            px: 3,
                            fontWeight: 600,
                            textTransform: 'none'
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="contained"
                          onClick={handlePasswordChange}
                          disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                          sx={{ 
                            borderRadius: 2,
                            px: 3,
                            fontWeight: 600,
                            textTransform: 'none'
                          }}
                        >
                          Update Password
                        </Button>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;