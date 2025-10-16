import { apiService as api } from './api';

export interface Homework {
  _id: string;
  title: string;
  description: string;
  subject: string;
  class: {
    _id: string;
    name: string;
    grade: string;
    section: string;
  };
  assignedBy: {
    _id: string;
    name: string;
    email: string;
  };
  assignedDate: string;
  dueDate: string;
  instructions?: string;
  totalMarks: number;
  attachments: {
    fileName: string;
    fileUrl: string;
    fileType: string;
    publicId: string;
  }[];
  submissions: {
    _id: string;
    student: {
      _id: string;
      name: string;
      email: string;
      rollNumber: string;
    };
    submittedAt: string;
    comments?: string;
    attachments: {
      fileName: string;
      fileUrl: string;
      fileType: string;
      publicId: string;
    }[];
    marks?: number;
    feedback?: string;
    isLate: boolean;
  }[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHomeworkData {
  title: string;
  description: string;
  subject: string;
  classId: string;
  dueDate: string;
  instructions?: string;
  totalMarks?: number;
}

class HomeworkService {
  async getAllHomework(): Promise<{ success: boolean; data: Homework[] }> {
    try {
      const response = await api.get<{ success: boolean; data: Homework[] }>('/homework');
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch homework');
    }
  }

  async createHomework(data: CreateHomeworkData): Promise<{ success: boolean; data: Homework; message: string }> {
    try {
      const response = await api.post<{ success: boolean; data: Homework; message: string }>('/homework', data);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create homework');
    }
  }

  async getParentHomework(): Promise<{ success: boolean; data: Homework[] }> {
    try {
      const response = await api.get<{ success: boolean; data: Homework[] }>('/homework/parent');
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch parent homework');
    }
  }
}

const homeworkService = new HomeworkService();
export default homeworkService;
