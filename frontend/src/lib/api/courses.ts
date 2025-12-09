import apiClient from './client'
import type {
    ApiResponse,
    Course,
    CourseFilters,
    PaginatedResponse,
    Category,
    Tag,
    Enrollment,
    Instructor,
    CourseLessonsResponse,
    Lesson,
    PaginatedApiResponse,
} from './types'

export const coursesApi = {
    // Get all courses with filters
    async getCourses(
        filters?: CourseFilters
    ): Promise<PaginatedResponse<Course>> {
        const params = new URLSearchParams()

        if (filters) {
            if (filters.page) params.append('page', filters.page.toString())
            if (filters.limit) params.append('limit', filters.limit.toString())
            if (filters.search) params.append('search', filters.search)
            if (filters.categoryId)
                params.append('categoryId', filters.categoryId.toString())
            if (filters.level) params.append('level', filters.level)
            if (filters.minPrice !== undefined)
                params.append('minPrice', filters.minPrice.toString())
            if (filters.maxPrice !== undefined)
                params.append('maxPrice', filters.maxPrice.toString())
            if (filters.isFeatured !== undefined)
                params.append('isFeatured', filters.isFeatured.toString())
            if (filters.instructorId)
                params.append('instructorId', filters.instructorId.toString())
            if (filters.sort) params.append('sort', filters.sort)
            if (filters.tagId) params.append('tagId', filters.tagId.toString())
        }

        // fetch vào tags
        const response = await apiClient.get<PaginatedApiResponse<Course>>(
            `/courses?${params.toString()}`
        )
        console.log('courses.ts', response)

        return {
            data: response.data.data,
            pagination: response.data.pagination,
            total: response.data.pagination.total,
        }
    },

    // Get featured courses
    async getFeaturedCourses(limit: number = 10): Promise<Course[]> {
        const params = new URLSearchParams()
        params.append('limit', limit.toString())

        const response = await apiClient.get<ApiResponse<Course[]>>(
            `/courses/featured?${params.toString()}`
        )
        return response.data.data
    },

    // Get trending courses
    async getTrendingCourses(limit: number = 10): Promise<Course[]> {
        const params = new URLSearchParams()
        params.append('limit', limit.toString())

        const response = await apiClient.get<ApiResponse<Course[]>>(
            `/courses/trending?${params.toString()}`
        )
        return response.data.data
    },

    // Get course by ID
    async getCourseById(id: number): Promise<Course> {
        const response = await apiClient.get<ApiResponse<Course>>(
            `/courses/${id}`
        )
        return response.data.data
    },

    // Get course by slug
    async getCourseBySlug(slug: string): Promise<Course> {
        const response = await apiClient.get<ApiResponse<Course>>(
            `/courses/slug/${slug}`
        )
        return response.data.data
    },

    // Get course lessons
    async getCourseLessons(courseId: number): Promise<CourseLessonsResponse> {
        const response = await apiClient.get<
            ApiResponse<CourseLessonsResponse>
        >(`/courses/${courseId}/lessons`)
        return response.data.data
    },

    // Get course instructor
    async getCourseInstructor(courseId: number): Promise<Instructor> {
        const response = await apiClient.get<ApiResponse<Instructor>>(
            `/courses/${courseId}/instructor`
        )
        return response.data.data
    },

    // Increment view count
    async incrementViewCount(
        courseId: number
    ): Promise<{ id: number; viewsCount: number }> {
        const response = await apiClient.post<
            ApiResponse<{ id: number; viewsCount: number }>
        >(`/courses/${courseId}/view`, {})
        return response.data.data
    },

    // Create course (instructor/admin only)
    async createCourse(data: Partial<Course>): Promise<Course> {
        const response = await apiClient.post<ApiResponse<Course>>(
            '/courses',
            data
        )
        return response.data.data
    },

    // Update course (instructor/admin only)
    async updateCourse(id: string, data: Partial<Course>): Promise<Course> {
        const response = await apiClient.put<ApiResponse<Course>>(
            `/courses/${id}`,
            data
        )
        return response.data.data
    },

    // Delete course (instructor/admin only)
    async deleteCourse(id: string): Promise<void> {
        await apiClient.delete(`/courses/${id}`)
    },

    // Enroll in course
    async enrollCourse(courseId: string): Promise<Enrollment> {
        const response = await apiClient.post<ApiResponse<Enrollment>>(
            `/courses/${courseId}/enroll`,
            {}
        )
        return response.data.data
    },

    // Get user enrollments
    async getEnrollments(): Promise<Enrollment[]> {
        const response = await apiClient.get<ApiResponse<Enrollment[]>>(
            '/courses/enrollments'
        )
        return response.data.data
    },

    // Get categories
    async getCategories(): Promise<Category[]> {
        const response = await apiClient.get<ApiResponse<Category[]>>(
            '/categories'
        )
        return response.data.data
    },

    async getTags(params?: {
        page?: number
        limit?: number
        search?: string
    }): Promise<{
        tags: Tag[]
        pagination: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }> {
        const queryParams = new URLSearchParams()

        if (params?.page) queryParams.append('page', params.page.toString())
        if (params?.limit) queryParams.append('limit', params.limit.toString())
        if (params?.search) queryParams.append('search', params.search)

        const response = await apiClient.get<
            ApiResponse<{
                tags: Tag[]
                pagination: {
                    page: number
                    limit: number
                    total: number
                    totalPages: number
                }
            }>
        >(`/tags?${queryParams.toString()}`)
        return response.data.data
    },

    // ✅ THÊM MỚI: getTagById - Lấy tag theo ID
    async getTagById(tagId: number): Promise<Tag> {
        const response = await apiClient.get<ApiResponse<Tag>>(`/tags/${tagId}`)
        return response.data.data
    },

    // ✅ THÊM MỚI: getCoursesByTag - Lấy courses theo tag
    async getCoursesByTag(
        tagId: number,
        params?: {
            page?: number
            limit?: number
            level?: string
            sort?: string
        }
    ): Promise<{
        tag: { id: number; name: string }
        courses: Course[]
        pagination: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }> {
        const queryParams = new URLSearchParams()

        if (params?.page) queryParams.append('page', params.page.toString())
        if (params?.limit) queryParams.append('limit', params.limit.toString())
        if (params?.level) queryParams.append('level', params.level)
        if (params?.sort) queryParams.append('sort', params.sort)

        const response = await apiClient.get<
            ApiResponse<{
                tag: { id: number; name: string }
                courses: Course[]
                pagination: {
                    page: number
                    limit: number
                    total: number
                    totalPages: number
                }
            }>
        >(`/tags/${tagId}/courses?${queryParams.toString()}`)
        return response.data.data
    },
}
