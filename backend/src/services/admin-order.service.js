// backend/src/services/admin-order.service.js
import { prisma } from '../config/database.config.js'
import { PAYMENT_STATUS } from '../config/constants.js'
import logger from '../config/logger.config.js'

class AdminOrderService {
    /**
     * Get all orders with admin filters
     * @param {object} filters - Filter options
     * @returns {Promise<{orders: Array, total: number}>}
     */
    async getAllOrders(filters) {
        const {
            page = 1,
            limit = 20,
            paymentStatus,
            search,
            sort = 'newest',
            startDate,
            endDate,
            minAmount,
            maxAmount,
        } = filters

        const skip = (page - 1) * limit

        // Build where clause
        const where = {}

        // Filter by payment status
        if (paymentStatus) {
            where.paymentStatus = paymentStatus
        }

        // Search in order code, course title, user email
        if (search) {
            where.OR = [
                { orderCode: { contains: search, mode: 'insensitive' } },
                {
                    course: {
                        title: { contains: search, mode: 'insensitive' },
                    },
                },
                {
                    user: {
                        OR: [
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

        // Filter by date range
        if (startDate || endDate) {
            where.createdAt = {}
            if (startDate) {
                where.createdAt.gte = new Date(startDate)
            }
            if (endDate) {
                const end = new Date(endDate)
                end.setHours(23, 59, 59, 999)
                where.createdAt.lte = end
            }
        }

        // Filter by amount range
        if (minAmount !== undefined || maxAmount !== undefined) {
            where.finalPrice = {}
            if (minAmount !== undefined) {
                where.finalPrice.gte = parseFloat(minAmount)
            }
            if (maxAmount !== undefined) {
                where.finalPrice.lte = parseFloat(maxAmount)
            }
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
                    course: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            thumbnailUrl: true,
                            price: true,
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            userName: true,
                            email: true,
                            fullName: true,
                        },
                    },
                    paymentTransactions: {
                        select: {
                            id: true,
                            transactionId: true,
                            paymentGateway: true,
                            status: true,
                            createdAt: true,
                        },
                        orderBy: {
                            createdAt: 'desc',
                        },
                        take: 1,
                    },
                },
            }),
            prisma.order.count({ where }),
        ])

        logger.info(`Admin retrieved ${orders.length} orders`)

        return {
            orders,
            total,
        }
    }

    /**
     * Get order statistics for admin dashboard
     * @returns {Promise<object>} Order statistics
     */
    async getOrderStatistics() {
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

        const [
            totalOrders,
            paidOrders,
            pendingOrders,
            failedOrders,
            todayOrders,
            thisMonthOrders,
            lastMonthOrders,
        ] = await Promise.all([
            prisma.order.count(),
            prisma.order.count({
                where: { paymentStatus: PAYMENT_STATUS.PAID },
            }),
            prisma.order.count({
                where: { paymentStatus: PAYMENT_STATUS.PENDING },
            }),
            prisma.order.count({
                where: { paymentStatus: PAYMENT_STATUS.FAILED },
            }),
            prisma.order.count({
                where: { createdAt: { gte: today } },
            }),
            prisma.order.count({
                where: { createdAt: { gte: thisMonth } },
            }),
            prisma.order.count({
                where: {
                    createdAt: { gte: lastMonth, lte: lastMonthEnd },
                },
            }),
        ])

        // Revenue statistics
        const [totalRevenue, todayRevenue, thisMonthRevenue, lastMonthRevenue] =
            await Promise.all([
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
            ])

        // Calculate growth
        const orderGrowth =
            lastMonthOrders > 0
                ? ((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100
                : 0

        const revenueGrowth =
            parseFloat(lastMonthRevenue._sum.finalPrice || 0) > 0
                ? ((parseFloat(thisMonthRevenue._sum.finalPrice || 0) -
                      parseFloat(lastMonthRevenue._sum.finalPrice || 0)) /
                      parseFloat(lastMonthRevenue._sum.finalPrice || 0)) *
                  100
                : 0

        return {
            overview: {
                totalOrders,
                paidOrders,
                pendingOrders,
                failedOrders,
                conversionRate:
                    totalOrders > 0
                        ? Math.round((paidOrders / totalOrders) * 100 * 100) /
                          100
                        : 0,
            },
            today: {
                orders: todayOrders,
                revenue: parseFloat(todayRevenue._sum.finalPrice || 0),
            },
            thisMonth: {
                orders: thisMonthOrders,
                revenue: parseFloat(thisMonthRevenue._sum.finalPrice || 0),
                orderGrowth: Math.round(orderGrowth * 100) / 100,
                revenueGrowth: Math.round(revenueGrowth * 100) / 100,
            },
            lastMonth: {
                orders: lastMonthOrders,
                revenue: parseFloat(lastMonthRevenue._sum.finalPrice || 0),
            },
            allTime: {
                revenue: parseFloat(totalRevenue._sum.finalPrice || 0),
                averageOrderValue:
                    paidOrders > 0
                        ? parseFloat(totalRevenue._sum.finalPrice || 0) /
                          paidOrders
                        : 0,
            },
        }
    }

    /**
     * Get revenue trend (last 30 days)
     * @returns {Promise<Array>} Daily revenue data
     */
    async getRevenueTrend() {
        const trend = []
        const now = new Date()

        for (let i = 29; i >= 0; i--) {
            const date = new Date(now)
            date.setDate(date.getDate() - i)
            date.setHours(0, 0, 0, 0)

            const nextDate = new Date(date)
            nextDate.setDate(nextDate.getDate() + 1)

            const dayData = await prisma.order.aggregate({
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

            trend.push({
                date: date.toISOString().split('T')[0],
                revenue: parseFloat(dayData._sum.finalPrice || 0),
                orders: dayData._count,
            })
        }

        return trend
    }
}

export default new AdminOrderService()
