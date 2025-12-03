// src/services/notifications.service.js
import { prisma } from '../config/database.config.js'
import logger from '../config/logger.config.js'
import { HTTP_STATUS } from '../config/constants.js'

class NotificationsService {
    async getNotifications(userId, options = {}) {
        const page =
            Number.isInteger(options.page) && options.page > 0
                ? options.page
                : 1
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
            const error = new Error('Notification not found')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
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
            const error = new Error('Notification not found')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
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

        logger.info(
            `Notification ${notificationId} marked as read by user ${userId}`
        )

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
            const error = new Error('Notification not found')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
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

        logger.info(`User ${userId} deleted ${result.count} notifications`)
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

    /**
     * Helper methods for auto-creating notifications
     */
    async notifyEnrollmentSuccess(userId, courseId, courseTitle) {
        try {
            await this.createNotification({
                userId,
                type: 'ENROLLMENT_SUCCESS',
                title: 'Đăng ký khóa học thành công',
                message: `Bạn đã đăng ký thành công khóa học "${courseTitle}". Bắt đầu học ngay!`,
                relatedId: courseId,
                relatedType: 'COURSE',
            })
        } catch (error) {
            logger.error(
                `Failed to create enrollment notification: ${error.message}`,
                error
            )
        }
    }

    async notifyPaymentSuccess(userId, orderId, courseId, courseTitle, amount) {
        try {
            await this.createNotification({
                userId,
                type: 'PAYMENT_SUCCESS',
                title: 'Thanh toán thành công',
                message: `Thanh toán khóa học "${courseTitle}" thành công. Bạn đã được đăng ký vào khóa học.`,
                relatedId: orderId,
                relatedType: 'ORDER',
            })
        } catch (error) {
            logger.error(
                `Failed to create payment success notification: ${error.message}`,
                error
            )
        }
    }

    async notifyOrderCancelled(userId, orderId, courseId, courseTitle) {
        try {
            await this.createNotification({
                userId,
                type: 'ORDER_CANCELLED',
                title: 'Đơn hàng đã bị hủy',
                message: `Đơn hàng của bạn cho khóa học "${courseTitle}" đã được hủy thành công.`,
                relatedId: orderId,
                relatedType: 'ORDER',
            })
        } catch (error) {
            logger.error(
                `Failed to create order cancellation notification: ${error.message}`,
                error
            )
        }
    }

    async notifyPaymentFailed(userId, orderId, courseId, courseTitle, reason) {
        try {
            await this.createNotification({
                userId,
                type: 'PAYMENT_FAILED',
                title: 'Thanh toán thất bại',
                message: `Thanh toán khóa học "${courseTitle}" thất bại. ${reason || 'Vui lòng thử lại.'}`,
                relatedId: orderId,
                relatedType: 'ORDER',
            })
        } catch (error) {
            logger.error(
                `Failed to create payment failed notification: ${error.message}`,
                error
            )
        }
    }

    async notifyLessonCompleted(
        userId,
        lessonId,
        courseId,
        lessonTitle,
        courseTitle
    ) {
        try {
            await this.createNotification({
                userId,
                type: 'LESSON_COMPLETED',
                title: 'Hoàn thành bài học',
                message: `Bạn đã hoàn thành bài học "${lessonTitle}" trong khóa học "${courseTitle}".`,
                relatedId: lessonId,
                relatedType: 'LESSON',
            })
        } catch (error) {
            logger.error(
                `Failed to create lesson completed notification: ${error.message}`,
                error
            )
        }
    }

    async notifyCourseCompleted(userId, courseId, courseTitle) {
        try {
            await this.createNotification({
                userId,
                type: 'COURSE_COMPLETED',
                title: 'Chúc mừng! Bạn đã hoàn thành khóa học',
                message: `Bạn đã hoàn thành 100% khóa học "${courseTitle}". Hãy xem chứng chỉ của bạn!`,
                relatedId: courseId,
                relatedType: 'COURSE',
            })
        } catch (error) {
            logger.error(
                `Failed to create course completed notification: ${error.message}`,
                error
            )
        }
    }
}

export default new NotificationsService()
