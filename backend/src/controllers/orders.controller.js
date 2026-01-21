// backend/src/controllers/orders.controller.js
import ordersService from '../services/orders.service.js'
import ApiResponse from '../utils/response.util.js'
import { asyncHandler } from '../middlewares/error.middleware.js'

class OrdersController {
    /**
     * @route   POST /api/v1/orders
     * @desc    Create a new order
     * @access  Private (Student/Instructor/Admin)
     */
    createOrder = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const { courseId, paymentGateway, billingAddress, couponCode } =
            req.body

        if (!courseId) {
            return ApiResponse.badRequest(res, 'Yêu cầu ID khóa học')
        }

        if (!paymentGateway) {
            return ApiResponse.badRequest(res, 'Yêu cầu cổng thanh toán')
        }

        const order = await ordersService.createOrder(
            userId,
            parseInt(courseId),
            paymentGateway,
            billingAddress,
            couponCode,
        )

        return ApiResponse.created(res, order, 'Tạo hóa đơn thành công')
    })

    /**
     * @route   GET /api/v1/orders
     * @desc    Get user's orders with filters and pagination
     * @access  Private (Student/Instructor/Admin)
     */
    getOrders = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const {
            page,
            limit,
            paymentStatus,
            paymentGateway,
            startDate,
            endDate,
            sort,
            search,
        } = req.query

        const filters = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            paymentStatus: paymentStatus || undefined,
            paymentGateway: paymentGateway || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            sort: sort || 'newest',
            search: search || undefined,
        }

        const result = await ordersService.getUserOrders(userId, filters)

        return ApiResponse.paginated(
            res,
            result.orders,
            {
                page: filters.page,
                limit: filters.limit,
                total: result.total,
            },
            'Truy xuất hóa đơn thành công',
        )
    })

    /**
     * @route   GET /api/v1/orders/:id
     * @desc    Get order details by ID
     * @access  Private (Student/Instructor/Admin)
     */
    getOrderById = asyncHandler(async (req, res) => {
        const { id } = req.params
        const userId = req.user.id
        const orderId = parseInt(id)

        if (isNaN(orderId)) {
            return ApiResponse.badRequest(res, 'ID hóa đơn không hợp lệ')
        }

        const order = await ordersService.getOrderById(orderId, userId)

        return ApiResponse.success(
            res,
            order,
            'Truy xuất chi tiết hóa đơn thành công',
        )
    })

    /**
     * @route   GET /api/v1/orders/code/:orderCode
     * @desc    Get order details by order code
     * @access  Private (Student/Instructor/Admin)
     */
    getOrderByCode = asyncHandler(async (req, res) => {
        const { orderCode } = req.params
        const userId = req.user.id

        if (!orderCode) {
            return ApiResponse.badRequest(res, 'Yêu cầu mã hóa đơn')
        }

        const order = await ordersService.getOrderByCode(orderCode, userId)

        return ApiResponse.success(
            res,
            order,
            'Truy xuất chi tiết hóa đơn thành công',
        )
    })

    /**
     * @route   PATCH /api/v1/orders/:id/cancel
     * @desc    Cancel pending order
     * @access  Private (Student/Instructor/Admin)
     */
    cancelOrder = asyncHandler(async (req, res) => {
        const { id } = req.params
        const userId = req.user.id
        const orderId = parseInt(id)

        if (isNaN(orderId)) {
            return ApiResponse.badRequest(res, 'ID đơn hàng không hợp lệ.')
        }

        const order = await ordersService.cancelOrder(orderId, userId)

        return ApiResponse.success(res, order, 'Hủy đơn hàng thành công.')
    })

    /**
     * @route   GET /api/v1/orders/stats
     * @desc    Get user's order statistics
     * @access  Private (Student/Instructor/Admin)
     */
    getUserOrderStats = asyncHandler(async (req, res) => {
        const userId = req.user.id

        const stats = await ordersService.getUserOrderStats(userId)

        return ApiResponse.success(
            res,
            stats,
            'Truy xuất thống kê hóa đơn thành công',
        )
    })
}

export default new OrdersController()
