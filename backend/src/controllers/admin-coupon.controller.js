// backend/src/controllers/admin-coupon.controller.js
import couponService from '../services/coupon.service.js'
import ApiResponse from '../utils/response.util.js'
import { asyncHandler } from '../middlewares/error.middleware.js'

class AdminCouponController {
    /**
     * @route   POST /api/v1/admin/coupons
     * @desc    Create a new coupon
     * @access  Private (Admin/Instructor)
     */
    createCoupon = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const couponData = req.body

        const coupon = await couponService.createCoupon(couponData, userId)

        return ApiResponse.created(res, coupon, 'Tạo mã giảm giá thành công')
    })

    /**
     * @route   PUT /api/v1/admin/coupons/:id
     * @desc    Update a coupon
     * @access  Private (Admin/Instructor)
     */
    updateCoupon = asyncHandler(async (req, res) => {
        const { id } = req.params
        const couponId = parseInt(id)

        if (isNaN(couponId)) {
            return ApiResponse.badRequest(res, 'ID mã giảm giá không hợp lệ')
        }

        const updateData = req.body
        const coupon = await couponService.updateCoupon(couponId, updateData)

        return ApiResponse.success(
            res,
            coupon,
            'Cập nhật mã giảm giá thành công',
        )
    })

    /**
     * @route   GET /api/v1/admin/coupons
     * @desc    Get all coupons with filters
     * @access  Private (Admin/Instructor)
     */
    getCoupons = asyncHandler(async (req, res) => {
        const { page, limit, search, active, type, sort } = req.query

        const filters = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            search: search || undefined,
            active: active || undefined,
            type: type || undefined,
            sort: sort || 'newest',
        }

        const result = await couponService.getAllCoupons(filters)

        return ApiResponse.paginated(
            res,
            result.coupons,
            {
                page: filters.page,
                limit: filters.limit,
                total: result.total,
            },
            'Truy xuất danh sách mã giảm giá thành công',
        )
    })

    /**
     * @route   GET /api/v1/admin/coupons/:id
     * @desc    Get coupon details by ID
     * @access  Private (Admin/Instructor)
     */
    getCouponById = asyncHandler(async (req, res) => {
        const { id } = req.params
        const couponId = parseInt(id)

        if (isNaN(couponId)) {
            return ApiResponse.badRequest(res, 'ID mã giảm giá không hợp lệ')
        }

        const coupon = await couponService.getCouponById(couponId)

        return ApiResponse.success(
            res,
            coupon,
            'Truy xuất chi tiết mã giảm giá thành công',
        )
    })

    /**
     * @route   DELETE /api/v1/admin/coupons/:id
     * @desc    Delete/Deactivate a coupon
     * @access  Private (Admin/Instructor)
     */
    deleteCoupon = asyncHandler(async (req, res) => {
        const { id } = req.params
        const couponId = parseInt(id)

        if (isNaN(couponId)) {
            return ApiResponse.badRequest(res, 'ID mã giảm giá không hợp lệ')
        }

        const result = await couponService.deleteCoupon(couponId)

        return ApiResponse.success(res, result, result.message)
    })

    /**
     * @route   GET /api/v1/admin/coupons/:id/usages
     * @desc    Get coupon usage history
     * @access  Private (Admin/Instructor)
     */
    getCouponUsageHistory = asyncHandler(async (req, res) => {
        const { id } = req.params
        const couponId = parseInt(id)

        if (isNaN(couponId)) {
            return ApiResponse.badRequest(res, 'ID mã giảm giá không hợp lệ')
        }

        const { page, limit } = req.query
        const filters = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
        }

        const result = await couponService.getCouponUsageHistory(
            couponId,
            filters,
        )

        return ApiResponse.paginated(
            res,
            result.usages,
            {
                page: filters.page,
                limit: filters.limit,
                total: result.total,
            },
            'Truy xuất lịch sử sử dụng mã giảm giá thành công',
        )
    })
}

export default new AdminCouponController()
