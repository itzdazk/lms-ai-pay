import apiClient from './client';
import type {
  ApiResponse,
  PaginatedResponse,
} from './types';
import type {
  CourseProgress,
  LessonProgress,
  ProgressUpdateRequest,
  ResumePosition,
  CourseProgressStats,
  LessonCompletionRequest,
  ProgressBadge,
} from '../progressTypes';

export const progressApi = {
  // Get course progress
  async getCourseProgress(courseId: string): Promise<ApiResponse<CourseProgress>> {
    const response = await apiClient.get<ApiResponse<CourseProgress>>(
      `/progress/courses/${courseId}`
    );
    return response.data;
  },

  // Get lesson progress
  async getLessonProgress(lessonId: string): Promise<ApiResponse<LessonProgress>> {
    const response = await apiClient.get<ApiResponse<LessonProgress>>(
      `/progress/lessons/${lessonId}`
    );
    return response.data;
  },

  // Start lesson
  async startLesson(lessonId: string): Promise<ApiResponse<LessonProgress>> {
    const response = await apiClient.post<ApiResponse<LessonProgress>>(
      `/progress/lessons/${lessonId}/start`
    );
    return response.data;
  },

  // Update lesson progress
  async updateLessonProgress(
    lessonId: string,
    data: ProgressUpdateRequest
  ): Promise<ApiResponse<LessonProgress>> {
    const response = await apiClient.put<ApiResponse<LessonProgress>>(
      `/progress/lessons/${lessonId}/update`,
      data
    );
    return response.data;
  },

  // Complete lesson
  async completeLesson(
    lessonId: string,
    data: LessonCompletionRequest
  ): Promise<ApiResponse<LessonProgress>> {
    const response = await apiClient.post<ApiResponse<LessonProgress>>(
      `/progress/lessons/${lessonId}/complete`,
      data
    );
    return response.data;
  },

  // Get resume position
  async getResumePosition(lessonId: string): Promise<ApiResponse<ResumePosition>> {
    const response = await apiClient.get<ApiResponse<ResumePosition>>(
      `/progress/lessons/${lessonId}/resume`
    );
    return response.data;
  },

  // Get user progress stats
  async getUserProgressStats(): Promise<ApiResponse<CourseProgressStats>> {
    const response = await apiClient.get<ApiResponse<CourseProgressStats>>(
      '/progress/stats'
    );
    return response.data;
  },

  // Get user badges
  async getUserBadges(): Promise<ApiResponse<ProgressBadge[]>> {
    const response = await apiClient.get<ApiResponse<ProgressBadge[]>>(
      '/progress/badges'
    );
    return response.data;
  },

  // Get all user course progress
  async getAllUserProgress(
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<CourseProgress>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await apiClient.get<PaginatedResponse<CourseProgress>>(
      `/progress/user?${params}`
    );
    return response.data;
  },
};
