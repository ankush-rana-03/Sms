import { apiService as api } from './api';

export interface Student {
  _id: string;
  name: string;
  rollNumber: string;
  parentPhone: string;
  grade: string;
  section: string;
  currentSession: string;
}

export interface AttendanceRecord {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    rollNumber: string;
    parentPhone: string;
  };
  classId: {
    _id: string;
    name: string;
    section: string;
  };
  date: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  markedBy: {
    _id: string;
    name: string;
  };
  remarks?: string;
  isVerified: boolean;
  verifiedBy?: {
    _id: string;
    name: string;
  };
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceStatistics {
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  halfDayCount: number;
  attendancePercentage: number;
}

export interface BulkAttendanceData {
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  date: string;
  remarks?: string;
}

class AttendanceService {
  // Mark individual attendance
  async markAttendance(data: {
    studentId: string;
    status: 'present' | 'absent' | 'late' | 'half-day';
    date: string;
    remarks?: string;
  }): Promise<{ success: boolean; data: AttendanceRecord; message: string }> {
    try {
      const response = await api.post<{ success: boolean; data: AttendanceRecord; message: string }>('/attendance/mark', data);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to mark attendance');
    }
  }

  // Mark bulk attendance
  async markBulkAttendance(data: BulkAttendanceData[]): Promise<{ success: boolean; message: string; data: AttendanceRecord[] }> {
    try {
      const response = await api.post<{ success: boolean; message: string; data: AttendanceRecord[] }>('/attendance/bulk', data);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to mark bulk attendance');
    }
  }

  // Get attendance by date
  async getAttendanceByDate(date: string, classId?: string): Promise<{ success: boolean; count: number; data: AttendanceRecord[] }> {
    try {
      const query = new URLSearchParams();
      if (classId) query.set('classId', classId);

      const response = await api.get<{ success: boolean; count: number; data: AttendanceRecord[] }>(`/attendance/date/${date}?${query.toString()}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch attendance');
    }
  }

  // Get student attendance report
  async getStudentAttendance(studentId: string, params?: { startDate?: string; endDate?: string; month?: number; year?: number }): Promise<{ success: boolean; data: AttendanceRecord[]; statistics: AttendanceStatistics }> {
    try {
      const query = new URLSearchParams();
      if (params?.startDate) query.set('startDate', params.startDate);
      if (params?.endDate) query.set('endDate', params.endDate);
      if (params?.month) query.set('month', params.month.toString());
      if (params?.year) query.set('year', params.year.toString());

      const response = await api.get<{ success: boolean; data: AttendanceRecord[]; statistics: AttendanceStatistics }>(`/attendance/student/${studentId}?${query.toString()}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch student attendance');
    }
  }

  // Update attendance
  async updateAttendance(id: string, data: {
    status?: 'present' | 'absent' | 'late' | 'half-day';
    remarks?: string;
  }): Promise<{ success: boolean; data: AttendanceRecord; message: string }> {
    try {
      const response = await api.put<{ success: boolean; data: AttendanceRecord; message: string }>(`/attendance/${id}`, data);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update attendance');
    }
  }

  // Get class attendance statistics
  async getClassAttendanceStatistics(classId: string, date: string): Promise<{ success: boolean; data: AttendanceStatistics }> {
    try {
      const response = await api.get<{ success: boolean; data: AttendanceStatistics }>(`/attendance/class/${classId}/statistics?date=${date}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch class statistics');
    }
  }

  // Get attendance dashboard
  async getAttendanceDashboard(params?: { date?: string; classId?: string }): Promise<{ success: boolean; data: any }> {
    try {
      const query = new URLSearchParams();
      if (params?.date) query.set('date', params.date);
      if (params?.classId) query.set('classId', params.classId);

      const response = await api.get<{ success: boolean; data: any }>(`/attendance/dashboard?${query.toString()}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch attendance dashboard');
    }
  }

  // Export attendance report
  async exportAttendanceReport(params: {
    startDate: string;
    endDate: string;
    classId?: string;
    format: 'pdf' | 'excel';
  }): Promise<{ success: boolean; data: { url: string } }> {
    try {
      const query = new URLSearchParams();
      query.set('startDate', params.startDate);
      query.set('endDate', params.endDate);
      query.set('format', params.format);
      if (params.classId) query.set('classId', params.classId);

      const response = await api.get<{ success: boolean; data: { url: string } }>(`/attendance/export?${query.toString()}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to export attendance report');
    }
  }

  // Send attendance notifications
  async sendAttendanceNotifications(data: {
    date: string;
    classId?: string;
    type: 'absent' | 'late' | 'all';
  }): Promise<{ success: boolean; message: string; sentCount: number }> {
    try {
      const response = await api.post<{ success: boolean; message: string; sentCount: number }>('/attendance/notifications', data);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to send notifications');
    }
  }

  // Get attendance trends
  async getAttendanceTrends(params: {
    classId?: string;
    period: 'week' | 'month' | 'quarter' | 'year';
    startDate: string;
    endDate: string;
  }): Promise<{ success: boolean; data: any }> {
    try {
      const query = new URLSearchParams();
      query.set('period', params.period);
      query.set('startDate', params.startDate);
      query.set('endDate', params.endDate);
      if (params.classId) query.set('classId', params.classId);

      const response = await api.get<{ success: boolean; data: any }>(`/attendance/trends?${query.toString()}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch attendance trends');
    }
  }

  // Verify attendance (Admin/Principal only)
  async verifyAttendance(id: string): Promise<{ success: boolean; data: AttendanceRecord; message: string }> {
    try {
      const response = await api.post<{ success: boolean; data: AttendanceRecord; message: string }>(`/attendance/${id}/verify`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to verify attendance');
    }
  }

  // Get attendance calendar
  async getAttendanceCalendar(params: {
    month: number;
    year: number;
    classId?: string;
    studentId?: string;
  }): Promise<{ success: boolean; data: any }> {
    try {
      const query = new URLSearchParams();
      query.set('month', params.month.toString());
      query.set('year', params.year.toString());
      if (params.classId) query.set('classId', params.classId);
      if (params.studentId) query.set('studentId', params.studentId);

      const response = await api.get<{ success: boolean; data: any }>(`/attendance/calendar?${query.toString()}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch attendance calendar');
    }
  }
}

const attendanceService = new AttendanceService();
export default attendanceService;