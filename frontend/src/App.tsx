import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Classes from './pages/Classes';
import Homework from './pages/Homework';
import Tests from './pages/Tests';
import Results from './pages/Results';
import Profile from './pages/Profile';
import Layout from './components/Layout';
import RoleBasedRoute from './components/RoleBasedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import LoginDebug from './components/LoginDebug';
import ErrorBoundary from './components/ErrorBoundary';

import TeacherAttendance from './pages/TeacherAttendance';
import TeacherManagement from './pages/TeacherManagement';
import WhatsAppStatus from './components/WhatsAppStatus';

const queryClient = new QueryClient();

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Initializing application..." />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

const ProtectedLayout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Initializing application..." />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <Layout />;
};

const router = createBrowserRouter([
  {
    path: "/debug",
    element: <LoginDebug />
  },
  {
    path: "/login", 
    element: <Login />
  },
  {
    path: "/",
    element: <ProtectedLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />
      },
      {
        path: "attendance",
        element: <Attendance />
      },
      {
        path: "students",
        element: (
          <RoleBasedRoute allowedRoles={['admin', 'principal', 'teacher']}>
            <Students />
          </RoleBasedRoute>
        )
      },
      {
        path: "teachers",
        element: (
          <RoleBasedRoute allowedRoles={['admin', 'principal']}>
            <Teachers />
          </RoleBasedRoute>
        )
      },
      {
        path: "teacher-management",
        element: (
          <RoleBasedRoute allowedRoles={['admin']}>
            <TeacherManagement />
          </RoleBasedRoute>
        )
      },
      {
        path: "classes",
        element: (
          <RoleBasedRoute allowedRoles={['admin', 'principal', 'teacher']}>
            <Classes />
          </RoleBasedRoute>
        )
      },
      {
        path: "homework",
        element: <Homework />
      },
      {
        path: "tests",
        element: <Tests />
      },
      {
        path: "results",
        element: <Results />
      },
      {
        path: "profile",
        element: <Profile />
      },
      {
        path: "teacher-attendance",
        element: (
          <RoleBasedRoute allowedRoles={['teacher', 'admin']}>
            <TeacherAttendance />
          </RoleBasedRoute>
        )
      },
      {
        path: "whatsapp-status",
        element: (
          <RoleBasedRoute allowedRoles={['admin']}>
            <WhatsAppStatus />
          </RoleBasedRoute>
        )
      }
    ]
  }
]);

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
