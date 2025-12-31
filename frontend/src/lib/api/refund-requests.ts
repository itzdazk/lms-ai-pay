import apiClient from './client'
import type { ApiResponse, PaginatedApiResponse } from './types'

/**
 * Refund request status
 */
export type RefundRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

/**
 * Refund request
 */
export interface RefundRequest {
    id: number
    orderId: number
    studentId: number
    reason: string
    status: RefundRequestStatus
    progressPercentage: number
    adminNotes?: string | null
    processedAt?: string | null
    processedBy?: number | null
    createdAt: string
    updatedAt: string
    order?: {
        id: number
        orderCode: string
        finalPrice: number
        course?: {
            id: number
            title: string
            thumbnailUrl?: string | null
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
}

