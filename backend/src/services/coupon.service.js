// backend/src/services/coupon.service.js
import { prisma } from '../config/database.config.js'
import { COUPON_TYPES, HTTP_STATUS } from '../config/constants.js'

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

        // Check global usage limit
        if (coupon.maxUses && coupon.usesCount >= coupon.maxUses) {
            const error = new Error('Mã giảm giá đã hết lượt sử dụng')
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
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
     * @returns {Promise<Object>} Coupon usage record
     */
    async applyCoupon(code, userId, orderId, discountAmount) {
        return prisma.$transaction(async (tx) => {
            // Re-fetch coupon with lock to prevent race conditions
            const coupon = await tx.coupon.findUnique({
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
                const userUsageCount = await tx.couponUsage.count({
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
            await tx.coupon.update({
                where: { id: coupon.id },
                data: {
                    usesCount: { increment: 1 },
                },
            })

            // Create usage record
            const usage = await tx.couponUsage.create({
                data: {
                    couponId: coupon.id,
                    userId: userId,
                    orderId: orderId,
                    amountReduced: discountAmount,
                },
            })

            return usage
        })
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
}

export default new CouponService()
