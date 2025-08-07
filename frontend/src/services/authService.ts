import { apiService } from './api';

export interface LoginRequest {
  email: string;
  password: string;
  role: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'principal' | 'admin' | 'teacher' | 'parent' | 'student';
    phone: string;
    address: string;
    profileImage?: string;
    isActive: boolean;
    emailVerified?: boolean;
  };
}

export interface User {
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

class AuthService {
  async login(email: string, password: string, role: string): Promise<LoginResponse> {
    return apiService.post<LoginResponse>('/auth/login', { email, password, role });
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    role: string;
    phone: string;
    address: string;
  }): Promise<LoginResponse> {
    return apiService.post<LoginResponse>('/auth/register', userData);
  }

  async getMe(): Promise<User> {
    const response = await apiService.get<{ success: boolean; data: User }>('/auth/me');
    return response.data;
  }

  async updateDetails(userData: Partial<User>): Promise<User> {
    const response = await apiService.put<{ success: boolean; data: User }>('/auth/updatedetails', userData);
    return response.data;
  }

  async updatePassword(currentPassword: string, newPassword: string): Promise<LoginResponse> {
    console.log('AuthService - Updating password...');
    console.log('AuthService - Current password length:', currentPassword.length);
    console.log('AuthService - New password length:', newPassword.length);
    
    try {
      const result = await apiService.put<LoginResponse>('/auth/updatepassword', {
        currentPassword,
        newPassword,
      });
      
      console.log('AuthService - Password update successful');
      return result;
    } catch (error) {
      console.error('AuthService - Password update failed:', error);
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<{ success: boolean; data: string }> {
    return apiService.post<{ success: boolean; data: string }>('/auth/forgotpassword', { email });
  }

  async resetPassword(token: string, password: string): Promise<LoginResponse> {
    return apiService.put<LoginResponse>(`/auth/resetpassword/${token}`, { password });
  }

  logout(): void {
    localStorage.removeItem('token');
  }
}

export const authService = new AuthService();