import apiClient from './client'
import type { ApiResponse, PaginatedApiResponse } from './types'
import type { Order } from './types'

/**
 * Admin Order Filters
 */
export interface AdminOrderFilters {
    page?: number
    limit?: number
    paymentStatus?:
        | 'PENDING'
        | 'PAID'
        | 'FAILED'
        | 'REFUNDED'
        | 'PARTIALLY_REFUNDED'
    search?: string
    sort?: 'newest' | 'oldest' | 'amount_asc' | 'amount_desc'
    startDate?: string
    endDate?: string
    minAmount?: number
    maxAmount?: number
}

/**
 * Admin Order Statistics
 */
export interface AdminOrderStats {
    overview: {
        totalOrders: number
        paidOrders: number
        pendingOrders: number
        failedOrders: number
        conversionRate: number
    }
    today: {
        orders: number
        revenue: number
    }
    thisMonth: {
        orders: number
        revenue: number
        orderGrowth?: number
        revenueGrowth?: number
    }
    lastMonth: {
        orders: number
        revenue: number
    }
    allTime: {
        revenue: number
        averageOrderValue: number
    }
}

/**
 * Revenue Trend Data Point
 */
export interface RevenueTrendPoint {
    date: string
    revenue: number
    orders: number
}

/**
 * Refund Request
 */
export interface RefundRequest {
    amount?: number
    reason?: string
}

/**
 * Admin Orders API client
 */
export const adminOrdersApi = {
    /**
     * Get all orders with admin filters
     */
    async getAllOrders(filters?: AdminOrderFilters): Promise<{
        data: Order[]
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
        if (filters?.paymentStatus)
            params.append('paymentStatus', filters.paymentStatus)
        if (filters?.search) params.append('search', filters.search)
        if (filters?.sort) params.append('sort', filters.sort)
        if (filters?.startDate) params.append('startDate', filters.startDate)
        if (filters?.endDate) params.append('endDate', filters.endDate)
        if (filters?.minAmount)
            params.append('minAmount', filters.minAmount.toString())
        if (filters?.maxAmount)
            params.append('maxAmount', filters.maxAmount.toString())

        const response = await apiClient.get<PaginatedApiResponse<Order>>(
            `/admin/orders?${params.toString()}`
        )
        return {
            data: response.data.data,
            pagination: response.data.pagination,
        }
    },

    /**
     * Get order statistics for admin dashboard
     */
    async getOrderStats(): Promise<AdminOrderStats> {
        const response = await apiClient.get<ApiResponse<AdminOrderStats>>(
            '/admin/orders/stats'
        )
        return response.data.data
    },

    /**
     * Get revenue trend (last 30 days)
     */
    async getRevenueTrend(): Promise<RevenueTrendPoint[]> {
        const response = await apiClient.get<ApiResponse<RevenueTrendPoint[]>>(
            '/admin/orders/revenue-trend'
        )
        return response.data.data
    },

    /**
     * Get order detail by ID (Admin can view any order)
     */
    async getOrderById(orderId: number | string): Promise<Order> {
        const response = await apiClient.get<ApiResponse<Order>>(
            `/admin/orders/${orderId}`
        )
        return response.data.data
    },

    /**
     * Refund an order (Admin only)
     */
    async refundOrder(
        orderId: number | string,
        refundData: RefundRequest
    ): Promise<Order> {
        const response = await apiClient.post<ApiResponse<Order>>(
            `/payments/refund/${orderId}`,
            refundData
        )
        return response.data.data
    },
}
