// backend/src/services/enrollment.service.js
import { prisma } from '../config/database.config.js'
import {
    ENROLLMENT_STATUS,
    COURSE_STATUS,
    PAYMENT_STATUS,
} from '../config/constants.js'
import logger from '../config/logger.config.js'
import ordersService from './orders.service.js'
import notificationsService from './notifications.service.js'
import emailService from './email.service.js'

class EnrollmentService {
    /**
     * Get user enrollments with filters
     * @param {number} userId - User ID
     * @param {object} filters - Filter options
     * @returns {Promise<{enrollments: Array, total: number}>}
     */
    async getUserEnrollments(userId, filters) {
        const {
            page = 1,
            limit = 20,
            status,
            search,
            sort = 'newest',
        } = filters

        const skip = (page - 1) * limit

        // Build where clause
        const where = {
            userId,
        }

        // Filter by status
        if (status) {
            where.status = status
        }

        // Search in course title
        if (search) {
            where.course = {
                title: {
                    contains: search,
                    mode: 'insensitive',
                },
            }
        }

        // Build orderBy clause
        let orderBy = {}
        switch (sort) {
            case 'oldest':
                orderBy = { enrolledAt: 'asc' }
                break
            case 'progress':
                orderBy = { progressPercentage: 'desc' }
                break
            case 'lastAccessed':
                orderBy = { lastAccessedAt: 'desc' }
                break
            case 'newest':
            default:
                orderBy = { enrolledAt: 'desc' }
        }

        // Execute query
        const [enrollments, total] = await Promise.all([
            prisma.enrollment.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                select: {
                    id: true,
                    userId: true,
                    courseId: true,
                    enrolledAt: true,
                    startedAt: true,
                    completedAt: true,
                    progressPercentage: true,
                    lastAccessedAt: true,
                    expiresAt: true,
                    status: true,
                    course: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            thumbnailUrl: true,
                            shortDescription: true,
                            level: true,
                            durationHours: true,
                            totalLessons: true,
                            instructor: {
                                select: {
                                    id: true,
                                    fullName: true,
                                    avatarUrl: true,
                                },
                            },
                        },
                    },
                },
            }),
            prisma.enrollment.count({ where }),
        ])

        logger.info(
            `Retrieved ${enrollments.length} enrollments for user ID: ${userId}`
        )

        return {
            enrollments,
            total,
        }
    }

    /**
     * Get enrollment by ID
     * @param {number} enrollmentId - Enrollment ID
     * @param {number} userId - User ID
     * @returns {Promise<object>}
     */
    async getEnrollmentById(enrollmentId, userId) {
        const enrollment = await prisma.enrollment.findFirst({
            where: {
                id: enrollmentId,
                userId, // Ensure user owns this enrollment
            },
            select: {
                id: true,
                userId: true,
                courseId: true,
                enrolledAt: true,
                startedAt: true,
                completedAt: true,
                progressPercentage: true,
                lastAccessedAt: true,
                expiresAt: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        description: true,
                        thumbnailUrl: true,
                        level: true,
                        durationHours: true,
                        totalLessons: true,
                        language: true,
                        ratingAvg: true,
                        ratingCount: true,
                        instructor: {
                            select: {
                                id: true,
                                userName: true,
                                fullName: true,
                                avatarUrl: true,
                                bio: true,
                            },
                        },
                        category: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                            },
                        },
                    },
                },
            },
        })

        if (!enrollment) {
            const error = new Error('Enrollment not found')
            error.statusCode = 404
            throw error
        }

        logger.info(
            `Retrieved enrollment ID: ${enrollmentId} for user ID: ${userId}`
        )

        return enrollment
    }

    /**
     * Get active enrollments (currently learning)
     * @param {number} userId - User ID
     * @param {number} limit - Limit results
     * @returns {Promise<Array>}
     */
    async getActiveEnrollments(userId, limit = 10) {
        const enrollments = await prisma.enrollment.findMany({
            where: {
                userId,
                status: ENROLLMENT_STATUS.ACTIVE,
                progressPercentage: {
                    lt: 100,
                },
            },
            take: limit,
            orderBy: {
                lastAccessedAt: 'desc',
            },
            select: {
                id: true,
                courseId: true,
                enrolledAt: true,
                progressPercentage: true,
                lastAccessedAt: true,
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        thumbnailUrl: true,
                        level: true,
                        durationHours: true,
                        totalLessons: true,
                        instructor: {
                            select: {
                                id: true,
                                fullName: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
            },
        })

        logger.info(
            `Retrieved ${enrollments.length} active enrollments for user ID: ${userId}`
        )

        return enrollments
    }

    /**
     * Get completed enrollments
     * @param {number} userId - User ID
     * @param {object} filters - Filter options
     * @returns {Promise<{enrollments: Array, total: number}>}
     */
    async getCompletedEnrollments(userId, filters) {
        const { page = 1, limit = 20 } = filters
        const skip = (page - 1) * limit

        const where = {
            userId,
            status: ENROLLMENT_STATUS.COMPLETED,
            progressPercentage: 100,
        }

        const [enrollments, total] = await Promise.all([
            prisma.enrollment.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    completedAt: 'desc',
                },
                select: {
                    id: true,
                    courseId: true,
                    enrolledAt: true,
                    completedAt: true,
                    progressPercentage: true,
                    course: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            thumbnailUrl: true,
                            level: true,
                            durationHours: true,
                            totalLessons: true,
                            instructor: {
                                select: {
                                    id: true,
                                    fullName: true,
                                    avatarUrl: true,
                                },
                            },
                        },
                    },
                },
            }),
            prisma.enrollment.count({ where }),
        ])

        logger.info(
            `Retrieved ${enrollments.length} completed enrollments for user ID: ${userId}`
        )

        return {
            enrollments,
            total,
        }
    }

    /**
     * Enroll in a course (free or paid)
     * @param {number} userId - User ID
     * @param {number} courseId - Course ID
     * @param {string} paymentGateway - Payment gateway (VNPay, MoMo) - Required if course is paid
     * @param {Object} billingAddress - Billing address (optional)
     * @returns {Promise<object>}
     */
    async enrollInCourse(
        userId,
        courseId,
        paymentGateway = null,
        billingAddress = null
    ) {
        // Check if course exists and is published
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                id: true,
                title: true,
                slug: true,
                price: true,
                discountPrice: true,
                status: true,
                thumbnailUrl: true,
                instructor: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
        })

        if (!course) {
            const error = new Error('Course not found')
            error.statusCode = 404
            throw error
        }

        if (course.status !== COURSE_STATUS.PUBLISHED) {
            const error = new Error('Course is not available for enrollment')
            error.statusCode = 400
            throw error
        }

        // Check if already enrolled
        const existingEnrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId,
                },
            },
        })

        if (existingEnrollment) {
            const error = new Error('You are already enrolled in this course')
            error.statusCode = 400
            throw error
        }

        // Calculate final price
        const finalPrice = course.discountPrice || course.price
        const isFree = parseFloat(finalPrice) === 0

        // If course is FREE, create enrollment immediately
        if (isFree) {
            const enrollment = await prisma.enrollment.create({
                data: {
                    userId,
                    courseId,
                    status: ENROLLMENT_STATUS.ACTIVE,
                    progressPercentage: 0,
                },
                select: {
                    id: true,
                    userId: true,
                    courseId: true,
                    enrolledAt: true,
                    status: true,
                    progressPercentage: true,
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
                },
            })

            // Update course enrolled count
            await prisma.course.update({
                where: { id: courseId },
                data: {
                    enrolledCount: {
                        increment: 1,
                    },
                },
            })

            logger.info(
                `User ID: ${userId} enrolled in free course ID: ${courseId}`
            )

            // Create notification for enrollment success
            await notificationsService.notifyEnrollmentSuccess(
                userId,
                courseId,
                course.title
            )

            // Send enrollment success email
            try {
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { email: true, fullName: true },
                })

                if (user) {
                    await emailService.sendEnrollmentSuccessEmail(
                        user.email,
                        user.fullName,
                        {
                            ...course,
                            instructor: course.instructor,
                        }
                    )
                    logger.info(
                        `Enrollment success email sent to user ${userId} for course ${courseId}`
                    )
                }
            } catch (error) {
                // Log error but don't fail the enrollment process
                logger.error(
                    `Failed to send enrollment success email: ${error.message}`,
                    error
                )
            }

            return {
                requiresPayment: false,
                enrollment,
            }
        }

        // If course is PAID, create order automatically
        if (!paymentGateway) {
            const error = new Error(
                'Payment gateway is required for paid courses. Please provide paymentGateway (VNPay or MoMo).'
            )
            error.statusCode = 400
            throw error
        }

        // Create order automatically
        const order = await ordersService.createOrder(
            userId,
            courseId,
            paymentGateway,
            billingAddress
        )

        logger.info(
            `Order created automatically for user ID: ${userId}, course ID: ${courseId}, order ID: ${order.id}`
        )

        return {
            requiresPayment: true,
            order,
            message: 'Order created successfully. Please proceed to payment.',
        }
    }

    /**
     * Enroll user from payment (called when payment is successful)
     * This method is idempotent - if enrollment already exists, it returns the existing enrollment
     * @param {number} orderId - Order ID
     * @returns {Promise<object>} Enrollment object
     */
    async enrollFromPayment(orderId) {
        // Get order with user and course info
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                userId: true,
                courseId: true,
                paymentStatus: true,
                course: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
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
            },
        })

        if (!order) {
            const error = new Error('Order not found')
            error.statusCode = 404
            throw error
        }
        if (order.paymentStatus !== PAYMENT_STATUS.PAID) {
            const error = new Error(
                `Cannot enroll from unpaid order. Status: ${order.paymentStatus}`
            )
            error.statusCode = 400
            throw error
        }
        if (order.course.status !== COURSE_STATUS.PUBLISHED) {
            const error = new Error('Course is not available for enrollment')
            error.statusCode = 400
            throw error
        }

        // Check if already enrolled (idempotent)
        const existingEnrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: order.userId,
                    courseId: order.courseId,
                },
            },
        })

        if (existingEnrollment) {
            logger.info(
                `User ${order.userId} already enrolled in course ${order.courseId}`
            )
            return existingEnrollment
        }

        // === BỎ HOÀN TOÀN $transaction ở đây ===
        // Vì đã có transaction bao ngoài ở updateOrderToPaid()
        const enrollment = await prisma.enrollment.create({
            data: {
                userId: order.userId,
                courseId: order.courseId,
                status: ENROLLMENT_STATUS.ACTIVE,
                progressPercentage: 0,
            },
            select: {
                id: true,
                userId: true,
                courseId: true,
                enrolledAt: true,
                status: true,
                progressPercentage: true,
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
            },
        })

        // Update course enrolled count
        await prisma.course.update({
            where: { id: order.courseId },
            data: { enrolledCount: { increment: 1 } },
        })

        logger.info(
            `User ${order.userId} enrolled in course ${order.courseId} from order ${orderId}`
        )

        // Gửi notification (fire-and-forget)
        notificationsService
            .notifyEnrollmentSuccess(
                order.userId,
                order.courseId,
                order.course.title
            )
            .catch((err) => {
                logger.error('Failed to send enrollment notification:', err)
            })

        // Gửi email (fire-and-forget – không được await trong transaction)
        ;(async () => {
            try {
                const user = await prisma.user.findUnique({
                    where: { id: order.userId },
                    select: { email: true, fullName: true },
                })

                if (user?.email) {
                    await emailService.sendEnrollmentSuccessEmail(
                        user.email,
                        user.fullName,
                        {
                            ...order.course,
                            instructor: order.course.instructor,
                        }
                    )
                    logger.info(`Enrollment email sent to ${user.email}`)
                }
            } catch (error) {
                logger.error(
                    `Failed to send enrollment email: ${error.message}`,
                    error
                )
            }
        })()

        return enrollment
    }

    /**
     * Check if user is enrolled in a course
     * @param {number} userId - User ID
     * @param {number} courseId - Course ID
     * @returns {Promise<object>}
     */
    async checkEnrollment(userId, courseId) {
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId,
                },
            },
            select: {
                id: true,
                status: true,
                enrolledAt: true,
                progressPercentage: true,
                expiresAt: true,
            },
        })

        const isEnrolled = !!enrollment
        const isActive =
            enrollment && enrollment.status === ENROLLMENT_STATUS.ACTIVE

        logger.info(
            `Enrollment check for user ID: ${userId}, course ID: ${courseId} - Enrolled: ${isEnrolled}`
        )

        return {
            isEnrolled,
            isActive,
            enrollment: enrollment || null,
        }
    }
}

export default new EnrollmentService()
