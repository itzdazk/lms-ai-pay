import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<{ message?: string; error?: string }>) => {
    // Handle network errors
    if (!error.response) {
      toast.error('Lỗi kết nối mạng. Vui lòng kiểm tra lại kết nối.');
      return Promise.reject(error);
    }

    const status = error.response.status;
    const message = error.response.data?.message || error.response.data?.error || 'Đã xảy ra lỗi';

    // Handle specific error codes
    switch (status) {
      case 401:
        // Unauthorized - Clear token and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        break;
      case 403:
        toast.error('Bạn không có quyền truy cập.');
        break;
      case 404:
        toast.error('Không tìm thấy dữ liệu.');
        break;
      case 422:
        // Validation errors
        toast.error(message);
        break;
      case 500:
        toast.error('Lỗi server. Vui lòng thử lại sau.');
        break;
      default:
        toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;

















