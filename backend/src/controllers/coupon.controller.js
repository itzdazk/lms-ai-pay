// backend/src/controllers/coupon.controller.js
import couponService from '../services/coupon.service.js'
import ApiResponse from '../utils/response.util.js'
import { asyncHandler } from '../middlewares/error.middleware.js'

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
}

export default new CouponController()
