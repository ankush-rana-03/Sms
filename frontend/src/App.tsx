import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import StudentAttendance from './pages/StudentAttendance';
import StaffAttendance from './pages/StaffAttendance';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Classes from './pages/Classes';
import Sessions from './pages/Sessions';
import Homework from './pages/Homework';
import Tests from './pages/Tests';
import Results from './pages/Results';
import Profile from './pages/Profile';
import Layout from './components/Layout';

import RoleBasedRoute from './components/RoleBasedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import LoginDebug from './components/LoginDebug';

import TeacherAttendance from './pages/TeacherAttendance';
import TeacherManagement from './pages/TeacherManagement';

// Import custom theme
import theme from './theme';

const queryClient = new QueryClient();

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
                <Route path="student-attendance" element={
                  <RoleBasedRoute allowedRoles={['admin', 'principal', 'teacher']}>
                    <StudentAttendance />
                  </RoleBasedRoute>
                } />
                <Route path="staff-attendance" element={
                  <RoleBasedRoute allowedRoles={['admin', 'principal', 'teacher']}>
                    <StaffAttendance />
                  </RoleBasedRoute>
                } />
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
                <Route path="teacher-management" element={
                  <RoleBasedRoute allowedRoles={['admin']}>
                    <TeacherManagement />
                  </RoleBasedRoute>
                } />
                <Route path="classes" element={
                  <RoleBasedRoute allowedRoles={['admin', 'principal', 'teacher']}>
                    <Classes />
                  </RoleBasedRoute>
                } />
                <Route path="sessions" element={
                  <RoleBasedRoute allowedRoles={['admin', 'principal']}>
                    <Sessions />
                  </RoleBasedRoute>
                } />
                <Route path="homework" element={<Homework />} />
                <Route path="tests" element={<Tests />} />
                <Route path="results" element={<Results />} />
                <Route path="profile" element={<Profile />} />
                <Route path="teacher-attendance" element={
                  <RoleBasedRoute allowedRoles={['teacher', 'admin']}>
                    <TeacherAttendance />
                  </RoleBasedRoute>
                } />


              </Route>
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
