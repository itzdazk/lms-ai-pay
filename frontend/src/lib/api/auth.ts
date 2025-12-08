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
        const response = await apiClient.post<ApiResponse<AuthResponse>>(
            '/auth/login',
            credentials
        )
        const { token, user } = response.data.data

        // Store token and user
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))

        return { token, user }
    },

    // Register
    async register(data: RegisterRequest): Promise<AuthResponse> {
        const response = await apiClient.post<ApiResponse<AuthResponse>>(
            '/auth/register',
            data
        )
        const { token, user } = response.data.data

        // Store token and user
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))

        return { token, user }
    },

    // Logout
    async logoutAPI(): Promise<void> {
        try {
            await apiClient.post('/auth/logout', {})
        } catch (error) {
            // Ignore errors on logout, clear storage anyway
            console.error('Logout error:', error)
        }
    },

    // Get current user
    async getCurrentUser(): Promise<User> {
        const response = await apiClient.get<ApiResponse<User>>('/auth/me')
        const user = response.data.data

        // Update stored user
        localStorage.setItem('user', JSON.stringify(user))

        return user
    },

    // Logout
    logout(): void {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('rememberEmail')
        window.location.href = '/login'
    },

    // Check if user is authenticated
    isAuthenticated(): boolean {
        return !!localStorage.getItem('token')
    },

    // Get stored user
    getStoredUser(): User | null {
        const userStr = localStorage.getItem('user')
        if (!userStr) return null
        try {
            return JSON.parse(userStr)
        } catch {
            return null
        }
    },

    // Get stored token
    getToken(): string | null {
        return localStorage.getItem('token')
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
}
