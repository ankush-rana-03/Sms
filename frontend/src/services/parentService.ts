import apiService from './api';

export interface ParentChild {
  _id: string;
  name: string;
  email: string;
  grade: string;
  section: string;
  rollNumber: string;
  currentSession: string;
  parentName: string;
  parentPhone: string;
  recentAttendance?: Array<{
    date: string;
    status: string;
  }>;
}

export interface ParentChildrenSummary {
  children: ParentChild[];
  summary: {
    totalChildren: number;
    childrenByGrade: Record<string, number>;
  };
}

export interface ParentHomework {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  class: {
    _id: string;
    name: string;
    section: string;
    session: string;
  };
  assignedBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export interface ParentTest {
  _id: string;
  subject: string;
  name: string;
  date: string;
  class: {
    _id: string;
    name: string;
    section: string;
    session: string;
  };
  createdAt: string;
}

export interface ParentResult {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
    grade: string;
    section: string;
    rollNumber: string;
  };
  test: {
    _id: string;
    subject: string;
    name: string;
    date: string;
  };
  marksObtained: number;
  totalMarks: number;
  grade: string;
  remarks: string;
  createdAt: string;
}

class ParentService {
  // Get parent's children summary
  async getChildrenSummary(): Promise<ParentChildrenSummary> {
    return apiService.get<ParentChildrenSummary>('/parent/children');
  }

  // Get homework for parent's children
  async getHomework(): Promise<ParentHomework[]> {
    const response = await apiService.get<{ success: boolean; data: ParentHomework[] }>('/parent/homework');
    return response.data;
  }

  // Get tests for parent's children
  async getTests(): Promise<ParentTest[]> {
    const response = await apiService.get<{ success: boolean; data: ParentTest[] }>('/parent/tests');
    return response.data;
  }

  // Get results for parent's children
  async getResults(): Promise<ParentResult[]> {
    const response = await apiService.get<{ success: boolean; data: ParentResult[] }>('/parent/results');
    return response.data;
  }

  // Get students (filtered for parents)
  async getStudents(params?: {
    page?: number;
    limit?: number;
    search?: string;
    grade?: string;
    section?: string;
    session?: string;
  }): Promise<{
    success: boolean;
    count: number;
    total: number;
    page: number;
    totalPages: number;
    data: ParentChild[];
  }> {
    return apiService.get('/students', { params });
  }
}

export const parentService = new ParentService();
export default parentService;
