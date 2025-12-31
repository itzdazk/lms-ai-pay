// backend/src/services/refund-request.service.js
import { prisma } from '../config/database.config.js'
import {
    HTTP_STATUS,
    PAYMENT_STATUS,
    USER_STATUS,
} from '../config/constants.js'
import logger from '../config/logger.config.js'
import progressService from './progress.service.js'
import notificationsService from './notifications.service.js'

class RefundRequestService {
    /**
     * Calculate course progress percentage for a student
     * @param {number} userId - User ID
     * @param {number} courseId - Course ID
     * @returns {Promise<number>} Progress percentage (0-100)
     */
    async calculateProgressPercentage(userId, courseId) {
        // Get enrollment
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId,
                },
            },
            include: {
                course: {
                    include: {
                        lessons: {
                            where: { isPublished: true },
                        },
                    },
                },
            },
        })

        if (!enrollment) {
            return 0
        }

        // Count completed lessons
        const completedLessons = await prisma.progress.count({
            where: {
                userId,
                courseId,
                isCompleted: true,
            },
        })

        const totalLessons = enrollment.course.lessons.length

        if (totalLessons === 0) {
            return 0
        }

        // Calculate progress percentage
        const progressPercentage =
            Math.round((completedLessons / totalLessons) * 100 * 100) / 100

        return progressPercentage
    }

    /**
     * Create a refund request
     * @param {number} userId - Student ID
     * @param {number} orderId - Order ID
     * @param {string} reason - Refund reason
     * @returns {Promise<Object>} Created refund request
     */
    async createRefundRequest(userId, orderId, reason) {
        // Validate order exists and belongs to user
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                course: true,
            },
        })

        if (!order) {
            const error = new Error('Order not found')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        if (order.userId !== userId) {
            const error = new Error(
                'You can only request refund for your own orders'
            )
            error.statusCode = HTTP_STATUS.FORBIDDEN
            throw error
        }

        // Check if order is PAID
        if (order.paymentStatus !== PAYMENT_STATUS.PAID) {
            const error = new Error(
                'Refund can only be requested for paid orders'
            )
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }

        // Check if there's already a pending or approved refund request
        const existingRequest = await prisma.refundRequest.findFirst({
            where: {
                orderId,
                status: {
                    in: ['PENDING', 'APPROVED'],
                },
            },
        })

        if (existingRequest) {
            const error = new Error(
                'A refund request already exists for this order'
            )
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }

        // Calculate progress percentage
        const progressPercentage = await this.calculateProgressPercentage(
            userId,
            order.courseId
        )

        // If progress >= 50%, automatically reject
        let status = 'PENDING'
        let adminNotes = null

        if (progressPercentage >= 50) {
            status = 'REJECTED'
            adminNotes = `Tự động từ chối: Tiến độ khóa học đạt ${progressPercentage.toFixed(2)}% (yêu cầu < 50%)`
        }

        // Create refund request and update order status
        const refundRequest = await prisma.$transaction(async (tx) => {
            // Update order status to REFUND_PENDING if request is pending
            if (status === 'PENDING') {
                await tx.order.update({
                    where: { id: orderId },
                    data: {
                        paymentStatus: PAYMENT_STATUS.REFUND_PENDING,
                    },
                })
            }

            // Create refund request
            return await tx.refundRequest.create({
                data: {
                    orderId,
                    studentId: userId,
                    reason,
                    status,
                    progressPercentage,
                    adminNotes,
                },
                include: {
                    order: {
                        include: {
                            course: {
                                select: {
                                    id: true,
                                    title: true,
                                },
                            },
                            user: {
                                select: {
                                    id: true,
                                    fullName: true,
                                    email: true,
                                },
                            },
                        },
                    },
                    student: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                        },
                    },
                },
            })
        })

        // Send notification to admin if request is pending
        if (status === 'PENDING') {
            try {
                // Get all admins
                const admins = await prisma.user.findMany({
                    where: {
                        role: 'ADMIN',
                        status: USER_STATUS.ACTIVE,
                    },
                    select: {
                        id: true,
                    },
                })

                // Format amount in VND
                const formattedAmount = order.finalPrice.toLocaleString('vi-VN')

                // Send notification to each admin
                await Promise.all(
                    admins.map((admin) =>
                        notificationsService.createNotification({
                            userId: admin.id,
                            type: 'REFUND_REQUEST',
                            title: 'Yêu cầu hoàn tiền mới',
                            message: `Học viên ${refundRequest.student.fullName} yêu cầu hoàn tiền ${formattedAmount} VNĐ cho đơn hàng ${order.orderCode} - Khóa học: ${order.course.title}`,
                            relatedId: order.id,
                            relatedType: 'ORDER',
                        })
                    )
                )

                logger.info(
                    `Sent refund request notifications to ${admins.length} admin(s) for order ${order.orderCode}`
                )
            } catch (error) {
                logger.error(
                    'Error sending refund request notification:',
                    error
                )
                // Don't throw error, just log it
            }
        }

        return refundRequest
    }

    /**
     * Get refund requests for a student
     * @param {number} userId - Student ID
     * @param {Object} filters - Filters (page, limit, status)
     * @returns {Promise<Object>} Refund requests with pagination
     */
    async getStudentRefundRequests(userId, filters = {}) {
        const { page = 1, limit = 10, status } = filters

        const where = {
            studentId: userId,
            ...(status && { status }),
        }

        const [refundRequests, total] = await Promise.all([
            prisma.refundRequest.findMany({
                where,
                include: {
                    order: {
                        include: {
                            course: {
                                select: {
                                    id: true,
                                    title: true,
                                    thumbnailUrl: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.refundRequest.count({ where }),
        ])

        return {
            refundRequests,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        }
    }

    /**
     * Get refund request by ID (for student)
     * @param {number} requestId - Refund request ID
     * @param {number} userId - Student ID (for authorization)
     * @returns {Promise<Object>} Refund request
     */
    async getRefundRequestById(requestId, userId) {
        const refundRequest = await prisma.refundRequest.findUnique({
            where: { id: requestId },
            include: {
                order: {
                    include: {
                        course: {
                            select: {
                                id: true,
                                title: true,
                                thumbnailUrl: true,
                            },
                        },
                    },
                },
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
        })

        if (!refundRequest) {
            const error = new Error('Refund request not found')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Check if user is authorized (student or admin)
        if (refundRequest.studentId !== userId) {
            // Check if user is admin
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { role: true },
            })

            if (user?.role !== 'ADMIN') {
                const error = new Error('Unauthorized')
                error.statusCode = HTTP_STATUS.FORBIDDEN
                throw error
            }
        }

        return refundRequest
    }

    /**
     * Check if order has refund request
     * @param {number} orderId - Order ID
     * @returns {Promise<Object|null>} Refund request or null
     */
    async getRefundRequestByOrderId(orderId) {
        return await prisma.refundRequest.findFirst({
            where: { orderId },
            orderBy: { createdAt: 'desc' },
        })
    }
}

export default new RefundRequestService()
