import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Conditionally import dev tools only in development
const ReactQueryDevtools = process.env.NODE_ENV === 'development' 
  ? require('@tanstack/react-query-devtools').ReactQueryDevtools 
  : null;
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import RoleBasedRoute from './components/RoleBasedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load components for better performance
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Students = lazy(() => import('./pages/Students'));
const Teachers = lazy(() => import('./pages/Teachers'));
const Classes = lazy(() => import('./pages/Classes'));
const Homework = lazy(() => import('./pages/Homework'));
const Tests = lazy(() => import('./pages/Tests'));
const Results = lazy(() => import('./pages/Results'));
const Profile = lazy(() => import('./pages/Profile'));
const TeacherAttendance = lazy(() => import('./pages/TeacherAttendance'));
const TeacherManagement = lazy(() => import('./pages/TeacherManagement'));
const WhatsAppStatus = lazy(() => import('./components/WhatsAppStatus'));
const LoginDebug = lazy(() => import('./components/LoginDebug'));

// Optimized QueryClient configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error: any) => {
        if (error?.status === 404 || error?.status === 401) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
    success: {
      main: '#4caf50',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
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
    element: (
      <Suspense fallback={<LoadingSpinner message="Loading debug..." />}>
        <LoginDebug />
      </Suspense>
    )
  },
  {
    path: "/login", 
    element: (
      <Suspense fallback={<LoadingSpinner message="Loading login..." />}>
        <Login />
      </Suspense>
    )
  },
  {
    path: "/",
    element: <ProtectedLayout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingSpinner message="Loading dashboard..." />}>
            <Dashboard />
          </Suspense>
        )
      },
      {
        path: "attendance",
        element: (
          <Suspense fallback={<LoadingSpinner message="Loading attendance..." />}>
            <Attendance />
          </Suspense>
        )
      },
      {
        path: "students",
        element: (
          <Suspense fallback={<LoadingSpinner message="Loading students..." />}>
            <RoleBasedRoute allowedRoles={['admin', 'principal', 'teacher']}>
              <Students />
            </RoleBasedRoute>
          </Suspense>
        )
      },
      {
        path: "teachers",
        element: (
          <Suspense fallback={<LoadingSpinner message="Loading teachers..." />}>
            <RoleBasedRoute allowedRoles={['admin', 'principal']}>
              <Teachers />
            </RoleBasedRoute>
          </Suspense>
        )
      },
      {
        path: "teacher-management",
        element: (
          <Suspense fallback={<LoadingSpinner message="Loading teacher management..." />}>
            <RoleBasedRoute allowedRoles={['admin']}>
              <TeacherManagement />
            </RoleBasedRoute>
          </Suspense>
        )
      },
      {
        path: "classes",
        element: (
          <Suspense fallback={<LoadingSpinner message="Loading classes..." />}>
            <RoleBasedRoute allowedRoles={['admin', 'principal', 'teacher']}>
              <Classes />
            </RoleBasedRoute>
          </Suspense>
        )
      },
      {
        path: "homework",
        element: (
          <Suspense fallback={<LoadingSpinner message="Loading homework..." />}>
            <Homework />
          </Suspense>
        )
      },
      {
        path: "tests",
        element: (
          <Suspense fallback={<LoadingSpinner message="Loading tests..." />}>
            <Tests />
          </Suspense>
        )
      },
      {
        path: "results",
        element: (
          <Suspense fallback={<LoadingSpinner message="Loading results..." />}>
            <Results />
          </Suspense>
        )
      },
      {
        path: "profile",
        element: (
          <Suspense fallback={<LoadingSpinner message="Loading profile..." />}>
            <Profile />
          </Suspense>
        )
      },
      {
        path: "teacher-attendance",
        element: (
          <Suspense fallback={<LoadingSpinner message="Loading teacher attendance..." />}>
            <RoleBasedRoute allowedRoles={['teacher', 'admin']}>
              <TeacherAttendance />
            </RoleBasedRoute>
          </Suspense>
        )
      },
      {
        path: "whatsapp-status",
        element: (
          <Suspense fallback={<LoadingSpinner message="Loading WhatsApp status..." />}>
            <RoleBasedRoute allowedRoles={['admin']}>
              <WhatsAppStatus />
            </RoleBasedRoute>
          </Suspense>
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
            <ErrorBoundary>
              <RouterProvider router={router} />
            </ErrorBoundary>
          </AuthProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'development' && ReactQueryDevtools && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
