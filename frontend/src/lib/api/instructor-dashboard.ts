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

export interface InstructorRevenueData {
    totalRevenue: number
    period: 'day' | 'week' | 'month' | 'year'
    revenueChart: RevenueChartData[]
    recentOrders: Order[]
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
     * @param period - 'day' | 'week' | 'month' | 'year'
     */
    async getInstructorRevenue(
        period: 'day' | 'week' | 'month' | 'year' = 'month'
    ): Promise<InstructorRevenueData> {
        const response = await apiClient.get<
            ApiResponse<InstructorRevenueData>
        >(`/dashboard/instructor/revenue?period=${period}`)
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
