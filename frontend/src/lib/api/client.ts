import axios, {
    AxiosError,
    AxiosInstance,
    InternalAxiosRequestConfig,
} from 'axios'
import { toast } from 'sonner'

const API_BASE_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

// Get base server URL (without /api/v1)
export const getServerBaseUrl = () => {
    return API_BASE_URL.replace(/\/api\/v1\/?$/, '')
}

// Convert relative URL to absolute URL
export const getAbsoluteUrl = (relativeUrl: string | null | undefined): string => {
    if (!relativeUrl) return ''
    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
        return relativeUrl
    }
    const baseUrl = getServerBaseUrl()
    const cleanUrl = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`
    return `${baseUrl}${cleanUrl}`
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Enable cookies for authentication
})

// Request interceptor
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
    (error: AxiosError<{ message?: string; error?: string | { message?: string; code?: string } }>) => {
        // Handle network errors
        if (!error.response) {
            toast.error('Lỗi kết nối mạng. Vui lòng kiểm tra lại kết nối.')
            return Promise.reject(error)
        }

        const status = error.response.status
        const requestUrl = error.config?.url || ''
        const requestMethod = error.config?.method?.toUpperCase() || ''

        // Skip toast for transcript endpoint (transcript is optional) - check early
        if (status === 404 && requestUrl.includes('/lessons/') && requestUrl.includes('/transcript')) {
            // Don't show toast, let component handle it silently
            return Promise.reject(error)
        }

        // Skip toast for lesson by slug endpoint (404) - let component handle it
        if (status === 404 && requestUrl.includes('/courses/slug/') && requestUrl.includes('/lessons/')) {
            // Don't show toast, let component handle it with error page
            return Promise.reject(error)
        }

        // Skip toast for validation errors from lesson/course endpoints (422)
        // Let components handle validation errors themselves to avoid duplicates
        if (status === 422 && (requestUrl.includes('/lessons/') || requestUrl.includes('/courses/'))) {
            // Don't show toast, let component handle it
            return Promise.reject(error)
        }

        // Extract message safely - handle both object and string formats
        let message = 'Đã xảy ra lỗi'
        let errorCode: string | undefined
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
                if (typeof error.response.data.error === 'object' && error.response.data.error.code) {
                    errorCode = error.response.data.error.code
                }
            }
        }

        // Suppress toast for backend rate limit seek update error
        if (typeof message === 'string' && message.toLowerCase().includes('rate limit') && message.toLowerCase().includes('seek update')) {
            // Do not show toast, let VideoPlayer handle UX
            return Promise.reject(error);
        }

        // Translate common error messages to Vietnamese
        const lowerMessage = message.toLowerCase()

        // Check for Prisma error codes (P2003 = Foreign key constraint)
        if (errorCode === 'NOT_FOUND' || errorCode === 'P2003') {
            if (requestUrl.includes('/users/') && requestMethod === 'DELETE') {
                message = 'Không thể xóa người dùng này vì có dữ liệu liên quan (khóa học đã tạo, đăng ký khóa học, hoặc đơn hàng). Vui lòng xóa hoặc xử lý các dữ liệu liên quan trước.'
            }
        }

        // Check for constraint violations in message
        if (
            lowerMessage.includes('foreign key constraint') ||
            lowerMessage.includes('constraint') ||
            lowerMessage.includes('related record not found') ||
            lowerMessage.includes('database operation failed')
        ) {
            if (requestUrl.includes('/users/') && requestMethod === 'DELETE') {
                if (lowerMessage.includes('courses') || lowerMessage.includes('instructor') || lowerMessage.includes('course')) {
                    message = 'Không thể xóa người dùng này vì họ đã tạo khóa học. Vui lòng xóa hoặc chuyển quyền sở hữu các khóa học trước.'
                } else if (lowerMessage.includes('enrollments') || lowerMessage.includes('enrollment')) {
                    message = 'Không thể xóa người dùng này vì họ đã đăng ký khóa học. Vui lòng hủy đăng ký trước.'
                } else if (lowerMessage.includes('orders') || lowerMessage.includes('order')) {
                    message = 'Không thể xóa người dùng này vì họ có đơn hàng. Vui lòng xử lý các đơn hàng trước.'
                } else if (message === 'Đã xảy ra lỗi' || lowerMessage.includes('related record not found')) {
                    message = 'Không thể xóa người dùng này vì có dữ liệu liên quan (khóa học đã tạo, đăng ký khóa học, hoặc đơn hàng). Vui lòng xóa hoặc xử lý các dữ liệu liên quan trước.'
                }
            }
        } else if (lowerMessage.includes('cannot delete admin')) {
            message = 'Không thể xóa tài khoản quản trị viên.'
        } else if (lowerMessage.includes('user not found')) {
            message = 'Không tìm thấy người dùng.'
        }

        // Handle specific error codes
        switch (status) {
            case 401:
                // Check if this is a login/register request
                const isAuthRequest =
                    requestUrl.includes('/auth/login') ||
                    requestUrl.includes('/auth/register')

                // Check if this is a public endpoint that might return 401 for guest users
                // These endpoints should handle 401 gracefully in their components
                const isPublicEndpointThatMayFail =
                    requestUrl.includes('/enrollments/check/') ||
                    requestUrl.includes('/enrollments') && requestMethod === 'GET'

                if (isAuthRequest) {
                    // For login/register, don't show toast or redirect
                    // Let the page handle the error message display
                    // This prevents duplicate error messages
                } else if (isPublicEndpointThatMayFail) {
                    // For public endpoints that may return 401 for guests,
                    // don't redirect - let the component handle it
                    // This allows guest users to view public pages without being forced to login
                } else {
                    // For other requests, session has expired
                    localStorage.removeItem('user')
                    toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
                    // Avoid redirect loop
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login'
                    }
                }
                break

            case 403:
                toast.error('Bạn không có quyền truy cập.')
                break

            case 404:
                // Skip toast for transcript endpoint is already handled above
                // Only show default message if we haven't translated it already
                if (message === 'Đã xảy ra lỗi' || (message.toLowerCase().includes('not found') && !lowerMessage.includes('user not found'))) {
                    toast.error('Không tìm thấy dữ liệu.')
                } else {
                    toast.error(message)
                }
                break

            case 422:
                // Validation errors - message might be array or object
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
                // Ensure message is a string before showing
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
