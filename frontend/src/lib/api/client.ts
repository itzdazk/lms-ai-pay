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
    let errorCode: string | undefined;
    if (error.response.data) {
      if (typeof error.response.data.message === 'string') {
        message = error.response.data.message;
      } else if (error.response.data.error) {
        if (typeof error.response.data.error.message === 'string') {
          message = error.response.data.error.message;
        } else if (typeof error.response.data.error === 'string') {
          message = error.response.data.error;
        }
        // Get error code if available
        if (error.response.data.error?.code) {
          errorCode = error.response.data.error.code;
        }
      }
    }

    // Translate common error messages to Vietnamese
    const lowerMessage = message.toLowerCase();
    const requestPath = error.config?.url || '';
    const requestMethod = error.config?.method?.toUpperCase() || '';
    
    // Check for Prisma error codes (P2003 = Foreign key constraint)
    if (errorCode === 'NOT_FOUND' || errorCode === 'P2003') {
      // This is likely a foreign key constraint violation
      if (requestPath.includes('/users/') && requestMethod === 'DELETE') {
        message = 'Không thể xóa người dùng này vì có dữ liệu liên quan (khóa học đã tạo, đăng ký khóa học, hoặc đơn hàng). Vui lòng xóa hoặc xử lý các dữ liệu liên quan trước.';
      }
    }
    
    // Check for constraint violations in message
    if (lowerMessage.includes('foreign key constraint') || 
        lowerMessage.includes('constraint') ||
        lowerMessage.includes('related record not found') ||
        lowerMessage.includes('database operation failed')) {
      // Check what type of constraint violation based on request path
      if (requestPath.includes('/users/') && requestMethod === 'DELETE') {
        // This is a user deletion - check error details
        if (lowerMessage.includes('courses') || lowerMessage.includes('instructor') || lowerMessage.includes('course')) {
          message = 'Không thể xóa người dùng này vì họ đã tạo khóa học. Vui lòng xóa hoặc chuyển quyền sở hữu các khóa học trước.';
        } else if (lowerMessage.includes('enrollments') || lowerMessage.includes('enrollment')) {
          message = 'Không thể xóa người dùng này vì họ đã đăng ký khóa học. Vui lòng hủy đăng ký trước.';
        } else if (lowerMessage.includes('orders') || lowerMessage.includes('order')) {
          message = 'Không thể xóa người dùng này vì họ có đơn hàng. Vui lòng xử lý các đơn hàng trước.';
        } else if (message === 'Đã xảy ra lỗi' || lowerMessage.includes('related record not found')) {
          message = 'Không thể xóa người dùng này vì có dữ liệu liên quan (khóa học đã tạo, đăng ký khóa học, hoặc đơn hàng). Vui lòng xóa hoặc xử lý các dữ liệu liên quan trước.';
        }
      }
    } else if (lowerMessage.includes('cannot delete admin')) {
      message = 'Không thể xóa tài khoản quản trị viên.';
    } else if (lowerMessage.includes('user not found')) {
      message = 'Không tìm thấy người dùng.';
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
        // Only show default message if we haven't translated it already
        if (message === 'Đã xảy ra lỗi' || message.toLowerCase().includes('not found') && !lowerMessage.includes('user not found')) {
          toast.error('Không tìm thấy dữ liệu.');
        } else {
          toast.error(message);
        }
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