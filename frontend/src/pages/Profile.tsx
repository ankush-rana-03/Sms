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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
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
  VpnKey,
  Security,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

  // Password change state
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Forgot password state
  const [forgotPasswordDialog, setForgotPasswordDialog] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState(user?.email || '');

  // Notification state
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  const [loading, setLoading] = useState(false);

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

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setNotification({
        open: true,
        message: 'New passwords do not match',
        severity: 'error',
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setNotification({
        open: true,
        message: 'Password must be at least 6 characters long',
        severity: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      await authService.updatePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setNotification({
        open: true,
        message: 'Password updated successfully',
        severity: 'success',
      });
      setPasswordDialog(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      setNotification({
        open: true,
        message: error.response?.data?.error || 'Failed to update password',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      setNotification({
        open: true,
        message: 'Please enter your email address',
        severity: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(forgotPasswordEmail);
      setNotification({
        open: true,
        message: 'Password reset email sent successfully. Please check your inbox.',
        severity: 'success',
      });
      setForgotPasswordDialog(false);
    } catch (error: any) {
      setNotification({
        open: true,
        message: error.response?.data?.error || 'Failed to send reset email',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
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

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  mx: 'auto',
                  mb: 2,
                  fontSize: '3rem',
                }}
              >
                {user?.name?.charAt(0) || 'U'}
              </Avatar>
              
              <Typography variant="h5" gutterBottom>
                {user?.name}
              </Typography>
              
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {getRoleDisplayName(user?.role || '')}
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Button
                  variant={isEditing ? 'outlined' : 'contained'}
                  startIcon={isEditing ? <Cancel /> : <Edit />}
                  onClick={isEditing ? handleCancel : handleEdit}
                  sx={{ mr: 1 }}
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
                
                {isEditing && (
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSave}
                  >
                    Save
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Security Card */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Security sx={{ mr: 1 }} />
                Security
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<Lock />}
                  onClick={() => setPasswordDialog(true)}
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  Change Password
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<VpnKey />}
                  onClick={() => setForgotPasswordDialog(true)}
                  fullWidth
                >
                  Reset Password
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Details */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
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
                    InputProps={{
                      startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
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
                    InputProps={{
                      startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={!isEditing}
                    multiline
                    rows={3}
                    InputProps={{
                      startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Account Information
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <School />
                  </ListItemIcon>
                  <ListItemText
                    primary="Role"
                    secondary={getRoleDisplayName(user?.role || '')}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Work />
                  </ListItemIcon>
                  <ListItemText
                    primary="Account Status"
                    secondary={user?.isActive ? 'Active' : 'Inactive'}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Email />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email Verification"
                    secondary={user?.emailVerified ? 'Verified' : 'Not Verified'}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Current Password"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="New Password"
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
            margin="normal"
            required
            helperText="Password must be at least 6 characters long"
          />
          <TextField
            fullWidth
            label="Confirm New Password"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
            margin="normal"
            required
            error={passwordForm.newPassword !== passwordForm.confirmPassword && passwordForm.confirmPassword !== ''}
            helperText={passwordForm.newPassword !== passwordForm.confirmPassword && passwordForm.confirmPassword !== '' ? 'Passwords do not match' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)}>Cancel</Button>
          <Button 
            onClick={handlePasswordChange} 
            variant="contained"
            disabled={loading || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotPasswordDialog} onClose={() => setForgotPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Enter your email address and we'll send you a link to reset your password.
          </Alert>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={forgotPasswordEmail}
            onChange={(e) => setForgotPasswordEmail(e.target.value)}
            margin="normal"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setForgotPasswordDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleForgotPassword} 
            variant="contained"
            disabled={loading || !forgotPasswordEmail}
          >
            {loading ? 'Sending...' : 'Send Reset Email'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setNotification(prev => ({ ...prev, open: false }))} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;