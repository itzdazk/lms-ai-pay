import apiClient from './client'
import type {
    ApiResponse,
    Course,
    PaginatedResponse,
} from './types'

export const instructorCoursesApi = {
    // Get instructor course by ID (with full details)
    async getInstructorCourseById(id: string): Promise<Course> {
        const response = await apiClient.get<ApiResponse<Course>>(
            `/instructor/courses/${id}`
        )
        return response.data.data
    },

    // Get instructor courses
    async getInstructorCourses(filters?: {
        page?: number
        limit?: number
        search?: string
        status?:
            | 'DRAFT'
            | 'PUBLISHED'
            | 'ARCHIVED'
            | 'draft'
            | 'published'
            | 'archived'
        categoryId?: string
        level?: 'beginner' | 'intermediate' | 'advanced'
        sort?: string
    }): Promise<PaginatedResponse<Course>> {
        const params = new URLSearchParams()

        // Always set default values
        if (filters?.page) params.append('page', filters.page.toString())
        if (filters?.limit) params.append('limit', filters.limit.toString())
        if (filters?.search && filters.search.trim())
            params.append('search', filters.search.trim())

        if (filters?.status) {
            // Convert to uppercase for backend
            const statusUpper = filters.status.toUpperCase() as
                | 'DRAFT'
                | 'PUBLISHED'
                | 'ARCHIVED'
            params.append('status', statusUpper)
        }

        if (filters?.categoryId) params.append('categoryId', filters.categoryId)

        if (filters?.level) {
            // Convert to uppercase for backend
            const levelUpper = filters.level.toUpperCase() as
                | 'BEGINNER'
                | 'INTERMEDIATE'
                | 'ADVANCED'
            params.append('level', levelUpper)
        }

        // Always include sort parameter (default to 'newest' if not provided)
        params.append('sort', filters?.sort || 'newest')
        const queryString = params.toString()
        const url = queryString
            ? `/instructor/courses?${queryString}`
            : '/instructor/courses'
        const response = await apiClient.get<any>(url)

        // Backend returns: { success: true, message, data: [...], pagination: {...} }
        // But sometimes response.data.data might be the array directly
        // Handle both cases
        let coursesArray: any[] = []
        let paginationInfo: any = {
            page: filters?.page || 1,
            limit: filters?.limit || 20,
            total: 0,
            totalPages: 0,
        }

        // Check response structure
        if (response.data?.data && Array.isArray(response.data.data)) {
            // Normal case: response.data.data contains array
            coursesArray = response.data.data
            paginationInfo = response.data.pagination || paginationInfo
        } else if (Array.isArray(response.data)) {
            // If response.data is already an array (unexpected but handle it)
            coursesArray = response.data
            paginationInfo = {
                page: filters?.page || 1,
                limit: filters?.limit || 20,
                total: response.data.length,
                totalPages: Math.ceil(
                    response.data.length / (filters?.limit || 20)
                ),
            }
        } else if (
            response.data?.courses &&
            Array.isArray(response.data.courses)
        ) {
            // Alternative structure: response.data.courses
            coursesArray = response.data.courses
            paginationInfo = response.data.pagination || paginationInfo
        }

        return {
            data: coursesArray,
            pagination: paginationInfo,
        }
    },

    // Create course (instructor)
    async createInstructorCourse(data: Partial<Course>): Promise<Course> {
        const response = await apiClient.post<ApiResponse<Course>>(
            '/instructor/courses',
            data
        )
        return response.data.data
    },

    // Update course (instructor)
    async updateInstructorCourse(
        id: string,
        data: Partial<Course>
    ): Promise<Course> {
        const response = await apiClient.put<ApiResponse<Course>>(
            `/instructor/courses/${id}`,
            data
        )
        return response.data.data
    },

    // Delete course (instructor)
    async deleteInstructorCourse(id: string): Promise<void> {
        await apiClient.delete(`/instructor/courses/${id}`)
    },

    // Change course status
    async changeCourseStatus(
        id: string,
        status: 'draft' | 'published' | 'archived'
    ): Promise<Course> {
        // Convert to uppercase as backend expects: DRAFT, PUBLISHED, ARCHIVED
        const statusUpper = status.toUpperCase() as
            | 'DRAFT'
            | 'PUBLISHED'
            | 'ARCHIVED'
        const response = await apiClient.patch<ApiResponse<Course>>(
            `/instructor/courses/${id}/status`,
            { status: statusUpper }
        )
        return response.data.data
    },

    // Upload course thumbnail
    async uploadCourseThumbnail(id: string, file: File): Promise<Course> {
        const formData = new FormData()
        formData.append('thumbnail', file)
        const response = await apiClient.patch<ApiResponse<Course>>(
            `/instructor/courses/${id}/thumbnail`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        )
        return response.data.data
    },

    // Upload course preview video
    async uploadCoursePreview(id: string, file: File): Promise<Course> {
        const formData = new FormData()
        formData.append('videoPreview', file)
        const response = await apiClient.patch<ApiResponse<Course>>(
            `/instructor/courses/${id}/preview`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        )
        return response.data.data
    },

    // Add tags to course
    async addCourseTags(id: string, tagIds: number[]): Promise<Course> {
        const response = await apiClient.post<ApiResponse<Course>>(
            `/instructor/courses/${id}/tags`,
            {
                tagIds,
            }
        )
        return response.data.data
    },

    // Remove tag from course
    async removeCourseTag(id: string, tagId: number): Promise<void> {
        await apiClient.delete(`/instructor/courses/${id}/tags/${tagId}`)
    },

    // Get course analytics
    async getCourseAnalytics(id: string): Promise<any> {
        const response = await apiClient.get<ApiResponse<any>>(
            `/instructor/courses/${id}/analytics`
        )
        return response.data.data
    },

    // Get instructor course statistics
    async getInstructorCourseStatistics(): Promise<any> {
        const response = await apiClient.get<ApiResponse<any>>(
            '/instructor/courses/statistics'
        )
        return response.data.data
    },
}

