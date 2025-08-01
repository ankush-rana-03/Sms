import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import CameraTest from './components/CameraTest';
import StudentCreationTest from './components/StudentCreationTest';
import DatabaseTest from './components/DatabaseTest';
import SimpleCameraTest from './components/SimpleCameraTest';

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

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/simple-camera" element={<SimpleCameraTest />} />
              <Route path="/student-test" element={<StudentCreationTest />} />
              <Route path="/database-test" element={<DatabaseTest />} />
              <Route path="/camera-test" element={<CameraTest />} />
              <Route path="/debug" element={<LoginDebug />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="students" element={
                  <RoleBasedRoute allowedRoles={['admin', 'principal', 'teacher']}>
                    <Students />
                  </RoleBasedRoute>
                } />
                <Route path="teachers" element={
                  <RoleBasedRoute allowedRoles={['admin', 'principal']}>
                    <Teachers />
                  </RoleBasedRoute>
                } />
                <Route path="classes" element={
                  <RoleBasedRoute allowedRoles={['admin', 'principal', 'teacher']}>
                    <Classes />
                  </RoleBasedRoute>
                } />
                <Route path="homework" element={<Homework />} />
                <Route path="tests" element={<Tests />} />
                <Route path="results" element={<Results />} />
                <Route path="profile" element={<Profile />} />
              </Route>
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
