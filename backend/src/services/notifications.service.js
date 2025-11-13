// src/services/notifications.service.js
import { prisma } from '../config/database.config.js'
import logger from '../config/logger.config.js'

class NotificationsService {
    async getNotifications(userId, options = {}) {
        const page = Number.isInteger(options.page) && options.page > 0 ? options.page : 1
        const limit =
            Number.isInteger(options.limit) && options.limit > 0
                ? Math.min(options.limit, 100)
                : 20
        const skip = (page - 1) * limit

        const where = {
            userId,
        }

        if (options.isRead !== undefined) {
            where.isRead = options.isRead
        }

        const [items, total] = await prisma.$transaction([
            prisma.notification.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            prisma.notification.count({ where }),
        ])

        logger.info(
            `Retrieved ${items.length} notifications for user ${userId} (page ${page})`
        )

        return {
            items,
            total,
            page,
            limit,
        }
    }

    async getUnreadCount(userId) {
        const count = await prisma.notification.count({
            where: {
                userId,
                isRead: false,
            },
        })

        logger.info(`User ${userId} has ${count} unread notifications`)

        return count
    }

    async getNotificationById(userId, notificationId) {
        const notification = await prisma.notification.findFirst({
            where: {
                id: notificationId,
                userId,
            },
        })

        if (!notification) {
            throw new Error('Notification not found')
        }

        return notification
    }

    async markAsRead(userId, notificationId) {
        const notification = await prisma.notification.findFirst({
            where: {
                id: notificationId,
                userId,
            },
        })

        if (!notification) {
            throw new Error('Notification not found')
        }

        if (notification.isRead) {
            return notification
        }

        const updated = await prisma.notification.update({
            where: { id: notificationId },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        })

        logger.info(`Notification ${notificationId} marked as read by user ${userId}`)

        return updated
    }

    async markAllAsRead(userId) {
        const result = await prisma.notification.updateMany({
            where: {
                userId,
                isRead: false,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        })

        logger.info(
            `User ${userId} marked ${result.count} notifications as read`
        )

        return {
            updated: result.count,
        }
    }

    async deleteNotification(userId, notificationId) {
        const notification = await prisma.notification.findFirst({
            where: {
                id: notificationId,
                userId,
            },
        })

        if (!notification) {
            throw new Error('Notification not found')
        }

        await prisma.notification.delete({
            where: { id: notificationId },
        })

        logger.info(`Notification ${notificationId} deleted by user ${userId}`)
    }

    async deleteAllNotifications(userId) {
        const result = await prisma.notification.deleteMany({
            where: {
                userId,
            },
        })

        logger.info(
            `User ${userId} deleted ${result.count} notifications`
        )
    }

    async createNotification(data) {
        const notification = await prisma.notification.create({
            data,
        })

        logger.info(
            `Notification created for user ${notification.userId} (type: ${notification.type})`
        )

        return notification
    }
}

export default new NotificationsService()

