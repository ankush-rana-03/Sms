import { apiService as api } from './api';

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  grade: string;
  section: string;
  rollNumber: string;
  gender: string;
  bloodGroup: string;
  parentName: string;
  parentPhone: string;
  attendance?: AttendanceRecord[];
}

export interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'late';
  markedAt: string;
  markedBy: string;
}

export interface TodayAttendanceRecord {
  studentId: string;
  name: string;
  email: string;
  grade: string;
  section: string;
  rollNumber: string;
  todayStatus: string;
  markedAt: string | null;
}

export interface Teacher {
  _id: string;
  teacherId: string;
  name: string;
  email: string;
  phone: string;
  designation: 'TGT' | 'PGT' | 'JBT' | 'NTT';
  subjects: string[];
  assignedClasses: AssignedClass[];
  qualification?: {
    degree: string;
    institution: string;
    yearOfCompletion: number;
  };
  experience?: {
    years: number;
    previousSchools: string[];
  };
  specialization?: string[];
  joiningDate: string;
  salary: number;
  contactInfo?: {
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  isClassTeacher: boolean;
  classTeacherOf?: any;
  isActive: boolean;
  onlineStatus: {
    isOnline: boolean;
    lastSeen: string;
    lastActivity: string;
  };
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AssignedClass {
  class: {
    _id: string;
    name: string;
    grade: string;
    section: string;
  } | null;
  section: string;
  subject: string;
  grade: string;
}

export interface TeacherFormData {
  name: string;
  email: string;
  phone: string;
  designation: 'TGT' | 'PGT' | 'JBT' | 'NTT';
  subjects: string[];
  assignedClasses: {
    class: string;
    section: string;
    subject: string;
    grade: string;
  }[];
  qualification?: {
    degree?: string;
    institution?: string;
    yearOfCompletion?: number;
  };
  experience?: {
    years?: number;
    previousSchools?: string[];
  };
  specialization?: string[];
  salary: number;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
}

class TeacherService {
  // Get students by class and section
  async getStudentsByClass(grade: string, section?: string): Promise<{ success: boolean; count: number; data: Student[] }> {
    try {
      const params = new URLSearchParams({ grade });
      if (section) params.append('section', section);

      const response = await api.get<{ success: boolean; count: number; data: Student[] }>(`/teachers/students?${params.toString()}`);
      return response;
    } catch (error: any) {
      console.error('Error fetching students by class:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch students');
    }
  }

  // Mark attendance
  async markAttendance(studentId: string, status: 'present' | 'absent' | 'late', date: string): Promise<{
    success: boolean;
    message: string;
    data: {
      studentId: string;
      status: string;
      date: string;
      markedAt: string;
    };
  }> {
    try {
      const response = await api.post<{
        success: boolean;
        message: string;
        data: {
          studentId: string;
          status: string;
          date: string;
          markedAt: string;
        };
      }>('/teachers/attendance', { studentId, status, date });
      return response;
    } catch (error: any) {
      console.error('Error marking attendance:', error);
      throw new Error(error.response?.data?.message || 'Failed to mark attendance');
    }
  }

  // Get today's attendance
  async getTodayAttendance(grade: string, section?: string): Promise<{
    success: boolean;
    date: string;
    count: number;
    data: TodayAttendanceRecord[];
  }> {
    try {
      const params = new URLSearchParams({ grade });
      if (section) params.append('section', section);

      const response = await api.get<{
        success: boolean;
        date: string;
        count: number;
        data: TodayAttendanceRecord[];
      }>(`/teachers/today-attendance?${params.toString()}`);
      return response;
    } catch (error: any) {
      console.error('Error fetching today attendance:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch today attendance');
    }
  }

  // ========== TEACHER MANAGEMENT FUNCTIONS ==========

  // Get all teachers
  async getAllTeachers(): Promise<{ success: boolean; count: number; data: Teacher[] }> {
    try {
      const response = await api.get<{ success: boolean; count: number; data: Teacher[] }>('/teachers/management');
      return response;
    } catch (error: any) {
      console.error('Error fetching teachers:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch teachers');
    }
  }

  // Create new teacher
  async createTeacher(teacherData: TeacherFormData): Promise<{ success: boolean; message: string; data: Teacher }> {
    try {
      const response = await api.post<{ success: boolean; message: string; data: Teacher }>('/teachers/management', teacherData);
      return response;
    } catch (error: any) {
      console.error('Error creating teacher:', error);
      throw new Error(error.response?.data?.message || 'Failed to create teacher');
    }
  }

  // Update teacher
  async updateTeacher(teacherId: string, teacherData: Partial<TeacherFormData>): Promise<{ success: boolean; message: string; data: Teacher }> {
    try {
      const response = await api.put<{ success: boolean; message: string; data: Teacher }>(`/teachers/management/${teacherId}`, teacherData);
      return response;
    } catch (error: any) {
      console.error('Error updating teacher:', error);
      throw new Error(error.response?.data?.message || 'Failed to update teacher');
    }
  }

  // Delete teacher
  async deleteTeacher(teacherId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete<{ success: boolean; message: string }>(`/teachers/management/${teacherId}`);
      return response;
    } catch (error: any) {
      console.error('Error deleting teacher:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete teacher');
    }
  }

  // Reset teacher password
  async resetTeacherPassword(teacherId: string, newPassword?: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post<{ success: boolean; message: string }>(`/teachers/management/${teacherId}/reset-password`, { newPassword });
      return response;
    } catch (error: any) {
      console.error('Error resetting teacher password:', error);
      throw new Error(error.response?.data?.message || 'Failed to reset teacher password');
    }
  }

  // Get teacher status
  async getTeacherStatus(teacherId: string): Promise<{
    success: boolean;
    data: {
      name: string;
      email: string;
      onlineStatus: {
        isOnline: boolean;
        lastSeen: string;
        lastActivity: string;
      };
    };
  }> {
    try {
      const response = await api.get<{
        success: boolean;
        data: {
          name: string;
          email: string;
          onlineStatus: {
            isOnline: boolean;
            lastSeen: string;
            lastActivity: string;
          };
        };
      }>(`/teachers/management/${teacherId}/status`);
      return response;
    } catch (error: any) {
      console.error('Error fetching teacher status:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch teacher status');
    }
  }

  // Update teacher status
  async updateTeacherStatus(teacherId: string, isOnline: boolean): Promise<{
    success: boolean;
    message: string;
    data: {
      name: string;
      email: string;
      onlineStatus: {
        isOnline: boolean;
        lastSeen: string;
        lastActivity: string;
      };
    };
  }> {
    try {
      const response = await api.put<{
        success: boolean;
        message: string;
        data: {
          name: string;
          email: string;
          onlineStatus: {
            isOnline: boolean;
            lastSeen: string;
            lastActivity: string;
          };
        };
      }>(`/teachers/management/${teacherId}/status`, { isOnline });
      return response;
    } catch (error: any) {
      console.error('Error updating teacher status:', error);
      throw new Error(error.response?.data?.message || 'Failed to update teacher status');
    }
  }
}

const teacherService = new TeacherService();
export default teacherService;