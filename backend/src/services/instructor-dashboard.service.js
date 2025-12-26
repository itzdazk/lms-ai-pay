// src/services/instructor-dashboard.service.js
import { prisma } from '../config/database.config.js'
import {
    ENROLLMENT_STATUS,
    PAYMENT_STATUS,
    COURSE_STATUS,
} from '../config/constants.js'

class InstructorDashboardService {
    /**
     * Get instructor dashboard overview
     * @param {number} instructorId - Instructor ID
     * @returns {Promise<Object>} Dashboard data
     */
    async getInstructorDashboard(instructorId) {
        // Get stats
        const stats = await this.getInstructorStats(instructorId)

        // Get recent courses
        const recentCourses = await prisma.course.findMany({
            where: { instructorId },
            select: {
                id: true,
                title: true,
                slug: true,
                thumbnailUrl: true,
                status: true,
                enrolledCount: true,
                ratingAvg: true,
                ratingCount: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 5,
        })

        return {
            stats,
            recentCourses,
        }
    }

    /**
     * Get instructor statistics
     * @param {number} instructorId - Instructor ID
     * @returns {Promise<Object>} Statistics
     */
    async getInstructorStats(instructorId) {
        // Total courses
        const totalCourses = await prisma.course.count({
            where: { instructorId },
        })

        // Published courses
        const publishedCourses = await prisma.course.count({
            where: {
                instructorId,
                status: COURSE_STATUS.PUBLISHED,
            },
        })

        // Draft courses
        const draftCourses = await prisma.course.count({
            where: {
                instructorId,
                status: COURSE_STATUS.DRAFT,
            },
        })

        // Total enrollments across all courses
        const totalEnrollments = await prisma.enrollment.count({
            where: {
                course: {
                    instructorId,
                },
            },
        })

        // Active enrollments
        const activeEnrollments = await prisma.enrollment.count({
            where: {
                course: {
                    instructorId,
                },
                status: ENROLLMENT_STATUS.ACTIVE,
            },
        })

        // Total students (unique users enrolled in instructor's courses)
        const totalStudents = await prisma.enrollment.findMany({
            where: {
                course: {
                    instructorId,
                },
            },
            select: {
                userId: true,
            },
            distinct: ['userId'],
        })

        // Total revenue (sum of finalPrice from paid orders)
        const revenueData = await prisma.order.aggregate({
            where: {
                course: {
                    instructorId,
                },
                paymentStatus: PAYMENT_STATUS.PAID,
            },
            _sum: {
                finalPrice: true,
            },
        })

        const totalRevenue = revenueData._sum.finalPrice || 0

        // Average rating across all courses
        const ratingData = await prisma.course.aggregate({
            where: {
                instructorId,
                ratingCount: {
                    gt: 0,
                },
            },
            _avg: {
                ratingAvg: true,
            },
        })

        const averageRating = ratingData._avg.ratingAvg || 0

        return {
            totalCourses,
            publishedCourses,
            draftCourses,
            totalEnrollments,
            activeEnrollments,
            totalStudents: totalStudents.length,
            totalRevenue: parseFloat(totalRevenue),
            averageRating: parseFloat(averageRating),
        }
    }

    /**
     * Get instructor revenue data
     * @param {number} instructorId - Instructor ID
     * @param {Object} options - Options (period: 'day' | 'week' | 'month' | 'year')
     * @returns {Promise<Object>} Revenue data
     */
    async getInstructorRevenue(instructorId, options = {}) {
        const { period = 'month' } = options

        // Calculate date range based on period
        const now = new Date()
        let startDate = new Date()

        switch (period) {
            case 'day':
                startDate.setDate(now.getDate() - 30) // Last 30 days
                break
            case 'week':
                startDate.setDate(now.getDate() - 7 * 12) // Last 12 weeks
                break
            case 'month':
                startDate.setMonth(now.getMonth() - 12) // Last 12 months
                break
            case 'year':
                startDate.setFullYear(now.getFullYear() - 5) // Last 5 years
                break
            default:
                startDate.setMonth(now.getMonth() - 12)
        }

        // Get all paid orders for instructor's courses
        const orders = await prisma.order.findMany({
            where: {
                course: {
                    instructorId,
                },
                paymentStatus: PAYMENT_STATUS.PAID,
                paidAt: {
                    gte: startDate,
                },
            },
            select: {
                id: true,
                finalPrice: true,
                paidAt: true,
                course: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
            orderBy: {
                paidAt: 'desc',
            },
        })

        // Calculate total revenue
        const totalRevenue = orders.reduce(
            (sum, order) => sum + parseFloat(order.finalPrice),
            0
        )

        // Group by period
        const revenueByPeriod = {}
        orders.forEach((order) => {
            if (!order.paidAt) return

            const date = new Date(order.paidAt)
            let key

            switch (period) {
                case 'day':
                    key = date.toISOString().split('T')[0] // YYYY-MM-DD
                    break
                case 'week':
                    const weekStart = new Date(date)
                    weekStart.setDate(date.getDate() - date.getDay())
                    key = weekStart.toISOString().split('T')[0]
                    break
                case 'month':
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
                    break
                case 'year':
                    key = String(date.getFullYear())
                    break
                default:
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            }

            if (!revenueByPeriod[key]) {
                revenueByPeriod[key] = {
                    period: key,
                    revenue: 0,
                    orders: 0,
                }
            }

            revenueByPeriod[key].revenue += parseFloat(order.finalPrice)
            revenueByPeriod[key].orders += 1
        })

        // Convert to array and sort
        const revenueChart = Object.values(revenueByPeriod).sort((a, b) => {
            return a.period.localeCompare(b.period)
        })

        return {
            totalRevenue,
            period,
            revenueChart,
            recentOrders: orders.slice(0, 10),
        }
    }

    /**
     * Get instructor analytics
     * @param {number} instructorId - Instructor ID
     * @returns {Promise<Object>} Analytics data
     */
    async getInstructorAnalytics(instructorId) {
        // Get all courses with detailed stats
        const courses = await prisma.course.findMany({
            where: { instructorId },
            include: {
                enrollments: {
                    select: {
                        id: true,
                        status: true,
                        enrolledAt: true,
                        completedAt: true,
                    },
                },
                lessons: {
                    select: {
                        id: true,
                        isPublished: true,
                    },
                },
            },
        })

        // Calculate course-level analytics
        const courseAnalytics = courses.map((course) => {
            const totalLessons = course.lessons.length
            const publishedLessons = course.lessons.filter(
                (l) => l.isPublished
            ).length
            const totalEnrollments = course.enrollments.length
            const activeEnrollments = course.enrollments.filter(
                (e) => e.status === ENROLLMENT_STATUS.ACTIVE
            ).length
            const completedEnrollments = course.enrollments.filter(
                (e) => e.status === ENROLLMENT_STATUS.COMPLETED
            ).length

            // Calculate completion rate
            const completionRate =
                totalEnrollments > 0
                    ? (completedEnrollments / totalEnrollments) * 100
                    : 0

            return {
                courseId: course.id,
                title: course.title,
                slug: course.slug,
                status: course.status,
                totalLessons,
                publishedLessons,
                totalEnrollments,
                activeEnrollments,
                completedEnrollments,
                completionRate: Math.round(completionRate * 100) / 100,
                ratingAvg: parseFloat(course.ratingAvg),
                ratingCount: course.ratingCount,
                enrolledCount: course.enrolledCount,
            }
        })

        // Overall analytics
        const totalCourses = courses.length
        const publishedCourses = courses.filter(
            (c) => c.status === COURSE_STATUS.PUBLISHED
        ).length
        const totalEnrollments = courses.reduce(
            (sum, c) => sum + c.enrollments.length,
            0
        )
        const totalLessons = courses.reduce(
            (sum, c) => sum + c.lessons.length,
            0
        )

        // Enrollment trend (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const recentEnrollments = await prisma.enrollment.findMany({
            where: {
                course: {
                    instructorId,
                },
                enrolledAt: {
                    gte: thirtyDaysAgo,
                },
            },
            select: {
                enrolledAt: true,
            },
        })

        // Group enrollments by day
        const enrollmentTrend = {}
        recentEnrollments.forEach((enrollment) => {
            const date = new Date(enrollment.enrolledAt)
            const key = date.toISOString().split('T')[0] // YYYY-MM-DD

            if (!enrollmentTrend[key]) {
                enrollmentTrend[key] = 0
            }
            enrollmentTrend[key] += 1
        })

        return {
            overview: {
                totalCourses,
                publishedCourses,
                totalEnrollments,
                totalLessons,
            },
            courseAnalytics,
            enrollmentTrend: Object.entries(enrollmentTrend)
                .map(([date, count]) => ({ date, count }))
                .sort((a, b) => a.date.localeCompare(b.date)),
        }
    }

    /**
     * Get instructor orders (orders for courses taught by instructor)
     * @param {number} instructorId - Instructor ID
     * @param {Object} options - Filters and pagination options
     * @returns {Promise<Object>} Orders list with pagination
     */
    async getInstructorOrders(instructorId, options = {}) {
        const {
            page = 1,
            limit = 20,
            search,
            paymentStatus,
            paymentGateway,
            courseId,
            startDate,
            endDate,
            sort = 'newest',
        } = options

        const skip = (page - 1) * limit

        // Build where clause - filter by instructor's courses
        const where = {
            course: {
                instructorId,
                // Filter by course ID if provided
                ...(courseId && { id: parseInt(courseId) }),
            },
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

        // Filter by search (orderCode, course title, or student name/email)
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
                {
                    user: {
                        OR: [
                            {
                                fullName: {
                                    contains: search,
                                    mode: 'insensitive',
                                },
                            },
                            {
                                email: {
                                    contains: search,
                                    mode: 'insensitive',
                                },
                            },
                        ],
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
                            avatarUrl: true,
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
     * Get instructor enrollments (enrollments for courses taught by instructor)
     * @param {number} instructorId - Instructor ID
     * @param {Object} options - Filters and pagination options
     * @returns {Promise<Object>} Enrollments list with pagination
     */
    async getInstructorEnrollments(instructorId, options = {}) {
        const {
            page = 1,
            limit = 20,
            search,
            courseId,
            status,
            startDate,
            endDate,
            sort = 'newest',
        } = options

        const skip = (page - 1) * limit

        // Build where clause - filter by instructor's courses
        const where = {
            course: {
                instructorId,
                // Filter by course ID if provided
                ...(courseId && { id: parseInt(courseId) }),
            },
        }

        // Filter by enrollment status
        if (status) {
            where.status = status
        }

        // Filter by date range
        if (startDate || endDate) {
            where.enrolledAt = {}
            if (startDate) {
                where.enrolledAt.gte = new Date(startDate)
            }
            if (endDate) {
                where.enrolledAt.lte = new Date(endDate)
            }
        }

        // Filter by search (student name/email or course title)
        if (search) {
            where.OR = [
                {
                    user: {
                        OR: [
                            {
                                fullName: {
                                    contains: search,
                                    mode: 'insensitive',
                                },
                            },
                            {
                                email: {
                                    contains: search,
                                    mode: 'insensitive',
                                },
                            },
                            {
                                userName: {
                                    contains: search,
                                    mode: 'insensitive',
                                },
                            },
                        ],
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
                orderBy = { enrolledAt: 'asc' }
                break
            case 'progress_asc':
                orderBy = { progressPercentage: 'asc' }
                break
            case 'progress_desc':
                orderBy = { progressPercentage: 'desc' }
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
                include: {
                    user: {
                        select: {
                            id: true,
                            userName: true,
                            email: true,
                            fullName: true,
                            avatarUrl: true,
                        },
                    },
                    course: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            thumbnailUrl: true,
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
     * Get instructor students list
     * @param {number} instructorId - Instructor ID
     * @param {Object} options - Options (page, limit, search)
     * @returns {Promise<Object>} Students list with pagination
     */
    async getInstructorStudents(instructorId, options = {}) {
        const { page = 1, limit = 20, search = '' } = options
        const skip = (page - 1) * limit

        // Get all enrollments for instructor's courses
        const where = {
            course: {
                instructorId,
            },
        }

        if (search) {
            where.user = {
                OR: [
                    { fullName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { userName: { contains: search, mode: 'insensitive' } },
                ],
            }
        }

        const [enrollments, total] = await Promise.all([
            prisma.enrollment.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            userName: true,
                            email: true,
                            fullName: true,
                            avatarUrl: true,
                        },
                    },
                    course: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                        },
                    },
                },
                orderBy: {
                    enrolledAt: 'desc',
                },
                skip,
                take: limit,
            }),
            prisma.enrollment.count({ where }),
        ])

        // Get unique students with their enrollment count
        const studentMap = new Map()

        enrollments.forEach((enrollment) => {
            const userId = enrollment.user.id
            if (!studentMap.has(userId)) {
                studentMap.set(userId, {
                    user: enrollment.user,
                    enrollments: [],
                    totalEnrollments: 0,
                })
            }

            const student = studentMap.get(userId)
            student.enrollments.push({
                courseId: enrollment.course.id,
                courseTitle: enrollment.course.title,
                courseSlug: enrollment.course.slug,
                enrolledAt: enrollment.enrolledAt,
                status: enrollment.status,
                progressPercentage: parseFloat(enrollment.progressPercentage),
            })
            student.totalEnrollments += 1
        })

        // Convert to array
        const students = Array.from(studentMap.values())

        // Get total unique students count
        const uniqueStudentsCount = await prisma.enrollment.findMany({
            where: {
                course: {
                    instructorId,
                },
            },
            select: {
                userId: true,
            },
            distinct: ['userId'],
        })

        return {
            students,
            pagination: {
                page,
                limit,
                total: uniqueStudentsCount.length,
                totalPages: Math.ceil(uniqueStudentsCount.length / limit),
            },
        }
    }
}

export default new InstructorDashboardService()
