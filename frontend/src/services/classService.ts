import { apiService as api } from './api';

export interface Class {
  _id: string;
  name: string;
  section: string;
  grade: string;
  academicYear: string;
  session: string;
  roomNumber?: string;
  capacity: number;
  currentStrength?: number;
  isActiveSession: boolean;
  classTeacher?: {
    _id: string;
    name: string;
    email: string;
  };
}

class ClassService {
  // Get all classes
  async getClasses(session?: string): Promise<{ success: boolean; data: Class[] }> {
    try {
      const query = new URLSearchParams();
      if (session) query.set('session', session);

      const response = await api.get<{ success: boolean; data: Class[] }>(`/classes?${query.toString()}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch classes');
    }
  }

  // Get available classes for registration
  async getAvailableClasses(): Promise<{ 
    success: boolean; 
    data: { 
      classes: Array<{ name: string; displayName: string; sections: string[] }>; 
      sections: string[]; 
      currentSession: string; 
    } 
  }> {
    try {
      const response = await api.get<{ 
        success: boolean; 
        data: { 
          classes: Array<{ name: string; displayName: string; sections: string[] }>; 
          sections: string[]; 
          currentSession: string; 
        } 
      }>('/classes/available-for-registration');
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch available classes');
    }
  }

  // Create new class
  async createClass(classData: {
    name: string;
    section: string;
    academicYear: string;
    roomNumber?: string;
    capacity?: number;
  }): Promise<{ success: boolean; data: Class; message: string }> {
    try {
      const response = await api.post<{ success: boolean; data: Class; message: string }>('/classes', classData);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create class');
    }
  }

  // Assign class teacher
  async assignClassTeacher(classId: string, teacherId: string): Promise<{ success: boolean; message: string; data: any }> {
    try {
      const response = await api.put<{ success: boolean; message: string; data: any }>(`/classes/${classId}/class-teacher`, { teacherId });
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to assign class teacher');
    }
  }

  // Delete class
  async deleteClass(classId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete<{ success: boolean; message: string }>(`/classes/${classId}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete class');
    }
  }
}

const classService = new ClassService();
export default classService;