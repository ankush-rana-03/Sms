import { api } from './api';

export interface Teacher {
  _id: string;
  teacherId: string;
  name: string;
  email: string;
  phone: string;
  designation: 'TGT' | 'PGT' | 'JBT' | 'NTT';
  subjects: string[];
  assignedClasses: Array<{
    class: {
      _id: string;
      name: string;
      grade: string;
      section: string;
    };
    section: string;
    subject: string;
    grade: string;
  }>;
  qualification: {
    degree: string;
    institution: string;
    yearOfCompletion: number;
  };
  experience: {
    years: number;
    previousSchools: string[];
  };
  specialization: string[];
  joiningDate: string;
  salary: number;
  isActive: boolean;
  onlineStatus: {
    isOnline: boolean;
    lastSeen: string;
    lastActivity: string;
  };
  passwordResetRequired: boolean;
  lastPasswordChange: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    lastLogin: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LoginLog {
  _id: string;
  loginTime: string;
  logoutTime: string | null;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failed';
  sessionDuration: number;
}

export interface TeacherStatistics {
  totalTeachers: number;
  activeTeachers: number;
  onlineTeachers: number;
  designationStats: Array<{
    _id: string;
    count: number;
  }>;
  recentLogins: Array<{
    teacherId: string;
    name: string;
    lastLogin: string;
  }>;
}

export interface CreateTeacherData {
  name: string;
  email: string;
  phone: string;
  designation: 'TGT' | 'PGT' | 'JBT' | 'NTT';
  subjects: string[];
  assignedClasses?: Array<{
    class: string;
    section: string;
    subject: string;
    grade: string;
  }>;
  qualification: {
    degree: string;
    institution: string;
    yearOfCompletion: number;
  };
  experience: {
    years: number;
    previousSchools: string[];
  };
  specialization: string[];
  salary: number;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface UpdateTeacherData extends Partial<CreateTeacherData> {}

export interface TeachersResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  totalPages: number;
  data: Teacher[];
}

export interface CreateTeacherResponse {
  success: boolean;
  message: string;
  data: {
    teacher: Teacher;
    temporaryPassword: string;
    message: string;
  };
}

export interface LoginLogsResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  totalPages: number;
  statistics: {
    totalSessions: number;
    totalDurationMinutes: number;
    averageSessionMinutes: number;
  };
  data: LoginLog[];
}

export interface StatisticsResponse {
  success: boolean;
  data: TeacherStatistics;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
  data: {
    temporaryPassword: string;
    message: string;
  };
}

class TeacherManagementService {
  // Get all teachers with pagination and filters
  async getTeachers(params: {
    page?: number;
    limit?: number;
    search?: string;
    designation?: string;
    status?: string;
  }): Promise<TeachersResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.designation) queryParams.append('designation', params.designation);
    if (params.status) queryParams.append('status', params.status);

    const response = await api.get(`/admin/teachers?${queryParams.toString()}`);
    return response.data;
  }

  // Create new teacher
  async createTeacher(data: CreateTeacherData): Promise<CreateTeacherResponse> {
    const response = await api.post('/admin/teachers', data);
    return response.data;
  }

  // Update teacher
  async updateTeacher(teacherId: string, data: UpdateTeacherData): Promise<{ success: boolean; message: string; data: Teacher }> {
    const response = await api.put(`/admin/teachers/${teacherId}`, data);
    return response.data;
  }

  // Delete (deactivate) teacher
  async deleteTeacher(teacherId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/admin/teachers/${teacherId}`);
    return response.data;
  }

  // Reset teacher password
  async resetTeacherPassword(teacherId: string, forceReset: boolean = true): Promise<PasswordResetResponse> {
    const response = await api.post(`/admin/teachers/${teacherId}/reset-password`, { forceReset });
    return response.data;
  }

  // Get teacher login logs
  async getTeacherLoginLogs(teacherId: string, params: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<LoginLogsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const response = await api.get(`/admin/teachers/${teacherId}/login-logs?${queryParams.toString()}`);
    return response.data;
  }

  // Get teacher status
  async getTeacherStatus(teacherId: string): Promise<{ success: boolean; data: any }> {
    const response = await api.get(`/admin/teachers/${teacherId}/status`);
    return response.data;
  }

  // Update teacher status
  async updateTeacherStatus(teacherId: string, isOnline: boolean): Promise<{ success: boolean; message: string; data: any }> {
    const response = await api.put(`/admin/teachers/${teacherId}/status`, { isOnline });
    return response.data;
  }

  // Get online teachers
  async getOnlineTeachers(): Promise<{ success: boolean; count: number; data: Teacher[] }> {
    const response = await api.get('/admin/teachers/online/teachers');
    return response.data;
  }

  // Assign classes to teacher
  async assignClassesToTeacher(teacherId: string, assignedClasses: Array<{
    class: string;
    section: string;
    subject: string;
    grade: string;
  }>): Promise<{ success: boolean; message: string; data: Teacher }> {
    const response = await api.post(`/admin/teachers/${teacherId}/assign-classes`, { assignedClasses });
    return response.data;
  }

  // Get teacher statistics
  async getTeacherStatistics(): Promise<StatisticsResponse> {
    const response = await api.get('/admin/teachers/statistics/overview');
    return response.data;
  }
}

export const teacherManagementService = new TeacherManagementService();