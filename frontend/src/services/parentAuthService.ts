import { parentApiService } from './parentApi';

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
    return parentApiService.post('/parents/login', credentials);
  }

  async getParentProfile(): Promise<{ success: boolean; data: Parent }> {
    return parentApiService.get('/parents/profile');
  }

  async updateParentProfile(profile: UpdateProfileRequest): Promise<{ success: boolean; data: Parent }> {
    return parentApiService.put('/parents/profile', profile);
  }

  async changePassword(passwordData: ChangePasswordRequest): Promise<{ success: boolean; message: string }> {
    return parentApiService.put('/parents/change-password', passwordData);
  }

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    return parentApiService.post('/parents/forgot-password', { email });
  }

  async resetPassword(token: string, password: string): Promise<{ success: boolean; message: string }> {
    return parentApiService.put(`/parents/reset-password/${token}`, { password });
  }

  // Helper method to check if parent is logged in
  isParentLoggedIn(): boolean {
    return !!localStorage.getItem('parentToken');
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