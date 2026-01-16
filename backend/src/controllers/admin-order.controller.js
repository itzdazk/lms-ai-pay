// backend/src/controllers/admin-order.controller.js
import adminOrderService from '../services/admin-order.service.js'
import ApiResponse from '../utils/response.util.js'
import { asyncHandler } from '../middlewares/error.middleware.js'

class AdminOrderController {
    /**
     * @route   GET /api/v1/admin/orders
     * @desc    Get all orders with admin filters
     * @desc    Xem danh sách hóa đơn, tìm tên khách, lọc theo ngày
     * @access  Private (Admin)
     */
    getAllOrders = asyncHandler(async (req, res) => {
        const {
            page,
            limit,
            paymentStatus,
            search,
            sort,
            startDate,
            endDate,
            minAmount,
            maxAmount,
        } = req.query

        const filters = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            paymentStatus: paymentStatus || undefined,
            search: search || undefined,
            sort: sort || 'newest',
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            minAmount: minAmount || undefined,
            maxAmount: maxAmount || undefined,
        }

        const result = await adminOrderService.getAllOrders(filters)

        return ApiResponse.paginated(
            res,
            result.orders,
            {
                page: filters.page,
                limit: filters.limit,
                total: result.total,
            },
            'Truy xuất danh sách hóa đơn thành công'
        )
    })

    /**
     * @route   GET /api/v1/admin/orders/stats
     * @desc    Get order statistics for admin dashboard
     * @desc    Xem báo cáo: hôm nay bán bao nhiêu, tháng này tăng bao %
     * @access  Private (Admin)
     */
    getOrderStatistics = asyncHandler(async (req, res) => {
        const stats = await adminOrderService.getOrderStatistics()

        return ApiResponse.success(
            res,
            stats,
            'Truy xuất thống kê hóa đơn thành công'
        )
    })

    /**
     * @route   GET /api/v1/admin/orders/revenue-trend
     * @desc    Get revenue trend (last 30 days)
     * @desc Vẽ biểu đồ doanh thu 30 ngày để biết ngày nào đông
     * @access  Private (Admin)
     */
    getRevenueTrend = asyncHandler(async (req, res) => {
        const trend = await adminOrderService.getRevenueTrend()

        return ApiResponse.success(
            res,
            trend,
            'Truy xuất xu hướng doanh thu thành công'
        )
    })

    /**
     * @route   GET /api/v1/admin/orders/:id
     * @desc    Get order details by ID (Admin can view any order)
     * @access  Private (Admin)
     */
    getOrderById = asyncHandler(async (req, res) => {
        const { id } = req.params
        const orderId = parseInt(id)

        if (isNaN(orderId)) {
            return ApiResponse.badRequest(res, 'ID hóa đơn không hợp lệ')
        }

        const order = await adminOrderService.getOrderById(orderId)

        return ApiResponse.success(
            res,
            order,
            'Truy xuất chi tiết hóa đơn thành công'
        )
    })
}

export default new AdminOrderController()
