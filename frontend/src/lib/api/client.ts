import axios, {
    AxiosError,
    AxiosInstance,
    InternalAxiosRequestConfig,
} from 'axios'
import { toast } from 'sonner'

const API_BASE_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

// Create axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Enable cookies for authentication
})

// Request interceptor - Cookies are automatically sent with withCredentials: true
// No need to manually add token to headers, backend will read from cookies
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Don't set Content-Type for FormData - browser will set it with boundary
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type']
        }
        // Cookies are automatically included with withCredentials: true
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
    (response) => {
        return response
    },
    (
        error: AxiosError<{
            message?: string
            error?: string | { message?: string }
        }>
    ) => {
        // Handle network errors
        if (!error.response) {
            toast.error('Lỗi kết nối mạng. Vui lòng kiểm tra lại kết nối.')
            return Promise.reject(error)
        }

        const status = error.response.status
        const requestUrl = error.config?.url || ''

        // Extract message safely - handle both object and string
        let message = 'Đã xảy ra lỗi'
        if (error.response.data) {
            if (typeof error.response.data.message === 'string') {
                message = error.response.data.message
            } else if (error.response.data.error) {
                if (typeof error.response.data.error === 'string') {
                    message = error.response.data.error
                } else if (
                    typeof error.response.data.error === 'object' &&
                    error.response.data.error.message
                ) {
                    message = error.response.data.error.message
                }
            }
        }

        // Handle specific error codes
        switch (status) {
            case 401:
                // Check if this is a login/register request - don't show session expired message
                const isAuthRequest =
                    requestUrl.includes('/auth/login') ||
                    requestUrl.includes('/auth/register')

                if (isAuthRequest) {
                    // For login/register, show the actual error message from backend
                    // toast.error(message)
                } else {
                    // For other requests, it's an expired session
                    localStorage.removeItem('user')
                    toast.error(
                        'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
                    )
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login'
                    }
                }
                break
            case 403:
                toast.error('Bạn không có quyền truy cập.')
                break
            case 404:
                toast.error('Không tìm thấy dữ liệu.')
                break
            case 422:
                // Validation errors - message might be an array or object
                if (typeof message === 'string') {
                    toast.error(message)
                } else {
                    toast.error('Vui lòng kiểm tra lại thông tin đã nhập')
                }
                break
            case 500:
                toast.error('Lỗi server. Vui lòng thử lại sau.')
                break
            default:
                // Ensure message is a string
                if (typeof message === 'string') {
                    toast.error(message)
                } else {
                    toast.error('Đã xảy ra lỗi')
                }
        }

        return Promise.reject(error)
    }
)

export default apiClient

// Alternative LoginPage.tsx handleSubmit - Remove duplicate toast
/*
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setErrors({});
  setIsLoading(true);

  try {
    await login(email, password);
    toast.success('Đăng nhập thành công!');
    
    // Redirect based on user role
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role === 'ADMIN') {
        navigate('/admin-dashboard');
      } else if (user.role === 'INSTRUCTOR') {
        navigate('/instructor-dashboard');
      } else {
        navigate('/dashboard');
      }
    } else {
      navigate('/dashboard');
    }
  } catch (error: any) {
    console.error('Login error:', error);
    // Don't show toast here - client.ts already handles it
    // Just set field-specific errors if needed
    if (error.response?.status === 401) {
      setErrors({ password: 'Email hoặc mật khẩu không đúng' });
    }
  } finally {
    setIsLoading(false);
  }
};
*/
