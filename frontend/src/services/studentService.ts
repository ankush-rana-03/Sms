import { apiService as api } from './api';

export interface StudentFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  grade: string;
  section: string;
  rollNumber: string;
  gender: string;
  bloodGroup: string;
  parentName: string;
  parentPhone: string;
}

export interface Student {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  grade: string;
  section: string;
  rollNumber: string;
  gender: string;
  bloodGroup: string;
  parentName: string;
  parentPhone: string;
  attendance?: AttendanceRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'late';
  markedAt: string;
  markedBy: string;
}

export interface AttendanceMarkingData {
  studentId: string;
  attendanceDate: string;
  status: 'present' | 'absent' | 'late';
}

class StudentService {
  // Create a new student
  async createStudent(studentData: StudentFormData): Promise<{ success: boolean; data: Student; message: string }> {
    try {
      console.log('=== FRONTEND: Creating student ===');
      console.log('Student data:', studentData);
      console.log('Token:', localStorage.getItem('token'));
      
      const response = await api.post<{ success: boolean; data: Student; message: string }>('/students', studentData);
      
      console.log('=== FRONTEND: Student created successfully ===');
      console.log('Response:', response);
      
      return response;
    } catch (error: any) {
      console.error('=== FRONTEND: Error creating student ===');
      console.error('Error:', error);
      console.error('Response:', error.response);
      throw new Error(error.response?.data?.message || 'Failed to create student');
    }
  }

  // Get all students
  async getStudents(params?: { page?: number; limit?: number; search?: string; grade?: string; section?: string }): Promise<{ success: boolean; data: Student[]; count: number; total: number; page: number; totalPages: number }> {
    try {
      console.log('=== FRONTEND: Fetching students ===');
      console.log('Token:', localStorage.getItem('token'));
      
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.search) query.set('search', params.search);
      if (params?.grade) query.set('grade', params.grade);
      if (params?.section) query.set('section', params.section);

      const response = await api.get<{ success: boolean; data: Student[]; count: number; total: number; page: number; totalPages: number }>(`/students?${query.toString()}`);
      
      console.log('=== FRONTEND: Students fetched successfully ===');
      console.log('Response:', response);
      
      return response;
    } catch (error: any) {
      console.error('=== FRONTEND: Error fetching students ===');
      console.error('Error:', error);
      console.error('Response:', error.response);
      throw new Error(error.response?.data?.message || 'Failed to fetch students');
    }
  }

  // Mark attendance
  async markAttendance(attendanceData: AttendanceMarkingData): Promise<{
    success: boolean;
    message: string;
    data: {
      studentId: string;
      attendanceDate: string;
      status: string;
    };
  }> {
    try {
      const response = await api.post<{
        success: boolean;
        message: string;
        data: {
          studentId: string;
          attendanceDate: string;
          status: string;
        };
      }>('/students/attendance', attendanceData);
      return response;
    } catch (error: any) {
      console.error('Error marking attendance:', error);
      throw new Error(error.response?.data?.message || 'Failed to mark attendance');
    }
  }

  // Get attendance records for a student
  async getStudentAttendance(studentId: string, startDate?: string, endDate?: string): Promise<{
    success: boolean;
    data: {
      student: {
        id: string;
        name: string;
        email: string;
      };
      attendance: AttendanceRecord[];
    };
  }> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await api.get<{
        success: boolean;
        data: {
          student: {
            id: string;
            name: string;
            email: string;
          };
          attendance: AttendanceRecord[];
        };
      }>(`/students/${studentId}/attendance?${params.toString()}`);
      return response;
    } catch (error: any) {
      console.error('Error fetching attendance:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch attendance');
    }
  }

  async updateStudent(studentId: string, update: Partial<StudentFormData>): Promise<{ success: boolean; data: Student; message: string }> {
    try {
      const response = await api.put<{ success: boolean; data: Student; message: string }>(`/students/${studentId}`, update);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update student');
    }
  }

  async deleteStudent(studentId: string, reason?: string): Promise<{ success: boolean; message: string; data: Student }> {
    try {
      const response = await api.delete<{ success: boolean; message: string; data: Student }>(`/students/${studentId}`, {
        data: { reason }
      });
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete student');
    }
  }

  // Get deleted students
  async getDeletedStudents(params?: { search?: string; grade?: string; section?: string }): Promise<{ success: boolean; data: Student[] }> {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      if (params?.grade) query.set('grade', params.grade);
      if (params?.section) query.set('section', params.section);

      const response = await api.get<{ success: boolean; data: Student[] }>(`/students/deleted?${query.toString()}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch deleted students');
    }
  }

  // Restore deleted student
  async restoreStudent(studentId: string): Promise<{ success: boolean; message: string; data: Student }> {
    try {
      const response = await api.put<{ success: boolean; message: string; data: Student }>(`/students/${studentId}/restore`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to restore student');
    }
  }

  // Permanently delete student
  async permanentlyDeleteStudent(studentId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete<{ success: boolean; message: string }>(`/students/${studentId}/permanent`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to permanently delete student');
    }
  }

  async approveStudent(studentId: string): Promise<{ success: boolean; message: string; data: Student }> {
    try {
      const response = await api.put<{ success: boolean; message: string; data: Student }>(`/students/${studentId}/approve`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to approve student');
    }
  }
}

const studentService = new StudentService();
export default studentService;