import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies for authentication
});

// Request interceptor - Cookies are automatically sent with withCredentials: true
// No need to manually add token to headers, backend will read from cookies
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Don't set Content-Type for FormData - browser will set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    // Cookies are automatically included with withCredentials: true
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
    // Extract message safely - handle both object and string
    let message = 'Đã xảy ra lỗi';
    if (error.response.data) {
      if (typeof error.response.data.message === 'string') {
        message = error.response.data.message;
      } else if (error.response.data.error && typeof error.response.data.error.message === 'string') {
        message = error.response.data.error.message;
      } else if (typeof error.response.data.error === 'string') {
        message = error.response.data.error;
      }
    }

    // Handle specific error codes
    switch (status) {
      case 401:
        // Unauthorized - Clear user and redirect to login
        // Cookies will be cleared by backend or browser
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
        // Validation errors - message might be an array or object
        if (typeof message === 'string') {
          toast.error(message);
        } else {
          toast.error('Vui lòng kiểm tra lại thông tin đã nhập');
        }
        break;
      case 500:
        toast.error('Lỗi server. Vui lòng thử lại sau.');
        break;
      default:
        // Ensure message is a string
        if (typeof message === 'string') {
          toast.error(message);
        } else {
          toast.error('Đã xảy ra lỗi');
        }
    }

    return Promise.reject(error);
  }
);

export default apiClient;