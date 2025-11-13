// src/controllers/notifications.controller.js
import { asyncHandler } from '../middlewares/error.middleware.js'
import ApiResponse from '../utils/response.util.js'
import notificationsService from '../services/notifications.service.js'

class NotificationsController {
    getNotifications = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const page = req.query.page ? parseInt(req.query.page, 10) : 1
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20

        const result = await notificationsService.getNotifications(userId, {
            page,
            limit,
        })

        return ApiResponse.paginated(
            res,
            result.items,
            {
                page: result.page,
                limit: result.limit,
                total: result.total,
            },
            'Notifications retrieved successfully'
        )
    })

    getUnreadNotifications = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const page = req.query.page ? parseInt(req.query.page, 10) : 1
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20

        const result = await notificationsService.getNotifications(userId, {
            page,
            limit,
            isRead: false,
        })

        return ApiResponse.paginated(
            res,
            result.items,
            {
                page: result.page,
                limit: result.limit,
                total: result.total,
            },
            'Unread notifications retrieved successfully'
        )
    })

    getUnreadCount = asyncHandler(async (req, res) => {
        const userId = req.user.id

        const count = await notificationsService.getUnreadCount(userId)

        return ApiResponse.success(
            res,
            { count },
            'Unread notifications count retrieved successfully'
        )
    })

    getNotificationById = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const notificationId = parseInt(req.params.id, 10)

        const notification = await notificationsService.getNotificationById(
            userId,
            notificationId
        )

        return ApiResponse.success(
            res,
            notification,
            'Notification retrieved successfully'
        )
    })

    markNotificationAsRead = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const notificationId = parseInt(req.params.id, 10)

        const updated = await notificationsService.markAsRead(
            userId,
            notificationId
        )

        return ApiResponse.success(
            res,
            updated,
            'Notification marked as read successfully'
        )
    })

    markAllNotificationsAsRead = asyncHandler(async (req, res) => {
        const userId = req.user.id

        const result = await notificationsService.markAllAsRead(userId)

        return ApiResponse.success(
            res,
            result,
            'All notifications marked as read successfully'
        )
    })

    deleteNotification = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const notificationId = parseInt(req.params.id, 10)

        await notificationsService.deleteNotification(userId, notificationId)

        return ApiResponse.noContent(res)
    })

    deleteAllNotifications = asyncHandler(async (req, res) => {
        const userId = req.user.id

        await notificationsService.deleteAllNotifications(userId)

        return ApiResponse.noContent(res)
    })
}

export default new NotificationsController()

