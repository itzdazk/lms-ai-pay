import apiClient from './client'
import type { ApiResponse, PaginatedResponse, PaginatedApiResponse } from './types'
import type { User } from './types'

// Types based on ADMIN_COURSE_API_RULES.md
export interface AdminCourse {
    id: number
    title: string
    slug: string
    shortDescription: string
    thumbnailUrl: string | null
    price: number
    discountPrice: number | null
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
    durationHours: number
    totalLessons: number
    ratingAvg: number | null
    ratingCount: number
    enrolledCount: number
    viewsCount: number
    completionRate: number | null
    isFeatured: boolean | null
    publishedAt: string | null
    createdAt: string
    updatedAt: string
    instructor: {
        id: number
        userName: string
        fullName: string
        email: string
        avatarUrl: string | null
    }
    category: {
        id: number
        name: string
        slug: string
    }
    lessonsCount: number
    enrollmentsCount: number
    ordersCount: number
}

export interface AdminCourseFilters {
    page?: number
    limit?: number
    search?: string
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
    categoryId?: number
    level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
    instructorId?: number
    isFeatured?: boolean
    sort?:
        | 'newest'
        | 'oldest'
        | 'updated'
        | 'updated-oldest'
        | 'popular'
        | 'enrollments'
        | 'rating'
        | 'price_asc'
        | 'price_desc'
        | 'views'
        | 'title'
    minPrice?: number
    maxPrice?: number
    minEnrollments?: number
    maxEnrollments?: number
    minRating?: number
}

export interface PlatformAnalytics {
    overview: {
        courses: {
            total: number
            published: number
            draft: number
            archived: number
            featured: number
            publishedLast30Days: number
        }
        enrollments: {
            total: number
            active: number
            completed: number
            last30Days: number
            last7Days: number
            completionRate: number
        }
        revenue: {
            total: number
            last30Days: number
            totalOrders: number
            ordersLast30Days: number
            averageOrderValue: number
        }
        users: {
            total: number
            instructors: number
            students: number
            newUsersLast30Days: number
        }
    }
    topPerformers: {
        coursesByEnrollments: AdminCourse[]
        coursesByRevenue: Array<
            AdminCourse & { totalRevenue: number; totalOrders: number }
        >
        instructors: Array<{
            id: number
            userName: string
            fullName: string
            email: string
            avatarUrl: string | null
            totalCourses: number
            totalEnrollments: number
            averageRating: number
        }>
    }
    distribution: {
        categories: Array<{
            categoryId: number
            categoryName: string
            categorySlug: string
            courseCount: number
        }>
    }
    trends: {
        enrollments: Array<{ date: string; enrollments: number }>
        revenue: Array<{ date: string; revenue: number; orders: number }>
    }
}

// API Functions
export const adminCoursesApi = {
    /**
     * Get all courses with admin filters
     */
    async getAllCourses(
        filters: AdminCourseFilters = {}
    ): Promise<PaginatedResponse<AdminCourse>> {
        const params = new URLSearchParams()

        if (filters.page) params.append('page', filters.page.toString())
        if (filters.limit) params.append('limit', filters.limit.toString())
        if (filters.search) params.append('search', filters.search)
        if (filters.status) params.append('status', filters.status)
        if (filters.categoryId)
            params.append('categoryId', filters.categoryId.toString())
        if (filters.level) params.append('level', filters.level)
        if (filters.instructorId)
            params.append('instructorId', filters.instructorId.toString())
        if (filters.isFeatured !== undefined)
            params.append('isFeatured', filters.isFeatured.toString())
        if (filters.sort) params.append('sort', filters.sort)
        if (filters.minPrice !== undefined)
            params.append('minPrice', filters.minPrice.toString())
        if (filters.maxPrice !== undefined)
            params.append('maxPrice', filters.maxPrice.toString())
        if (filters.minEnrollments !== undefined)
            params.append('minEnrollments', filters.minEnrollments.toString())
        if (filters.maxEnrollments !== undefined)
            params.append('maxEnrollments', filters.maxEnrollments.toString())
        if (filters.minRating !== undefined)
            params.append('minRating', filters.minRating.toString())

        const response = await apiClient.get<PaginatedApiResponse<AdminCourse>>(
            `/admin/courses?${params.toString()}`
        )

        return response.data
    },

    /**
     * Toggle course featured status
     */
    async toggleCourseFeatured(
        courseId: number,
        isFeatured: boolean
    ): Promise<AdminCourse> {
        const response = await apiClient.patch<ApiResponse<AdminCourse>>(
            `/admin/courses/${courseId}/featured`,
            { isFeatured }
        )

        return response.data.data
    },

    /**
     * Get platform analytics
     */
    async getPlatformAnalytics(): Promise<PlatformAnalytics> {
        const response = await apiClient.get<ApiResponse<PlatformAnalytics>>(
            '/admin/courses/analytics'
        )

        return response.data.data
    },

    /**
     * Get all instructors for course filtering (admin only)
     */
    async getInstructorsForCourses(limit = 1000): Promise<User[]> {
        const response = await apiClient.get<ApiResponse<User[]>>(
            `/admin/courses/instructors?limit=${limit}`
        )

        return response.data.data
    },
}
