// backend/src/services/enrollment.service.js
import { prisma } from '../config/database.config.js'
import {
    ENROLLMENT_STATUS,
    COURSE_STATUS,
    PAYMENT_STATUS,
    HTTP_STATUS,
    USER_ROLES,
} from '../config/constants.js'
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
                            ratingAvg: true,
                        },
                    },
                },
            }),
            prisma.enrollment.count({ where }),
        ])

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
            const error = new Error('Không tìm thấy đăng ký')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

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
        billingAddress = null,
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
            const error = new Error('Không tìm thấy khóa học')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        if (course.status !== COURSE_STATUS.PUBLISHED) {
            const error = new Error('Khóa học không khả dụng để đăng ký')
            error.statusCode = HTTP_STATUS.BAD_REQUEST
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
            const error = new Error('Bạn đã đăng ký khóa học này')
            error.statusCode = HTTP_STATUS.BAD_REQUEST
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

            // Create notification for enrollment success (student)
            await notificationsService.notifyEnrollmentSuccess(
                userId,
                courseId,
                course.title,
            )

            // Notify instructor about new enrollment
            try {
                const student = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { fullName: true },
                })
                if (course.instructor && student) {
                    await notificationsService.notifyInstructorNewEnrollment(
                        course.instructor.id,
                        courseId,
                        course.title,
                        student.fullName,
                        userId,
                    )
                }
            } catch (error) {
                // Don't fail enrollment if notification fails
            }

            // Notify admins about new enrollment (free course)
            try {
                const student = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { fullName: true },
                })
                if (student && course.instructor) {
                    await notificationsService.notifyAdminsNewEnrollment(
                        userId,
                        student.fullName,
                        courseId,
                        course.title,
                        course.instructor.fullName,
                        false, // isPaid = false for free course
                        null,
                    )
                }
            } catch (error) {
                // Don't fail enrollment if notification fails
            }

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
                        },
                    )
                }
            } catch (error) {}

            return {
                requiresPayment: false,
                enrollment,
            }
        }

        // If course is PAID, create order automatically
        if (!paymentGateway) {
            const error = new Error(
                'Cổng thanh toán là bắt buộc đối với các khóa học có phí. Vui lòng cung cấp cổng thanh toán (VNPay hoặc MoMo).',
            )
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }

        // Create order automatically
        const order = await ordersService.createOrder(
            userId,
            courseId,
            paymentGateway,
            billingAddress,
        )

        return {
            requiresPayment: true,
            order,
            message:
                'Đơn hàng được tạo thành công. Vui lòng tiến hành thanh toán.',
        }
    }

    /**
     * Enroll user from payment (called when payment is successful)
     * This method is idempotent - if enrollment already exists, it returns the existing enrollment
     * @param {number} orderId - Order ID
     * @returns {Promise<object>} Enrollment object
     */
    /**
     * Enroll user from payment (called after successful payment)
     * @param {number} orderId - Order ID
     * @returns {Promise<object>} Enrollment
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
                finalPrice: true,
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
            const error = new Error('Không tìm thấy đơn hàng')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }
        if (order.paymentStatus !== PAYMENT_STATUS.PAID) {
            const error = new Error(
                `Không thể đăng ký từ đơn hàng chưa thanh toán. Trạng thái: ${order.paymentStatus}`,
            )
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }
        if (order.course.status !== COURSE_STATUS.PUBLISHED) {
            const error = new Error('Khóa học không khả dụng để đăng ký')
            error.statusCode = HTTP_STATUS.BAD_REQUEST
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

        // Gửi notification (fire-and-forget)
        notificationsService
            .notifyEnrollmentSuccess(
                order.userId,
                order.courseId,
                order.course.title,
            )
            .catch((err) => {})

        // Notify instructor about new enrollment from payment (fire-and-forget)
        ;(async () => {
            try {
                const student = await prisma.user.findUnique({
                    where: { id: order.userId },
                    select: { fullName: true },
                })
                if (order.course.instructor && student) {
                    await notificationsService.notifyInstructorNewEnrollment(
                        order.course.instructor.id,
                        order.courseId,
                        order.course.title,
                        student.fullName,
                        order.userId,
                    )
                }
            } catch (error) {}
        })()

        // Notify admins about new enrollment from payment (fire-and-forget)
        ;(async () => {
            try {
                const student = await prisma.user.findUnique({
                    where: { id: order.userId },
                    select: { fullName: true },
                })
                if (student && order.course.instructor && order.finalPrice) {
                    await notificationsService.notifyAdminsNewEnrollment(
                        order.userId,
                        student.fullName,
                        order.courseId,
                        order.course.title,
                        order.course.instructor.fullName,
                        true, // isPaid = true
                        order.finalPrice,
                    )
                }
            } catch (error) {}
        })()

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
                        },
                    )
                }
            } catch (error) {
                // Don't fail enrollment if email fails
            }
        })()

        return enrollment
    }

    /**
     * Check if user has access to a course (enrolled, instructor, or admin)
     * @param {number} userId - User ID
     * @param {number} courseId - Course ID
     * @param {string} userRole - User's role (optional, for role-based access)
     * @returns {Promise<object>}
     */
    async checkEnrollment(userId, courseId, userRole = null) {
        // Admin has access to all courses
        if (userRole === USER_ROLES.ADMIN) {
            return {
                isEnrolled: true,
                isActive: true,
                enrollment: null,
                accessReason: 'admin',
            }
        }

        // Instructor has access to their own courses
        if (userRole === USER_ROLES.INSTRUCTOR) {
            const course = await prisma.course.findUnique({
                where: { id: courseId },
                select: { instructorId: true },
            })
            if (course && course.instructorId === userId) {
                return {
                    isEnrolled: true,
                    isActive: true,
                    enrollment: null,
                    accessReason: 'instructor',
                }
            }
        }

        // Regular enrollment check for students (or instructor not owning the course)
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

        return {
            isEnrolled,
            isActive,
            enrollment: enrollment || null,
            accessReason: isEnrolled ? 'enrolled' : null,
        }
    }
}

export default new EnrollmentService()
