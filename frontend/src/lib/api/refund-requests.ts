import apiClient from './client'
import type { ApiResponse, PaginatedApiResponse } from './types'

/**
 * Refund request status
 */
export type RefundRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

/**
 * Refund reason types
 */
export type RefundReasonType =
    | 'MEDICAL'
    | 'FINANCIAL_EMERGENCY'
    | 'DISSATISFACTION'
    | 'OTHER'

/**
 * Refund types
 */
export type RefundType = 'FULL' | 'PARTIAL'

/**
 * Refund eligibility result
 */
export interface RefundEligibility {
    eligible: boolean
    type: RefundType | null
    suggestedAmount: number | null
    message: string
    progressPercentage?: number
    daysSincePayment?: number
}

/**
 * Refund request
 */
export interface RefundRequest {
    id: number
    orderId: number
    studentId: number
    reason: string
    reasonType?: RefundReasonType | null
    status: RefundRequestStatus
    refundType?: RefundType | null
    progressPercentage: number
    suggestedRefundAmount?: number | null
    requestedRefundAmount?: number | null
    adminNotes?: string | null
    offerExpiresAt?: string | null
    studentAcceptedOffer?: boolean
    studentRejectedOffer?: boolean
    processedAt?: string | null
    processedBy?: number | null
    createdAt: string
    updatedAt: string
    order?: {
        id: number
        orderCode: string
        originalPrice: number
        discountAmount: number
        finalPrice: number
        paymentGateway?: string
        paymentStatus?: string
        refundAmount?: number
        refundedAt?: string | null
        paidAt?: string | null
        createdAt: string
        notes?: string | null
        course?: {
            id: number
            title: string
            thumbnailUrl?: string | null
            price?: number
            discountPrice?: number | null
            durationHours?: number
            totalLessons?: number
            instructor?: {
                id: number
                fullName: string
            }
        }
        user?: {
            id: number
            fullName: string
            email: string
        }
    }
    student?: {
        id: number
        fullName: string
        email: string
    }
}

/**
 * Create refund request request
 */
export interface CreateRefundRequestRequest {
    orderId: number
    reason: string
    reasonType?: RefundReasonType
}

/**
 * Refund requests API client
 */
export const refundRequestsApi = {
    /**
     * Create a refund request
     */
    async createRefundRequest(
        payload: CreateRefundRequestRequest
    ): Promise<RefundRequest> {
        const response = await apiClient.post<ApiResponse<RefundRequest>>(
            '/refund-requests',
            payload
        )
        return response.data.data
    },

    /**
     * Get student's refund requests
     */
    async getStudentRefundRequests(params?: {
        page?: number
        limit?: number
        status?: RefundRequestStatus
    }): Promise<PaginatedApiResponse<RefundRequest>> {
        const response = await apiClient.get<
            PaginatedApiResponse<RefundRequest>
        >('/refund-requests', { params })
        return response.data
    },

    /**
     * Get refund request by ID
     */
    async getRefundRequestById(requestId: number): Promise<RefundRequest> {
        const response = await apiClient.get<ApiResponse<RefundRequest>>(
            `/refund-requests/${requestId}`
        )
        return response.data.data
    },

    /**
     * Get refund request for an order
     */
    async getRefundRequestByOrderId(
        orderId: number
    ): Promise<RefundRequest | null> {
        const response = await apiClient.get<ApiResponse<RefundRequest | null>>(
            `/refund-requests/order/${orderId}`
        )
        return response.data.data
    },

    /**
     * Check refund eligibility for an order
     */
    async getRefundEligibility(orderId: number): Promise<RefundEligibility> {
        const response = await apiClient.get<ApiResponse<RefundEligibility>>(
            `/refund-requests/eligibility/${orderId}`
        )
        return response.data.data
    },

    /**
     * Process refund request (Admin only)
     */
    async processRefundRequest(
        requestId: number,
        action: 'APPROVE' | 'REJECT',
        customAmount?: number | null,
        notes?: string | null
    ): Promise<{
        refundRequest: RefundRequest
        refundTransaction?: any
        order?: any
    }> {
        const response = await apiClient.post<
            ApiResponse<{
                refundRequest: RefundRequest
                refundTransaction?: any
                order?: any
            }>
        >(`/refund-requests/${requestId}/process`, {
            action,
            customAmount,
            notes,
        })
        return response.data.data
    },

    /**
     * Get all refund requests (Admin only)
     */
    async getAllRefundRequests(params?: {
        page?: number
        limit?: number
        status?: RefundRequestStatus
        search?: string
        sort?: 'newest' | 'oldest'
    }): Promise<PaginatedApiResponse<RefundRequest>> {
        const response = await apiClient.get<
            PaginatedApiResponse<RefundRequest>
        >('/admin/refund-requests', { params })
        return response.data
    },
}
