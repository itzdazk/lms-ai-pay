import apiClient from './client'
import type {
    ApiResponse,
    PaginatedApiResponse,
    Course,
    Enrollment,
    Order,
} from './types'

// =====================================================
// INSTRUCTOR DASHBOARD TYPES
// =====================================================
export interface InstructorDashboardData {
    stats: InstructorStats
    recentCourses: Course[]
}

export interface InstructorStats {
    totalCourses: number
    publishedCourses: number
    draftCourses: number
    totalEnrollments: number
    activeEnrollments: number
    totalStudents: number
    totalRevenue: number
    averageRating: number
}

export interface RevenueChartData {
    period: string
    revenue: number
    orders: number
}

export interface CourseRevenueData {
    courseId: number
    courseTitle: string
    courseThumbnailUrl: string | null
    coursePrice: number
    orderCount: number
    revenue: number
}

export interface InstructorRevenueData {
    totalRevenue: number
    totalOrders: number
    period: 'day' | 'week' | 'month' | 'year'
    revenueChart: RevenueChartData[]
    recentOrders: Order[]
    courseId: number | null
    year: number
    month: number | null
}

export interface CoursePerformance {
    courseId: number
    title: string
    slug: string
    status: string
    totalLessons: number
    publishedLessons: number
    totalEnrollments: number
    activeEnrollments: number
    completedEnrollments: number
    completionRate: number
    ratingAvg: number
    ratingCount: number
    enrolledCount: number
}

export interface EnrollmentTrendData {
    date: string
    count: number
}

export interface InstructorAnalyticsData {
    overview: {
        totalCourses: number
        publishedCourses: number
        totalEnrollments: number
        totalLessons: number
    }
    courseAnalytics: CoursePerformance[]
    enrollmentTrend: EnrollmentTrendData[]
}

export interface Student {
    user: {
        id: number
        userName: string
        email: string
        fullName: string
        avatarUrl: string | null
    }
    enrollments: Array<{
        courseId: number
        courseTitle: string
        courseSlug: string
        enrolledAt: string
        status: string
        progressPercentage: number
    }>
    totalEnrollments: number
}

export interface InstructorStudentsData {
    students: Student[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

export interface InstructorEnrollmentsData {
    enrollments: Enrollment[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

// =====================================================
// API CLIENT
// =====================================================
export const instructorDashboardApi = {
    /**
     * Get instructor dashboard overview
     */
    async getInstructorDashboard(): Promise<InstructorDashboardData> {
        const response = await apiClient.get<
            ApiResponse<InstructorDashboardData>
        >('/dashboard/instructor')
        return response.data.data
    },

    /**
     * Get instructor statistics
     */
    async getInstructorStats(): Promise<InstructorStats> {
        const response = await apiClient.get<ApiResponse<InstructorStats>>(
            '/dashboard/instructor/stats'
        )
        return response.data.data
    },

    /**
     * Get instructor revenue data
     * @param params - Revenue query parameters
     */
    async getInstructorRevenue(params?: {
        period?: 'day' | 'week' | 'month' | 'year'
        courseId?: number | null
        year?: number // Required, defaults to current year
        month?: number | null // Optional, 1-12 or null for all months
    }): Promise<InstructorRevenueData> {
        const queryParams = new URLSearchParams()
        if (params?.period) queryParams.append('period', params.period)
        // Only send courseId if it's explicitly provided and not null
        // null means "all courses", so we don't send it
        if (params?.courseId !== null && params?.courseId !== undefined) {
            queryParams.append('courseId', params.courseId.toString())
        }
        // Year is required, default to current year if not provided
        const year = params?.year ?? new Date().getFullYear()
        queryParams.append('year', year.toString())
        // Month is optional (1-12)
        if (params?.month !== null && params?.month !== undefined && params.month >= 1 && params.month <= 12) {
            queryParams.append('month', params.month.toString())
        }

        const url = `/dashboard/instructor/revenue${
            queryParams.toString() ? `?${queryParams.toString()}` : ''
        }`
        const response = await apiClient.get<
            ApiResponse<InstructorRevenueData>
        >(url)
        return response.data.data
    },

    /**
     * Get instructor revenue orders (paid orders for revenue report)
     * @param params - Parameters for revenue orders query
     */
    async getInstructorRevenueOrders(params?: {
        year?: number
        month?: number | null
        courseId?: number | null
        page?: number
        limit?: number
    }): Promise<{
        orders: Order[]
        totalRevenue: number
        pagination: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }> {
        const queryParams = new URLSearchParams()
        // Year is required, default to current year if not provided
        const year = params?.year ?? new Date().getFullYear()
        queryParams.append('year', year.toString())
        // Month is optional (1-12)
        if (params?.month !== null && params?.month !== undefined && params.month >= 1 && params.month <= 12) {
            queryParams.append('month', params.month.toString())
        }
        // Only send courseId if it's explicitly provided and not null
        if (params?.courseId !== null && params?.courseId !== undefined) {
            queryParams.append('courseId', params.courseId.toString())
        }
        if (params?.page) queryParams.append('page', params.page.toString())
        if (params?.limit) queryParams.append('limit', params.limit.toString())

        const url = `/dashboard/instructor/revenue/orders?${queryParams.toString()}`
        const response = await apiClient.get<ApiResponse<{
            orders: Order[]
            totalRevenue: number
            pagination: {
                page: number
                limit: number
                total: number
                totalPages: number
            }
        }>>(url)
        return response.data.data
    },

    /**
     * Get instructor revenue grouped by courses (optimized)
     */
    async getInstructorRevenueByCourses(params?: {
        year?: number
        month?: number | null
        courseId?: number | null
        page?: number
        limit?: number
    }): Promise<{
        courses: CourseRevenueData[]
        totalRevenue: number
        pagination: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }> {
        const queryParams = new URLSearchParams()
        const year = params?.year ?? new Date().getFullYear()
        queryParams.append('year', year.toString())
        if (params?.month !== null && params?.month !== undefined && params.month >= 1 && params.month <= 12) {
            queryParams.append('month', params.month.toString())
        }
        if (params?.courseId !== null && params?.courseId !== undefined) {
            queryParams.append('courseId', params.courseId.toString())
        }
        if (params?.page) queryParams.append('page', params.page.toString())
        if (params?.limit) queryParams.append('limit', params.limit.toString())

        const url = `/dashboard/instructor/revenue/courses${
            queryParams.toString() ? `?${queryParams.toString()}` : ''
        }`
        const response = await apiClient.get<
            ApiResponse<{
                courses: CourseRevenueData[]
                totalRevenue: number
                pagination: {
                    page: number
                    limit: number
                    total: number
                    totalPages: number
                }
            }>
        >(url)
        return response.data.data
    },

    /**
     * Get instructor analytics
     */
    async getInstructorAnalytics(): Promise<InstructorAnalyticsData> {
        const response = await apiClient.get<
            ApiResponse<InstructorAnalyticsData>
        >('/dashboard/instructor/analytics')
        return response.data.data
    },

    /**
     * Get instructor students list
     */
    async getInstructorStudents(params?: {
        page?: number
        limit?: number
        search?: string
    }): Promise<InstructorStudentsData> {
        const queryParams = new URLSearchParams()
        if (params?.page) queryParams.append('page', params.page.toString())
        if (params?.limit) queryParams.append('limit', params.limit.toString())
        if (params?.search) queryParams.append('search', params.search)

        const url = `/dashboard/instructor/students${
            queryParams.toString() ? `?${queryParams.toString()}` : ''
        }`
        const response = await apiClient.get<
            ApiResponse<InstructorStudentsData>
        >(url)
        return response.data.data
    },

    /**
     * Get instructor revenue chart data (grouped by month or day)
     * @param params - Parameters for revenue chart query
     */
    async getInstructorRevenueChartData(params?: {
        year?: number
        month?: number | null
        courseId?: number | null
    }): Promise<
        Array<{
            period: string | number
            periodLabel: string
            revenue: number
            orders: number
            date: string
        }>
    > {
        const queryParams = new URLSearchParams()
        // Year is required, default to current year if not provided
        const year = params?.year ?? new Date().getFullYear()
        queryParams.append('year', year.toString())
        // Month is optional (1-12 or null for all months)
        if (params?.month !== null && params?.month !== undefined && params.month >= 1 && params.month <= 12) {
            queryParams.append('month', params.month.toString())
        }
        // Only send courseId if it's explicitly provided and not null
        if (params?.courseId !== null && params?.courseId !== undefined) {
            queryParams.append('courseId', params.courseId.toString())
        }

        const url = `/dashboard/instructor/revenue/chart${
            queryParams.toString() ? `?${queryParams.toString()}` : ''
        }`
        const response = await apiClient.get<
            ApiResponse<
                Array<{
                    period: string | number
                    periodLabel: string
                    revenue: number
                    date: string
                }>
            >
        >(url)
        return response.data.data
    },

    /**
     * Get instructor enrollments list
     */
    async getInstructorEnrollments(params?: {
        page?: number
        limit?: number
        search?: string
        courseId?: number
        status?: string
        startDate?: string
        endDate?: string
        sort?: string
    }): Promise<InstructorEnrollmentsData> {
        const queryParams = new URLSearchParams()
        if (params?.page) queryParams.append('page', params.page.toString())
        if (params?.limit) queryParams.append('limit', params.limit.toString())
        if (params?.search) queryParams.append('search', params.search)
        if (params?.courseId)
            queryParams.append('courseId', params.courseId.toString())
        if (params?.status) queryParams.append('status', params.status)
        if (params?.startDate) queryParams.append('startDate', params.startDate)
        if (params?.endDate) queryParams.append('endDate', params.endDate)
        if (params?.sort) queryParams.append('sort', params.sort)

        const url = `/dashboard/instructor/enrollments${
            queryParams.toString() ? `?${queryParams.toString()}` : ''
        }`
        const response = await apiClient.get<PaginatedApiResponse<Enrollment>>(
            url
        )
        return {
            enrollments: response.data.data,
            pagination: response.data.pagination,
        }
    },
}
