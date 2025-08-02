import api from './api';

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
    const response = await api.post('/attendance/mark', data);
    return response.data;
  }

  // Bulk mark attendance
  async bulkMarkAttendance(request: BulkAttendanceRequest) {
    const response = await api.post('/attendance/bulk', request);
    return response.data;
  }

  // Get attendance by date
  async getAttendanceByDate(date: string, classId?: string) {
    const params = classId ? { classId } : {};
    const response = await api.get(`/attendance/date/${date}`, { params });
    return response.data;
  }

  // Get student attendance
  async getStudentAttendance(studentId: string, startDate?: string, endDate?: string) {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await api.get(`/attendance/student/${studentId}`, { params });
    return response.data;
  }

  // Update attendance
  async updateAttendance(attendanceId: string, data: {
    status?: 'present' | 'absent' | 'late' | 'half-day';
    remarks?: string;
  }) {
    const response = await api.put(`/attendance/${attendanceId}`, data);
    return response.data;
  }

  // Get today's attendance for a class (teacher specific)
  async getTodayAttendance(grade?: string, section?: string) {
    const params: any = {};
    if (grade) params.grade = grade;
    if (section) params.section = section;
    
    const response = await api.get('/teachers/attendance/today', { params });
    return response.data;
  }
}

export default new AttendanceService();