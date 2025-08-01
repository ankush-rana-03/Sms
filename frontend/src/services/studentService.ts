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
  facialData: {
    faceId: string;
    faceDescriptor: number[];
    faceImage: string;
  };
}

export interface Student {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  grade: string;
  parentName: string;
  parentPhone: string;
  facialData: {
    faceId: string;
    faceDescriptor: number[];
    faceImage: string;
    isFaceRegistered: boolean;
  };
  attendance?: AttendanceRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'late';
  markedAt: string;
  markedBy: string;
  verifiedWithFace: boolean;
}

export interface AttendanceMarkingData {
  studentId: string;
  capturedFaceDescriptor: number[];
  attendanceDate: string;
  status: 'present' | 'absent' | 'late';
}

class StudentService {
  // Create a new student with facial data
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
  async getStudents(): Promise<{ success: boolean; data: Student[]; count: number }> {
    try {
      console.log('=== FRONTEND: Fetching students ===');
      console.log('Token:', localStorage.getItem('token'));
      
      const response = await api.get<{ success: boolean; data: Student[]; count: number }>('/students');
      
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

  // Mark attendance with face verification
  async markAttendanceWithFace(attendanceData: AttendanceMarkingData): Promise<{
    success: boolean;
    message: string;
    data: {
      studentId: string;
      attendanceDate: string;
      status: string;
      similarity: number;
      verifiedWithFace: boolean;
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
          similarity: number;
          verifiedWithFace: boolean;
        };
      }>('/students/attendance/face', attendanceData);
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
}

export default new StudentService();