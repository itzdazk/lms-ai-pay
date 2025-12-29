import apiClient from './client'
import type { ApiResponse } from './types'

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface DashboardOverview {
    summary: {
        users: {
            total: number
            active: number
            instructors: number
            students: number
            newToday: number
            newThisMonth: number
            growthPercentage: number
        }
        courses: {
            total: number
            published: number
            draft: number
            publishedThisMonth: number
        }
        enrollments: {
            total: number
            active: number
            completed: number
            today: number
            thisMonth: number
            growthPercentage: number
            completionRate: number
        }
        revenue: {
            total: number
            today: number
            thisMonth: number
            growthPercentage: number
            averageOrderValue: number
        }
        orders: {
            total: number
            paid: number
            pending: number
            today: number
            conversionRate: number
        }
    }
}

export interface UsersAnalytics {
    registrationTrend: Array<{
        date: string
        users: number
    }>
    distribution: {
        byRole: Array<{ role: string; count: number }>
        byStatus: Array<{ status: string; count: number }>
    }
    topActiveUsers: Array<{
        id: number
        userName: string
        fullName: string
        email: string
        avatarUrl: string | null
        totalEnrollments: number
        completedLessons: number
    }>
    recentUsers: Array<{
        id: number
        userName: string
        fullName: string
        email: string
        role: string
        status: string
        createdAt: string
    }>
}

export interface CoursesAnalytics {
    distribution: {
        byCategory: Array<{
            categoryId: number
            categoryName: string
            categorySlug: string
            courseCount: number
            totalEnrollments: number
        }>
        byLevel: Array<{
            level: string | null
            courseCount: number
            totalEnrollments: number
        }>
    }
    topPerformingCourses: Array<{
        id: number
        title: string
        slug: string
        thumbnailUrl: string | null
        price: number
        enrolledCount: number
        ratingAvg: number
        ratingCount: number
        viewsCount: number
        instructor: {
            id: number
            userName: string
            fullName: string
        }
        category: {
            id: number
            name: string
        }
    }>
    metrics: {
        averageEnrollments: number
        averageRating: number
        averageViews: number
        averageCompletionRate: number
    }
}

export interface RevenueAnalytics {
    trend: Array<{
        date: string
        revenue: number
        orders: number
    }>
    byPaymentGateway: Array<{
        gateway: string
        revenue: number
        orders: number
    }>
    topRevenueCourses: Array<{
        id: number
        title: string
        slug: string
        thumbnailUrl: string | null
        price: number
        totalRevenue: number
        totalOrders: number
        instructor: {
            id: number
            userName: string
            fullName: string
        }
    }>
    monthlyComparison: {
        current: {
            revenue: number
            orders: number
        }
        previous: {
            revenue: number
            orders: number
        }
        growth: number
    }
}

export type ActivityType =
    | 'order'
    | 'enrollment'
    | 'user_registration'
    | 'course_published'

export interface Activity {
    type: ActivityType
    id: number
    timestamp: string
    message?: string
    metadata?: {
        user?: { id: number; name: string; userName?: string; fullName?: string; email?: string }
        course?: { id: number; title: string; slug?: string }
        amount?: number
        orderCode?: string
        paymentGateway?: string
        role?: string
        instructor?: { id: number; userName: string; fullName: string }
    }
}

export interface RecentActivities {
    recentOrders: Array<{
        type: 'order'
        id: number
        orderCode: string
        amount: number
        paymentGateway: string
        timestamp: string
        user: {
            id: number
            userName: string
            fullName: string
            email: string
        }
        course: {
            id: number
            title: string
            slug: string
        }
    }>
    recentEnrollments: Array<{
        type: 'enrollment'
        id: number
        timestamp: string
        user: {
            id: number
            userName: string
            fullName: string
        }
        course: {
            id: number
            title: string
            slug: string
        }
    }>
    recentUsers: Array<{
        type: 'user_registration'
        id: number
        userName: string
        fullName: string
        email: string
        role: string
        timestamp: string
    }>
    recentCourses: Array<{
        type: 'course_published'
        id: number
        title: string
        slug: string
        timestamp: string
        instructor: {
            id: number
            userName: string
            fullName: string
        }
    }>
}

export interface SystemStats {
    content: {
        lessons: {
            total: number
            published: number
        }
        quizzes: {
            total: number
        }
    }
    engagement: {
        progress: {
            total: number
            completed: number
            completionRate: number
        }
        notifications: {
            total: number
            unread: number
        }
    }
    transactions: {
        total: number
        successful: number
        successRate: number
    }
}

// =====================================================
// API CLIENT
// =====================================================

export const adminDashboardApi = {
    /**
     * Get dashboard overview
     */
    getOverview: async (): Promise<DashboardOverview> => {
        const response = await apiClient.get<ApiResponse<DashboardOverview>>(
            '/dashboard/admin'
        )
        return response.data.data
    },

    /**
     * Get user statistics
     */
    getUserStats: async () => {
        const response = await apiClient.get<ApiResponse<any>>(
            '/dashboard/admin/user-stats'
        )
        return response.data.data
    },

    /**
     * Get system statistics
     */
    getSystemStats: async (): Promise<SystemStats> => {
        const response = await apiClient.get<ApiResponse<SystemStats>>(
            '/dashboard/admin/stats'
        )
        return response.data.data
    },

    /**
     * Get user analytics
     */
    getUsersAnalytics: async (): Promise<UsersAnalytics> => {
        const response = await apiClient.get<ApiResponse<UsersAnalytics>>(
            '/dashboard/admin/users-analytics'
        )
        return response.data.data
    },

    /**
     * Get course analytics
     */
    getCoursesAnalytics: async (): Promise<CoursesAnalytics> => {
        const response = await apiClient.get<ApiResponse<CoursesAnalytics>>(
            '/dashboard/admin/courses-analytics'
        )
        return response.data.data
    },

    /**
     * Get revenue analytics
     */
    getRevenueAnalytics: async (): Promise<RevenueAnalytics> => {
        const response = await apiClient.get<ApiResponse<RevenueAnalytics>>(
            '/dashboard/admin/revenue'
        )
        return response.data.data
    },

    /**
     * Get recent activities
     */
    getActivities: async (limit: number = 20): Promise<RecentActivities> => {
        const response = await apiClient.get<ApiResponse<RecentActivities>>(
            '/dashboard/admin/activities',
            {
                params: { limit },
            }
        )
        return response.data.data
    },
}


