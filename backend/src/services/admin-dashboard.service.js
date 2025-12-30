// backend/src/services/admin-dashboard.service.js
import { prisma } from '../config/database.config.js'
import {
    USER_ROLES,
    USER_STATUS,
    COURSE_STATUS,
    ENROLLMENT_STATUS,
    PAYMENT_STATUS,
} from '../config/constants.js'
import logger from '../config/logger.config.js'

class AdminDashboardService {
    /**
     * Get admin dashboard overview
     * @returns {Promise<object>} Dashboard data with key metrics
     */
    async getDashboardOverview() {
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthEnd = new Date(
            now.getFullYear(),
            now.getMonth(),
            0,
            23,
            59,
            59
        )

        // Get all statistics in parallel
        const [
            // Users stats
            totalUsers,
            activeUsers,
            newUsersToday,
            newUsersThisMonth,
            newUsersLastMonth,

            // Instructors stats
            totalInstructors,

            // Students stats
            totalStudents,

            // Courses stats
            totalCourses,
            publishedCourses,
            draftCourses,
            coursesPublishedThisMonth,

            // Enrollments stats
            totalEnrollments,
            activeEnrollments,
            completedEnrollments,
            enrollmentsToday,
            enrollmentsThisMonth,
            enrollmentsLastMonth,

            // Revenue stats
            totalRevenue,
            revenueToday,
            revenueThisMonth,
            revenueLastMonth,

            // Orders stats
            totalOrders,
            paidOrders,
            pendingOrders,
            ordersToday,
        ] = await Promise.all([
            // Users queries
            prisma.user.count(),
            prisma.user.count({ where: { status: USER_STATUS.ACTIVE } }),
            prisma.user.count({ where: { createdAt: { gte: today } } }),
            prisma.user.count({ where: { createdAt: { gte: thisMonth } } }),
            prisma.user.count({
                where: {
                    createdAt: { gte: lastMonth, lte: lastMonthEnd },
                },
            }),

            // Instructors
            prisma.user.count({ where: { role: USER_ROLES.INSTRUCTOR } }),

            // Students
            prisma.user.count({ where: { role: USER_ROLES.STUDENT } }),

            // Courses
            prisma.course.count(),
            prisma.course.count({ where: { status: COURSE_STATUS.PUBLISHED } }),
            prisma.course.count({ where: { status: COURSE_STATUS.DRAFT } }),
            prisma.course.count({
                where: { publishedAt: { gte: thisMonth } },
            }),

            // Enrollments
            prisma.enrollment.count(),
            prisma.enrollment.count({
                where: { status: ENROLLMENT_STATUS.ACTIVE },
            }),
            prisma.enrollment.count({
                where: { status: ENROLLMENT_STATUS.COMPLETED },
            }),
            prisma.enrollment.count({
                where: { enrolledAt: { gte: today } },
            }),
            prisma.enrollment.count({
                where: { enrolledAt: { gte: thisMonth } },
            }),
            prisma.enrollment.count({
                where: {
                    enrolledAt: { gte: lastMonth, lte: lastMonthEnd },
                },
            }),

            // Revenue
            prisma.order.aggregate({
                where: { paymentStatus: PAYMENT_STATUS.PAID },
                _sum: { finalPrice: true },
            }),
            prisma.order.aggregate({
                where: {
                    paymentStatus: PAYMENT_STATUS.PAID,
                    paidAt: { gte: today },
                },
                _sum: { finalPrice: true },
            }),
            prisma.order.aggregate({
                where: {
                    paymentStatus: PAYMENT_STATUS.PAID,
                    paidAt: { gte: thisMonth },
                },
                _sum: { finalPrice: true },
            }),
            prisma.order.aggregate({
                where: {
                    paymentStatus: PAYMENT_STATUS.PAID,
                    paidAt: { gte: lastMonth, lte: lastMonthEnd },
                },
                _sum: { finalPrice: true },
            }),

            // Orders
            prisma.order.count(),
            prisma.order.count({
                where: { paymentStatus: PAYMENT_STATUS.PAID },
            }),
            prisma.order.count({
                where: { paymentStatus: PAYMENT_STATUS.PENDING },
            }),
            prisma.order.count({ where: { createdAt: { gte: today } } }),
        ])

        // Calculate growth percentages
        const userGrowth =
            newUsersLastMonth > 0
                ? (
                      ((newUsersThisMonth - newUsersLastMonth) /
                          newUsersLastMonth) *
                      100
                  ).toFixed(2)
                : 0

        const enrollmentGrowth =
            enrollmentsLastMonth > 0
                ? (
                      ((enrollmentsThisMonth - enrollmentsLastMonth) /
                          enrollmentsLastMonth) *
                      100
                  ).toFixed(2)
                : 0

        const revenueGrowth =
            parseFloat(revenueLastMonth._sum.finalPrice || 0) > 0
                ? (
                      ((parseFloat(revenueThisMonth._sum.finalPrice || 0) -
                          parseFloat(revenueLastMonth._sum.finalPrice || 0)) /
                          parseFloat(revenueLastMonth._sum.finalPrice || 0)) *
                      100
                  ).toFixed(2)
                : 0

        logger.info('Admin dashboard overview retrieved')

        return {
            summary: {
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    instructors: totalInstructors,
                    students: totalStudents,
                    newToday: newUsersToday,
                    newThisMonth: newUsersThisMonth,
                    growthPercentage: parseFloat(userGrowth),
                },
                courses: {
                    total: totalCourses,
                    published: publishedCourses,
                    draft: draftCourses,
                    publishedThisMonth: coursesPublishedThisMonth,
                },
                enrollments: {
                    total: totalEnrollments,
                    active: activeEnrollments,
                    completed: completedEnrollments,
                    today: enrollmentsToday,
                    thisMonth: enrollmentsThisMonth,
                    growthPercentage: parseFloat(enrollmentGrowth),
                    completionRate:
                        totalEnrollments > 0
                            ? (
                                  (completedEnrollments / totalEnrollments) *
                                  100
                              ).toFixed(2)
                            : 0,
                },
                revenue: {
                    total: parseFloat(totalRevenue._sum.finalPrice || 0),
                    today: parseFloat(revenueToday._sum.finalPrice || 0),
                    thisMonth: parseFloat(
                        revenueThisMonth._sum.finalPrice || 0
                    ),
                    growthPercentage: parseFloat(revenueGrowth),
                    averageOrderValue:
                        paidOrders > 0
                            ? (
                                  parseFloat(
                                      totalRevenue._sum.finalPrice || 0
                                  ) / paidOrders
                              ).toFixed(2)
                            : 0,
                },
                orders: {
                    total: totalOrders,
                    paid: paidOrders,
                    pending: pendingOrders,
                    today: ordersToday,
                    conversionRate:
                        totalOrders > 0
                            ? ((paidOrders / totalOrders) * 100).toFixed(2)
                            : 0,
                },
            },
        }
    }

    /**
     * Get user statistics for admin dashboard
     * @returns {Promise<object>} User statistics
     */
    async getUserStats() {
        const [totalUsers, totalInstructors, totalStudents] = await Promise.all(
            [
                prisma.user.count(),
                prisma.user.count({ where: { role: USER_ROLES.INSTRUCTOR } }),
                prisma.user.count({ where: { role: USER_ROLES.STUDENT } }),
            ]
        )

        logger.info('User statistics retrieved')

        return {
            totalUsers,
            totalInstructors,
            totalStudents,
            totalAdmins: totalUsers - totalStudents - totalInstructors,
        }
    }

    /**
     * Get system statistics for admin dashboard
     * @returns {Promise<object>} System statistics
     */
    async getSystemStats() {
        const [
            // Storage stats
            totalLessons,
            publishedLessons,

            // Quiz stats
            totalQuizzes,

            // Progress stats
            totalProgress,
            completedProgress,

            // Notification stats
            totalNotifications,
            unreadNotifications,

            // Transaction stats
            totalTransactions,
            successTransactions,
        ] = await Promise.all([
            prisma.lesson.count(),
            prisma.lesson.count({ where: { isPublished: true } }),
            prisma.quiz.count(),
            prisma.progress.count(),
            prisma.progress.count({ where: { isCompleted: true } }),
            prisma.notification.count(),
            prisma.notification.count({ where: { isRead: false } }),
            prisma.paymentTransaction.count(),
            prisma.paymentTransaction.count({ where: { status: 'SUCCESS' } }),
        ])

        logger.info('System statistics retrieved')

        return {
            content: {
                lessons: {
                    total: totalLessons,
                    published: publishedLessons,
                },
                quizzes: {
                    total: totalQuizzes,
                },
            },
            engagement: {
                progress: {
                    total: totalProgress,
                    completed: completedProgress,
                    completionRate:
                        totalProgress > 0
                            ? (
                                  (completedProgress / totalProgress) *
                                  100
                              ).toFixed(2)
                            : 0,
                },
                notifications: {
                    total: totalNotifications,
                    unread: unreadNotifications,
                },
            },
            transactions: {
                total: totalTransactions,
                successful: successTransactions,
                successRate:
                    totalTransactions > 0
                        ? (
                              (successTransactions / totalTransactions) *
                              100
                          ).toFixed(2)
                        : 0,
            },
        }
    }

    /**
     * Get user analytics for admin dashboard
     * @returns {Promise<object>} User analytics data
     */
    async getUsersAnalytics() {
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        // Get user registration trend (last 30 days)
        const registrationTrend = []
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now)
            date.setDate(date.getDate() - i)
            date.setHours(0, 0, 0, 0)

            const nextDate = new Date(date)
            nextDate.setDate(nextDate.getDate() + 1)

            const count = await prisma.user.count({
                where: {
                    createdAt: {
                        gte: date,
                        lt: nextDate,
                    },
                },
            })

            registrationTrend.push({
                date: date.toISOString().split('T')[0],
                users: count,
            })
        }

        // Get user distribution by role
        const usersByRole = await prisma.user.groupBy({
            by: ['role'],
            _count: true,
        })

        // Get user distribution by status
        const usersByStatus = await prisma.user.groupBy({
            by: ['status'],
            _count: true,
        })

        // Get top active users (by enrollments)
        const topActiveUsers = await prisma.user.findMany({
            where: {
                role: USER_ROLES.STUDENT,
            },
            select: {
                id: true,
                userName: true,
                fullName: true,
                email: true,
                avatarUrl: true,
                _count: {
                    select: {
                        enrollments: true,
                        progress: {
                            where: { isCompleted: true },
                        },
                    },
                },
            },
            orderBy: {
                enrollments: {
                    _count: 'desc',
                },
            },
            take: 10,
        })

        // Get recently registered users
        const recentUsers = await prisma.user.findMany({
            where: {
                createdAt: { gte: thirtyDaysAgo },
            },
            select: {
                id: true,
                userName: true,
                fullName: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 10,
        })

        logger.info('User analytics retrieved')

        return {
            registrationTrend,
            distribution: {
                byRole: usersByRole.map((item) => ({
                    role: item.role,
                    count: item._count,
                })),
                byStatus: usersByStatus.map((item) => ({
                    status: item.status,
                    count: item._count,
                })),
            },
            topActiveUsers: topActiveUsers.map((user) => ({
                id: user.id,
                userName: user.userName,
                fullName: user.fullName,
                email: user.email,
                avatarUrl: user.avatarUrl,
                totalEnrollments: user._count.enrollments,
                completedLessons: user._count.progress,
            })),
            recentUsers,
        }
    }

    /**
     * Get course analytics for admin dashboard
     * @returns {Promise<object>} Course analytics data
     */
    async getCoursesAnalytics() {
        // Get course distribution by category
        const coursesByCategory = await prisma.course.groupBy({
            by: ['categoryId'],
            where: { status: COURSE_STATUS.PUBLISHED },
            _count: true,
            _sum: {
                enrolledCount: true,
            },
        })

        // Sort by course count descending and take top 10
        const sortedCategories = coursesByCategory
            .sort((a, b) => b._count - a._count)
            .slice(0, 10)

        // Get category names
        const categoryIds = sortedCategories.map((item) => item.categoryId)
        const categories = await prisma.category.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true, slug: true },
        })

        const categoryDistribution = sortedCategories.map((item) => {
            const category = categories.find((c) => c.id === item.categoryId)
            return {
                categoryId: item.categoryId,
                categoryName: category?.name || 'Unknown',
                categorySlug: category?.slug || '',
                courseCount: item._count,
                totalEnrollments: item._sum.enrolledCount || 0,
            }
        })

        // Get course distribution by level
        const coursesByLevel = await prisma.course.groupBy({
            by: ['level'],
            where: { status: COURSE_STATUS.PUBLISHED },
            _count: true,
            _sum: {
                enrolledCount: true,
            },
        })

        // Get top performing courses (by enrollments and revenue)
        const topCourses = await prisma.course.findMany({
            where: { status: COURSE_STATUS.PUBLISHED },
            select: {
                id: true,
                title: true,
                slug: true,
                thumbnailUrl: true,
                price: true,
                enrolledCount: true,
                ratingAvg: true,
                ratingCount: true,
                viewsCount: true,
                instructor: {
                    select: {
                        id: true,
                        userName: true,
                        fullName: true,
                    },
                },
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                enrolledCount: 'desc',
            },
            take: 10,
        })

        // Get course performance metrics
        const courseMetrics = await prisma.course.aggregate({
            where: { status: COURSE_STATUS.PUBLISHED },
            _avg: {
                enrolledCount: true,
                ratingAvg: true,
                viewsCount: true,
                completionRate: true,
            },
        })

        logger.info('Course analytics retrieved')

        return {
            distribution: {
                byCategory: categoryDistribution,
                byLevel: coursesByLevel.map((item) => ({
                    level: item.level,
                    courseCount: item._count,
                    totalEnrollments: item._sum.enrolledCount || 0,
                })),
            },
            topPerformingCourses: topCourses,
            metrics: {
                averageEnrollments: parseFloat(
                    courseMetrics._avg.enrolledCount || 0
                ).toFixed(2),
                averageRating: parseFloat(
                    courseMetrics._avg.ratingAvg || 0
                ).toFixed(2),
                averageViews: parseFloat(
                    courseMetrics._avg.viewsCount || 0
                ).toFixed(2),
                averageCompletionRate: parseFloat(
                    courseMetrics._avg.completionRate || 0
                ).toFixed(2),
            },
        }
    }

    /**
     * Get revenue analytics for admin dashboard
     * @returns {Promise<object>} Revenue analytics data
     */
    async getRevenueAnalytics() {
        const now = new Date()

        // Get revenue trend (last 30 days)
        const revenueTrend = []
        for (let i = 29; i >= 0; i--) {
            // Create date in UTC to match database Timestamptz
            const targetDate = new Date(now)
            targetDate.setUTCDate(targetDate.getUTCDate() - i)
            targetDate.setUTCHours(0, 0, 0, 0)

            const nextDate = new Date(targetDate)
            nextDate.setUTCDate(nextDate.getUTCDate() + 1)

            const dayRevenue = await prisma.order.aggregate({
                where: {
                    paymentStatus: PAYMENT_STATUS.PAID,
                    paidAt: {
                        gte: targetDate,
                        lt: nextDate,
                    },
                },
                _sum: { finalPrice: true },
                _count: true,
            })

            revenueTrend.push({
                date: targetDate.toISOString().split('T')[0],
                revenue: parseFloat(dayRevenue._sum.finalPrice || 0),
                orders: dayRevenue._count,
            })
        }

        // Get revenue by payment gateway
        const revenueByGateway = await prisma.order.groupBy({
            by: ['paymentGateway'],
            where: { paymentStatus: PAYMENT_STATUS.PAID },
            _sum: {
                finalPrice: true,
            },
            _count: true,
        })

        // Get top revenue courses
        const topRevenueCourses = await prisma.order.groupBy({
            by: ['courseId'],
            where: { paymentStatus: PAYMENT_STATUS.PAID },
            _sum: { finalPrice: true },
            _count: true,
            orderBy: {
                _sum: {
                    finalPrice: 'desc',
                },
            },
            take: 10,
        })

        // Get course details
        const courseIds = topRevenueCourses.map((item) => item.courseId)
        const courses = await prisma.course.findMany({
            where: { id: { in: courseIds } },
            select: {
                id: true,
                title: true,
                slug: true,
                thumbnailUrl: true,
                price: true,
                instructor: {
                    select: {
                        id: true,
                        userName: true,
                        fullName: true,
                    },
                },
            },
        })

        const topRevenueCoursesWithDetails = topRevenueCourses.map((item) => {
            const course = courses.find((c) => c.id === item.courseId)
            return {
                ...course,
                totalRevenue: parseFloat(item._sum.finalPrice || 0),
                totalOrders: item._count,
            }
        })

        // Get monthly revenue comparison (current vs previous month)
        // Use UTC to match database Timestamptz
        const thisMonth = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)
        )
        const lastMonth = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0)
        )
        const lastMonthEnd = new Date(
            Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                0,
                23,
                59,
                59,
                999
            )
        )

        const [thisMonthRevenue, lastMonthRevenue] = await Promise.all([
            prisma.order.aggregate({
                where: {
                    paymentStatus: PAYMENT_STATUS.PAID,
                    paidAt: { gte: thisMonth },
                },
                _sum: { finalPrice: true },
                _count: true,
            }),
            prisma.order.aggregate({
                where: {
                    paymentStatus: PAYMENT_STATUS.PAID,
                    paidAt: { gte: lastMonth, lte: lastMonthEnd },
                },
                _sum: { finalPrice: true },
                _count: true,
            }),
        ])

        logger.info('Revenue analytics retrieved')

        return {
            trend: revenueTrend,
            byPaymentGateway: revenueByGateway.map((item) => ({
                gateway: item.paymentGateway,
                revenue: parseFloat(item._sum.finalPrice || 0),
                orders: item._count,
            })),
            topRevenueCourses: topRevenueCoursesWithDetails,
            monthlyComparison: {
                current: {
                    revenue: parseFloat(thisMonthRevenue._sum.finalPrice || 0),
                    orders: thisMonthRevenue._count,
                },
                previous: {
                    revenue: parseFloat(lastMonthRevenue._sum.finalPrice || 0),
                    orders: lastMonthRevenue._count,
                },
                growth:
                    parseFloat(lastMonthRevenue._sum.finalPrice || 0) > 0
                        ? (
                              ((parseFloat(
                                  thisMonthRevenue._sum.finalPrice || 0
                              ) -
                                  parseFloat(
                                      lastMonthRevenue._sum.finalPrice || 0
                                  )) /
                                  parseFloat(
                                      lastMonthRevenue._sum.finalPrice || 0
                                  )) *
                              100
                          ).toFixed(2)
                        : 0,
            },
        }
    }

    /**
     * Get recent activities for admin dashboard
     * @param {number} limit - Number of activities to retrieve
     * @returns {Promise<object>} Recent activities
     */
    async getRecentActivities(limit = 20) {
        // Get recent orders
        const recentOrders = await prisma.order.findMany({
            where: {
                paymentStatus: PAYMENT_STATUS.PAID,
            },
            select: {
                id: true,
                orderCode: true,
                finalPrice: true,
                paymentGateway: true,
                paidAt: true,
                user: {
                    select: {
                        id: true,
                        userName: true,
                        fullName: true,
                        email: true,
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
                paidAt: 'desc',
            },
            take: limit,
        })

        // Get recent enrollments
        const recentEnrollments = await prisma.enrollment.findMany({
            select: {
                id: true,
                enrolledAt: true,
                user: {
                    select: {
                        id: true,
                        userName: true,
                        fullName: true,
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
            take: limit,
        })

        // Get recent user registrations
        const recentUsers = await prisma.user.findMany({
            select: {
                id: true,
                userName: true,
                fullName: true,
                email: true,
                role: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
        })

        // Get recent course publications
        const recentCourses = await prisma.course.findMany({
            where: {
                status: COURSE_STATUS.PUBLISHED,
                publishedAt: { not: null },
            },
            select: {
                id: true,
                title: true,
                slug: true,
                publishedAt: true,
                instructor: {
                    select: {
                        id: true,
                        userName: true,
                        fullName: true,
                    },
                },
            },
            orderBy: {
                publishedAt: 'desc',
            },
            take: limit,
        })

        logger.info('Recent activities retrieved')

        return {
            recentOrders: recentOrders.map((order) => ({
                type: 'order',
                id: order.id,
                orderCode: order.orderCode,
                amount: parseFloat(order.finalPrice),
                paymentGateway: order.paymentGateway,
                timestamp: order.paidAt,
                user: order.user,
                course: order.course,
            })),
            recentEnrollments: recentEnrollments.map((enrollment) => ({
                type: 'enrollment',
                id: enrollment.id,
                timestamp: enrollment.enrolledAt,
                user: enrollment.user,
                course: enrollment.course,
            })),
            recentUsers: recentUsers.map((user) => ({
                type: 'user_registration',
                id: user.id,
                userName: user.userName,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                timestamp: user.createdAt,
            })),
            recentCourses: recentCourses.map((course) => ({
                type: 'course_published',
                id: course.id,
                title: course.title,
                slug: course.slug,
                timestamp: course.publishedAt,
                instructor: course.instructor,
            })),
        }
    }
}

export default new AdminDashboardService()
