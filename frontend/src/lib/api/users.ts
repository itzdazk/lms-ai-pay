import apiClient from './client';
import type {
  ApiResponse,
  User,
  PaginatedResponse,
  Enrollment,
} from './types';

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
  role?: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
  status?: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  sortBy?: 'createdAt' | 'fullName' | 'email' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  bio?: string;
}

export interface ChangeRoleRequest {
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
}

export interface ChangeStatusRequest {
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
}

export interface GetUserEnrollmentsParams {
  page?: number;
  limit?: number;
  status?: 'ACTIVE' | 'COMPLETED' | 'DROPPED';
  search?: string;
  sort?: 'newest' | 'oldest' | 'progress' | 'lastAccessed';
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
    // Use URLSearchParams to avoid sending empty strings
    const searchParams = new URLSearchParams();
    
    if (params) {
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.search && params.search.trim()) {
        searchParams.append('search', params.search.trim());
      }
      if (params.role) searchParams.append('role', params.role);
      if (params.status) searchParams.append('status', params.status);
      if (params.sortBy) searchParams.append('sortBy', params.sortBy);
      if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
    }
    
    const queryString = searchParams.toString();
    const url = queryString ? `/users?${queryString}` : '/users';
    
    // Backend returns: { success: true, data: { users: [...], pagination: {...} } }
    const response = await apiClient.get<ApiResponse<{ users: User[]; pagination: any }>>(url);
    const backendData = response.data.data;
    
    // Transform to PaginatedResponse format: { data: [...], pagination: {...} }
    return {
      data: backendData.users || [],
      pagination: backendData.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    };
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
  async changeUserRole(id: string, role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT'): Promise<User> {
    const response = await apiClient.patch<ApiResponse<User>>(
      `/users/${id}/role`,
      { role }
    );
    return response.data.data;
  },

  // Admin: Change user status
  async changeUserStatus(
    id: string,
    status: 'ACTIVE' | 'INACTIVE' | 'BANNED'
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

  // Admin: Get a user's enrollments
  async getUserEnrollments(
    id: string | number,
    params?: GetUserEnrollmentsParams
  ): Promise<PaginatedResponse<Enrollment> & { totalEnrollments?: number }> {
    const searchParams = new URLSearchParams();

    if (params) {
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.status) searchParams.append('status', params.status);
      if (params.search && params.search.trim()) {
        searchParams.append('search', params.search.trim());
      }
      if (params.sort) searchParams.append('sort', params.sort);
    }

    const queryString = searchParams.toString();
    const url = queryString
      ? `/users/${id}/enrollments?${queryString}`
      : `/users/${id}/enrollments`;

    const response = await apiClient.get<
      ApiResponse<{ enrollments: Enrollment[]; pagination: any; totalEnrollments?: number }>
    >(url);

    const backendData = response.data.data;

    return {
      data: backendData.enrollments || [],
      pagination: backendData.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
      totalEnrollments: backendData.totalEnrollments ?? backendData.pagination?.total ?? 0,
    };
  },

  // Admin: Delete a user's enrollment
  async deleteUserEnrollment(
    userId: string | number,
    enrollmentId: number | string
  ): Promise<{ message: string; totalEnrollments?: number }> {
    const response = await apiClient.delete<
      ApiResponse<{ message: string; totalEnrollments?: number }>
    >(`/users/${userId}/enrollments/${enrollmentId}`);

    return response.data.data;
  },
};

