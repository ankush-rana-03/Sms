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

  async validateToken(): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.get('/parents/validate-token');
  }

  async createSampleAttendance(): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.post('/parents/create-sample-attendance');
  }

  // Helper method to check if parent is logged in
  isParentLoggedIn(): boolean {
    const token = localStorage.getItem('parentToken');
    console.log('Checking parent login status, token exists:', !!token);
    
    if (!token) return false;
    
    try {
      // Decode JWT token to check expiration
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log('Invalid token format');
        localStorage.removeItem('parentToken');
        localStorage.removeItem('parentData');
        return false;
      }
      
      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp <= currentTime;
      
      console.log('Token expiration check:', {
        exp: payload.exp,
        currentTime,
        isExpired,
        expiresAt: new Date(payload.exp * 1000).toISOString(),
        role: payload.role
      });
      
      // Check if token is for parent role
      if (payload.role !== 'parent') {
        console.log('Token is not for parent role, removing from storage');
        localStorage.removeItem('parentToken');
        localStorage.removeItem('parentData');
        return false;
      }
      
      if (isExpired) {
        console.log('Token expired, removing from storage');
        localStorage.removeItem('parentToken');
        localStorage.removeItem('parentData');
        return false;
      }
      
      return true;
    } catch (error) {
      console.log('Token validation error:', error);
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

  // Helper method to set parent data in localStorage
  setParentData(parent: Parent): void {
    localStorage.setItem('parentData', JSON.stringify(parent));
  }

  // Helper method to logout parent
  logoutParent(): void {
    localStorage.removeItem('parentToken');
    localStorage.removeItem('parentData');
  }
}

export const parentAuthService = new ParentAuthService();
export default parentAuthService;