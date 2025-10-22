import { apiService } from './api';

export interface Parent {
  id: string;
  name: string;
  email: string;
  phone: string;
  children: Array<{
    _id: string;
    name: string;
    grade: string;
    section: string;
    rollNumber: string;
    parentName: string;
    parentPhone: string;
    parentEmail: string;
  }>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  data: {
    parent: Parent;
  };
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  address?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

class ParentAuthService {
  async loginParent(credentials: LoginRequest): Promise<LoginResponse> {
    return apiService.post('/parents/login', credentials);
  }

  async getParentProfile(): Promise<{ success: boolean; data: Parent }> {
    return apiService.get('/parents/profile');
  }

  async updateParentProfile(profile: UpdateProfileRequest): Promise<{ success: boolean; data: Parent }> {
    return apiService.put('/parents/profile', profile);
  }

  async changePassword(passwordData: ChangePasswordRequest): Promise<{ success: boolean; message: string }> {
    return apiService.put('/parents/change-password', passwordData);
  }

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    return apiService.post('/parents/forgot-password', { email });
  }

  async resetPassword(token: string, password: string): Promise<{ success: boolean; message: string }> {
    return apiService.put(`/parents/reset-password/${token}`, { password });
  }

  // Helper method to check if parent is logged in
  isParentLoggedIn(): boolean {
    const token = localStorage.getItem('parentToken');
    if (!token) return false;
    
    try {
      // Decode JWT token to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch (error) {
      // If token is malformed, remove it
      localStorage.removeItem('parentToken');
      localStorage.removeItem('parentData');
      return false;
    }
  }

  // Helper method to get parent data from localStorage
  getParentData(): Parent | null {
    const parentData = localStorage.getItem('parentData');
    return parentData ? JSON.parse(parentData) : null;
  }

  // Helper method to logout parent
  logoutParent(): void {
    localStorage.removeItem('parentToken');
    localStorage.removeItem('parentData');
  }
}

export const parentAuthService = new ParentAuthService();
export default parentAuthService;