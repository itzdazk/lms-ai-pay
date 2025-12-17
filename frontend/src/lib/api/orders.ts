import apiClient from './client'
import type { ApiResponse, CreateOrderRequest, Order } from './types'

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
}
