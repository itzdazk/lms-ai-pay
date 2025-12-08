import apiClient from './client';
import type { ApiResponse, LoginRequest, RegisterRequest, AuthResponse, User } from './types';

export const authApi = {
  // Login
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<{ user: User }>>('/auth/login', credentials);
    
    // Check if response has data
    if (!response.data || !response.data.data) {
      throw new Error('Invalid response from server');
    }
    
    const { user } = response.data.data;
    
    // Validate user exists
    if (!user) {
      throw new Error('User data missing from response');
    }
    
    // Store user in localStorage (token is in httpOnly cookie, managed by browser)
    localStorage.setItem('user', JSON.stringify(user));
    
    // Return user, token is in cookie (not accessible via JavaScript)
    return { token: '', user }; // Token is in httpOnly cookie
  },

  // Register
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<{ user: User }>>('/auth/register', data);
    
    // Check if response has data
    if (!response.data || !response.data.data) {
      throw new Error('Invalid response from server');
    }
    
    const { user } = response.data.data;
    
    // Validate user exists
    if (!user) {
      throw new Error('User data missing from response');
    }
    
    // Store user in localStorage (token is in httpOnly cookie, managed by browser)
    localStorage.setItem('user', JSON.stringify(user));
    
    // Return user, token is in cookie (not accessible via JavaScript)
    return { token: '', user }; // Token is in httpOnly cookie
  },

  // Get current user
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    const user = response.data.data;
    
    // Update stored user
    localStorage.setItem('user', JSON.stringify(user));
    
    return user;
  },

  // Logout
  async logout(): Promise<void> {
    try {
      // Call backend logout to clear cookies
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear localStorage
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  },

  // Check if user is authenticated
  // Since token is in httpOnly cookie, we check if user exists in localStorage
  // Backend will validate the cookie on each request
  isAuthenticated(): boolean {
    return !!localStorage.getItem('user');
  },

  // Get stored user
  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  // Get stored token
  // Token is in httpOnly cookie, not accessible via JavaScript
  // This method returns null as token is managed by browser
  getToken(): string | null {
    return null; // Token is in httpOnly cookie, not accessible
  },

  // Resend email verification
  async resendVerification(): Promise<void> {
    await apiClient.post<ApiResponse<null>>('/auth/resend-verification');
  },
};