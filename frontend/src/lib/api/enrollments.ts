// Enrollment API Service
import apiClient from './client'
import type {
    Enrollment,
    EnrollmentFilters,
    ApiResponse,
    PaginatedApiResponse,
} from './types'

// Extended types for enrollment with course
export interface EnrollmentWithCourse extends Enrollment {
    course: {
        id: number
        title: string
        slug: string
        thumbnailUrl?: string
        instructor: {
            id: number
            fullName: string
            avatarUrl?: string
        }
        totalLessons: number
        durationHours: number
        level: string
        ratingAvg: number
    }
}

export interface EnrollmentCheckResponse {
    success: boolean
    message: string
    data: {
        isEnrolled: boolean
        enrollment?: Enrollment
    }
}

export interface CreateEnrollmentRequest {
    courseId: number
    paymentGateway?: 'VNPay' | 'MoMo'
    billingAddress?: {
        fullName?: string
        email?: string
        phone?: string
        address?: string
        city?: string
        country?: string
    }
}

export interface CreateEnrollmentResponse {
    // For free course: enrollment object directly
    id?: number
    userId?: number
    courseId?: number
    enrolledAt?: string
    status?: string
    progressPercentage?: string | number
    course?: any
    // For paid course: order object
    enrollment?: Enrollment
    order?: {
        id: number
        orderCode: string
        finalPrice: number
        paymentStatus: string
    }
    redirectUrl?: string
}

export const enrollmentsApi = {
    /**
     * Get all enrollments with filters
     */
    async getEnrollments(
        filters?: EnrollmentFilters
    ): Promise<PaginatedApiResponse<EnrollmentWithCourse>> {
        const params = new URLSearchParams()
        if (filters?.page) params.append('page', filters.page.toString())
        if (filters?.limit) params.append('limit', filters.limit.toString())
        if (filters?.status) params.append('status', filters.status)
        if (filters?.search) params.append('search', filters.search)
        if (filters?.sort) params.append('sort', filters.sort)

        const response = await apiClient.get<
            PaginatedApiResponse<EnrollmentWithCourse>
        >(`/enrollments?${params.toString()}`)
        return response.data
    },

    /**
     * Get active enrollments
     */
    async getActiveEnrollments(
        limit = 10
    ): Promise<ApiResponse<EnrollmentWithCourse[]>> {
        const response = await apiClient.get<
            ApiResponse<EnrollmentWithCourse[]>
        >(`/enrollments/active?limit=${limit}`)
        return response.data
    },

    /**
     * Get completed enrollments
     */
    async getCompletedEnrollments(
        page = 1,
        limit = 20
    ): Promise<PaginatedApiResponse<EnrollmentWithCourse>> {
        const response = await apiClient.get<
            PaginatedApiResponse<EnrollmentWithCourse>
        >(`/enrollments/completed?page=${page}&limit=${limit}`)
        return response.data
    },

    /**
     * Get enrollment by ID
     */
    async getEnrollmentById(
        id: number
    ): Promise<ApiResponse<EnrollmentWithCourse>> {
        const response = await apiClient.get<ApiResponse<EnrollmentWithCourse>>(
            `/enrollments/${id}`
        )
        return response.data
    },

    /**
     * Check enrollment status for a course
     */
    async checkEnrollment(courseId: number): Promise<EnrollmentCheckResponse> {
        const response = await apiClient.get<EnrollmentCheckResponse>(
            `/enrollments/check/${courseId}`
        )
        return response.data
    },

    /**
     * Create enrollment (free course) or create order (paid course)
     */
    async createEnrollment(
        request: CreateEnrollmentRequest
    ): Promise<ApiResponse<CreateEnrollmentResponse>> {
        const response = await apiClient.post<
            ApiResponse<CreateEnrollmentResponse>
        >('/enrollments', request)
        return response.data
    },
}
