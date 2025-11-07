// backend/src/services/enrollment.service.js
import { prisma } from '../config/database.config.js'
import { ENROLLMENT_STATUS, COURSE_STATUS } from '../config/constants.js'
import logger from '../config/logger.config.js'

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
                                username: true,
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
            throw new Error('Enrollment not found')
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
     * Enroll in a free course
     * @param {number} userId - User ID
     * @param {number} courseId - Course ID
     * @returns {Promise<object>}
     */
    async enrollInFreeCourse(userId, courseId) {
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

        // Check if course is free
        const finalPrice = course.discountPrice || course.price
        if (parseFloat(finalPrice) > 0) {
            throw new Error(
                'This course is not free. Please proceed with payment.'
            )
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
            throw new Error('You are already enrolled in this course')
        }

        // Create enrollment
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
