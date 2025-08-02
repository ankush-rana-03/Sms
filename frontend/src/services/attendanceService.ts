import { apiService as api } from './api';

export interface AttendanceData {
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  remarks?: string;
}

export interface BulkAttendanceRequest {
  classId: string;
  date: string;
  attendanceData: AttendanceData[];
}

export interface AttendanceRecord {
  id: string;
  student: {
    id: string;
    name: string;
    studentId: string;
    parentPhone: string;
  };
  class: {
    id: string;
    name: string;
    section: string;
  };
  date: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  markedBy: {
    id: string;
    name: string;
  };
  markedAt: string;
  remarks?: string;
  isVerified: boolean;
  verifiedBy?: {
    id: string;
    name: string;
  };
  verifiedAt?: string;
}

export interface AttendanceStatistics {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendancePercentage: number;
}

export interface StudentAttendanceResponse {
  attendance: AttendanceRecord[];
  statistics: AttendanceStatistics;
}

class AttendanceService {
  // Mark individual attendance
  async markAttendance(data: {
    studentId: string;
    status: 'present' | 'absent' | 'late' | 'half-day';
    date?: string;
    remarks?: string;
  }) {
    return await api.post('/attendance/mark', data);
  }

  // Bulk mark attendance
  async bulkMarkAttendance(request: BulkAttendanceRequest) {
    return await api.post('/attendance/bulk', request);
  }

  // Get attendance by date
  async getAttendanceByDate(date: string, classId?: string) {
    const params = classId ? { classId } : {};
    return await api.get(`/attendance/date/${date}`, { params });
  }

  // Get student attendance
  async getStudentAttendance(studentId: string, startDate?: string, endDate?: string) {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    return await api.get(`/attendance/student/${studentId}`, { params });
  }

  // Update attendance
  async updateAttendance(attendanceId: string, data: {
    status?: 'present' | 'absent' | 'late' | 'half-day';
    remarks?: string;
  }) {
    return await api.put(`/attendance/${attendanceId}`, data);
  }

  // Get today's attendance for a class (teacher specific)
  async getTodayAttendance(grade?: string, section?: string) {
    const params: any = {};
    if (grade) params.grade = grade;
    if (section) params.section = section;
    
    return await api.get('/teachers/attendance/today', { params });
  }
}

export default new AttendanceService();