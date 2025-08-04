import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'principal' | 'admin' | 'teacher' | 'parent' | 'student';
  phone: string;
  address: string;
  profileImage?: string;
  isActive: boolean;
  emailVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('Initializing authentication...');
        const token = localStorage.getItem('token');
        console.log('Token found:', !!token);
        
        if (token) {
          console.log('Attempting to get user data...');
          const userData = await authService.getMe();
          console.log('User data received:', userData);
          setUser(userData);
        } else {
          console.log('No token found, user will need to login');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('token');
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string, role: string) => {
    try {
      const response = await authService.login(email, password, role);
      localStorage.setItem('token', response.token);
      
      // If user data is not included in login response, fetch it separately
      if (!response.user) {
        const userData = await authService.getMe();
        setUser(userData);
      } else {
        setUser(response.user);
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};