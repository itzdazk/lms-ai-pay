// backend/src/services/orders.service.js
import { prisma } from '../config/database.config.js'
import {
    PAYMENT_STATUS,
    COURSE_STATUS,
    PAYMENT_GATEWAY,
    PENDING_TIME,
    TRANSACTION_STATUS,
    HTTP_STATUS,
} from '../config/constants.js'
import notificationsService from './notifications.service.js'
import emailService from './email.service.js'
import couponService from './coupon.service.js'
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
     * @param {string} couponCode - Coupon code (optional)
     * @returns {Promise<Object>} Created order
     */
    async createOrder(
        userId,
        courseId,
        paymentGateway,
        billingAddress = null,
        couponCode = null,
    ) {
        // Validate payment gateway
        const validGateways = Object.values(PAYMENT_GATEWAY)
        if (!validGateways.includes(paymentGateway)) {
            const error = new Error(
                `Cổng thanh toán không hợp lệ. Phải là một trong các cổng: ${validGateways.join(', ')}`,
            )
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
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
            const error = new Error('Không tìm thấy khóa học')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        if (course.status !== COURSE_STATUS.PUBLISHED) {
            const error = new Error('Khóa học không khả dụng để đăng ký')
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }

        // Calculate prices
        const prices = this.calculatePrices(course)
        let { originalPrice, discountAmount, finalPrice } = prices

        // Apply coupon if provided
        let couponDiscount = 0
        let appliedCouponCode = null

        if (couponCode) {
            logger.info(`[Coupon] Attempting to apply coupon: ${couponCode}`)
            logger.info(`[Coupon] Order total before coupon: ${finalPrice}`)

            try {
                // Validate coupon (returns coupon object directly)
                // Note: This does not increment matches, usesCount or create usage record yet
                const coupon = await couponService.validateCoupon(
                    couponCode,
                    userId,
                    finalPrice,
                    [courseId],
                )

                // Calculate discount
                couponDiscount = couponService.calculateDiscount(
                    coupon,
                    finalPrice,
                )

                logger.info(`[Coupon] Calculated discount: ${couponDiscount}`)

                // Update final price with coupon discount
                finalPrice = Math.max(0, finalPrice - couponDiscount)
                discountAmount = discountAmount + couponDiscount
                appliedCouponCode = coupon.code
            } catch (error) {
                // If coupon validation fails, log error but continue order creation without coupon
                logger.error('[Coupon] Validation error:', error.message)
                logger.error('[Coupon] Stack:', error.stack)
                // Don't throw error, just proceed without coupon
            }
        }

        // Check if course is paid (finalPrice > 0)
        if (finalPrice <= 0) {
            const error = new Error(
                'Không thể tạo đơn hàng cho khóa học miễn phí. Vui lòng sử dụng đăng ký miễn phí thay vì đơn hàng.',
            )
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
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
            const error = new Error('Bạn đã đăng ký vào khóa học này')
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
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
                return existingPendingOrder
            }
            // If the order has expired (>= 15 minutes), CANCEL it and proceed to create a new order
            else {
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

        // Create order with coupon tracking (Lazy Increment: no usage record created yet)
        const order = await prisma.$transaction(async (tx) => {
            // Create order
            const newOrder = await tx.order.create({
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
                    // ✅ NEW: Save coupon info for lazy increment
                    appliedCouponCode: appliedCouponCode || null,
                    couponDiscount: couponDiscount > 0 ? couponDiscount : 0,
                },
                include: {
                    course: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            thumbnailUrl: true,
                            price: true,
                            discountPrice: true,
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
            return newOrder
        })

        return order
    }

    /**
     * Get user's orders with filters and pagination
     * @param {string} userId - User ID
     * @param {object} filters - Filters
     * @param {number} filters.page - Page number
     * @param {number} filters.limit - Limit per page
     * @param {string} filters.paymentStatus - Payment status
     * @param {string} filters.paymentGateway - Payment gateway
     * @param {string} filters.startDate - Start date
     * @param {string} filters.endDate - End date
     * @param {string} filters.sort - Sort order
     * @param {string} filters.search - Search query
     * @returns {Promise<object>} - User's orders
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
            search,
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

        // Filter by search (orderCode or course title)
        if (search) {
            where.OR = [
                {
                    orderCode: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
                {
                    course: {
                        title: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                },
            ]
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
                    user: {
                        select: {
                            id: true,
                            userName: true,
                            email: true,
                            fullName: true,
                        },
                    },
                    course: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            thumbnailUrl: true,
                            price: true,
                            discountPrice: true,
                            totalLessons: true,
                            durationHours: true,
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
     * @param {string} orderId - Order ID
     * @param {string} userId - User ID
     * @returns {Promise<object>} - Order
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
                        price: true,
                        discountPrice: true,
                        description: true,
                        totalLessons: true,
                        durationHours: true,
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
            const error = new Error('Không tìm thấy đơn hàng')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        if (order.userId !== userId) {
            const error = new Error('Không có quyền truy cập vào đơn hàng này')
            error.statusCode = HTTP_STATUS.FORBIDDEN
            throw error
        }

        return order
    }

    /**
     * Get order by order code
     * @param {string} orderCode - Order code
     * @param {string} userId - User ID
     * @returns {Promise<object>} - Order
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
                        price: true,
                        discountPrice: true,
                        description: true,
                        totalLessons: true,
                        durationHours: true,
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
            const error = new Error('Không tìm thấy đơn hàng')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        if (order.userId !== userId) {
            const error = new Error('Không có quyền truy cập vào đơn hàng này')
            error.statusCode = HTTP_STATUS.FORBIDDEN
            throw error
        }

        return order
    }

    /**
     * Update order payment status to PAID
     * @param {string} orderId - Order ID
     * @param {string} transactionId - Transaction ID
     * @param {object} paymentData - Payment data
     * @returns {Promise<object>} - Updated order
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
                appliedCouponCode: true,
                couponDiscount: true,
            },
        })

        if (!order) {
            const error = new Error('Không tìm thấy đơn hàng')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Check if order is already paid
        if (order.paymentStatus === PAYMENT_STATUS.PAID) {
            // Still try to enroll if not already enrolled (idempotent)
            try {
                const { default: enrollmentService } =
                    await import('./enrollment.service.js')
                const enrollment =
                    await enrollmentService.enrollFromPayment(orderId)
                return {
                    order: await this.getOrderById(orderId, order.userId),
                    enrollment,
                    alreadyPaid: true,
                }
            } catch (error) {
                // Enrollment might already exist, that's ok
            }
            return {
                order: await this.getOrderById(orderId, order.userId),
                enrollment: null,
                alreadyPaid: true,
            }
        }

        // Check if order is pending
        if (order.paymentStatus !== PAYMENT_STATUS.PENDING) {
            const error = new Error(
                `Không thể cập nhật trạng thái đơn hàng thành PAID. Trạng thái hiện tại: ${order.paymentStatus}`,
            )
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
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

            // ✅ NEW: Apply coupon only when payment is successful
            if (
                updatedOrder.appliedCouponCode &&
                Number(updatedOrder.couponDiscount) > 0
            ) {
                try {
                    await couponService.applyCouponOnSuccess(
                        updatedOrder.appliedCouponCode,
                        updatedOrder.userId,
                        updatedOrder.id,
                        Number(updatedOrder.couponDiscount),
                        tx,
                    )
                    logger.info(
                        `✅ Coupon ${updatedOrder.appliedCouponCode} consumed for order ${updatedOrder.id}`,
                    )
                } catch (error) {
                    logger.error(`Failed to apply coupon on success:`, error)
                    // Log error but don't fail the payment success flow
                }
            }

            return updatedOrder
        })

        // Automatically enroll user in the course
        // Use dynamic import to avoid circular dependency
        let enrollment = null
        try {
            const { default: enrollmentService } =
                await import('./enrollment.service.js')
            enrollment = await enrollmentService.enrollFromPayment(orderId)
        } catch (error) {
            // Log error but don't fail - enrollment might already exist (idempotent)
            // Re-throw if it's a critical error (not just "already enrolled")
            if (!error.message.includes('already enrolled')) {
                throw error
            }
        }

        // Create notification for payment success (student)
        await notificationsService.notifyPaymentSuccess(
            result.user.id,
            result.id,
            result.courseId,
            result.course.title,
            result.finalPrice,
        )

        // Notify instructor about payment received
        try {
            if (result.course.instructor) {
                await notificationsService.notifyInstructorPaymentReceived(
                    result.course.instructor.id,
                    result.id,
                    result.courseId,
                    result.course.title,
                    result.finalPrice,
                    result.user.fullName,
                )
            }
        } catch (error) {
            // Don't fail payment if notification fails
        }

        // Send payment success email
        try {
            await emailService.sendPaymentSuccessEmail(
                result.user.email,
                result.user.fullName,
                result,
            )
        } catch (error) {
            // Log error but don't fail the payment process
        }

        return {
            order: result,
            enrollment,
        }
    }

    /**
     * Cancel order
     * @param {string} orderId - Order ID
     * @param {string} userId - User ID
     * @returns {Promise<object>} - Updated order
     */
    async cancelOrder(orderId, userId) {
        // 1. Fetch order với transactions
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                userId,
            },
            include: {
                paymentTransactions: {
                    where: {
                        status: TRANSACTION_STATUS.PENDING,
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
                course: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        })

        if (!order) {
            const error = new Error('Không tìm thấy đơn hàng')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // 2. Validate order status
        if (order.paymentStatus !== PAYMENT_STATUS.PENDING) {
            const error = new Error(
                `Không thể hủy đơn hàng với trạng thái: ${order.paymentStatus}. Chỉ có đơn hàng PENDING mới có thể bị hủy.`,
            )
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }

        // 3. Kiểm tra nếu đã có transaction SUCCESS
        const hasSuccessfulTransaction =
            await prisma.paymentTransaction.findFirst({
                where: {
                    orderId: order.id,
                    status: TRANSACTION_STATUS.SUCCESS,
                },
            })

        if (hasSuccessfulTransaction) {
            const error = new Error(
                'Không thể hủy đơn hàng - thanh toán đã được xử lý thành công',
            )
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }

        // 4. Cancel cả Order VÀ tất cả Transactions (NO ROLLBACK NEEDED)
        const result = await prisma.$transaction(async (tx) => {
            // 4.1. Update all PENDING transactions → FAILED
            const updatedTransactionsCount =
                await tx.paymentTransaction.updateMany({
                    where: {
                        orderId: order.id,
                        status: TRANSACTION_STATUS.PENDING,
                    },
                    data: {
                        status: TRANSACTION_STATUS.FAILED,
                        errorMessage: 'Order cancelled by user',
                        gatewayResponse: {
                            cancelledAt: new Date().toISOString(),
                            cancelledBy: 'user',
                            cancelReason: 'USER_CANCELLED',
                        },
                    },
                })

            // 4.3. Update Order → FAILED
            const cancelledOrder = await tx.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: PAYMENT_STATUS.FAILED,
                    notes: 'Cancelled by user',
                },
                include: {
                    course: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
            })

            return {
                order: cancelledOrder,
                cancelledTransactionsCount: updatedTransactionsCount.count,
            }
        })

        // 5. Send notification (fire-and-forget)
        setImmediate(() => {
            notificationsService
                .notifyOrderCancelled(
                    userId,
                    order.id,
                    order.courseId,
                    order.course?.title || 'Unknown Course',
                )
                .catch((err) => {})
        })

        return result.order
    }

    /**
     * Get order statistics for a user
     * @param {number} userId - User ID
     * @returns {Promise<object>} Order statistics
     */
    async getUserOrderStats(userId) {
        const [total, paid, pending, failed, refunded, partiallyRefunded] =
            await Promise.all([
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
                prisma.order.count({
                    where: {
                        userId,
                        paymentStatus: PAYMENT_STATUS.REFUNDED,
                    },
                }),
                prisma.order.count({
                    where: {
                        userId,
                        paymentStatus: PAYMENT_STATUS.PARTIALLY_REFUNDED,
                    },
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
            refunded,
            partiallyRefunded,
            totalSpent: parseFloat(totalSpent._sum.finalPrice || 0),
        }
    }
}

export default new OrdersService()
