import { apiService } from './api';

export interface Homework {
  _id?: string;
  title: string;
  description: string;
  subject: string;
  class: string | { _id: string; name: string; section: string };
  section?: string;
  assignedBy: string | { _id: string; name: string; email: string };
  assignedDate?: Date;
  dueDate: Date;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    publicId: string;
  }>;
  instructions?: string;
  totalMarks?: number;
  submissions?: Array<{
    student: string;
    submittedAt: Date;
    attachments?: Array<{
      fileName: string;
      fileUrl: string;
      fileType: string;
      publicId: string;
    }>;
    comments?: string;
    marks?: number;
    feedback?: string;
    isLate?: boolean;
  }>;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateHomeworkRequest {
  title: string;
  description: string;
  subject: string;
  class: string;
  section?: string;
  dueDate: string;
  instructions?: string;
  totalMarks?: number;
}

export interface UpdateHomeworkRequest extends Partial<CreateHomeworkRequest> {
  isActive?: boolean;
}

class HomeworkService {
  async getAllHomework(): Promise<{ success: boolean; data: Homework[] }> {
    return apiService.get('/homework');
  }

  async getHomeworkById(id: string): Promise<{ success: boolean; data: Homework }> {
    return apiService.get(`/homework/${id}`);
  }

  async createHomework(homework: CreateHomeworkRequest): Promise<{ success: boolean; data: Homework }> {
    return apiService.post('/homework', homework);
  }

  async updateHomework(id: string, homework: UpdateHomeworkRequest): Promise<{ success: boolean; data: Homework }> {
    return apiService.put(`/homework/${id}`, homework);
  }

  async deleteHomework(id: string): Promise<{ success: boolean; message: string }> {
    return apiService.delete(`/homework/${id}`);
  }

  async submitHomework(homeworkId: string, submission: {
    comments?: string;
    attachments?: Array<{
      fileName: string;
      fileUrl: string;
      fileType: string;
      publicId: string;
    }>;
  }): Promise<{ success: boolean; data: any }> {
    return apiService.post(`/homework/${homeworkId}/submit`, submission);
  }

  async gradeHomework(homeworkId: string, studentId: string, grade: {
    marks: number;
    feedback?: string;
  }): Promise<{ success: boolean; data: any }> {
    return apiService.post(`/homework/${homeworkId}/grade`, {
      studentId,
      ...grade
    });
  }
}

export const homeworkService = new HomeworkService();
export default homeworkService;