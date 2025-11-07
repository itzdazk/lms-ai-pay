// src/services/admin-course.service.js
import { prisma } from '../config/database.config.js'
import {
    COURSE_STATUS,
    COURSE_LEVEL,
    ENROLLMENT_STATUS,
    PAYMENT_STATUS,
} from '../config/constants.js'
import logger from '../config/logger.config.js'

class AdminCourseService {
    /**
     * Get all courses with admin filters and pagination
     * @param {object} filters - Filters and pagination options
     * @returns {Promise<{courses: Array, total: number}>}
     */
    async getAllCourses(filters) {
        const {
            page = 1,
            limit = 20,
            search,
            status,
            categoryId,
            level,
            instructorId,
            isFeatured,
            sort = 'newest',
            minPrice,
            maxPrice,
            minEnrollments,
            maxEnrollments,
            minRating,
        } = filters

        const skip = (page - 1) * limit

        // Build where clause
        const where = {}

        // Search in title, description, instructor name
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { shortDescription: { contains: search, mode: 'insensitive' } },
                {
                    instructor: {
                        OR: [
                            {
                                username: {
                                    contains: search,
                                    mode: 'insensitive',
                                },
                            },
                            {
                                fullName: {
                                    contains: search,
                                    mode: 'insensitive',
                                },
                            },
                        ],
                    },
                },
            ]
        }

        // Filter by status
        if (status) {
            where.status = status
        }

        // Filter by category
        if (categoryId) {
            where.categoryId = parseInt(categoryId)
        }

        // Filter by level
        if (level) {
            where.level = level
        }

        // Filter by instructor
        if (instructorId) {
            where.instructorId = parseInt(instructorId)
        }

        // Filter by featured
        if (isFeatured !== undefined) {
            where.isFeatured = isFeatured === 'true' || isFeatured === true
        }

        // Filter by price range
        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {}
            if (minPrice !== undefined) {
                where.price.gte = parseFloat(minPrice)
            }
            if (maxPrice !== undefined) {
                where.price.lte = parseFloat(maxPrice)
            }
        }

        // Filter by enrollment count
        if (minEnrollments !== undefined || maxEnrollments !== undefined) {
            where.enrolledCount = {}
            if (minEnrollments !== undefined) {
                where.enrolledCount.gte = parseInt(minEnrollments)
            }
            if (maxEnrollments !== undefined) {
                where.enrolledCount.lte = parseInt(maxEnrollments)
            }
        }

        // Filter by rating
        if (minRating !== undefined) {
            where.ratingAvg = {
                gte: parseFloat(minRating),
            }
        }

        // Build orderBy clause
        let orderBy = {}
        switch (sort) {
            case 'oldest':
                orderBy = { createdAt: 'asc' }
                break
            case 'updated':
                orderBy = { updatedAt: 'desc' }
                break
            case 'popular':
                orderBy = { enrolledCount: 'desc' }
                break
            case 'rating':
                orderBy = { ratingAvg: 'desc' }
                break
            case 'price_asc':
                orderBy = { price: 'asc' }
                break
            case 'price_desc':
                orderBy = { price: 'desc' }
                break
            case 'views':
                orderBy = { viewsCount: 'desc' }
                break
            case 'title':
                orderBy = { title: 'asc' }
                break
            case 'newest':
            default:
                orderBy = { createdAt: 'desc' }
        }

        // Execute query
        const [courses, total] = await Promise.all([
            prisma.course.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    shortDescription: true,
                    thumbnailUrl: true,
                    price: true,
                    discountPrice: true,
                    level: true,
                    status: true,
                    durationHours: true,
                    totalLessons: true,
                    ratingAvg: true,
                    ratingCount: true,
                    enrolledCount: true,
                    viewsCount: true,
                    completionRate: true,
                    isFeatured: true,
                    publishedAt: true,
                    createdAt: true,
                    updatedAt: true,
                    instructor: {
                        select: {
                            id: true,
                            username: true,
                            fullName: true,
                            email: true,
                            avatarUrl: true,
                        },
                    },
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                    _count: {
                        select: {
                            lessons: true,
                            enrollments: true,
                            orders: true,
                        },
                    },
                },
            }),
            prisma.course.count({ where }),
        ])

        logger.info(`Admin retrieved ${courses.length} courses`)

        return {
            courses: courses.map((course) => ({
                ...course,
                lessonsCount: course._count.lessons,
                enrollmentsCount: course._count.enrollments,
                ordersCount: course._count.orders,
                _count: undefined,
            })),
            total,
        }
    }

    /**
     * Toggle course featured status
     * @param {number} courseId - Course ID
     * @param {boolean} isFeatured - Featured status
     * @returns {Promise<object>} Updated course
     */
    async toggleCourseFeatured(courseId, isFeatured) {
        // Check if course exists
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                id: true,
                title: true,
                status: true,
                isFeatured: true,
            },
        })

        if (!course) {
            throw new Error('Course not found')
        }

        // Only published courses can be featured
        if (isFeatured && course.status !== COURSE_STATUS.PUBLISHED) {
            throw new Error('Only published courses can be marked as featured')
        }

        // Update featured status
        const updatedCourse = await prisma.course.update({
            where: { id: courseId },
            data: { isFeatured },
            select: {
                id: true,
                title: true,
                slug: true,
                status: true,
                isFeatured: true,
                updatedAt: true,
                instructor: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                    },
                },
            },
        })

        logger.info(
            `Admin ${isFeatured ? 'featured' : 'unfeatured'} course: ${course.title} (ID: ${courseId})`
        )

        return updatedCourse
    }

    /**
     * Get comprehensive platform analytics
     * @returns {Promise<object>} Platform analytics
     */
    async getPlatformAnalytics() {
        // Get current date ranges
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

        // 1. Course Statistics
        const [
            totalCourses,
            publishedCourses,
            draftCourses,
            archivedCourses,
            featuredCourses,
            coursesPublishedLast30Days,
        ] = await Promise.all([
            prisma.course.count(),
            prisma.course.count({ where: { status: COURSE_STATUS.PUBLISHED } }),
            prisma.course.count({ where: { status: COURSE_STATUS.DRAFT } }),
            prisma.course.count({ where: { status: COURSE_STATUS.ARCHIVED } }),
            prisma.course.count({
                where: {
                    status: COURSE_STATUS.PUBLISHED,
                    isFeatured: true,
                },
            }),
            prisma.course.count({
                where: {
                    publishedAt: { gte: thirtyDaysAgo },
                },
            }),
        ])

        // 2. Enrollment Statistics
        const [
            totalEnrollments,
            activeEnrollments,
            completedEnrollments,
            enrollmentsLast30Days,
            enrollmentsLast7Days,
        ] = await Promise.all([
            prisma.enrollment.count(),
            prisma.enrollment.count({
                where: { status: ENROLLMENT_STATUS.ACTIVE },
            }),
            prisma.enrollment.count({
                where: { status: ENROLLMENT_STATUS.COMPLETED },
            }),
            prisma.enrollment.count({
                where: { enrolledAt: { gte: thirtyDaysAgo } },
            }),
            prisma.enrollment.count({
                where: { enrolledAt: { gte: sevenDaysAgo } },
            }),
        ])

        // 3. Revenue Statistics
        const [totalRevenue, revenueLast30Days, totalOrders, ordersLast30Days] =
            await Promise.all([
                prisma.order.aggregate({
                    where: { paymentStatus: PAYMENT_STATUS.PAID },
                    _sum: { finalPrice: true },
                }),
                prisma.order.aggregate({
                    where: {
                        paymentStatus: PAYMENT_STATUS.PAID,
                        paidAt: { gte: thirtyDaysAgo },
                    },
                    _sum: { finalPrice: true },
                }),
                prisma.order.count({
                    where: { paymentStatus: PAYMENT_STATUS.PAID },
                }),
                prisma.order.count({
                    where: {
                        paymentStatus: PAYMENT_STATUS.PAID,
                        paidAt: { gte: thirtyDaysAgo },
                    },
                }),
            ])

        // 4. User Statistics
        const [totalUsers, totalInstructors, totalStudents, usersLast30Days] =
            await Promise.all([
                prisma.user.count(),
                prisma.user.count({ where: { role: 'INSTRUCTOR' } }),
                prisma.user.count({ where: { role: 'STUDENT' } }),
                prisma.user.count({
                    where: { createdAt: { gte: thirtyDaysAgo } },
                }),
            ])

        // 5. Top Performing Courses (by enrollments)
        const topCoursesByEnrollments = await prisma.course.findMany({
            where: { status: COURSE_STATUS.PUBLISHED },
            orderBy: { enrolledCount: 'desc' },
            take: 10,
            select: {
                id: true,
                title: true,
                slug: true,
                thumbnailUrl: true,
                enrolledCount: true,
                ratingAvg: true,
                ratingCount: true,
                price: true,
                instructor: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                    },
                },
            },
        })

        // 6. Top Performing Courses (by revenue)
        const topCoursesByRevenue = await prisma.order.groupBy({
            by: ['courseId'],
            where: { paymentStatus: PAYMENT_STATUS.PAID },
            _sum: { finalPrice: true },
            _count: true,
            orderBy: { _sum: { finalPrice: 'desc' } },
            take: 10,
        })

        // Fetch course details for top revenue courses
        const topRevenueCourseIds = topCoursesByRevenue.map(
            (item) => item.courseId
        )
        const topRevenueCourses = await prisma.course.findMany({
            where: { id: { in: topRevenueCourseIds } },
            select: {
                id: true,
                title: true,
                slug: true,
                thumbnailUrl: true,
                price: true,
                instructor: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                    },
                },
            },
        })

        // Combine revenue data with course details
        const topCoursesWithRevenue = topCoursesByRevenue.map((revenueData) => {
            const course = topRevenueCourses.find(
                (c) => c.id === revenueData.courseId
            )
            return {
                ...course,
                totalRevenue: parseFloat(revenueData._sum.finalPrice || 0),
                totalOrders: revenueData._count,
            }
        })

        // 7. Top Instructors (by course count and enrollments)
        const topInstructors = await prisma.user.findMany({
            where: { role: 'INSTRUCTOR' },
            select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
                avatarUrl: true,
                _count: {
                    select: {
                        coursesAsInstructor: {
                            where: { status: COURSE_STATUS.PUBLISHED },
                        },
                    },
                },
                coursesAsInstructor: {
                    where: { status: COURSE_STATUS.PUBLISHED },
                    select: {
                        enrolledCount: true,
                        ratingAvg: true,
                    },
                },
            },
            orderBy: {
                coursesAsInstructor: {
                    _count: 'desc',
                },
            },
            take: 10,
        })

        // Calculate instructor metrics
        const topInstructorsWithMetrics = topInstructors.map((instructor) => {
            const totalEnrollments = instructor.coursesAsInstructor.reduce(
                (sum, course) => sum + course.enrolledCount,
                0
            )
            const avgRating =
                instructor.coursesAsInstructor.length > 0
                    ? instructor.coursesAsInstructor.reduce(
                          (sum, course) =>
                              sum + parseFloat(course.ratingAvg || 0),
                          0
                      ) / instructor.coursesAsInstructor.length
                    : 0

            return {
                id: instructor.id,
                username: instructor.username,
                fullName: instructor.fullName,
                email: instructor.email,
                avatarUrl: instructor.avatarUrl,
                totalCourses: instructor._count.coursesAsInstructor,
                totalEnrollments,
                averageRating: parseFloat(avgRating.toFixed(2)),
            }
        })

        // 8. Category Distribution
        const categoryDistribution = await prisma.course.groupBy({
            by: ['categoryId'],
            where: { status: COURSE_STATUS.PUBLISHED },
            _count: true,
            orderBy: { _count: { categoryId: 'desc' } },
            take: 10,
        })

        // Fetch category names
        const categoryIds = categoryDistribution.map((item) => item.categoryId)
        const categories = await prisma.category.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true, slug: true },
        })

        const categoryStats = categoryDistribution.map((item) => {
            const category = categories.find((c) => c.id === item.categoryId)
            return {
                categoryId: item.categoryId,
                categoryName: category?.name || 'Unknown',
                categorySlug: category?.slug || '',
                courseCount: item._count,
            }
        })

        // 9. Enrollment Trend (last 30 days)
        const enrollmentTrend = []
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now)
            date.setDate(date.getDate() - i)
            date.setHours(0, 0, 0, 0)

            const nextDate = new Date(date)
            nextDate.setDate(nextDate.getDate() + 1)

            const count = await prisma.enrollment.count({
                where: {
                    enrolledAt: {
                        gte: date,
                        lt: nextDate,
                    },
                },
            })

            enrollmentTrend.push({
                date: date.toISOString().split('T')[0],
                enrollments: count,
            })
        }

        // 10. Revenue Trend (last 30 days)
        const revenueTrend = []
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now)
            date.setDate(date.getDate() - i)
            date.setHours(0, 0, 0, 0)

            const nextDate = new Date(date)
            nextDate.setDate(nextDate.getDate() + 1)

            const dayRevenue = await prisma.order.aggregate({
                where: {
                    paymentStatus: PAYMENT_STATUS.PAID,
                    paidAt: {
                        gte: date,
                        lt: nextDate,
                    },
                },
                _sum: { finalPrice: true },
                _count: true,
            })

            revenueTrend.push({
                date: date.toISOString().split('T')[0],
                revenue: parseFloat(dayRevenue._sum.finalPrice || 0),
                orders: dayRevenue._count,
            })
        }

        logger.info('Admin retrieved platform analytics')

        return {
            overview: {
                courses: {
                    total: totalCourses,
                    published: publishedCourses,
                    draft: draftCourses,
                    archived: archivedCourses,
                    featured: featuredCourses,
                    publishedLast30Days: coursesPublishedLast30Days,
                },
                enrollments: {
                    total: totalEnrollments,
                    active: activeEnrollments,
                    completed: completedEnrollments,
                    last30Days: enrollmentsLast30Days,
                    last7Days: enrollmentsLast7Days,
                    completionRate:
                        totalEnrollments > 0
                            ? parseFloat(
                                  (
                                      (completedEnrollments /
                                          totalEnrollments) *
                                      100
                                  ).toFixed(2)
                              )
                            : 0,
                },
                revenue: {
                    total: parseFloat(totalRevenue._sum.finalPrice || 0),
                    last30Days: parseFloat(
                        revenueLast30Days._sum.finalPrice || 0
                    ),
                    totalOrders,
                    ordersLast30Days,
                    averageOrderValue:
                        totalOrders > 0
                            ? parseFloat(
                                  (
                                      parseFloat(
                                          totalRevenue._sum.finalPrice || 0
                                      ) / totalOrders
                                  ).toFixed(2)
                              )
                            : 0,
                },
                users: {
                    total: totalUsers,
                    instructors: totalInstructors,
                    students: totalStudents,
                    newUsersLast30Days: usersLast30Days,
                },
            },
            topPerformers: {
                coursesByEnrollments: topCoursesByEnrollments,
                coursesByRevenue: topCoursesWithRevenue,
                instructors: topInstructorsWithMetrics,
            },
            distribution: {
                categories: categoryStats,
            },
            trends: {
                enrollments: enrollmentTrend,
                revenue: revenueTrend,
            },
        }
    }
}

export default new AdminCourseService()
