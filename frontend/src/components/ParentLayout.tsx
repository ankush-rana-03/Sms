import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  useTheme,
  useMediaQuery,
  SwipeableDrawer,
  Tooltip,
  Fade,
  Zoom,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  School,
  Assignment,
  Quiz,
  Assessment,
  Person,
  Notifications,
  Logout,
  Settings,
  Close,
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useParentAuth } from '../contexts/ParentAuthContext';

const drawerWidth = 280;

const getParentMenuItems = () => [
  { text: 'Dashboard', icon: <Dashboard />, path: '/parent/dashboard' },
  { text: 'Attendance', icon: <School />, path: '/parent/attendance' },
  { text: 'Homework', icon: <Assignment />, path: '/parent/homework' },
  { text: 'Tests', icon: <Quiz />, path: '/parent/tests' },
  { text: 'Results', icon: <Assessment />, path: '/parent/results' },
];

const ParentLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { parent, logout } = useParentAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/parent-login');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const menuItems = getParentMenuItems();

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
        color: 'white',
        textAlign: 'center'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
          <img
            src={process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/logo.png` : '/logo.png'}
            alt="Logo"
            style={{ height: 40, width: 40, objectFit: 'contain', borderRadius: 6, background: 'rgba(255,255,255,0.15)', padding: 4 }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          🏫 Parent Portal
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          School Management System
        </Typography>
        {isMobile && (
          <IconButton
            onClick={handleDrawerToggle}
            sx={{ 
              position: 'absolute', 
              top: 8, 
              right: 8, 
              color: 'white' 
            }}
          >
            <Close />
          </IconButton>
        )}
      </Box>
      
      <Divider />
      
      {/* User Info */}
      <Box sx={{ p: 2, textAlign: 'center', borderBottom: 1, borderColor: 'divider' }}>
        <Avatar 
          sx={{ 
            width: 64, 
            height: 64, 
            mx: 'auto', 
            mb: 1,
            bgcolor: 'primary.main',
            fontSize: '1.5rem'
          }}
        >
          {parent?.name?.charAt(0) || 'P'}
        </Avatar>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {parent?.name || 'Parent'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {parent?.email || 'parent@school.com'}
        </Typography>
        {parent?.children && parent.children.length > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            {parent.children.length} child{parent.children.length > 1 ? 'ren' : ''}
          </Typography>
        )}
      </Box>

      {/* Navigation Menu */}
      <List sx={{ flexGrow: 1, px: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 2,
                mx: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
                '&:hover': {
                  bgcolor: 'action.hover',
                  transform: 'translateX(4px)',
                  transition: 'all 0.2s ease-in-out',
                },
              }}
            >
              <ListItemIcon sx={{ 
                minWidth: 40,
                color: location.pathname === item.path ? 'white' : 'inherit'
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{
                  fontWeight: location.pathname === item.path ? 600 : 500,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block' }}>
          © 2024 School Management System
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          zIndex: theme.zIndex.drawer + 1,
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Logo (from public/logo.png) */}
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', mr: 2 }}>
            <img
              src={process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/logo.png` : '/logo.png'}
              alt="Logo"
              style={{ height: 32, width: 32, objectFit: 'contain', borderRadius: 4 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </Box>
          
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 600,
              display: { xs: 'none', sm: 'block' }
            }}
          >
            {menuItems.find(item => item.path === location.pathname)?.text || 'Parent Dashboard'}
          </Typography>

          {/* Mobile Title */}
          <Typography 
            variant="h6" 
            sx={{ 
              flexGrow: 1, 
              display: { xs: 'block', sm: 'none' },
              textAlign: 'center'
            }}
          >
            {menuItems.find(item => item.path === location.pathname)?.text || 'Parent Dashboard'}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Notifications" TransitionComponent={Zoom}>
              <IconButton color="inherit">
                <Badge badgeContent={4} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Profile" TransitionComponent={Zoom}>
              <IconButton
                onClick={handleProfileMenuOpen}
                sx={{ ml: 1 }}
              >
                <Avatar sx={{ 
                  width: { xs: 32, sm: 36 }, 
                  height: { xs: 32, sm: 36 },
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white'
                }}>
                  {parent?.name?.charAt(0) || 'P'}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile Drawer */}
        <SwipeableDrawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          onOpen={() => setMobileOpen(true)}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              border: 'none',
              boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
            },
          }}
        >
          {drawer}
        </SwipeableDrawer>
        
        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              border: 'none',
              boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }} />
        <Box sx={{ 
          p: { xs: 1, sm: 2, md: 3 },
          minHeight: `calc(100vh - ${isMobile ? 56 : 64}px)`,
        }}>
          <Outlet />
        </Box>
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            borderRadius: 2,
          }
        }}
      >
        <MenuItem onClick={() => navigate('/parent/profile')}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={() => navigate('/parent/settings')}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ParentLayout;