
import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { handleApiError } from '../utils/errorHandler';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://0.0.0.0:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token and request logging
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error: AxiosError) => {
    // Handle network errors
    if (!error.response) {
      handleApiError({
        message: 'Network error. Please check your connection.',
        status: 0,
        data: null
      });
      return Promise.reject(error);
    }

    const { status, data } = error.response;
    
    // Handle authentication errors
    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    // Handle other errors
    handleApiError({
      message: (data as any)?.message || 'An error occurred',
      status,
      data
    });
    
    return Promise.reject(error);
  }
);

export default api;

// Utility functions for common API patterns
export const createApiCall = <T>(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  data?: any,
  config?: any
) => {
  return api[method]<T>(url, data, config);
};

export const uploadFile = (url: string, file: File, onProgress?: (progress: number) => void) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    },
  });
};
