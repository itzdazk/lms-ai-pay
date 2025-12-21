import apiClient from './client'
import type { ApiResponse, PaymentTransaction } from './types'

/**
 * Transaction filters for querying transactions
 */
export interface TransactionFilters {
    page?: number
    limit?: number
    status?: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'
    paymentGateway?: 'VNPay' | 'MoMo'
    startDate?: string
    endDate?: string
    userId?: number // Admin only
}

/**
 * Transactions API client
 */
export const transactionsApi = {
    /**
     * Get transactions list with filters and pagination
     */
    async getTransactions(filters?: TransactionFilters): Promise<{
        transactions: PaymentTransaction[]
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
        if (filters?.status) params.append('status', filters.status)
        if (filters?.paymentGateway)
            params.append('paymentGateway', filters.paymentGateway)
        if (filters?.startDate) params.append('startDate', filters.startDate)
        if (filters?.endDate) params.append('endDate', filters.endDate)
        if (filters?.userId) params.append('userId', filters.userId.toString())

        const response = await apiClient.get<
            ApiResponse<{
                data: PaymentTransaction[]
                pagination: {
                    page: number
                    limit: number
                    total: number
                    totalPages: number
                }
            }>
        >(`/transactions?${params.toString()}`)

        // Backend returns { data: [...], pagination: {...} } inside response.data.data
        const result = response.data.data

        return {
            transactions: Array.isArray(result?.data) ? result.data : [],
            pagination: result?.pagination || {
                page: 1,
                limit: 10,
                total: 0,
                totalPages: 0,
            },
        }
    },

    /**
     * Get transaction detail by ID
     */
    async getTransactionById(
        transactionId: number | string
    ): Promise<PaymentTransaction> {
        const response = await apiClient.get<ApiResponse<PaymentTransaction>>(
            `/transactions/${transactionId}`
        )
        return response.data.data
    },
}
