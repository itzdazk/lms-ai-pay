import apiClient from './client';
import type {
  ApiResponse,
  DashboardStats,
  LearningProgress,
  Course,
} from './types';

export const dashboardApi = {
  // Get student dashboard stats
  async getStudentStats(): Promise<DashboardStats> {
    const response = await apiClient.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return response.data.data;
  },

  // Get learning progress
  async getLearningProgress(): Promise<LearningProgress[]> {
    const response = await apiClient.get<ApiResponse<LearningProgress[]>>('/dashboard/progress');
    return response.data.data;
  },

  // Get completed courses
  async getCompletedCourses(): Promise<Course[]> {
    const response = await apiClient.get<ApiResponse<Course[]>>('/dashboard/completed');
    return response.data.data;
  },

  // Get recommended courses (AI recommendations)
  async getRecommendedCourses(): Promise<Course[]> {
    const response = await apiClient.get<ApiResponse<Course[]>>('/dashboard/recommendations');
    return response.data.data;
  },

  // Get instructor dashboard stats
  async getInstructorStats(): Promise<{
    totalCourses: number;
    totalStudents: number;
    totalRevenue: number;
    averageRating: number;
  }> {
    const response = await apiClient.get<ApiResponse<any>>('/dashboard/instructor/stats');
    return response.data.data;
  },

  // Get instructor courses
  async getInstructorCourses(): Promise<Course[]> {
    const response = await apiClient.get<ApiResponse<Course[]>>('/dashboard/instructor/courses');
    return response.data.data;
  },

  // Admin Dashboard APIs
  async getAdminDashboard(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/dashboard/admin');
    return response.data.data;
  },

  async getAdminStats(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/dashboard/admin/user-stats');
    return response.data.data;
  },

  async getAdminUsersAnalytics(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/dashboard/admin/users-analytics');
    return response.data.data;
  },

  async getAdminCoursesAnalytics(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/dashboard/admin/courses-analytics');
    return response.data.data;
  },

  async getAdminRevenueAnalytics(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/dashboard/admin/revenue');
    return response.data.data;
  },

  async getAdminRecentActivities(limit?: number): Promise<any> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await apiClient.get<ApiResponse<any>>(`/dashboard/admin/activities${params}`);
    return response.data.data;
  },
};