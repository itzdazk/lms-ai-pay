import apiClient from './client';
import type {
  ApiResponse,
  Course,
  CourseFilters,
  PaginatedResponse,
  Category,
  Tag,
  Enrollment,
} from './types';

export const coursesApi = {
  // Get all courses with filters
  async getCourses(filters?: CourseFilters): Promise<PaginatedResponse<Course>> {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.categoryId) params.append('categoryId', filters.categoryId);
      if (filters.level) params.append('level', filters.level);
      if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
      if (filters.isFree !== undefined) params.append('isFree', filters.isFree.toString());
      if (filters.featured !== undefined) params.append('featured', filters.featured.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.tags && filters.tags.length > 0) {
        filters.tags.forEach(tag => params.append('tags', tag));
      }
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
    }

    const response = await apiClient.get<ApiResponse<PaginatedResponse<Course>>>(
      `/courses?${params.toString()}`
    );
    return response.data.data;
  },

  // Get course by ID
  async getCourseById(id: string): Promise<Course> {
    const response = await apiClient.get<ApiResponse<Course>>(`/courses/${id}`);
    return response.data.data;
  },

  // Get course by slug
  async getCourseBySlug(slug: string): Promise<Course> {
    const response = await apiClient.get<ApiResponse<Course>>(`/courses/slug/${slug}`);
    return response.data.data;
  },

  // Create course (instructor/admin only)
  async createCourse(data: Partial<Course>): Promise<Course> {
    const response = await apiClient.post<ApiResponse<Course>>('/courses', data);
    return response.data.data;
  },

  // Update course (instructor/admin only)
  async updateCourse(id: string, data: Partial<Course>): Promise<Course> {
    const response = await apiClient.put<ApiResponse<Course>>(`/courses/${id}`, data);
    return response.data.data;
  },

  // Delete course (instructor/admin only)
  async deleteCourse(id: string): Promise<void> {
    await apiClient.delete(`/courses/${id}`);
  },

  // Enroll in course
  async enrollCourse(courseId: string): Promise<Enrollment> {
    const response = await apiClient.post<ApiResponse<Enrollment>>(
      `/courses/${courseId}/enroll`,
      {}
    );
    return response.data.data;
  },

  // Get user enrollments
  async getEnrollments(): Promise<Enrollment[]> {
    const response = await apiClient.get<ApiResponse<Enrollment[]>>('/courses/enrollments');
    return response.data.data;
  },

  // Get categories
  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get<ApiResponse<Category[]>>('/courses/categories');
    return response.data.data;
  },

  // Get tags
  async getTags(): Promise<Tag[]> {
    const response = await apiClient.get<ApiResponse<Tag[]>>('/courses/tags');
    return response.data.data;
  },
};







