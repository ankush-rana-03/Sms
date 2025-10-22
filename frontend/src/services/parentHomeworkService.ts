import { apiService } from './api';

export interface ParentHomework {
  _id: string;
  title: string;
  description: string;
  subject: string;
  class: {
    _id: string;
    name: string;
    section: string;
  };
  section: string;
  assignedBy: {
    _id: string;
    name: string;
    email: string;
  };
  assignedDate: string;
  dueDate: string;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    publicId: string;
  }>;
  instructions?: string;
  totalMarks?: number;
  childrenCompletion: Array<{
    studentId: string;
    studentName: string;
    grade: string;
    section: string;
    completionStatus: 'not_started' | 'half_complete' | 'fully_complete';
    completedAt: string | null;
    parentComments: string | null;
    lastUpdated: string | null;
  }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HomeworkStatistics {
  totalHomework: number;
  children: Array<{
    childId: string;
    childName: string;
    grade: string;
    section: string;
    totalHomework: number;
    notStarted: number;
    halfComplete: number;
    fullyComplete: number;
    completionRate: string;
  }>;
}

export interface UpdateCompletionRequest {
  completionStatus: 'not_started' | 'half_complete' | 'fully_complete';
  parentComments?: string;
}

class ParentHomeworkService {
  async getParentHomework(): Promise<{ success: boolean; data: ParentHomework[] }> {
    return apiService.get('/parents/homework');
  }

  async getChildHomeworkDetails(homeworkId: string, childId: string): Promise<{ success: boolean; data: ParentHomework }> {
    return apiService.get(`/parents/homework/${homeworkId}/child/${childId}`);
  }

  async updateHomeworkCompletion(
    homeworkId: string, 
    childId: string, 
    completionData: UpdateCompletionRequest
  ): Promise<{ success: boolean; message: string; data: any }> {
    return apiService.put(`/parents/homework/${homeworkId}/child/${childId}/complete`, completionData);
  }

  async getHomeworkStatistics(): Promise<{ success: boolean; data: HomeworkStatistics }> {
    return apiService.get('/parents/homework/statistics');
  }
}

export const parentHomeworkService = new ParentHomeworkService();
export default parentHomeworkService;