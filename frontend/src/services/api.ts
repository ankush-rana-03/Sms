import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://sms-38ap.onrender.com/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        // Check for parent token first, then regular token
        const parentToken = localStorage.getItem('parentToken');
        const token = localStorage.getItem('token');
        
        if (parentToken) {
          config.headers.Authorization = `Bearer ${parentToken}`;
        } else if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.log('API Error:', error.response?.status, error.response?.data);
        
        if (error.response?.status === 401) {
          // Only logout if it's a genuine authentication error
          const errorMessage = error.response?.data?.message || '';
          if (errorMessage.includes('Not authorized') || 
              errorMessage.includes('token') ||
              errorMessage.includes('expired') ||
              errorMessage.includes('invalid')) {
            console.log('Authentication error detected, logging out...');
            // Check if it's a parent request and redirect accordingly
            const parentToken = localStorage.getItem('parentToken');
            if (parentToken) {
              localStorage.removeItem('parentToken');
              localStorage.removeItem('parentData');
              window.location.href = '/parent-login';
            } else {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }
          } else {
            console.log('401 error but not authentication related, not logging out');
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    console.log('API Service - Making POST request to:', url);
    console.log('API Service - Base URL:', this.api.defaults.baseURL);
    console.log('API Service - Data:', data);
    
    const response = await this.api.post<T>(url, data, config);
    console.log('API Service - Response:', response.data);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const requestConfig = { ...config, data };
    const response = await this.api.delete<T>(url, requestConfig);
    return response.data;
  }

  async upload<T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.post<T>(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
