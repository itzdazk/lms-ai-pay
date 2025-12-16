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
    PaginatedApiResponse,
    PublicCourseFilters,
    PublicCoursesPagination,
    PublicCourse,
} from './types'

export const coursesApi = {
    // Get all courses with filters
    async getPublicCourses(
        filters?: PublicCourseFilters
    ): Promise<PublicCoursesPagination<PublicCourse>> {
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
            if (filters.tagIds && filters.tagIds.length > 0) {
                filters.tagIds.forEach((tagId) => {
                    params.append('tagIds', tagId.toString())
                })
            }
        }

        // fetch vào tags
        const response = await apiClient.get<
            PaginatedApiResponse<PublicCourse>
        >(`/courses?${params.toString()}`)
        console.log('courses.ts', response)

        return {
            data: response.data.data,
            pagination: response.data.pagination,
            total: response.data.pagination.total,
        }
    },

    // Get featured courses
    async getFeaturedCourses(limit: number = 10): Promise<PublicCourse[]> {
        const params = new URLSearchParams()
        params.append('limit', limit.toString())

        const response = await apiClient.get<ApiResponse<PublicCourse[]>>(
            `/courses/featured?${params.toString()}`
        )
        return response.data.data
    },

    // Get trending courses
    async getTrendingCourses(limit: number = 10): Promise<PublicCourse[]> {
        const params = new URLSearchParams()
        params.append('limit', limit.toString())

        const response = await apiClient.get<ApiResponse<PublicCourse[]>>(
            `/courses/trending?${params.toString()}`
        )
        return response.data.data
    },

    // Get course by slug
    async getCourseBySlug(slug: string): Promise<PublicCourse> {
        const response = await apiClient.get<ApiResponse<PublicCourse>>(
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

    // Get categories
    async getCategories(): Promise<Category[]> {
        const response = await apiClient.get<ApiResponse<Category[]>>(
            '/categories'
        )
        return response.data.data
    },

    async getCourseTags(params?: {
        page?: number
        limit?: number
        search?: string
        sort?: string
        sortOrder?: string
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
        if (params?.sort) queryParams.append('sort', params.sort)
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)

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

    // Get all courses with filters
    async getCourses(
        filters?: CourseFilters
    ): Promise<PaginatedResponse<Course>> {
        const params = new URLSearchParams()

        if (filters) {
            if (filters.categoryId)
                params.append('categoryId', String(filters.categoryId))
            if (filters.level) params.append('level', filters.level)
            if (filters.minPrice !== undefined)
                params.append('minPrice', filters.minPrice.toString())
            if (filters.maxPrice !== undefined)
                params.append('maxPrice', filters.maxPrice.toString())
            if (filters.isFree !== undefined)
                params.append('isFree', filters.isFree.toString())
            if (filters.featured !== undefined)
                params.append('featured', filters.featured.toString())
            if (filters.search) params.append('search', filters.search)
            if (filters.tags && filters.tags.length > 0) {
                filters.tags.forEach((tag) => params.append('tags', tag))
            }
            if (filters.sortBy) params.append('sortBy', filters.sortBy)
            if (filters.page) params.append('page', filters.page.toString())
            if (filters.limit) params.append('limit', filters.limit.toString())
        }

        const response = await apiClient.get<
            ApiResponse<PaginatedResponse<Course>>
        >(`/courses?${params.toString()}`)
        return response.data.data
    },

    // Get course by ID
    async getCourseById(id: string): Promise<Course> {
        const response = await apiClient.get<ApiResponse<Course>>(
            `/courses/${id}`
        )
        return response.data.data
    },

    // Get course by ID
    async getPublicCourseById(id: number): Promise<PublicCourse> {
        const response = await apiClient.get<ApiResponse<PublicCourse>>(
            `/courses/${id}`
        )
        return response.data.data
    },

    // Get course counts by level
    async getCourseCountsByLevel(): Promise<{
        BEGINNER: number
        INTERMEDIATE: number
        ADVANCED: number
    }> {
        const response = await apiClient.get<
            ApiResponse<{
                BEGINNER: number
                INTERMEDIATE: number
                ADVANCED: number
            }>
        >('/courses/levels/counts')
        return response.data.data
    },

    // Get course counts by price type
    async getCourseCountsByPrice(): Promise<{
        free: number
        paid: number
    }> {
        const response = await apiClient.get<
            ApiResponse<{
                free: number
                paid: number
            }>
        >('/courses/prices/counts')
        return response.data.data
    },

    // Get user enrollments
    async getEnrollments(): Promise<Enrollment[]> {
        const response = await apiClient.get<ApiResponse<Enrollment[]>>(
            '/courses/enrollments'
        )
        return response.data.data
    },

    // Get tags (paginate with max limit 100, but also include selected tag IDs if provided)
    async getTags(selectedTagIds?: string[]): Promise<Tag[]> {
        // Backend max limit is 100, so we paginate to get all tags
        let allTags: Tag[] = []
        let page = 1
        const limit = 100 // Max allowed by backend
        let hasMore = true

        while (hasMore) {
            const response = await apiClient.get<
                ApiResponse<{ tags: Tag[]; pagination: any }>
            >(`/tags?page=${page}&limit=${limit}`)

            // Backend returns { success: true, data: { tags: [...], pagination: {...} }, message: "..." }
            const responseData = response.data?.data as
                | { tags?: Tag[]; pagination?: any }
                | undefined

            let tags: Tag[] = []
            if (responseData?.tags && Array.isArray(responseData.tags)) {
                tags = responseData.tags
            } else if (Array.isArray(response.data)) {
                tags = response.data as Tag[]
            } else {
                console.warn(
                    'Unexpected tags response structure:',
                    response.data
                )
                break
            }

            allTags = [...allTags, ...tags]

            // Check if there are more pages
            const pagination = responseData?.pagination
            if (
                pagination &&
                pagination.totalPages &&
                page < pagination.totalPages
            ) {
                page++
            } else {
                hasMore = false
            }
        }

        // If selectedTagIds provided, load missing tags
        if (selectedTagIds && selectedTagIds.length > 0) {
            const loadedTagIds = new Set(allTags.map((t) => String(t.id)))
            const missingTagIds = selectedTagIds.filter(
                (id) => !loadedTagIds.has(id)
            )

            if (missingTagIds.length > 0) {
                // Load missing tags by fetching them individually
                const missingTagsPromises = missingTagIds.map(async (tagId) => {
                    try {
                        const tagResponse = await apiClient.get<
                            ApiResponse<Tag>
                        >(`/tags/${tagId}`)
                        return tagResponse.data?.data
                    } catch (error) {
                        console.warn(`Failed to load tag ${tagId}:`, error)
                        return null
                    }
                })

                const missingTags = (
                    await Promise.all(missingTagsPromises)
                ).filter((tag): tag is Tag => tag !== null)
                allTags = [...allTags, ...missingTags]
            }
        }

        return allTags
    },

    // Create tag (admin/instructor)
    async createTag(name: string, description?: string): Promise<Tag> {
        // Generate slug from name (similar to backend seed.js)
        const slug = name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove Vietnamese accents
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')

        const response = await apiClient.post<ApiResponse<Tag>>('/tags', {
            name,
            slug,
            description,
        })
        return response.data.data
    },

    // Update tag (admin/instructor)
    async updateTag(
        tagId: number,
        data: { name?: string; slug?: string; description?: string }
    ): Promise<Tag> {
        const response = await apiClient.put<ApiResponse<Tag>>(
            `/tags/${tagId}`,
            data
        )
        return response.data.data
    },

    // Delete tag (admin/instructor)
    async deleteTag(tagId: string): Promise<void> {
        await apiClient.delete(`/tags/${tagId}`)
    },
}
