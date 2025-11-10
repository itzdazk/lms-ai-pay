// backend/src/services/orders.service.js
import { prisma } from '../config/database.config.js'
import {
    PAYMENT_STATUS,
    COURSE_STATUS,
    PAYMENT_GATEWAY,
    PENDING_TIME,
} from '../config/constants.js'
import logger from '../config/logger.config.js'

class OrdersService {
    /**
     * Generate unique order code
     * Format: ORD-YYYYMMDD-HHMMSS-XXXX (XXXX is random 4 digits)
     * @returns {string} Order code
     */
    generateOrderCode() {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const hours = String(now.getHours()).padStart(2, '0')
        const minutes = String(now.getMinutes()).padStart(2, '0')
        const seconds = String(now.getSeconds()).padStart(2, '0')
        const random = Math.floor(1000 + Math.random() * 9000) // 4 random digits

        return `ORD-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`
    }

    /**
     * Calculate order prices from course
     * @param {Object} course - Course object
     * @returns {Object} Prices object
     */
    calculatePrices(course) {
        const originalPrice = parseFloat(course.price) || 0
        // Logic: discountPrice || price (same as enrollment service)
        const finalPrice = course.discountPrice || course.price
        const finalPriceNum = parseFloat(finalPrice) || 0
        const discountAmount = originalPrice - finalPriceNum

        return {
            originalPrice,
            discountAmount: Math.max(0, discountAmount),
            finalPrice: finalPriceNum,
        }
    }

    /**
     * Create a new order
     * @param {number} userId - User ID
     * @param {number} courseId - Course ID
     * @param {string} paymentGateway - Payment gateway (VNPay, MoMo)
     * @param {Object} billingAddress - Billing address (optional)
     * @returns {Promise<Object>} Created order
     */
    async createOrder(userId, courseId, paymentGateway, billingAddress = null) {
        // Validate payment gateway
        const validGateways = Object.values(PAYMENT_GATEWAY)
        if (!validGateways.includes(paymentGateway)) {
            throw new Error(
                `Invalid payment gateway. Must be one of: ${validGateways.join(', ')}`
            )
        }

        // Check if course exists and is published
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                id: true,
                title: true,
                price: true,
                discountPrice: true,
                status: true,
            },
        })

        if (!course) {
            throw new Error('Course not found')
        }

        if (course.status !== COURSE_STATUS.PUBLISHED) {
            throw new Error('Course is not available for enrollment')
        }

        // Calculate prices
        const prices = this.calculatePrices(course)
        const { originalPrice, discountAmount, finalPrice } = prices

        // Check if course is paid (finalPrice > 0)
        if (finalPrice <= 0) {
            throw new Error(
                'Cannot create order for free course. Please use free enrollment instead.'
            )
        }

        // Check if user is already enrolled
        const existingEnrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId,
                },
            },
        })

        if (existingEnrollment) {
            throw new Error('You are already enrolled in this course')
        }

        // Check if user has pending order for this course
        const existingPendingOrder = await prisma.order.findFirst({
            where: {
                userId,
                courseId,
                paymentStatus: PAYMENT_STATUS.PENDING,
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        // If pending order exists and is recent (< 15 minutes), return it
        if (existingPendingOrder) {
            const orderAge =
                Date.now() - existingPendingOrder.createdAt.getTime()
            if (orderAge < PENDING_TIME.PENDING_TIMEOUT_MS) {
                logger.info(
                    `Returning existing pending order: ${existingPendingOrder.orderCode}`
                )
                return existingPendingOrder
            }
            // If the order has expired (>= 15 minutes), CANCEL it and proceed to create a new order
            else {
                logger.warn(
                    `Auto-cancelling expired pending order: ${existingPendingOrder.orderCode}`
                )
                await prisma.order.update({
                    where: { id: existingPendingOrder.id },
                    data: {
                        paymentStatus: PAYMENT_STATUS.FAILED,
                        notes: 'Expired pending order - Auto-cancelled after 15 minutes timeout.',
                    },
                })
            }
        }

        // Generate order code
        const orderCode = this.generateOrderCode()

        // Create order
        const order = await prisma.order.create({
            data: {
                userId,
                courseId,
                orderCode,
                originalPrice,
                discountAmount,
                finalPrice,
                paymentGateway,
                paymentStatus: PAYMENT_STATUS.PENDING,
                billingAddress: billingAddress || null,
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        thumbnailUrl: true,
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
        })

        logger.info(
            `Order created: Order ID ${order.id}, Order Code ${orderCode}, User ID ${userId}, Course ID ${courseId}`
        )

        return order
    }

    /**
     * Get user's orders with filters and pagination
     * @param {number} userId - User ID
     * @param {Object} filters - Filters object
     * @returns {Promise<Object>} Orders and total count
     */
    async getUserOrders(userId, filters = {}) {
        const {
            page = 1,
            limit = 20,
            paymentStatus,
            paymentGateway,
            startDate,
            endDate,
            sort = 'newest',
        } = filters

        const skip = (page - 1) * limit

        // Build where clause
        const where = {
            userId,
        }

        // Filter by payment status
        if (paymentStatus) {
            where.paymentStatus = paymentStatus
        }

        // Filter by payment gateway
        if (paymentGateway) {
            where.paymentGateway = paymentGateway
        }

        // Filter by date range
        if (startDate || endDate) {
            where.createdAt = {}
            if (startDate) {
                where.createdAt.gte = new Date(startDate)
            }
            if (endDate) {
                where.createdAt.lte = new Date(endDate)
            }
        }

        // Build orderBy clause
        let orderBy = {}
        switch (sort) {
            case 'oldest':
                orderBy = { createdAt: 'asc' }
                break
            case 'amount_asc':
                orderBy = { finalPrice: 'asc' }
                break
            case 'amount_desc':
                orderBy = { finalPrice: 'desc' }
                break
            case 'newest':
            default:
                orderBy = { createdAt: 'desc' }
        }

        // Execute query
        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    course: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            thumbnailUrl: true,
                            instructor: {
                                select: {
                                    id: true,
                                    fullName: true,
                                },
                            },
                        },
                    },
                    paymentTransactions: {
                        select: {
                            id: true,
                            transactionId: true,
                            status: true,
                            amount: true,
                            createdAt: true,
                        },
                        orderBy: {
                            createdAt: 'desc',
                        },
                        take: 1, // Get latest transaction
                    },
                },
            }),
            prisma.order.count({ where }),
        ])

        return {
            orders,
            total,
        }
    }

    /**
     * Get order by ID
     * @param {number} orderId - Order ID
     * @param {number} userId - User ID (for authorization)
     * @returns {Promise<Object>} Order
     */
    async getOrderById(orderId, userId) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        thumbnailUrl: true,
                        description: true,
                        instructor: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
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
                paymentTransactions: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
        })

        if (!order) {
            throw new Error('Order not found')
        }

        // Check if order belongs to user (unless user is admin)
        // Note: Add admin check if needed
        if (order.userId !== userId) {
            throw new Error('Unauthorized access to this order')
        }

        return order
    }

    /**
     * Get order by order code
     * @param {string} orderCode - Order code
     * @param {number} userId - User ID (for authorization)
     * @returns {Promise<Object>} Order
     */
    async getOrderByCode(orderCode, userId) {
        const order = await prisma.order.findUnique({
            where: { orderCode },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        thumbnailUrl: true,
                        description: true,
                        instructor: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
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
                paymentTransactions: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
        })

        if (!order) {
            throw new Error('Order not found')
        }

        // Check if order belongs to user (unless user is admin)
        // Note: Add admin check if needed
        if (order.userId !== userId) {
            throw new Error('Unauthorized access to this order')
        }

        return order
    }

    /**
     * Update order payment status to PAID
     * This method will automatically enroll user in the course when payment is successful
     * @param {number} orderId - Order ID
     * @param {string} transactionId - Transaction ID from payment gateway
     * @param {Object} paymentData - Additional payment data (optional)
     * @returns {Promise<Object>} Updated order and enrollment
     */
    async updateOrderToPaid(orderId, transactionId = null, paymentData = {}) {
        // Get current order
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                userId: true,
                courseId: true,
                paymentStatus: true,
                transactionId: true,
            },
        })

        if (!order) {
            throw new Error('Order not found')
        }

        // Check if order is already paid
        if (order.paymentStatus === PAYMENT_STATUS.PAID) {
            logger.warn(
                `Order ID ${orderId} is already paid. Returning existing order.`
            )
            // Still try to enroll if not already enrolled (idempotent)
            try {
                const { default: enrollmentService } = await import(
                    './enrollment.service.js'
                )
                const enrollment =
                    await enrollmentService.enrollFromPayment(orderId)
                return {
                    order: await this.getOrderById(orderId, order.userId),
                    enrollment,
                    alreadyPaid: true,
                }
            } catch (error) {
                // Enrollment might already exist, that's ok
                logger.warn(
                    `Could not enroll from already-paid order: ${error.message}`
                )
            }
            return {
                order: await this.getOrderById(orderId, order.userId),
                enrollment: null,
                alreadyPaid: true,
            }
        }

        // Check if order is pending
        if (order.paymentStatus !== PAYMENT_STATUS.PENDING) {
            throw new Error(
                `Cannot update order to PAID. Current status: ${order.paymentStatus}`
            )
        }

        // Update order to PAID within a transaction
        const result = await prisma.$transaction(async (tx) => {
            const updateData = {
                paymentStatus: PAYMENT_STATUS.PAID,
                paidAt: new Date(),
                transactionId: transactionId || order.transactionId,
            }

            if (paymentData?.gateway) {
                updateData.paymentGateway = paymentData.gateway
            }

            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: updateData,
                include: {
                    course: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            thumbnailUrl: true,
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
            })

            logger.info(
                `Order ID ${orderId} updated to PAID. Transaction ID: ${transactionId || 'N/A'}`
            )

            return updatedOrder
        })

        // Automatically enroll user in the course
        // Use dynamic import to avoid circular dependency
        let enrollment = null
        try {
            const { default: enrollmentService } = await import(
                './enrollment.service.js'
            )
            enrollment = await enrollmentService.enrollFromPayment(orderId)
            logger.info(
                `User ID ${order.userId} automatically enrolled in course ID ${order.courseId} after payment`
            )
        } catch (error) {
            // Log error but don't fail - enrollment might already exist (idempotent)
            logger.error(
                `Failed to enroll user from payment: ${error.message}`,
                error
            )
            // Re-throw if it's a critical error (not just "already enrolled")
            if (!error.message.includes('already enrolled')) {
                throw error
            }
        }

        return {
            order: result,
            enrollment,
        }
    }

    /**
     * Cancel order
     * Only pending orders can be cancelled
     * @param {number} orderId - Order ID
     * @param {number} userId - User ID (for ownership verification)
     * @returns {Promise<object>} Cancelled order
     */
    async cancelOrder(orderId, userId) {
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                userId,
            },
        })

        if (!order) {
            throw new Error('Order not found')
        }

        if (order.paymentStatus !== PAYMENT_STATUS.PENDING) {
            throw new Error(
                `Cannot cancel order with status: ${order.paymentStatus}`
            )
        }

        const cancelledOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                paymentStatus: PAYMENT_STATUS.FAILED,
                notes: 'Cancelled by user',
            },
        })

        logger.info(`Order cancelled: ${order.orderCode} by user ${userId}`)

        return cancelledOrder
    }

    /**
     * Get order statistics for a user
     * @param {number} userId - User ID
     * @returns {Promise<object>} Order statistics
     */
    async getUserOrderStats(userId) {
        const [total, paid, pending, failed] = await Promise.all([
            prisma.order.count({ where: { userId } }),
            prisma.order.count({
                where: { userId, paymentStatus: PAYMENT_STATUS.PAID },
            }),
            prisma.order.count({
                where: { userId, paymentStatus: PAYMENT_STATUS.PENDING },
            }),
            prisma.order.count({
                where: { userId, paymentStatus: PAYMENT_STATUS.FAILED },
            }),
        ])

        // Calculate total spent
        const totalSpent = await prisma.order.aggregate({
            where: {
                userId,
                paymentStatus: PAYMENT_STATUS.PAID,
            },
            _sum: {
                finalPrice: true,
            },
        })

        return {
            total,
            paid,
            pending,
            failed,
            totalSpent: parseFloat(totalSpent._sum.finalPrice || 0),
        }
    }

    /**
     * Automatically cancel (change to FAILED) pending orders that have exceeded 15 minutes.
     * Typically called by a Cron Job.
     * @returns {Promise<number>} Number of orders cancelled
     */
    async cleanupExpiredPendingOrders() {
        // 1. Find all PENDING orders created before the EXPIRY_THRESHOLD
        const expiredOrders = await prisma.order.findMany({
            where: {
                paymentStatus: PAYMENT_STATUS.PENDING,
                createdAt: {
                    lte: PENDING_TIME.EXPIRY_THRESHOLD, // Less Than or Equal (older than expiry threshold)
                },
            },
            select: {
                id: true,
                orderCode: true,
            },
        })

        if (expiredOrders.length === 0) {
            logger.debug('Cron Job: No expired pending orders found.')
            return 0
        }

        // 2. Update all these orders to FAILED status
        const orderIdsToUpdate = expiredOrders.map((o) => o.id)

        await prisma.order.updateMany({
            where: {
                id: { in: orderIdsToUpdate },
            },
            data: {
                paymentStatus: PAYMENT_STATUS.FAILED,
                notes: 'Auto-cancelled by scheduler: Payment timeout exceeded (15 minutes).',
            },
        })

        logger.warn(
            `[CRON] Auto-cancelled ${expiredOrders.length} expired pending orders: ${expiredOrders.map((o) => o.orderCode).join(', ')}`
        )

        return expiredOrders.length
    }
}

export default new OrdersService()
