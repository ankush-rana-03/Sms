
import api from './api';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
  profileImage?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  message: string;
}

export const authService = {
  login: async (credentials: { email: string; password: string }): Promise<LoginResponse> => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Login failed. Please try again.');
    }
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  verifyToken: async (): Promise<User> => {
    try {
      const response = await api.get('/auth/verify');
      return response.data.user;
    } catch (error: any) {
      throw new Error('Token verification failed');
    }
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    try {
      await api.post('/auth/change-password', data);
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Password change failed. Please try again.');
    }
  },

  resetPassword: async (email: string): Promise<void> => {
    try {
      await api.post('/auth/reset-password', { email });
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Password reset failed. Please try again.');
    }
  }
};
