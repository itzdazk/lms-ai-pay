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

    /**
     * =====================================================
     * ADMIN NOTIFICATION HELPERS
     * =====================================================
     */

    /**
     * Notify all admins about new user registration
     */
    async notifyAdminsUserRegistered(userId, userName, fullName, email, role) {
        try {
            // Get all admin users
            const admins = await prisma.user.findMany({
                where: {
                    role: 'ADMIN',
                    status: 'ACTIVE',
                },
                select: { id: true },
            })

            // Create notification for each admin
            const notifications = admins.map((admin) =>
                this.createNotification({
                    userId: admin.id,
                    type: 'USER_REGISTERED',
                    title: 'Người dùng mới đăng ký',
                    message: `${fullName} (${email}) đã đăng ký với vai trò ${role === 'STUDENT' ? 'Học viên' : role === 'INSTRUCTOR' ? 'Giảng viên' : role}.`,
                    relatedId: userId,
                    relatedType: 'USER',
                })
            )

            await Promise.all(notifications)
        } catch (error) {
            logger.error(
                `Failed to notify admins about user registration: ${error.message}`,
                error
            )
        }
    }

    /**
     * Notify admin about user status change
     */
    async notifyAdminUserStatusChanged(
        adminId,
        userId,
        userName,
        oldStatus,
        newStatus
    ) {
        try {
            await this.createNotification({
                userId: adminId,
                type: 'USER_STATUS_CHANGED',
                title: 'Thay đổi trạng thái người dùng',
                message: `Người dùng ${userName} đã được thay đổi trạng thái từ ${oldStatus} sang ${newStatus}.`,
                relatedId: userId,
                relatedType: 'USER',
            })
        } catch (error) {
            logger.error(
                `Failed to create user status change notification: ${error.message}`,
                error
            )
        }
    }

    /**
     * Notify admin about user role change
     */
    async notifyAdminUserRoleChanged(
        adminId,
        userId,
        userName,
        oldRole,
        newRole
    ) {
        try {
            await this.createNotification({
                userId: adminId,
                type: 'USER_ROLE_CHANGED',
                title: 'Thay đổi vai trò người dùng',
                message: `Người dùng ${userName} đã được thay đổi vai trò từ ${oldRole} sang ${newRole}.`,
                relatedId: userId,
                relatedType: 'USER',
            })
        } catch (error) {
            logger.error(
                `Failed to create user role change notification: ${error.message}`,
                error
            )
        }
    }

    /**
     * Notify all admins about course pending approval
     */
    async notifyAdminsCoursePendingApproval(
        courseId,
        courseTitle,
        instructorName
    ) {
        try {
            const admins = await prisma.user.findMany({
                where: {
                    role: 'ADMIN',
                    status: 'ACTIVE',
                },
                select: { id: true },
            })

            const notifications = admins.map((admin) =>
                this.createNotification({
                    userId: admin.id,
                    type: 'COURSE_PENDING_APPROVAL',
                    title: 'Khóa học chờ phê duyệt',
                    message: `Khóa học "${courseTitle}" bởi ${instructorName} đang chờ phê duyệt.`,
                    relatedId: courseId,
                    relatedType: 'COURSE',
                })
            )

            await Promise.all(notifications)
        } catch (error) {
            logger.error(
                `Failed to notify admins about course pending approval: ${error.message}`,
                error
            )
        }
    }

    /**
     * Notify instructor about course approval status
     */
    async notifyInstructorCourseApprovalStatus(
        instructorId,
        courseId,
        courseTitle,
        status
    ) {
        try {
            const statusMessages = {
                APPROVED: {
                    title: 'Khóa học đã được phê duyệt',
                    message: `Khóa học "${courseTitle}" đã được phê duyệt và xuất bản.`,
                },
                REJECTED: {
                    title: 'Khóa học cần chỉnh sửa',
                    message: `Khóa học "${courseTitle}" cần chỉnh sửa trước khi được phê duyệt.`,
                },
            }

            const statusInfo = statusMessages[status] || statusMessages.REJECTED

            await this.createNotification({
                userId: instructorId,
                type: 'COURSE_APPROVAL_STATUS',
                title: statusInfo.title,
                message: statusInfo.message,
                relatedId: courseId,
                relatedType: 'COURSE',
            })
        } catch (error) {
            logger.error(
                `Failed to create course approval status notification: ${error.message}`,
                error
            )
        }
    }

    /**
     * Notify admin about course published
     */
    async notifyAdminCoursePublished(
        adminId,
        courseId,
        courseTitle,
        instructorName
    ) {
        try {
            await this.createNotification({
                userId: adminId,
                type: 'COURSE_PUBLISHED',
                title: 'Khóa học mới được xuất bản',
                message: `Khóa học "${courseTitle}" bởi ${instructorName} đã được xuất bản.`,
                relatedId: courseId,
                relatedType: 'COURSE',
            })
        } catch (error) {
            logger.error(
                `Failed to create course published notification: ${error.message}`,
                error
            )
        }
    }

    /**
     * Notify all admins about new enrollment
     */
    async notifyAdminsNewEnrollment(
        studentId,
        studentName,
        courseId,
        courseTitle,
        instructorName,
        isPaid = false,
        amount = null
    ) {
        try {
            // Get all admin users
            const admins = await prisma.user.findMany({
                where: {
                    role: 'ADMIN',
                    status: 'ACTIVE',
                },
                select: { id: true },
            })

            const paymentInfo =
                isPaid && amount
                    ? ` với giá ${amount.toLocaleString('vi-VN')} VNĐ`
                    : ' (miễn phí)'

            // Create notification for each admin
            const notifications = admins.map((admin) =>
                this.createNotification({
                    userId: admin.id,
                    type: 'NEW_ENROLLMENT',
                    title: 'Học viên mới đăng ký khóa học',
                    message: `Học viên ${studentName} đã đăng ký khóa học "${courseTitle}"${paymentInfo} của giảng viên ${instructorName}.`,
                    relatedId: courseId,
                    relatedType: 'COURSE',
                })
            )

            await Promise.all(notifications)
        } catch (error) {
            logger.error(
                `Failed to notify admins about new enrollment: ${error.message}`,
                error
            )
        }
    }

    /**
     * Notify admin about large order
     */
    async notifyAdminLargeOrder(
        adminId,
        orderId,
        orderCode,
        amount,
        courseTitle
    ) {
        try {
            await this.createNotification({
                userId: adminId,
                type: 'LARGE_ORDER',
                title: 'Đơn hàng lớn',
                message: `Đơn hàng ${orderCode} với giá trị ${amount.toLocaleString('vi-VN')} VNĐ cho khóa học "${courseTitle}".`,
                relatedId: orderId,
                relatedType: 'ORDER',
            })
        } catch (error) {
            logger.error(
                `Failed to create large order notification: ${error.message}`,
                error
            )
        }
    }

    /**
     * Notify admin about refund request
     */
    async notifyAdminRefundRequest(
        adminId,
        orderId,
        orderCode,
        amount,
        reason
    ) {
        try {
            await this.createNotification({
                userId: adminId,
                type: 'REFUND_REQUEST',
                title: 'Yêu cầu hoàn tiền',
                message: `Yêu cầu hoàn tiền ${amount.toLocaleString('vi-VN')} VNĐ cho đơn hàng ${orderCode}. Lý do: ${reason || 'Không có'}.`,
                relatedId: orderId,
                relatedType: 'ORDER',
            })
        } catch (error) {
            logger.error(
                `Failed to create refund request notification: ${error.message}`,
                error
            )
        }
    }

    /**
     * Notify admin about system alert
     */
    async notifyAdminSystemAlert(adminId, alertType, message) {
        try {
            await this.createNotification({
                userId: adminId,
                type: 'SYSTEM_ALERT',
                title: `Cảnh báo hệ thống: ${alertType}`,
                message: message,
                relatedId: null,
                relatedType: null,
            })
        } catch (error) {
            logger.error(
                `Failed to create system alert notification: ${error.message}`,
                error
            )
        }
    }

    /**
     * =====================================================
     * INSTRUCTOR NOTIFICATION HELPERS
     * =====================================================
     */

    /**
     * Notify instructor about new enrollment
     */
    async notifyInstructorNewEnrollment(
        instructorId,
        courseId,
        courseTitle,
        studentName,
        studentId
    ) {
        try {
            await this.createNotification({
                userId: instructorId,
                type: 'NEW_ENROLLMENT',
                title: 'Học viên mới đăng ký',
                message: `Học viên ${studentName} đã đăng ký khóa học "${courseTitle}".`,
                relatedId: courseId,
                relatedType: 'COURSE',
            })
        } catch (error) {
            logger.error(
                `Failed to create new enrollment notification: ${error.message}`,
                error
            )
        }
    }

    /**
     * Notify instructor about student completing course
     */
    async notifyInstructorStudentCompletedCourse(
        instructorId,
        courseId,
        courseTitle,
        studentName,
        studentId
    ) {
        try {
            await this.createNotification({
                userId: instructorId,
                type: 'STUDENT_COMPLETED_COURSE',
                title: 'Học viên hoàn thành khóa học',
                message: `Học viên ${studentName} đã hoàn thành 100% khóa học "${courseTitle}".`,
                relatedId: courseId,
                relatedType: 'COURSE',
            })
        } catch (error) {
            logger.error(
                `Failed to create student completed course notification: ${error.message}`,
                error
            )
        }
    }

    /**
     * Notify instructor about new review
     */
    async notifyInstructorNewReview(
        instructorId,
        courseId,
        courseTitle,
        studentName,
        rating
    ) {
        try {
            await this.createNotification({
                userId: instructorId,
                type: 'NEW_REVIEW',
                title: 'Review mới cho khóa học',
                message: `Khóa học "${courseTitle}" có review mới từ ${studentName} với ${rating} sao.`,
                relatedId: courseId,
                relatedType: 'COURSE',
            })
        } catch (error) {
            logger.error(
                `Failed to create new review notification: ${error.message}`,
                error
            )
        }
    }

    /**
     * Notify instructor about new question in course
     */
    async notifyInstructorNewQuestion(
        instructorId,
        courseId,
        courseTitle,
        studentName,
        questionPreview
    ) {
        try {
            await this.createNotification({
                userId: instructorId,
                type: 'NEW_QUESTION',
                title: 'Câu hỏi mới trong khóa học',
                message: `Có câu hỏi mới từ ${studentName} trong khóa học "${courseTitle}": ${questionPreview.substring(0, 100)}...`,
                relatedId: courseId,
                relatedType: 'COURSE',
            })
        } catch (error) {
            logger.error(
                `Failed to create new question notification: ${error.message}`,
                error
            )
        }
    }

    /**
     * Notify instructor about quiz submission
     */
    async notifyInstructorQuizSubmission(
        instructorId,
        quizId,
        quizTitle,
        courseId,
        courseTitle,
        studentName,
        score
    ) {
        try {
            await this.createNotification({
                userId: instructorId,
                type: 'QUIZ_SUBMISSION',
                title: 'Học viên nộp quiz',
                message: `Học viên ${studentName} đã nộp quiz "${quizTitle}" trong khóa học "${courseTitle}" với điểm ${score}.`,
                relatedId: quizId,
                relatedType: 'QUIZ',
            })
        } catch (error) {
            logger.error(
                `Failed to create quiz submission notification: ${error.message}`,
                error
            )
        }
    }

    /**
     * Notify instructor about payment received
     */
    async notifyInstructorPaymentReceived(
        instructorId,
        orderId,
        courseId,
        courseTitle,
        amount,
        studentName
    ) {
        try {
            await this.createNotification({
                userId: instructorId,
                type: 'PAYMENT_RECEIVED',
                title: 'Thanh toán thành công',
                message: `Bạn đã nhận thanh toán ${amount.toLocaleString('vi-VN')} VNĐ từ ${studentName} cho khóa học "${courseTitle}".`,
                relatedId: orderId,
                relatedType: 'ORDER',
            })
        } catch (error) {
            logger.error(
                `Failed to create payment received notification: ${error.message}`,
                error
            )
        }
    }

    /**
     * Notify instructor about revenue report
     */
    async notifyInstructorRevenueReport(
        instructorId,
        period,
        totalRevenue,
        courseCount
    ) {
        try {
            await this.createNotification({
                userId: instructorId,
                type: 'REVENUE_REPORT',
                title: `Báo cáo doanh thu ${period}`,
                message: `Doanh thu ${period} của bạn là ${totalRevenue.toLocaleString('vi-VN')} VNĐ từ ${courseCount} khóa học.`,
                relatedId: null,
                relatedType: null,
            })
        } catch (error) {
            logger.error(
                `Failed to create revenue report notification: ${error.message}`,
                error
            )
        }
    }

    /**
     * Notify instructor about payout processed
     */
    async notifyInstructorPayoutProcessed(instructorId, amount, payoutId) {
        try {
            await this.createNotification({
                userId: instructorId,
                type: 'PAYOUT_PROCESSED',
                title: 'Yêu cầu rút tiền đã được xử lý',
                message: `Yêu cầu rút tiền ${amount.toLocaleString('vi-VN')} VNĐ đã được xử lý thành công.`,
                relatedId: payoutId,
                relatedType: 'PAYOUT',
            })
        } catch (error) {
            logger.error(
                `Failed to create payout processed notification: ${error.message}`,
                error
            )
        }
    }

    /**
     * Notify instructor about transcript completed
     */
    async notifyInstructorTranscriptCompleted(
        instructorId,
        lessonId,
        lessonTitle,
        courseId,
        courseTitle
    ) {
        try {
            await this.createNotification({
                userId: instructorId,
                type: 'TRANSCRIPT_COMPLETED',
                title: 'Transcription hoàn thành',
                message: `Transcription cho bài học "${lessonTitle}" trong khóa học "${courseTitle}" đã sẵn sàng.`,
                relatedId: lessonId,
                relatedType: 'LESSON',
            })
        } catch (error) {
            logger.error(
                `Failed to create transcript completed notification: ${error.message}`,
                error
            )
        }
    }

    /**
     * Notify instructor about video uploaded
     */
    async notifyInstructorVideoUploaded(
        instructorId,
        lessonId,
        lessonTitle,
        courseId,
        courseTitle
    ) {
        try {
            await this.createNotification({
                userId: instructorId,
                type: 'VIDEO_UPLOADED',
                title: 'Video upload thành công',
                message: `Video cho bài học "${lessonTitle}" trong khóa học "${courseTitle}" đã được upload thành công.`,
                relatedId: lessonId,
                relatedType: 'LESSON',
            })
        } catch (error) {
            logger.error(
                `Failed to create video uploaded notification: ${error.message}`,
                error
            )
        }
    }
}

export default new NotificationsService()
