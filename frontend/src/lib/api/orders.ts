import apiClient from './client'
import type {
    ApiResponse,
    CreateOrderRequest,
    Order,
    OrderFilters,
    PaginatedApiResponse,
} from './types'

/**
 * Order statistics response
 */
export interface OrderStats {
    total: number
    paid: number
    pending: number
    failed: number
    refunded: number
    totalSpent: number
}

/**
 * Orders API client
 */
export const ordersApi = {
    /**
     * Create a new order for a course
     */
    async createOrder(payload: CreateOrderRequest): Promise<Order> {
        const response = await apiClient.post<ApiResponse<Order>>(
            '/orders',
            payload
        )
        return response.data.data
    },

    /**
     * Get order detail by numeric ID
     */
    async getOrderById(orderId: number | string): Promise<Order> {
        const response = await apiClient.get<ApiResponse<Order>>(
            `/orders/${orderId}`
        )
        return response.data.data
    },

    /**
     * Get order detail by order code (used in callbacks)
     */
    async getOrderByCode(orderCode: string): Promise<Order> {
        const response = await apiClient.get<ApiResponse<Order>>(
            `/orders/code/${orderCode}`
        )
        return response.data.data
    },

    /**
     * Get orders list with filters and pagination
     */
    async getOrders(filters?: OrderFilters): Promise<{
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
        if (filters?.paymentStatus)
            params.append('paymentStatus', filters.paymentStatus)
        if (filters?.paymentGateway)
            params.append('paymentGateway', filters.paymentGateway)
        if (filters?.startDate) params.append('startDate', filters.startDate)
        if (filters?.endDate) params.append('endDate', filters.endDate)
        if (filters?.sort) params.append('sort', filters.sort)
        if (filters?.search) params.append('search', filters.search)

        const response = await apiClient.get<PaginatedApiResponse<Order>>(
            `/orders?${params.toString()}`
        )
        return {
            orders: response.data.data,
            pagination: response.data.pagination,
        }
    },

    /**
     * Get order statistics
     */
    async getOrderStats(): Promise<OrderStats> {
        const response = await apiClient.get<ApiResponse<OrderStats>>(
            '/orders/stats'
        )
        return response.data.data
    },

    /**
     * Cancel a pending order
     */
    async cancelOrder(orderId: number | string): Promise<Order> {
        const response = await apiClient.patch<ApiResponse<Order>>(
            `/orders/${orderId}/cancel`
        )
        return response.data.data
    },
}
