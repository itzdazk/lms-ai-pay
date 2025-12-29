import apiClient from './client'
import type {
    ApiResponse,
    Notification,
    NotificationFilters,
    PaginatedApiResponse,
    UnreadCountResponse,
} from './types'

export interface GetNotificationsParams {
    page?: number
    limit?: number
    isRead?: boolean
}

export interface NotificationsResponse {
    items: Notification[]
    total: number
    page: number
    limit: number
}

export interface MarkAllAsReadResponse {
    updated: number
}

export const notificationsApi = {
    // GET /api/v1/notifications
    async getNotifications(
        params?: GetNotificationsParams
    ): Promise<NotificationsResponse> {
        const queryParams = new URLSearchParams()
        if (params?.page) queryParams.append('page', params.page.toString())
        if (params?.limit) queryParams.append('limit', params.limit.toString())
        if (params?.isRead !== undefined)
            queryParams.append('isRead', params.isRead.toString())

        const response = await apiClient.get<
            PaginatedApiResponse<Notification>
        >(`/notifications?${queryParams.toString()}`)

        return {
            items: response.data.data,
            total: response.data.pagination.total,
            page: response.data.pagination.page,
            limit: response.data.pagination.limit,
        }
    },

    // GET /api/v1/notifications/unread/count
    async getUnreadCount(): Promise<number> {
        const response = await apiClient.get<ApiResponse<UnreadCountResponse>>(
            '/notifications/unread/count'
        )
        return response.data.data.count
    },

    // GET /api/v1/notifications/:id
    async getNotificationById(id: number): Promise<Notification> {
        const response = await apiClient.get<ApiResponse<Notification>>(
            `/notifications/${id}`
        )
        return response.data.data
    },

    // PATCH /api/v1/notifications/:id/read
    async markAsRead(id: number): Promise<Notification> {
        const response = await apiClient.patch<ApiResponse<Notification>>(
            `/notifications/${id}/read`
        )
        return response.data.data
    },

    // PATCH /api/v1/notifications/read-all
    async markAllAsRead(): Promise<number> {
        const response = await apiClient.patch<
            ApiResponse<MarkAllAsReadResponse>
        >('/notifications/read-all')
        return response.data.data.updated
    },

    // DELETE /api/v1/notifications/:id
    async deleteNotification(id: number): Promise<void> {
        await apiClient.delete(`/notifications/${id}`)
    },

    // DELETE /api/v1/notifications
    async clearAllNotifications(): Promise<void> {
        await apiClient.delete('/notifications')
    },
}

