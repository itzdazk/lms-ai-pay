import apiClient from './client';
import type { ApiResponse, User, PaginatedResponse } from './types';

// Profile types
export interface UpdateProfileRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  bio?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Admin user management types
export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'admin' | 'instructor' | 'student';
  status?: 'active' | 'inactive' | 'suspended';
  sortBy?: 'createdAt' | 'fullName' | 'email';
  sortOrder?: 'asc' | 'desc';
}

export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  bio?: string;
}

export interface ChangeRoleRequest {
  role: 'admin' | 'instructor' | 'student';
}

export interface ChangeStatusRequest {
  status: 'active' | 'inactive' | 'suspended';
}

export const usersApi = {
  // Get current user profile
  async getProfile(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>('/users/profile');
    const user = response.data.data;
    
    // Update stored user
    localStorage.setItem('user', JSON.stringify(user));
    
    return user;
  },

  // Update current user profile
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>('/users/profile', data);
    const user = response.data.data;
    
    // Update stored user
    localStorage.setItem('user', JSON.stringify(user));
    
    return user;
  },

  // Upload avatar
  async uploadAvatar(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    // Axios will automatically set Content-Type with boundary for FormData
    const response = await apiClient.patch<ApiResponse<User>>(
      '/users/profile/avatar',
      formData
    );
    
    const user = response.data.data;
    
    // Update stored user
    localStorage.setItem('user', JSON.stringify(user));
    
    return user;
  },

  // Change password
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await apiClient.put<ApiResponse<null>>('/users/change-password', data);
  },

  // Admin: Get users list
  async getUsers(params?: GetUsersParams): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<User>>>(
      '/users',
      { params }
    );
    return response.data.data;
  },

  // Admin: Get user by ID
  async getUserById(id: string): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data;
  },

  // Admin: Update user
  async updateUser(id: string, data: UpdateUserRequest): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>(`/users/${id}`, data);
    return response.data.data;
  },

  // Admin: Change user role
  async changeUserRole(id: string, role: 'admin' | 'instructor' | 'student'): Promise<User> {
    const response = await apiClient.patch<ApiResponse<User>>(
      `/users/${id}/role`,
      { role }
    );
    return response.data.data;
  },

  // Admin: Change user status
  async changeUserStatus(
    id: string,
    status: 'active' | 'inactive' | 'suspended'
  ): Promise<User> {
    const response = await apiClient.patch<ApiResponse<User>>(
      `/users/${id}/status`,
      { status }
    );
    return response.data.data;
  },

  // Admin: Delete user
  async deleteUser(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/users/${id}`);
  },
};

