import apiClient from './client'
import type {
    ApiResponse,
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    User,
} from './types'

export const authApi = {
    // Login
    async login(credentials: LoginRequest): Promise<AuthResponse> {
        const response = await apiClient.post<ApiResponse<{ user: User }>>(
            '/auth/login',
            credentials
        )

        // Validate response structure
        if (!response.data?.data?.user) {
            throw new Error('Invalid response from server')
        }

        const { user } = response.data.data

        // Store user in localStorage (tokens are in httpOnly cookies)
        localStorage.setItem('user', JSON.stringify(user))

        return { user }
    },

    // Register
    async register(data: RegisterRequest): Promise<AuthResponse> {
        const response = await apiClient.post<ApiResponse<{ user: User }>>(
            '/auth/register',
            data
        )

        // ✅ Validate response structure
        if (!response.data?.data?.user) {
            throw new Error('Invalid response from server')
        }

        const { user } = response.data.data

        // ✅ Store user in localStorage (tokens are in httpOnly cookies)
        localStorage.setItem('user', JSON.stringify(user))

        return { user }
    },

    // Get current user
    async getCurrentUser(): Promise<User> {
        const response = await apiClient.get<ApiResponse<User>>('/auth/me')
        const user = response.data.data

        // Update stored user
        localStorage.setItem('user', JSON.stringify(user))

        return user
    },

    // Logout - Call API and clear local data
    async logout(): Promise<void> {
        try {
            // ✅ Call backend to invalidate tokens and clear cookies
            await apiClient.post('/auth/logout')
        } catch (error) {
            console.error('Logout API error:', error)
            // ✅ Continue to clear local data even if API fails
        } finally {
            // ✅ Clear all auth-related data from localStorage
            localStorage.removeItem('user')
            localStorage.removeItem('rememberIdentifier')

            // ✅ Redirect to login page
            window.location.href = '/login'
        }
    },

    // Check if user is authenticated
    // Note: Token is in httpOnly cookie, automatically sent with requests
    // We check localStorage user as a client-side indicator
    isAuthenticated(): boolean {
        return !!localStorage.getItem('user')
    },

    // Get stored user from localStorage
    getStoredUser(): User | null {
        const userStr = localStorage.getItem('user')
        if (!userStr) return null

        try {
            return JSON.parse(userStr)
        } catch (error) {
            console.error('Failed to parse stored user:', error)
            return null
        }
    },

    // Forgot password - Request reset token
    async forgotPassword(email: string): Promise<void> {
        await apiClient.post<ApiResponse<null>>('/auth/forgot-password', {
            email,
        })
    },

    // Reset password - Use token to set new password
    async resetPassword(token: string, password: string): Promise<void> {
        await apiClient.post<ApiResponse<null>>('/auth/reset-password', {
            token,
            password,
        })
    },

    // Verify email with token
    async verifyEmail(token: string): Promise<void> {
        await apiClient.post('/auth/verify-email', { token })
    },

    // Resend email verification
    async resendVerification(): Promise<void> {
        await apiClient.post<ApiResponse<null>>('/auth/resend-verification')
    },

    // Refresh token method
    async refreshToken(): Promise<void> {
        await apiClient.post('/auth/refresh-token')
        // Tokens được lưu trong httpOnly cookies tự động
    },
}
