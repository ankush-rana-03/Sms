import { apiService as api } from './api';

export interface ClassWithSections {
  name: string;
  displayName: string;
  sections: string[];
}

export interface AvailableClassesResponse {
  classes: ClassWithSections[];
  sections: string[];
  currentSession: string;
}

class ClassService {
  // Get available classes and sections for student registration
  async getAvailableClassesForRegistration(): Promise<{ success: boolean; data: AvailableClassesResponse }> {
    try {
      const response = await api.get<{ success: boolean; data: AvailableClassesResponse }>('/classes/available-for-registration');
      return response;
    } catch (error: any) {
      console.error('Error fetching available classes:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch available classes');
    }
  }

  // Get all classes (existing method)
  async getClasses(params?: { session?: string }): Promise<{ success: boolean; data: any[] }> {
    try {
      const query = new URLSearchParams();
      if (params?.session) query.set('session', params.session);

      const response = await api.get<{ success: boolean; data: any[] }>(`/classes?${query.toString()}`);
      return response;
    } catch (error: any) {
      console.error('Error fetching classes:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch classes');
    }
  }

  // Get students for a specific class
  async getClassStudents(classId: string): Promise<{ success: boolean; data: any[] }> {
    try {
      const response = await api.get<{ success: boolean; data: any[] }>(`/classes/${classId}/students`);
      return response;
    } catch (error: any) {
      console.error('Error fetching class students:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch class students');
    }
  }
}

const classService = new ClassService();
export default classService;