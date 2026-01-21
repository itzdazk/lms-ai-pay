// backend/src/controllers/student-coupon.controller.js
import couponService from '../services/coupon.service.js'
import ApiResponse from '../utils/response.util.js'
import { asyncHandler } from '../middlewares/error.middleware.js'

class StudentCouponController {
    /**
     * @route   GET /api/v1/coupons/available
     * @desc    Get all available coupons for student
     * @access  Private (Student)
     */
    getAvailableCoupons = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const { page, limit, type } = req.query

        const filters = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            type: type || undefined,
        }

        const result = await couponService.getAvailableCouponsForStudent(
            userId,
            filters,
        )

        return ApiResponse.paginated(
            res,
            result.coupons,
            {
                page: filters.page,
                limit: filters.limit,
                total: result.total,
            },
            'Lấy danh sách mã giảm giá thành công',
        )
    })
}

export default new StudentCouponController()
