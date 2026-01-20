// backend/src/controllers/coupon.controller.js
import couponService from '../services/coupon.service.js'
import ApiResponse from '../utils/response.util.js'
import { asyncHandler } from '../middlewares/error.middleware.js'
import { prisma } from '../config/database.config.js'
import { HTTP_STATUS } from '../config/constants.js'

class CouponController {
    /**
     * @route   POST /api/v1/coupons/apply
     * @desc    Apply coupon code to check validity and calculate discount
     * @access  Private (Authenticated users)
     */
    applyCoupon = asyncHandler(async (req, res) => {
        const { code, orderTotal, courseIds } = req.body
        const userId = req.user.id

        // Validate coupon
        const coupon = await couponService.validateCoupon(
            code,
            userId,
            orderTotal,
            courseIds || [],
        )

        // Calculate discount
        const discountAmount = couponService.calculateDiscount(
            coupon,
            orderTotal,
        )
        const finalPrice = Number(orderTotal) - discountAmount

        return ApiResponse.success(
            res,
            {
                couponCode: code,
                discountAmount,
                finalPrice,
                couponDetails: {
                    type: coupon.type,
                    value: coupon.value,
                },
            },
            'Áp dụng mã giảm giá thành công',
        )
    })

    /**
     * @route   GET /api/v1/coupons/:code/check
     * @desc    Quick check if coupon exists and is active (no usage limit check)
     * @access  Public
     */
    checkCoupon = asyncHandler(async (req, res) => {
        const { code } = req.params

        const coupon = await prisma.coupon.findUnique({
            where: { code },
            select: {
                id: true,
                code: true,
                type: true,
                value: true,
                active: true,
                startDate: true,
                endDate: true,
                minOrderValue: true,
            },
        })

        if (!coupon) {
            const error = new Error('Mã giảm giá không tồn tại')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        const now = new Date()
        const isValid =
            coupon.active && now >= coupon.startDate && now <= coupon.endDate

        return ApiResponse.success(
            res,
            {
                code: coupon.code,
                type: coupon.type,
                value: coupon.value,
                minOrderValue: coupon.minOrderValue,
                isValid,
                reason: !isValid
                    ? !coupon.active
                        ? 'Mã đã bị vô hiệu hóa'
                        : now < coupon.startDate
                          ? 'Mã chưa đến thời gian hiệu lực'
                          : 'Mã đã hết hạn'
                    : null,
            },
            'Kiểm tra mã giảm giá thành công',
        )
    })
}

export default new CouponController()
