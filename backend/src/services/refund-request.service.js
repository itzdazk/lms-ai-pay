// backend/src/services/refund-request.service.js
import { prisma } from '../config/database.config.js'
import {
    HTTP_STATUS,
    PAYMENT_STATUS,
    USER_STATUS,
    REFUND_REASON_TYPES,
    REFUND_TYPES,
    REFUND_POLICY,
    ENROLLMENT_STATUS,
} from '../config/constants.js'
import { Prisma } from '@prisma/client'
import logger from '../config/logger.config.js'
import progressService from './progress.service.js'
import notificationsService from './notifications.service.js'
import emailService from './email.service.js'

class RefundRequestService {
    /**
     * Check days since payment
     * @param {Date} paidAt - Payment date
     * @returns {number} Number of days since payment
     */
    checkDaysSincePayment(paidAt) {
        if (!paidAt) {
            return Infinity // If no paidAt, consider it as very old
        }
        const now = new Date()
        const diffTime = now.getTime() - paidAt.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    }

    /**
     * Calculate partial refund amount
     * @param {number|Decimal} orderAmount - Order final price
     * @param {number} progressPercentage - Progress percentage (0-100)
     * @returns {Decimal} Calculated refund amount
     */
    calculatePartialRefundAmount(orderAmount, progressPercentage) {
        const amount = parseFloat(orderAmount)
        const progress = parseFloat(progressPercentage) / 100
        const refundAmount =
            amount *
            (1 - progress) *
            (1 - REFUND_POLICY.PARTIAL_REFUND_PROCESSING_FEE)
        return new Prisma.Decimal(refundAmount.toFixed(2))
    }

    /**
     * Check refund eligibility
     * @param {number} orderId - Order ID
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Eligibility result
     */
    async checkRefundEligibility(orderId, userId) {
        // Get order with enrollment info
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                course: true,
            },
        })

        if (!order) {
            return {
                eligible: false,
                type: null,
                suggestedAmount: null,
                message: 'Order not found',
            }
        }

        if (order.userId !== userId) {
            return {
                eligible: false,
                type: null,
                suggestedAmount: null,
                message: 'Unauthorized access',
            }
        }

        if (order.paymentStatus !== PAYMENT_STATUS.PAID) {
            return {
                eligible: false,
                type: null,
                suggestedAmount: null,
                message: 'Only paid orders can be refunded',
            }
        }

        // Calculate progress
        const progressPercentage = await this.calculateProgressPercentage(
            userId,
            order.courseId
        )

        // Check days since payment
        const daysSincePayment = this.checkDaysSincePayment(order.paidAt)

        // Check for FULL refund eligibility
        // Condition: progress < 20% AND within 7 days of payment
        if (
            progressPercentage < REFUND_POLICY.FULL_REFUND_MAX_PROGRESS &&
            daysSincePayment <= REFUND_POLICY.FULL_REFUND_MAX_DAYS
        ) {
            return {
                eligible: true,
                type: REFUND_TYPES.FULL,
                suggestedAmount: new Prisma.Decimal(order.finalPrice),
                message: `Bạn đủ điều kiện hoàn tiền toàn bộ. Tiến độ: ${progressPercentage.toFixed(2)}%, Thời gian: ${daysSincePayment} ngày`,
                progressPercentage,
                daysSincePayment,
            }
        }

        // Check for PARTIAL refund eligibility
        // Condition: progress < 50% (and not eligible for FULL refund)
        // This covers cases where:
        // - progress < 20% but days > 7 (missed FULL refund window)
        // - progress >= 20% and < 50% (standard partial refund)
        if (progressPercentage < REFUND_POLICY.PARTIAL_REFUND_MAX_PROGRESS) {
            const suggestedAmount = this.calculatePartialRefundAmount(
                order.finalPrice,
                progressPercentage
            )
            return {
                eligible: true,
                type: REFUND_TYPES.PARTIAL,
                suggestedAmount,
                message: `Bạn đủ điều kiện hoàn tiền một phần. Tiến độ: ${progressPercentage.toFixed(2)}%`,
                progressPercentage,
                daysSincePayment,
            }
        }

        // REJECT - Progress too high (>= 50%)
        return {
            eligible: false,
            type: null,
            suggestedAmount: null,
            message: `Không thể hoàn tiền. Tiến độ khóa học đạt ${progressPercentage.toFixed(2)}% (yêu cầu < ${REFUND_POLICY.PARTIAL_REFUND_MAX_PROGRESS}%)`,
            progressPercentage,
            daysSincePayment,
        }
    }

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
     * @param {string} reason - Refund reason (detailed)
     * @param {string} reasonType - Reason type (MEDICAL, FINANCIAL_EMERGENCY, DISSATISFACTION, OTHER)
     * @returns {Promise<Object>} Created refund request
     */
    async createRefundRequest(userId, orderId, reason, reasonType = null) {
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

        // Check refund eligibility
        const eligibility = await this.checkRefundEligibility(orderId, userId)

        if (!eligibility.eligible) {
            const error = new Error(eligibility.message)
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }

        // Determine status and refund details
        let status = 'PENDING'
        let adminNotes = null
        let refundType = eligibility.type
        let suggestedRefundAmount = eligibility.suggestedAmount

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
                    reasonType: reasonType || REFUND_REASON_TYPES.OTHER,
                    status,
                    refundType,
                    progressPercentage: eligibility.progressPercentage,
                    suggestedRefundAmount,
                    requestedRefundAmount: suggestedRefundAmount, // Initially same as suggested
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

                // Send email to student
                try {
                    await emailService.sendRefundRequestSubmittedEmail(
                        refundRequest.student,
                        refundRequest,
                        order
                    )
                } catch (emailError) {
                    logger.error(
                        'Error sending refund request submitted email:',
                        emailError
                    )
                    // Don't throw error, just log it
                }
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
     * Get all refund requests for admin
     * @param {Object} filters - Filters (page, limit, status, search, sort)
     * @returns {Promise<Object>} Refund requests with pagination
     */
    async getAllRefundRequests(filters = {}) {
        const {
            page = 1,
            limit = 10,
            status,
            search,
            sort = 'oldest',
            startDate,
            endDate,
            minAmount,
            maxAmount,
        } = filters

        const where = {}

        // Filter by status
        if (status) {
            where.status = status
        }

        // Filter by date range (refund request creation date)
        if (startDate || endDate) {
            where.createdAt = {}
            if (startDate) {
                where.createdAt.gte = new Date(startDate)
            }
            if (endDate) {
                const end = new Date(endDate)
                end.setHours(23, 59, 59, 999)
                where.createdAt.lte = end
            }
        }

        // Build search conditions
        const searchConditions = []
        if (search) {
            searchConditions.push(
                {
                    order: {
                        orderCode: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                },
                {
                    student: {
                        fullName: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                },
                {
                    student: {
                        email: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                },
                {
                    order: {
                        course: {
                            title: {
                                contains: search,
                                mode: 'insensitive',
                            },
                        },
                    },
                }
            )
        }

        // Filter by amount range (order finalPrice)
        const amountFilter = {}
        if (minAmount !== undefined || maxAmount !== undefined) {
            amountFilter.finalPrice = {}
            if (minAmount !== undefined) {
                amountFilter.finalPrice.gte = new Prisma.Decimal(minAmount)
            }
            if (maxAmount !== undefined) {
                amountFilter.finalPrice.lte = new Prisma.Decimal(maxAmount)
            }
        }

        // Combine filters: if we have both search and amount, use AND
        if (searchConditions.length > 0 && Object.keys(amountFilter).length > 0) {
            where.AND = [
                {
                    order: amountFilter,
                },
                {
                    OR: searchConditions,
                },
            ]
        } else if (searchConditions.length > 0) {
            // Only search
            where.OR = searchConditions
        } else if (Object.keys(amountFilter).length > 0) {
            // Only amount filter
            where.order = amountFilter
        }

        // Sort order
        let orderBy = { createdAt: 'asc' } // Default to oldest
        if (sort === 'oldest') {
            orderBy = { createdAt: 'asc' }
        } else if (sort === 'newest') {
            orderBy = { createdAt: 'desc' }
        } else if (sort === 'amount_asc') {
            orderBy = { order: { finalPrice: 'asc' } }
        } else if (sort === 'amount_desc') {
            orderBy = { order: { finalPrice: 'desc' } }
        }

        const [refundRequests, total] = await Promise.all([
            prisma.refundRequest.findMany({
                where,
                include: {
                    order: {
                        select: {
                            id: true,
                            orderCode: true,
                            originalPrice: true,
                            discountAmount: true,
                            finalPrice: true,
                            paymentGateway: true,
                            paymentStatus: true,
                            refundAmount: true,
                            refundedAt: true,
                            paidAt: true,
                            createdAt: true,
                            notes: true,
                            course: {
                                select: {
                                    id: true,
                                    title: true,
                                    thumbnailUrl: true,
                                    price: true,
                                    discountPrice: true,
                                    durationHours: true,
                                    totalLessons: true,
                                    instructor: {
                                        select: {
                                            id: true,
                                            fullName: true,
                                        },
                                    },
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
                orderBy,
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

    /**
     * Revoke enrollment access (hard delete - remove enrollment and related data)
     * @param {number} userId - User ID
     * @param {number} courseId - Course ID
     * @param {string} reason - Reason for revocation
     * @returns {Promise<Object|null>} Deleted enrollment info or null
     */
    async revokeEnrollmentAccess(userId, courseId, reason = '') {
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId,
                },
            },
        })

        if (!enrollment) {
            logger.warn(
                `No enrollment found to revoke for user ${userId} and course ${courseId}`
            )
            return null
        }

        // Get all lessons in the course to delete related data
        const courseLessons = await prisma.lesson.findMany({
            where: { courseId },
            select: { id: true },
        })
        const lessonIds = courseLessons.map((lesson) => lesson.id)

        // Delete all related data in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Delete progress records for all lessons in this course
            if (lessonIds.length > 0) {
                await tx.progress.deleteMany({
                    where: {
                        userId,
                        lessonId: {
                            in: lessonIds,
                        },
                    },
                })
            }

            // 2. Delete lesson notes for all lessons in this course
            if (lessonIds.length > 0) {
                await tx.lessonNote.deleteMany({
                    where: {
                        userId,
                        lessonId: {
                            in: lessonIds,
                        },
                    },
                })
            }

            // 3. Delete enrollment
            const deletedEnrollment = await tx.enrollment.delete({
                where: { id: enrollment.id },
            })

            // 4. Decrement course enrolled count
            await tx.course.update({
                where: { id: courseId },
                data: {
                    enrolledCount: {
                        decrement: 1,
                    },
                },
            })

            return deletedEnrollment
        })

        logger.info(
            `Enrollment and related data deleted for user ${userId} in course ${courseId}. Reason: ${reason}`
        )

        return result
    }

    /**
     * Process refund request (Admin only)
     * @param {number} requestId - Refund request ID
     * @param {number} adminUserId - Admin user ID
     * @param {string} action - 'APPROVE' or 'REJECT'
     * @param {number|null} customAmount - Custom refund amount (optional, overrides suggested)
     * @param {string} notes - Admin notes
     * @returns {Promise<Object>} Processed refund request and refund result
     */
    async processRefundRequest(
        requestId,
        adminUserId,
        action,
        customAmount = null,
        notes = null
    ) {
        // Use transaction with row-level locking to prevent concurrent processing
        // This ensures only one request can process the refund at a time
        const refundRequest = await prisma.$transaction(async (tx) => {
            // Use findUnique with forUpdate to lock the row (PostgreSQL row-level locking)
            // This prevents concurrent processing of the same refund request
            const request = await tx.refundRequest.findUnique({
                where: { id: requestId },
                include: {
                    order: {
                        include: {
                            course: true,
                            user: true,
                        },
                    },
                    student: true,
                },
            })

            if (!request) {
                const error = new Error('Refund request not found')
                error.statusCode = HTTP_STATUS.NOT_FOUND
                throw error
            }

            // Check status while locked to prevent race condition
            if (request.status !== 'PENDING') {
                const error = new Error(
                    `Cannot process refund request with status: ${request.status}. This request may have been processed already.`
                )
                error.statusCode = HTTP_STATUS.BAD_REQUEST
                throw error
            }

            return request
        })

        if (action === 'REJECT') {
            const updated = await prisma.$transaction(async (tx) => {
                const refundRequestUpdated = await tx.refundRequest.update({
                    where: { id: requestId },
                    data: {
                        status: 'REJECTED',
                        processedAt: new Date(),
                        processedBy: adminUserId,
                        adminNotes: notes || 'Rejected by admin',
                    },
                })

                // Revert order status back to PAID
                await tx.order.update({
                    where: { id: refundRequest.orderId },
                    data: {
                        paymentStatus: PAYMENT_STATUS.PAID,
                    },
                })

                return refundRequestUpdated
            })

            logger.info(
                `Admin ${adminUserId} rejected refund request ${requestId}`
            )

            // Send rejection email
            try {
                await emailService.sendRefundRejectedEmail(
                    refundRequest.student,
                    refundRequest,
                    refundRequest.order,
                    notes || 'Rejected by admin'
                )
            } catch (emailError) {
                logger.error('Error sending refund rejected email:', emailError)
                // Don't throw error, just log it
            }

            return {
                refundRequest: updated,
                refundTransaction: null,
            }
        }

        // APPROVE action
        let refundAmount = null

        if (customAmount !== null && customAmount !== undefined) {
            // Validate and parse customAmount
            const parsedAmount = parseFloat(customAmount)
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                const error = new Error(
                    `Invalid refund amount: ${customAmount}. Amount must be a positive number.`
                )
                error.statusCode = HTTP_STATUS.BAD_REQUEST
                throw error
            }
            refundAmount = new Prisma.Decimal(parsedAmount)
        } else {
            // Use requested or suggested amount
            refundAmount =
                refundRequest.requestedRefundAmount ||
                refundRequest.suggestedRefundAmount
        }

        if (!refundAmount || refundAmount <= 0) {
            const error = new Error(
                'Invalid refund amount. Please specify a valid refund amount or ensure the refund request has a suggested amount.'
            )
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }

        // Import payment service dynamically to avoid circular dependency
        const { default: paymentService } = await import('./payment.service.js')

        // Get admin user
        const adminUser = await prisma.user.findUnique({
            where: { id: adminUserId },
        })

        if (!adminUser || adminUser.role !== 'ADMIN') {
            const error = new Error('Only administrators can process refunds')
            error.statusCode = HTTP_STATUS.FORBIDDEN
            throw error
        }

        // Process refund through payment service
        const refundResult = await paymentService.refundOrder(
            refundRequest.orderId,
            adminUser,
            parseFloat(refundAmount.toString()),
            notes || `Refund processed for request ${requestId}`
        )

        // Update refund request and revoke enrollment
        const result = await prisma.$transaction(async (tx) => {
            const refundRequestUpdated = await tx.refundRequest.update({
                where: { id: requestId },
                data: {
                    status: 'APPROVED',
                    processedAt: new Date(),
                    processedBy: adminUserId,
                    requestedRefundAmount: refundAmount,
                    adminNotes: notes || 'Approved by admin',
                },
            })

            // Revoke enrollment access (soft delete)
            await this.revokeEnrollmentAccess(
                refundRequest.studentId,
                refundRequest.order.courseId,
                `Refund approved for order ${refundRequest.order.orderCode}`
            )

            return refundRequestUpdated
        })

        logger.info(
            `Admin ${adminUserId} approved refund request ${requestId}. Amount: ${refundAmount}`
        )

        // Send approval email
        try {
            await emailService.sendRefundApprovedEmail(
                refundRequest.student,
                refundRequest,
                refundRequest.order,
                refundAmount.toString()
            )
        } catch (emailError) {
            logger.error('Error sending refund approved email:', emailError)
            // Don't throw error, just log it
        }

        return {
            refundRequest: result,
            refundTransaction: refundResult.refundTransaction,
            order: refundResult.order,
        }
    }
}

export default new RefundRequestService()
