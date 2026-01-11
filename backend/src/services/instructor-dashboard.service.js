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
     * Get instructor courses list for dropdown (simple version)
     * @param {number} instructorId - Instructor ID
     * @returns {Promise<Array>} List of courses (id, title, slug)
     */
    async getInstructorCoursesForDropdown(instructorId) {
        const courses = await prisma.course.findMany({
            where: { instructorId },
            select: {
                id: true,
                title: true,
                slug: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        return courses
    }

    /**
     * Get instructor revenue data
     * @param {number} instructorId - Instructor ID
     * @param {Object} options - Options (period, courseId, year, month)
     * @returns {Promise<Object>} Revenue data
     */
    async getInstructorRevenue(instructorId, options = {}) {
        const { 
            period = 'month', 
            courseId = null, 
            year = new Date().getFullYear(),
            month = null // null = all months, 1-12 = specific month
        } = options

        // Calculate date range based on year and month
        // If month is provided: filter that month (01/MM/YYYY to last day of month)
        // If month is null: filter entire year (01/01/YYYY to 31/12/YYYY)
        const startDate = new Date(year, month ? month - 1 : 0, 1) // month-1 because Date uses 0-indexed months
        startDate.setHours(0, 0, 0, 0) // Beginning of day
        
        let endDate
        if (month) {
            // Last day of the specified month
            endDate = new Date(year, month, 0) // Day 0 of next month = last day of current month
        } else {
            // Last day of the year
            endDate = new Date(year, 11, 31) // December 31
        }
        endDate.setHours(23, 59, 59, 999) // End of day

        // Build where clause
        // When filtering by courseId, ensure the course belongs to the instructor
        const whereClause = {
            course: {
                instructorId,
                // Add courseId filter inside course to ensure security (course belongs to instructor)
                // courseId is already parsed as number in controller, but ensure it's a number
                ...(courseId && !isNaN(Number(courseId)) ? { id: Number(courseId) } : {}),
            },
            paymentStatus: PAYMENT_STATUS.PAID,
            // Always filter by date range (year and/or month)
            paidAt: {
                gte: startDate,
                lte: endDate,
            },
        }

        // Get all paid orders for instructor's courses
        const orders = await prisma.order.findMany({
            where: whereClause,
            select: {
                id: true,
                finalPrice: true,
                paidAt: true,
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
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

        // Group by day (always group by day for bar chart)
        const revenueByDay = {}
        orders.forEach((order) => {
            if (!order.paidAt) return

            const date = new Date(order.paidAt)
            // Format as YYYY-MM-DD
            const dayKey = date.toISOString().split('T')[0]

            if (!revenueByDay[dayKey]) {
                revenueByDay[dayKey] = {
                    period: dayKey,
                    revenue: 0,
                    orders: 0,
                }
            }

            revenueByDay[dayKey].revenue += parseFloat(order.finalPrice)
            revenueByDay[dayKey].orders += 1
        })

        // Convert to array and sort by date
        const revenueChart = Object.values(revenueByDay).sort((a, b) => {
            return a.period.localeCompare(b.period)
        })

        return {
            totalRevenue,
            totalOrders: orders.length,
            period: month ? 'month' : 'year', // Return period type
            revenueChart: revenueChart, // Keep for compatibility, but frontend may not use
            recentOrders: orders.slice(0, 10),
            courseId: courseId ? parseInt(courseId) : null,
            year: year,
            month: month,
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
     * Get instructor revenue orders (paid orders for revenue report)
     * @param {number} instructorId - Instructor ID
     * @param {Object} options - Filters and pagination options (year, month, courseId, page, limit)
     * @returns {Promise<Object>} Paid orders list with pagination and total revenue
     */
    async getInstructorRevenueOrders(instructorId, options = {}) {
        const {
            year = new Date().getFullYear(),
            month = null, // null = all months, 1-12 = specific month
            courseId = null,
            page = 1,
            limit = 20,
        } = options

        const skip = (page - 1) * limit

        // Calculate date range based on year and month
        const startDate = new Date(year, month ? month - 1 : 0, 1)
        startDate.setHours(0, 0, 0, 0) // Beginning of day
        
        let endDate
        if (month) {
            // Last day of the specified month
            endDate = new Date(year, month, 0) // Day 0 of next month = last day of current month
        } else {
            // Last day of the year
            endDate = new Date(year, 11, 31) // December 31
        }
        endDate.setHours(23, 59, 59, 999) // End of day

        // Build where clause - only paid orders
        const where = {
            course: {
                instructorId,
                // Add courseId filter inside course to ensure security
                ...(courseId && !isNaN(Number(courseId)) ? { id: Number(courseId) } : {}),
            },
            paymentStatus: PAYMENT_STATUS.PAID,
            paidAt: {
                not: null, // Ensure paidAt is not null
                gte: startDate,
                lte: endDate,
            },
        }

        // Execute query
        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    paidAt: 'desc', // Latest first
                },
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

        // Calculate total revenue for all matching orders (not just current page)
        const totalRevenueResult = await prisma.order.aggregate({
            where,
            _sum: {
                finalPrice: true,
            },
        })

        const totalRevenue = totalRevenueResult._sum?.finalPrice 
            ? parseFloat(totalRevenueResult._sum.finalPrice.toString())
            : 0

        return {
            orders,
            total,
            totalRevenue,
        }
    }

    /**
     * Get instructor revenue chart data (aggregated by month or day)
     * @param {number} instructorId - Instructor ID
     * @param {Object} options - Options (year, month, courseId)
     * @returns {Promise<Array>} Chart data (grouped by month if month=null, by day if month is set)
     */
    async getInstructorRevenueChartData(instructorId, options = {}) {
        const {
            year = new Date().getFullYear(),
            month = null, // null = all months (group by month), 1-12 = specific month (group by day)
            courseId = null,
        } = options

        // Calculate date range based on year and month
        const startDate = new Date(year, month ? month - 1 : 0, 1)
        startDate.setHours(0, 0, 0, 0)

        let endDate
        if (month) {
            // Last day of the specified month
            endDate = new Date(year, month, 0)
        } else {
            // Last day of the year
            endDate = new Date(year, 11, 31)
        }
        endDate.setHours(23, 59, 59, 999)

        // Build where clause
        const where = {
            course: {
                instructorId,
                ...(courseId && !isNaN(Number(courseId)) ? { id: Number(courseId) } : {}),
            },
            paymentStatus: PAYMENT_STATUS.PAID,
            paidAt: {
                not: null,
                gte: startDate,
                lte: endDate,
            },
        }

        // Get all orders in the date range
        const orders = await prisma.order.findMany({
            where,
            select: {
                finalPrice: true,
                paidAt: true,
            },
            orderBy: {
                paidAt: 'asc',
            },
        })

        // Group data by month or day
        const chartData = []

        if (month === null) {
            // Group by month (12 months)
            const revenueByMonth = new Map()

            // Initialize all 12 months with 0 revenue
            for (let m = 1; m <= 12; m++) {
                revenueByMonth.set(m, 0)
            }

            // Aggregate revenue by month
            orders.forEach((order) => {
                if (!order.paidAt) return
                const orderDate = new Date(order.paidAt)
                const orderMonth = orderDate.getMonth() + 1 // 1-12
                const revenue = parseFloat(order.finalPrice.toString())
                revenueByMonth.set(
                    orderMonth,
                    revenueByMonth.get(orderMonth) + revenue
                )
            })

            // Convert to array and format
            const monthNames = [
                'Tháng 1',
                'Tháng 2',
                'Tháng 3',
                'Tháng 4',
                'Tháng 5',
                'Tháng 6',
                'Tháng 7',
                'Tháng 8',
                'Tháng 9',
                'Tháng 10',
                'Tháng 11',
                'Tháng 12',
            ]

            for (let m = 1; m <= 12; m++) {
                chartData.push({
                    period: monthNames[m - 1],
                    periodLabel: monthNames[m - 1],
                    revenue: revenueByMonth.get(m),
                    date: `${year}-${String(m).padStart(2, '0')}-01`,
                })
            }
        } else {
            // Group by day (days in the selected month)
            const revenueByDay = new Map()

            // Get number of days in the month
            const daysInMonth = new Date(year, month, 0).getDate()

            // Initialize all days with 0 revenue
            for (let d = 1; d <= daysInMonth; d++) {
                revenueByDay.set(d, 0)
            }

            // Aggregate revenue by day
            orders.forEach((order) => {
                if (!order.paidAt) return
                const orderDate = new Date(order.paidAt)
                const orderDay = orderDate.getDate() // 1-31
                const revenue = parseFloat(order.finalPrice.toString())
                revenueByDay.set(orderDay, revenueByDay.get(orderDay) + revenue)
            })

            // Convert to array and format
            for (let d = 1; d <= daysInMonth; d++) {
                const date = new Date(year, month - 1, d)
                chartData.push({
                    period: d,
                    periodLabel: `${String(d).padStart(2, '0')}/${String(month).padStart(2, '0')}`,
                    revenue: revenueByDay.get(d),
                    date: date.toISOString().split('T')[0],
                })
            }
        }

        return chartData
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
