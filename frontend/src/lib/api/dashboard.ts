import apiClient from './client'
import type {
    ApiResponse,
    DashboardStats,
    LearningProgress,
    Course,
    Order,
    Enrollment,
    PaginatedApiResponse,
} from './types'

export const dashboardApi = {
    // Get student dashboard stats
    async getStudentStats(): Promise<DashboardStats> {
        const response = await apiClient.get<ApiResponse<DashboardStats>>(
            '/dashboard/stats'
        )
        return response.data.data
    },

    // Get learning progress
    async getLearningProgress(): Promise<LearningProgress[]> {
        const response = await apiClient.get<ApiResponse<LearningProgress[]>>(
            '/dashboard/progress'
        )
        return response.data.data
    },

    // Get completed courses
    async getCompletedCourses(): Promise<Course[]> {
        const response = await apiClient.get<ApiResponse<Course[]>>(
            '/dashboard/completed'
        )
        return response.data.data
    },

    // Get recommended courses (AI recommendations)
    async getRecommendedCourses(): Promise<Course[]> {
        const response = await apiClient.get<ApiResponse<Course[]>>(
            '/dashboard/recommendations'
        )
        return response.data.data
    },

    // Get instructor dashboard stats
    async getInstructorStats(): Promise<{
        totalCourses: number
        totalStudents: number
        totalRevenue: number
        averageRating: number
    }> {
        const response = await apiClient.get<ApiResponse<any>>(
            '/dashboard/instructor/stats'
        )
        return response.data.data
    },

    // Get instructor courses
    async getInstructorCourses(): Promise<Course[]> {
        const response = await apiClient.get<ApiResponse<Course[]>>(
            '/dashboard/instructor/courses'
        )
        return response.data.data
    },

    // Admin Dashboard APIs
    async getAdminDashboard(): Promise<any> {
        const response = await apiClient.get<ApiResponse<any>>(
            '/dashboard/admin'
        )
        return response.data.data
    },

    async getAdminStats(): Promise<any> {
        const response = await apiClient.get<ApiResponse<any>>(
            '/dashboard/admin/user-stats'
        )
        return response.data.data
    },

    async getAdminUsersAnalytics(): Promise<any> {
        const response = await apiClient.get<ApiResponse<any>>(
            '/dashboard/admin/users-analytics'
        )
        return response.data.data
    },

    async getAdminCoursesAnalytics(): Promise<any> {
        const response = await apiClient.get<ApiResponse<any>>(
            '/dashboard/admin/courses-analytics'
        )
        return response.data.data
    },

    async getAdminRevenueAnalytics(): Promise<any> {
        const response = await apiClient.get<ApiResponse<any>>(
            '/dashboard/admin/revenue'
        )
        return response.data.data
    },

    async getAdminRecentActivities(limit?: number): Promise<any> {
        const params = limit ? `?limit=${limit}` : ''
        const response = await apiClient.get<ApiResponse<any>>(
            `/dashboard/admin/activities${params}`
        )
        return response.data.data
    },

    // Instructor Orders APIs
    async getInstructorOrders(filters?: {
        page?: number
        limit?: number
        search?: string
        paymentStatus?: string
        paymentGateway?: string
        courseId?: number
        startDate?: string
        endDate?: string
        sort?: string
    }): Promise<{
        orders: Order[]
        pagination: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }> {
        const params = new URLSearchParams()
        if (filters?.page) params.append('page', filters.page.toString())
        if (filters?.limit) params.append('limit', filters.limit.toString())
        if (filters?.search) params.append('search', filters.search)
        if (filters?.paymentStatus)
            params.append('paymentStatus', filters.paymentStatus)
        if (filters?.paymentGateway)
            params.append('paymentGateway', filters.paymentGateway)
        if (filters?.courseId)
            params.append('courseId', filters.courseId.toString())
        if (filters?.startDate) params.append('startDate', filters.startDate)
        if (filters?.endDate) params.append('endDate', filters.endDate)
        if (filters?.sort) params.append('sort', filters.sort)

        const response = await apiClient.get<PaginatedApiResponse<Order>>(
            `/dashboard/instructor/orders?${params.toString()}`
        )
        return {
            orders: response.data.data,
            pagination: response.data.pagination,
        }
    },

    // Instructor Enrollments APIs
    async getInstructorEnrollments(filters?: {
        page?: number
        limit?: number
        search?: string
        courseId?: number
        status?: string
        startDate?: string
        endDate?: string
        sort?: string
    }): Promise<{
        enrollments: Enrollment[]
        pagination: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }> {
        const params = new URLSearchParams()
        if (filters?.page) params.append('page', filters.page.toString())
        if (filters?.limit) params.append('limit', filters.limit.toString())
        if (filters?.search) params.append('search', filters.search)
        if (filters?.courseId)
            params.append('courseId', filters.courseId.toString())
        if (filters?.status) params.append('status', filters.status)
        if (filters?.startDate) params.append('startDate', filters.startDate)
        if (filters?.endDate) params.append('endDate', filters.endDate)
        if (filters?.sort) params.append('sort', filters.sort)

        const response = await apiClient.get<PaginatedApiResponse<Enrollment>>(
            `/dashboard/instructor/enrollments?${params.toString()}`
        )
        return {
            enrollments: response.data.data,
            pagination: response.data.pagination,
        }
    },
}
