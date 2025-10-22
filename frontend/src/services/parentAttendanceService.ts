import { apiService } from './api';

export interface StudentAttendance {
  _id: string;
  student: {
    _id: string;
    name: string;
    rollNumber: string;
    grade: string;
    section: string;
  };
  date: string;
  status: 'present' | 'absent' | 'late';
  remarks?: string;
  markedBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendancePercentage: number;
}

export interface MonthlyAttendance {
  month: string;
  year: number;
  attendance: StudentAttendance[];
  summary: AttendanceSummary;
}

class ParentAttendanceService {
  // Get attendance for a specific student
  async getStudentAttendance(studentId: string, startDate?: string, endDate?: string): Promise<{
    success: boolean;
    data: StudentAttendance[];
  }> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    return apiService.get(`/parents/attendance/${studentId}?${params.toString()}`);
  }

  // Get attendance summary for a student
  async getAttendanceSummary(studentId: string, startDate?: string, endDate?: string): Promise<{
    success: boolean;
    data: AttendanceSummary;
  }> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    return apiService.get(`/parents/attendance/${studentId}/summary?${params.toString()}`);
  }

  // Get monthly attendance for a student
  async getMonthlyAttendance(studentId: string, month: number, year: number): Promise<{
    success: boolean;
    data: MonthlyAttendance;
  }> {
    return apiService.get(`/parents/attendance/${studentId}/monthly?month=${month}&year=${year}`);
  }

  // Get current month attendance for all children
  async getCurrentMonthAttendance(): Promise<{
    success: boolean;
    data: {
      children: Array<{
        student: {
          _id: string;
          name: string;
          rollNumber: string;
          grade: string;
          section: string;
        };
        attendance: StudentAttendance[];
        summary: AttendanceSummary;
      }>;
    };
  }> {
    return apiService.get('/parents/attendance/current-month');
  }
}

export const parentAttendanceService = new ParentAttendanceService();