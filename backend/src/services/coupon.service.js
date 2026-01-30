// backend/src/services/coupon.service.js
import { prisma } from '../config/database.config.js'
import {
    COUPON_TYPES,
    HTTP_STATUS,
    PAYMENT_STATUS,
} from '../config/constants.js'

class CouponService {
    /**
     * Validate coupon for application
     * @param {string} code - Coupon code
     * @param {number} userId - User ID
     * @param {number} orderTotal - Order total amount
     * @param {Array<number>} courseIds - Array of course IDs in the order
     * @returns {Promise<Object>} Validation result with coupon data
     */
    async validateCoupon(code, userId, orderTotal, courseIds = []) {
        // Find coupon by code
        const coupon = await prisma.coupon.findUnique({
            where: { code },
        })

        if (!coupon) {
            const error = new Error('Mã giảm giá không tồn tại')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        if (!coupon.active) {
            const error = new Error('Mã giảm giá đã bị vô hiệu hóa')
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }

        // Check date validity
        const now = new Date()
        if (now < coupon.startDate) {
            const error = new Error('Mã giảm giá chưa đến thời gian hiệu lực')
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }
        if (now > coupon.endDate) {
            const error = new Error('Mã giảm giá đã hết hạn')
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }

        if (coupon.maxUses) {
            // Check completed usages
            const consumedCount = await prisma.couponUsage.count({
                where: { couponId: coupon.id },
            })

            if (consumedCount >= coupon.maxUses) {
                const error = new Error('Mã giảm giá đã hết lượt sử dụng')
                error.statusCode = HTTP_STATUS.BAD_REQUEST
                throw error
            }

            // check pending orders to prevent overselling
            const pendingCount = await prisma.order.count({
                where: {
                    appliedCouponCode: code,
                    paymentStatus: PAYMENT_STATUS.PENDING,
                },
            })

            // Reserve capacity: consumed + pending must be < maxUses
            if (consumedCount + pendingCount >= coupon.maxUses) {
                const error = new Error(
                    'Mã giảm giá tạm thời không khả dụng do có đơn hàng đang chờ xử lý',
                )
                error.statusCode = HTTP_STATUS.BAD_REQUEST
                throw error
            }
        }

        // Check user-specific conditions
        if (userId) {
            // Check if New User type
            if (coupon.type === COUPON_TYPES.NEW_USER) {
                const orderCount = await prisma.order.count({
                    where: {
                        userId,
                        paymentStatus: 'PAID',
                    },
                })
                if (orderCount > 0) {
                    const error = new Error(
                        'Mã giảm giá chỉ dành cho khách hàng mới',
                    )
                    error.statusCode = HTTP_STATUS.BAD_REQUEST
                    throw error
                }
            }

            // Check per-user usage limit
            if (coupon.maxUsesPerUser) {
                const userUsageCount = await prisma.couponUsage.count({
                    where: {
                        couponId: coupon.id,
                        userId: userId,
                    },
                })
                if (userUsageCount >= coupon.maxUsesPerUser) {
                    const error = new Error(
                        'Bạn đã hết lượt sử dụng mã giảm giá này',
                    )
                    error.statusCode = HTTP_STATUS.BAD_REQUEST
                    throw error
                }
            }
        }

        // Check minimum order value
        if (coupon.minOrderValue && orderTotal < Number(coupon.minOrderValue)) {
            const error = new Error(
                `Đơn hàng tối thiểu để áp dụng mã là ${Number(coupon.minOrderValue).toLocaleString('vi-VN')}đ`,
            )
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }

        // Check course applicability
        if (
            coupon.applicableCourseIds &&
            coupon.applicableCourseIds.length > 0
        ) {
            const hasApplicableCourse = courseIds.some((id) =>
                coupon.applicableCourseIds.includes(id),
            )
            if (!hasApplicableCourse) {
                const error = new Error(
                    'Mã giảm giá không áp dụng cho các khóa học trong đơn hàng này',
                )
                error.statusCode = HTTP_STATUS.BAD_REQUEST
                throw error
            }
        }

        // Check category applicability (if courseIds provided)
        if (
            coupon.applicableCategoryIds &&
            coupon.applicableCategoryIds.length > 0 &&
            courseIds.length > 0
        ) {
            const courses = await prisma.course.findMany({
                where: {
                    id: { in: courseIds },
                },
                select: {
                    categoryId: true,
                },
            })

            const hasApplicableCategory = courses.some((course) =>
                coupon.applicableCategoryIds.includes(course.categoryId),
            )

            if (!hasApplicableCategory) {
                const error = new Error(
                    'Mã giảm giá không áp dụng cho danh mục của các khóa học trong đơn hàng này',
                )
                error.statusCode = HTTP_STATUS.BAD_REQUEST
                throw error
            }
        }

        return coupon
    }

    /**
     * Calculate discount amount based on coupon type
     * @param {Object} coupon - Coupon object
     * @param {number} orderTotal - Order total amount
     * @returns {number} Discount amount
     */
    calculateDiscount(coupon, orderTotal) {
        let discount = 0
        const total = Number(orderTotal)
        const value = Number(coupon.value)

        if (coupon.type === COUPON_TYPES.PERCENT) {
            discount = total * (value / 100)
            // Apply max discount cap if exists
            if (coupon.maxDiscount) {
                const max = Number(coupon.maxDiscount)
                discount = Math.min(discount, max)
            }
        } else if (
            coupon.type === COUPON_TYPES.FIXED ||
            coupon.type === COUPON_TYPES.NEW_USER
        ) {
            discount = value
        }

        // Ensure discount doesn't exceed order total
        return Math.min(discount, total)
    }

    /**
     * Apply coupon to order (update usage count and create usage record)
     * This should be called within a transaction when order is confirmed
     * @param {string} code - Coupon code
     * @param {number} userId - User ID
     * @param {number} orderId - Order ID
     * @param {number} discountAmount - Calculated discount amount
     * @param {Object} tx - Optional Prisma transaction context
     * @returns {Promise<Object>} Coupon usage record
     */
    async applyCouponOnSuccess(
        code,
        userId,
        orderId,
        discountAmount,
        tx = null,
    ) {
        const executeInTransaction = async (txContext) => {
            // Re-fetch coupon with lock to prevent race conditions
            const coupon = await txContext.coupon.findUnique({
                where: { code },
            })

            if (!coupon || !coupon.active) {
                const error = new Error('Mã giảm giá không hợp lệ')
                error.statusCode = HTTP_STATUS.BAD_REQUEST
                throw error
            }

            // Re-check global limit
            if (coupon.maxUses && coupon.usesCount >= coupon.maxUses) {
                const error = new Error('Mã giảm giá đã hết lượt sử dụng')
                error.statusCode = HTTP_STATUS.BAD_REQUEST
                throw error
            }

            // Re-check user limit
            if (coupon.maxUsesPerUser) {
                const userUsageCount = await txContext.couponUsage.count({
                    where: {
                        couponId: coupon.id,
                        userId: userId,
                    },
                })
                if (userUsageCount >= coupon.maxUsesPerUser) {
                    const error = new Error(
                        'Bạn đã hết lượt sử dụng mã giảm giá này',
                    )
                    error.statusCode = HTTP_STATUS.BAD_REQUEST
                    throw error
                }
            }

            // Increment usage count
            await txContext.coupon.update({
                where: { id: coupon.id },
                data: {
                    usesCount: { increment: 1 },
                },
            })

            // Create usage record
            const usage = await txContext.couponUsage.create({
                data: {
                    couponId: coupon.id,
                    userId: userId,
                    orderId: orderId,
                    amountReduced: discountAmount,
                },
            })

            return usage
        }

        // If transaction context provided, use it; otherwise create new transaction
        if (tx) {
            return executeInTransaction(tx)
        } else {
            return prisma.$transaction(executeInTransaction)
        }
    }

    /**
     * Get all coupons with filters and pagination (Admin)
     * @param {Object} filters - Filter options
     * @returns {Promise<Object>} Coupons and total count
     */
    async getAllCoupons(filters = {}) {
        const {
            page = 1,
            limit = 20,
            search,
            active,
            type,
            sort = 'newest',
        } = filters

        const skip = (page - 1) * limit

        // Build where clause
        const where = {}

        if (search) {
            where.OR = [{ code: { contains: search, mode: 'insensitive' } }]
        }

        if (active !== undefined) {
            where.active = active === 'true' || active === true
        }

        if (type) {
            where.type = type
        }

        // Build orderBy clause
        let orderBy = {}
        switch (sort) {
            case 'oldest':
                orderBy = { createdAt: 'asc' }
                break
            case 'most_used':
                orderBy = { usesCount: 'desc' }
                break
            case 'least_used':
                orderBy = { usesCount: 'asc' }
                break
            case 'newest':
            default:
                orderBy = { createdAt: 'desc' }
        }

        // Execute query
        const [coupons, total] = await Promise.all([
            prisma.coupon.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    _count: {
                        select: { usages: true },
                    },
                },
            }),
            prisma.coupon.count({ where }),
        ])

        // Calculate total discount given for each coupon
        const couponsWithStats = await Promise.all(
            coupons.map(async (coupon) => {
                const stats = await prisma.couponUsage.aggregate({
                    where: { couponId: coupon.id },
                    _sum: { amountReduced: true },
                })

                return {
                    ...coupon,
                    totalDiscountGiven: parseFloat(
                        stats._sum.amountReduced || 0,
                    ),
                }
            }),
        )

        return {
            coupons: couponsWithStats,
            total,
        }
    }

    /**
     * Get coupon by ID with usage statistics (Admin)
     * @param {number} couponId - Coupon ID
     * @returns {Promise<Object>} Coupon with statistics
     */
    async getCouponById(couponId) {
        const coupon = await prisma.coupon.findUnique({
            where: { id: couponId },
            include: {
                _count: {
                    select: { usages: true },
                },
            },
        })

        if (!coupon) {
            const error = new Error('Không tìm thấy mã giảm giá')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Get total discount given
        const stats = await prisma.couponUsage.aggregate({
            where: { couponId: coupon.id },
            _sum: { amountReduced: true },
        })

        return {
            ...coupon,
            totalDiscountGiven: parseFloat(stats._sum.amountReduced || 0),
        }
    }

    /**
     * Create new coupon (Admin)
     * @param {Object} couponData - Coupon data
     * @param {number} createdBy - Admin user ID
     * @returns {Promise<Object>} Created coupon
     */
    async createCoupon(couponData, createdBy) {
        const {
            code,
            type,
            value,
            maxDiscount,
            minOrderValue,
            applicableCourseIds,
            applicableCategoryIds,
            startDate,
            endDate,
            maxUses,
            maxUsesPerUser,
        } = couponData

        // Check if code already exists
        const existing = await prisma.coupon.findUnique({
            where: { code },
        })

        if (existing) {
            const error = new Error('Mã giảm giá đã tồn tại')
            error.statusCode = HTTP_STATUS.CONFLICT
            throw error
        }

        const coupon = await prisma.coupon.create({
            data: {
                code,
                type,
                value,
                maxDiscount,
                minOrderValue,
                applicableCourseIds: applicableCourseIds || [],
                applicableCategoryIds: applicableCategoryIds || [],
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                maxUses,
                maxUsesPerUser,
                createdBy,
                active: true,
            },
        })

        return coupon
    }

    /**
     * Update coupon (Admin)
     * @param {number} couponId - Coupon ID
     * @param {Object} updateData - Update data
     * @returns {Promise<Object>} Updated coupon
     */
    async updateCoupon(couponId, updateData) {
        // Check if coupon exists
        const existing = await prisma.coupon.findUnique({
            where: { id: couponId },
        })

        if (!existing) {
            const error = new Error('Không tìm thấy mã giảm giá')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // If updating code, check for duplicates
        if (updateData.code && updateData.code !== existing.code) {
            const duplicate = await prisma.coupon.findUnique({
                where: { code: updateData.code },
            })
            if (duplicate) {
                const error = new Error('Mã giảm giá đã tồn tại')
                error.statusCode = HTTP_STATUS.CONFLICT
                throw error
            }
        }

        // Prepare update data
        const data = { ...updateData }
        if (data.startDate) {
            data.startDate = new Date(data.startDate)
        }
        if (data.endDate) {
            data.endDate = new Date(data.endDate)
        }

        const coupon = await prisma.coupon.update({
            where: { id: couponId },
            data,
        })

        return coupon
    }

    /**
     * Delete/Deactivate coupon (Admin)
     * @param {number} couponId - Coupon ID
     * @returns {Promise<Object>} Result message
     */
    async deleteCoupon(couponId) {
        // Check if coupon exists
        const coupon = await prisma.coupon.findUnique({
            where: { id: couponId },
        })

        if (!coupon) {
            const error = new Error('Không tìm thấy mã giảm giá')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Check if coupon has been used
        const usageCount = await prisma.couponUsage.count({
            where: { couponId },
        })

        if (usageCount > 0) {
            // Soft delete - just deactivate
            await prisma.coupon.update({
                where: { id: couponId },
                data: { active: false },
            })
            return {
                deleted: false,
                deactivated: true,
                message:
                    'Mã đã được sử dụng nên chỉ vô hiệu hóa, không xóa vĩnh viễn',
            }
        } else {
            // Hard delete if never used
            await prisma.coupon.delete({
                where: { id: couponId },
            })
            return {
                deleted: true,
                deactivated: false,
                message: 'Xóa mã giảm giá thành công',
            }
        }
    }

    /**
     * Get available coupons for student (Public/Student)
     * @param {number} userId - User ID
     * @param {Object} filters - Filter options
     * @returns {Promise<Object>} Available coupons and total count
     */
    async getAvailableCouponsForStudent(userId, filters = {}) {
        const { page = 1, limit = 20, type } = filters
        const skip = (page - 1) * limit

        const now = new Date()

        // Build where clause
        const where = {
            active: true,
            startDate: { lte: now },
            endDate: { gte: now },
        }

        if (type) {
            where.type = type
        }

        // Execute query
        const [coupons, total] = await Promise.all([
            prisma.coupon.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    code: true,
                    type: true,
                    value: true,
                    maxDiscount: true,
                    minOrderValue: true,
                    applicableCourseIds: true,
                    applicableCategoryIds: true,
                    startDate: true,
                    endDate: true,
                    maxUses: true,
                    maxUsesPerUser: true,
                    usesCount: true,
                },
            }),
            prisma.coupon.count({ where }),
        ])

        // Filter out coupons that user is not eligible for
        const eligibleCoupons = await Promise.all(
            coupons.map(async (coupon) => {
                try {
                    // Check if user has exceeded per-user limit
                    if (coupon.maxUsesPerUser && userId) {
                        const userUsageCount = await prisma.couponUsage.count({
                            where: {
                                couponId: coupon.id,
                                userId: userId,
                            },
                        })
                        if (userUsageCount >= coupon.maxUsesPerUser) {
                            return null // User has exhausted this coupon
                        }
                    }

                    // Check if NEW_USER coupon and user has paid orders
                    if (coupon.type === COUPON_TYPES.NEW_USER && userId) {
                        const orderCount = await prisma.order.count({
                            where: {
                                userId,
                                paymentStatus: PAYMENT_STATUS.PAID,
                            },
                        })
                        if (orderCount > 0) {
                            return null // User is not a new user
                        }
                    }

                    // Check if coupon has reached max uses
                    if (coupon.maxUses && coupon.usesCount >= coupon.maxUses) {
                        return null // Coupon is fully used
                    }

                    // Get applicable course/category names for display
                    let applicableCourses = []
                    let applicableCategories = []

                    if (
                        coupon.applicableCourseIds &&
                        coupon.applicableCourseIds.length > 0
                    ) {
                        applicableCourses = await prisma.course.findMany({
                            where: {
                                id: { in: coupon.applicableCourseIds },
                            },
                            select: {
                                id: true,
                                title: true,
                            },
                        })
                    }

                    if (
                        coupon.applicableCategoryIds &&
                        coupon.applicableCategoryIds.length > 0
                    ) {
                        applicableCategories = await prisma.category.findMany({
                            where: {
                                id: { in: coupon.applicableCategoryIds },
                            },
                            select: {
                                id: true,
                                name: true,
                            },
                        })
                    }

                    return {
                        ...coupon,
                        applicableCourses,
                        applicableCategories,
                    }
                } catch (error) {
                    console.error(
                        `Error checking eligibility for coupon ${coupon.id}:`,
                        error,
                    )
                    return null
                }
            }),
        )

        // Filter out null values (ineligible coupons)
        const filteredCoupons = eligibleCoupons.filter(
            (coupon) => coupon !== null,
        )

        return {
            coupons: filteredCoupons,
            total: filteredCoupons.length, // Return actual eligible count
        }
    }

    /**
     * Get coupon usage history (Admin)
     * @param {number} couponId - Coupon ID
     * @param {Object} filters - Filter options
     * @returns {Promise<Object>} Usage history and total count
     */

    async getCouponUsageHistory(couponId, filters = {}) {
        const { page = 1, limit = 20 } = filters
        const skip = (page - 1) * limit

        // Check if coupon exists
        const coupon = await prisma.coupon.findUnique({
            where: { id: couponId },
        })

        if (!coupon) {
            const error = new Error('Không tìm thấy mã giảm giá')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        const [usages, total] = await Promise.all([
            prisma.couponUsage.findMany({
                where: { couponId },
                skip,
                take: limit,
                orderBy: { usedAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                        },
                    },
                    order: {
                        select: {
                            id: true,
                            orderCode: true,
                            finalPrice: true,
                            course: {
                                select: {
                                    id: true,
                                    title: true,
                                },
                            },
                        },
                    },
                },
            }),
            prisma.couponUsage.count({ where: { couponId } }),
        ])

        return {
            usages,
            total,
        }
    }

    /**
     * Toggle coupon active status
     * @param {number} couponId - Coupon ID
     * @returns {Promise<Object>} Updated coupon
     */
    async toggleCouponActive(couponId) {
        // Check if coupon exists
        const coupon = await prisma.coupon.findUnique({
            where: { id: couponId },
        })

        if (!coupon) {
            const error = new Error('Không tìm thấy mã giảm giá')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Toggle active status
        const updatedCoupon = await prisma.coupon.update({
            where: { id: couponId },
            data: {
                active: !coupon.active,
            },
        })

        return updatedCoupon
    }

    /**
     * Get overview metrics for admin dashboard
     * @returns {Promise<Object>} Dashboard metrics
     */
    async getOverviewMetrics() {
        const now = new Date()

        // Get all coupons with status calculation
        const allCoupons = await prisma.coupon.findMany({
            select: {
                id: true,
                active: true,
                startDate: true,
                endDate: true,
                usesCount: true,
                maxUses: true,
                _count: {
                    select: { usages: true },
                },
            },
        })

        // Calculate metrics
        const total = allCoupons.length
        let active = 0
        let scheduled = 0
        let expired = 0
        let disabled = 0

        allCoupons.forEach((coupon) => {
            if (!coupon.active) {
                disabled++
            } else if (now < coupon.startDate) {
                scheduled++
            } else if (now > coupon.endDate) {
                expired++
            } else {
                active++
            }
        })

        // Total discount given
        const discountStats = await prisma.couponUsage.aggregate({
            _sum: { amountReduced: true },
            _count: { id: true },
        })

        const totalDiscountGiven = parseFloat(
            discountStats._sum.amountReduced || 0,
        )
        const totalUsages = discountStats._count.id

        // Orders using coupons (distinct orders)
        const ordersWithCoupons = await prisma.order.count({
            where: {
                appliedCouponCode: { not: null },
                paymentStatus: PAYMENT_STATUS.PAID,
            },
        })

        return {
            total,
            active,
            scheduled,
            expired,
            disabled,
            totalDiscountGiven,
            totalUsages,
            ordersWithCoupons,
        }
    }
}

export default new CouponService()
