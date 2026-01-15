// backend/src/services/admin-revenue-stats.service.js
import { prisma } from '../config/database.config.js'
import { PAYMENT_STATUS } from '../config/constants.js'
import logger from '../config/logger.config.js'

class AdminRevenueStatsService {
    /**
     * Get revenue statistics by year and month
     * @param {number|null} year - Year to filter (null for all years)
     * @param {number|null} month - Month to filter (null for all months)
     * @returns {Promise<object>} Revenue statistics
     */
    async getRevenueStats(year = null, month = null) {
        const now = new Date()

        // Build date filters for top instructors and courses
        const where = {
            paymentStatus: PAYMENT_STATUS.PAID,
        }

        // Filter by year if provided
        if (year) {
            if (month) {
                // Filter by specific month
                const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
                const monthEnd = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0))
                where.paidAt = {
                    gte: monthStart,
                    lt: monthEnd,
                }
            } else {
                // Filter by entire year
                const yearStart = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0))
                const yearEnd = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0))
                where.paidAt = {
                    gte: yearStart,
                    lt: yearEnd,
                }
            }
        }
        // If no year provided, where.paidAt is undefined (all time)

        // Get total revenue and total orders based on filter
        const statsResult = await prisma.order.aggregate({
            where: where,
            _sum: { finalPrice: true },
            _count: true,
        })
        const totalRevenue = parseFloat(statsResult._sum.finalPrice || 0)
        const totalOrders = statsResult._count || 0

        // Get chart data based on filters
        let monthlyData = []
        let yearlyData = []
        let dailyData = []

        if (!year) {
            // If no year selected: show data by year (only years with actual data)
            // Get distinct years from paid orders using raw query
            const yearsWithData = await prisma.$queryRaw`
                SELECT DISTINCT EXTRACT(YEAR FROM paid_at)::INTEGER as year
                FROM orders
                WHERE payment_status = ${PAYMENT_STATUS.PAID}
                  AND paid_at IS NOT NULL
                ORDER BY year ASC
            `

            // Process each year that has data
            for (const row of yearsWithData) {
                const y = Number(row.year)
                const yearStart = new Date(Date.UTC(y, 0, 1, 0, 0, 0, 0))
                const yearEnd = new Date(Date.UTC(y + 1, 0, 1, 0, 0, 0, 0))
                
                const yearStats = await prisma.order.aggregate({
                    where: {
                        paymentStatus: PAYMENT_STATUS.PAID,
                        paidAt: {
                            gte: yearStart,
                            lt: yearEnd,
                        },
                    },
                    _sum: { finalPrice: true },
                    _count: true,
                })

                yearlyData.push({
                    year: y,
                    revenue: parseFloat(yearStats._sum.finalPrice || 0),
                    orders: yearStats._count,
                })
            }
        } else if (!month) {
            // If year selected but no month: show data by month (12 months of that year)
            for (let m = 1; m <= 12; m++) {
                const monthStart = new Date(Date.UTC(year, m - 1, 1, 0, 0, 0, 0))
                const monthEnd = new Date(Date.UTC(year, m, 1, 0, 0, 0, 0))
                
                const monthStats = await prisma.order.aggregate({
                    where: {
                        paymentStatus: PAYMENT_STATUS.PAID,
                        paidAt: {
                            gte: monthStart,
                            lt: monthEnd,
                        },
                    },
                    _sum: { finalPrice: true },
                    _count: true,
                })

                monthlyData.push({
                    month: m,
                    year: year,
                    revenue: parseFloat(monthStats._sum.finalPrice || 0),
                    orders: monthStats._count,
                })
            }
        } else {
            // If both year and month selected: show data by day (all days in that month)
            const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
            const monthEnd = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0))
            
            // Get all orders in that month
            const orders = await prisma.order.findMany({
                where: {
                    paymentStatus: PAYMENT_STATUS.PAID,
                    paidAt: {
                        gte: monthStart,
                        lt: monthEnd,
                    },
                },
                select: {
                    paidAt: true,
                    finalPrice: true,
                },
            })

            // Group by day
            const dailyMap = new Map()
            orders.forEach((order) => {
                const date = new Date(order.paidAt)
                const dayKey = date.toISOString().split('T')[0] // YYYY-MM-DD
                
                if (dailyMap.has(dayKey)) {
                    const existing = dailyMap.get(dayKey)
                    existing.revenue += parseFloat(order.finalPrice || 0)
                    existing.orders += 1
                } else {
                    dailyMap.set(dayKey, {
                        date: dayKey,
                        revenue: parseFloat(order.finalPrice || 0),
                        orders: 1,
                    })
                }
            })

            // Create all days in the month (even if no orders)
            const daysInMonth = new Date(year, month, 0).getDate() // Get number of days in month
            for (let day = 1; day <= daysInMonth; day++) {
                const dayDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
                const dayKey = dayDate.toISOString().split('T')[0] // YYYY-MM-DD
                
                if (!dailyMap.has(dayKey)) {
                    // Add day with zero revenue if no orders
                    dailyMap.set(dayKey, {
                        date: dayKey,
                        revenue: 0,
                        orders: 0,
                    })
                }
            }

            // Convert to array and sort by date
            dailyData = Array.from(dailyMap.values()).sort((a, b) => 
                a.date.localeCompare(b.date)
            )
        }

        // Get top 5 instructors by revenue
        const topInstructorsData = await prisma.order.groupBy({
            by: ['courseId'],
            where: where,
            _sum: { finalPrice: true },
            _count: true,
            orderBy: {
                _sum: {
                    finalPrice: 'desc',
                },
            },
        })

        // Get course details with instructors
        const courseIds = topInstructorsData.map((item) => item.courseId)
        const courses = await prisma.course.findMany({
            where: { id: { in: courseIds } },
            select: {
                id: true,
                instructorId: true,
                instructor: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
        })

        // Group by instructor
        const instructorRevenueMap = new Map()
        topInstructorsData.forEach((item) => {
            const course = courses.find((c) => c.id === item.courseId)
            if (course && course.instructor) {
                const instructorId = course.instructor.id
                const instructorName = course.instructor.fullName || 'Unknown'
                const revenue = parseFloat(item._sum.finalPrice || 0)

                if (instructorRevenueMap.has(instructorId)) {
                    const existing = instructorRevenueMap.get(instructorId)
                    existing.revenue += revenue
                    existing.courseCount += 1
                } else {
                    instructorRevenueMap.set(instructorId, {
                        instructorId,
                        instructorName,
                        courseCount: 1,
                        revenue,
                    })
                }
            }
        })

        // Convert to array and sort by revenue, take top 5
        const topInstructors = Array.from(instructorRevenueMap.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5)

        // Get top 5 courses by revenue
        const topCoursesData = await prisma.order.groupBy({
            by: ['courseId'],
            where: where,
            _sum: { finalPrice: true },
            orderBy: {
                _sum: {
                    finalPrice: 'desc',
                },
            },
            take: 5,
        })

        // Get course details
        const topCourseIds = topCoursesData.map((item) => item.courseId)
        const topCourses = await prisma.course.findMany({
            where: { id: { in: topCourseIds } },
            select: {
                id: true,
                title: true,
                instructor: {
                    select: {
                        fullName: true,
                    },
                },
            },
        })

        const topCoursesWithRevenue = topCoursesData.map((item) => {
            const course = topCourses.find((c) => c.id === item.courseId)
            return {
                courseId: item.courseId,
                courseTitle: course?.title || 'Unknown Course',
                instructorName: course?.instructor?.fullName || 'Unknown',
                revenue: parseFloat(item._sum.finalPrice || 0),
            }
        })

        logger.info(`Revenue stats retrieved for year: ${year}, month: ${month}`)

        return {
            totalRevenue,
            totalOrders,
            monthlyData,
            yearlyData,
            dailyData,
            topInstructors,
            topCourses: topCoursesWithRevenue,
        }
    }
}

export default new AdminRevenueStatsService()
