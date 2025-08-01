import { apiService } from './api';

export interface LoginRequest {
  email: string;
  password: string;
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
  async login(email: string, password: string): Promise<LoginResponse> {
    return apiService.post<LoginResponse>('/auth/login', { email, password });
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
    return apiService.put<LoginResponse>('/auth/updatepassword', {
      currentPassword,
      newPassword,
    });
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