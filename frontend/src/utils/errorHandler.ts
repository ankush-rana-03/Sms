
interface ApiError {
  message: string;
  status: number;
  data: any;
}

export const handleApiError = (error: ApiError): void => {
  console.error('API Error:', error);
  
  // You can implement toast notifications here
  // For now, we'll use console.error
  
  switch (error.status) {
    case 400:
      console.error('Bad Request:', error.message);
      break;
    case 401:
      console.error('Unauthorized:', error.message);
      break;
    case 403:
      console.error('Forbidden:', error.message);
      break;
    case 404:
      console.error('Not Found:', error.message);
      break;
    case 500:
      console.error('Server Error:', error.message);
      break;
    default:
      console.error('Unknown Error:', error.message);
  }
};

export const formatErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

export const isNetworkError = (error: any): boolean => {
  return !error.response && error.code === 'NETWORK_ERROR';
};

export const createErrorBoundaryHandler = (componentName: string) => {
  return (error: Error, errorInfo: any) => {
    console.error(`Error in ${componentName}:`, error, errorInfo);
    
    // In production, you might want to send this to a logging service
    if (process.env.NODE_ENV === 'production') {
      // Send to logging service
      console.error('Production error logged');
    }
  };
};
