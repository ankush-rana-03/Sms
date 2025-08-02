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
  facialData: {
    hasFaceData: boolean;
    isFaceRegistered: boolean;
    faceId?: string;
    hasFaceImage: boolean;
  };
  attendance: AttendanceRecord[];
}

export interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'late';
  markedAt: Date;
  markedBy: string;
  verifiedWithFace: boolean;
}

export interface AttendanceMarkingData {
  studentId: string;
  status: 'present' | 'absent' | 'late';
  date: string;
  verifiedWithFace?: boolean;
}

export interface TodayAttendanceRecord {
  studentId: string;
  name: string;
  email: string;
  grade: string;
  section: string;
  rollNumber: string;
  todayStatus: 'present' | 'absent' | 'late' | 'not_marked';
  markedAt?: Date;
  verifiedWithFace: boolean;
}

class TeacherService {
  // Get students by class and section
  async getStudentsByClass(grade: string, section?: string): Promise<{ success: boolean; data: Student[]; count: number }> {
    try {
      console.log('=== FRONTEND: Getting students by class ===');
      console.log('Grade:', grade, 'Section:', section);
      
      const params = new URLSearchParams({ grade });
      if (section) {
        params.append('section', section);
      }
      
      const response = await api.get<{ success: boolean; data: Student[]; count: number }>(`/teachers/students?${params}`);
      console.log('=== FRONTEND: Students fetched successfully ===');
      console.log('Count:', response.count);
      return response;
    } catch (error: any) {
      console.error('=== FRONTEND: Error fetching students by class ===');
      console.error('Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch students by class');
    }
  }

  // Mark attendance for a student
  async markAttendance(data: AttendanceMarkingData): Promise<{ success: boolean; message: string; data: any }> {
    try {
      console.log('=== FRONTEND: Marking attendance ===');
      console.log('Data:', data);
      
      const response = await api.post<{ success: boolean; message: string; data: any }>('/teachers/attendance', data);
      console.log('=== FRONTEND: Attendance marked successfully ===');
      return response;
    } catch (error: any) {
      console.error('=== FRONTEND: Error marking attendance ===');
      console.error('Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to mark attendance');
    }
  }

  // Get attendance for a specific student
  async getStudentAttendance(studentId: string, startDate?: string, endDate?: string): Promise<{ success: boolean; data: { student: any; attendance: AttendanceRecord[] }; count: number }> {
    try {
      console.log('=== FRONTEND: Getting student attendance ===');
      console.log('Student ID:', studentId);
      
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await api.get<{ success: boolean; data: { student: any; attendance: AttendanceRecord[] }; count: number }>(`/teachers/attendance/student/${studentId}?${params}`);
      console.log('=== FRONTEND: Student attendance fetched successfully ===');
      return response;
    } catch (error: any) {
      console.error('=== FRONTEND: Error fetching student attendance ===');
      console.error('Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch student attendance');
    }
  }

  // Get today's attendance for a class
  async getTodayAttendance(grade: string, section?: string): Promise<{ success: boolean; data: TodayAttendanceRecord[]; count: number; date: string }> {
    try {
      console.log('=== FRONTEND: Getting today attendance ===');
      console.log('Grade:', grade, 'Section:', section);
      
      const params = new URLSearchParams({ grade });
      if (section) {
        params.append('section', section);
      }
      
      const response = await api.get<{ success: boolean; data: TodayAttendanceRecord[]; count: number; date: string }>(`/teachers/attendance/today?${params}`);
      console.log('=== FRONTEND: Today attendance fetched successfully ===');
      console.log('Date:', response.date, 'Count:', response.count);
      return response;
    } catch (error: any) {
      console.error('=== FRONTEND: Error fetching today attendance ===');
      console.error('Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch today attendance');
    }
  }
}

const teacherService = new TeacherService();
export default teacherService;