// backend/src/services/admin-revenue-stats.service.js
import { prisma } from '../config/database.config.js'
import { PAYMENT_STATUS } from '../config/constants.js'
import logger from '../config/logger.config.js'

/**
 * Convert Prisma Decimal to number
 * @param {any} value - Decimal value from Prisma
 * @returns {number} - Number value
 */
function decimalToNumber(value) {
    if (value == null || value === undefined) {
        return 0
    }
    // If it's a Prisma Decimal object, use toNumber()
    if (typeof value === 'object' && typeof value.toNumber === 'function') {
        try {
            return value.toNumber()
        } catch (error) {
            logger.warn(`Error converting Decimal to number: ${error.message}`)
            return 0
        }
    }
    // If it's already a number, return it
    if (typeof value === 'number') {
        return isNaN(value) ? 0 : value
    }
    // If it's a string, parse it
    if (typeof value === 'string') {
        const num = parseFloat(value)
        return isNaN(num) ? 0 : num
    }
    // Try to convert to number
    const num = Number(value)
    return isNaN(num) ? 0 : num
}

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
                    revenue: decimalToNumber(yearStats._sum.finalPrice),
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
                    revenue: decimalToNumber(monthStats._sum.finalPrice),
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
                    existing.revenue += decimalToNumber(order.finalPrice)
                    existing.orders += 1
                } else {
                    dailyMap.set(dayKey, {
                        date: dayKey,
                        revenue: decimalToNumber(order.finalPrice),
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
                const revenue = decimalToNumber(item._sum.finalPrice)

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
                revenue: decimalToNumber(item._sum.finalPrice),
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

    /**
     * Get instructors revenue statistics with filters, search, sort, and pagination
     * @param {number|null} year - Year to filter (null for all years)
     * @param {number|null} month - Month to filter (null for all months)
     * @param {string} search - Search query for instructor name or email
     * @param {string} sortBy - Sort by 'revenue' or 'courseCount'
     * @param {number} page - Page number (1-based)
     * @param {number} limit - Items per page
     * @returns {Promise<object>} Instructors revenue data with pagination
     */
    async getInstructorsRevenue(
        year = null,
        month = null,
        search = '',
        sortBy = 'revenue',
        page = 1,
        limit = 10
    ) {
        // Build date filter
        const dateFilter = {}
        if (year) {
            if (month) {
                // Filter by specific month
                const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
                const monthEnd = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0))
                dateFilter.paidAt = {
                    gte: monthStart,
                    lt: monthEnd,
                }
            } else {
                // Filter by entire year
                const yearStart = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0))
                const yearEnd = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0))
                dateFilter.paidAt = {
                    gte: yearStart,
                    lt: yearEnd,
                }
            }
        }

        // Get all paid orders with date filter
        const whereClause = {
            paymentStatus: PAYMENT_STATUS.PAID,
            ...dateFilter,
        }

        // Get all orders (not grouped) to get accurate counts
        const allOrders = await prisma.order.findMany({
            where: whereClause,
            select: {
                courseId: true,
                finalPrice: true,
            },
        })

        // Get unique course IDs from orders
        const courseIds = [...new Set(allOrders.map((order) => order.courseId))]

        // Build instructor filter for search
        const instructorWhere = {}
        if (search && search.trim()) {
            instructorWhere.OR = [
                { fullName: { contains: search.trim(), mode: 'insensitive' } },
                { email: { contains: search.trim(), mode: 'insensitive' } },
            ]
        }

        // Get course details with instructors (filtered by search if provided)
        const courses = await prisma.course.findMany({
            where: {
                id: { in: courseIds },
                ...(Object.keys(instructorWhere).length > 0
                    ? { instructor: instructorWhere }
                    : {}),
            },
            select: {
                id: true,
                instructorId: true,
                instructor: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
        })

        // Build set of valid course IDs (after search filter)
        const validCourseIds = new Set(courses.map((c) => c.id))

        // Group orders by instructor (only for valid courses)
        const instructorRevenueMap = new Map()
        const courseInstructorMap = new Map()

        // Build course to instructor map
        courses.forEach((course) => {
            if (course.instructor) {
                courseInstructorMap.set(course.id, course.instructor)
            }
        })

        // Process only orders from valid courses
        allOrders.forEach((order) => {
            // Only process if course is in valid courses (after search filter)
            if (validCourseIds.has(order.courseId)) {
                const instructor = courseInstructorMap.get(order.courseId)
                if (instructor) {
                    const instructorId = instructor.id
                    const instructorName = instructor.fullName || 'Unknown'
                    const email = instructor.email || ''
                    // Convert Decimal to number properly
                    const revenue = decimalToNumber(order.finalPrice)
                    
                    // Debug logging if revenue is invalid
                    if (isNaN(revenue) || revenue === null || revenue === undefined) {
                        logger.warn(
                            `Invalid revenue for order: courseId=${order.courseId}, finalPrice=${order.finalPrice}, type=${typeof order.finalPrice}`
                        )
                    }

                    if (instructorRevenueMap.has(instructorId)) {
                        const existing = instructorRevenueMap.get(instructorId)
                        existing.revenue = (existing.revenue || 0) + (revenue || 0)
                        existing.orderCount += 1
                    } else {
                        instructorRevenueMap.set(instructorId, {
                            instructorId,
                            instructorName,
                            email,
                            courseCount: 0,
                            orderCount: 1,
                            revenue: revenue || 0,
                        })
                    }
                }
            }
        })

        // Count unique courses per instructor (only from valid courses)
        const instructorCourseSet = new Map()
        allOrders.forEach((order) => {
            if (validCourseIds.has(order.courseId)) {
                const instructor = courseInstructorMap.get(order.courseId)
                if (instructor) {
                    const instructorId = instructor.id
                    if (!instructorCourseSet.has(instructorId)) {
                        instructorCourseSet.set(instructorId, new Set())
                    }
                    instructorCourseSet.get(instructorId).add(order.courseId)
                }
            }
        })

        // Update courseCount for each instructor
        instructorCourseSet.forEach((courseSet, instructorId) => {
            if (instructorRevenueMap.has(instructorId)) {
                instructorRevenueMap.get(instructorId).courseCount = courseSet.size
            }
        })

        // Convert to array
        let instructors = Array.from(instructorRevenueMap.values())

        // Sort
        if (sortBy === 'courseCount') {
            instructors.sort((a, b) => b.courseCount - a.courseCount)
        } else {
            // Default: sort by revenue descending
            instructors.sort((a, b) => b.revenue - a.revenue)
        }

        // Calculate summary statistics BEFORE pagination
        // These stats reflect ALL data matching the filters (date + search), not just the current page
        
        // Total revenue: sum from ALL valid orders (after date and search filters)
        // This is calculated from ALL orders, not just the paginated results
        // If search filter is applied, only includes orders from matching instructors
        // If no search filter, includes all orders within the date range
        const totalRevenue = allOrders
            .filter((order) => validCourseIds.has(order.courseId))
            .reduce((sum, order) => {
                const revenue = decimalToNumber(order.finalPrice)
                return sum + (revenue || 0)
            }, 0)
        
        // Instructor count: number of unique instructors (after search filter, before pagination)
        // This represents ALL instructors matching the filters, not just the current page
        const instructorCount = instructors.length
        
        // Total courses sold: total number of orders from ALL valid courses (after date and search filters)
        // This is calculated from ALL orders, not just the paginated results
        const totalCoursesSold = allOrders
            .filter((order) => validCourseIds.has(order.courseId))
            .length

        // Convert all instructors to proper format with rank
        // Map revenue to totalRevenue to match frontend interface
        const formattedInstructors = instructors.map((inst, index) => {
            const revenueValue = typeof inst.revenue === 'number' 
                ? inst.revenue 
                : decimalToNumber(inst.revenue)
            
            return {
                instructorId: Number(inst.instructorId),
                instructorName: inst.instructorName || 'Unknown',
                email: inst.email || '',
                courseCount: Number(inst.courseCount || 0),
                orderCount: Number(inst.orderCount || 0),
                totalRevenue: Number(revenueValue) || 0, // Convert to number and ensure it's not NaN
                rank: index + 1,
            }
        })

        // Prepare chart data (all instructors for pie chart, before pagination)
        // Frontend will group remaining instructors into "Khác"
        const chartData = formattedInstructors

        // Pagination
        const skip = (page - 1) * limit
        const total = formattedInstructors.length
        const paginatedInstructors = formattedInstructors.slice(skip, skip + limit)

        logger.info(
            `Instructors revenue retrieved: year=${year}, month=${month}, search=${search}, sortBy=${sortBy}, page=${page}, limit=${limit}`
        )

        return {
            instructors: paginatedInstructors,
            chartData: chartData, // Top 10 for pie chart
            summary: {
                totalRevenue: Number(totalRevenue),
                instructorCount: Number(instructorCount),
                totalCoursesSold: Number(totalCoursesSold),
            },
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: Number(total),
                totalPages: Number(Math.ceil(total / limit)),
            },
        }
    }
}

export default new AdminRevenueStatsService()
