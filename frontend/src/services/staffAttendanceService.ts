import { apiService as api } from './api';

export interface StaffAttendance {
  _id: string;
  staffId: {
    _id: string;
    name: string;
    email: string;
    role: string;
    department?: string;
  };
  date: string;
  checkIn?: {
    time: string;
    location?: string;
    method: string;
  };
  checkOut?: {
    time: string;
    location?: string;
    method: string;
  };
  status: 'present' | 'absent' | 'late' | 'half-day' | 'leave' | 'holiday';
  leaveType?: 'casual' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'other';
  leaveReason?: string;
  workingHours: number;
  overtime: number;
  remarks?: string;
  markedBy: {
    _id: string;
    name: string;
  };
  isVerified: boolean;
  verifiedBy?: {
    _id: string;
    name: string;
  };
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffAttendanceStatistics {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  leaveDays: number;
  attendancePercentage: number;
  totalWorkingHours: number;
  totalOvertime: number;
}

export interface StaffAttendanceDashboard {
  date: string;
  totalStaff: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  leaveCount: number;
  notMarkedCount: number;
  attendancePercentage: number;
  attendance: StaffAttendance[];
}

class StaffAttendanceService {
  // Staff check-in
  async checkIn(location?: string, method: string = 'manual'): Promise<{ success: boolean; data: StaffAttendance; message: string }> {
    try {
      const response = await api.post<{ success: boolean; data: StaffAttendance; message: string }>('/staff-attendance/check-in', {
        location,
        method
      });
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to check in');
    }
  }

  // Staff check-out
  async checkOut(location?: string, method: string = 'manual'): Promise<{ success: boolean; data: StaffAttendance; message: string }> {
    try {
      const response = await api.post<{ success: boolean; data: StaffAttendance; message: string }>('/staff-attendance/check-out', {
        location,
        method
      });
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to check out');
    }
  }

  // Get own attendance report
  async getMyAttendance(params?: { startDate?: string; endDate?: string; month?: number; year?: number }): Promise<{ success: boolean; data: StaffAttendance[]; statistics: StaffAttendanceStatistics }> {
    try {
      const query = new URLSearchParams();
      if (params?.startDate) query.set('startDate', params.startDate);
      if (params?.endDate) query.set('endDate', params.endDate);
      if (params?.month) query.set('month', params.month.toString());
      if (params?.year) query.set('year', params.year.toString());

      const response = await api.get<{ success: boolean; data: StaffAttendance[]; statistics: StaffAttendanceStatistics }>(`/staff-attendance/my-attendance?${query.toString()}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch attendance');
    }
  }

  // Get staff attendance by date (Admin/Principal)
  async getAttendanceByDate(date: string, department?: string, session?: string): Promise<{ success: boolean; count: number; data: StaffAttendance[] }> {
    try {
      const query = new URLSearchParams();
      if (department) query.set('department', department);
      if (session) query.set('session', session);

      const response = await api.get<{ success: boolean; count: number; data: StaffAttendance[] }>(`/staff-attendance/date/${date}?${query.toString()}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch attendance');
    }
  }

  // Get staff attendance report (Admin/Principal)
  async getStaffAttendanceReport(staffId: string, params?: { startDate?: string; endDate?: string; month?: number; year?: number }): Promise<{ success: boolean; data: StaffAttendance[]; statistics: StaffAttendanceStatistics }> {
    try {
      const query = new URLSearchParams();
      if (params?.startDate) query.set('startDate', params.startDate);
      if (params?.endDate) query.set('endDate', params.endDate);
      if (params?.month) query.set('month', params.month.toString());
      if (params?.year) query.set('year', params.year.toString());

      const response = await api.get<{ success: boolean; data: StaffAttendance[]; statistics: StaffAttendanceStatistics }>(`/staff-attendance/staff/${staffId}?${query.toString()}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch attendance report');
    }
  }

  // Mark staff attendance (Admin/Principal)
  async markAttendance(data: {
    staffId: string;
    status: string;
    date?: string;
    checkInTime?: string;
    checkOutTime?: string;
    leaveType?: string;
    leaveReason?: string;
    remarks?: string;
  }): Promise<{ success: boolean; data: StaffAttendance; message: string }> {
    try {
      const response = await api.post<{ success: boolean; data: StaffAttendance; message: string }>('/staff-attendance/mark', data);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to mark attendance');
    }
  }

  // Update staff attendance (Admin/Principal)
  async updateAttendance(id: string, data: {
    status?: string;
    checkInTime?: string;
    checkOutTime?: string;
    leaveType?: string;
    leaveReason?: string;
    remarks?: string;
  }): Promise<{ success: boolean; data: StaffAttendance; message: string }> {
    try {
      const response = await api.put<{ success: boolean; data: StaffAttendance; message: string }>(`/staff-attendance/${id}`, data);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update attendance');
    }
  }

  // Get staff attendance dashboard (Admin/Principal)
  async getDashboard(date?: string, session?: string): Promise<{ success: boolean; data: StaffAttendanceDashboard }> {
    try {
      const query = new URLSearchParams();
      if (date) query.set('date', date);
      if (session) query.set('session', session);

      const response = await api.get<{ success: boolean; data: StaffAttendanceDashboard }>(`/staff-attendance/dashboard?${query.toString()}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch dashboard');
    }
  }
}

const staffAttendanceService = new StaffAttendanceService();
export default staffAttendanceService;