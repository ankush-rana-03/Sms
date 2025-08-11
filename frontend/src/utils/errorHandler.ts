
export interface AppError extends Error {
  code?: string;
  status?: number;
}

export const createError = (message: string, code?: string, status?: number): AppError => {
  const error = new Error(message) as AppError;
  error.code = code;
  error.status = status;
  return error;
};

export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.message) {
    return error.message;
  }
  
  switch (error.response?.status) {
    case 400:
      return 'Bad request. Please check your input.';
    case 401:
      return 'Unauthorized. Please log in again.';
    case 403:
      return 'Access forbidden. You don\'t have permission.';
    case 404:
      return 'Resource not found.';
    case 500:
      return 'Server error. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};

export const logError = (error: Error, context?: string) => {
  console.error(`Error${context ? ` in ${context}` : ''}:`, error);
  
  // In production, you might want to send errors to a logging service
  if (process.env.NODE_ENV === 'production') {
    // Send to logging service (e.g., Sentry, LogRocket, etc.)
  }
};
