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
        const { courseId, paymentGateway, billingAddress } = req.body

        if (!courseId) {
            return ApiResponse.badRequest(res, 'Course ID is required')
        }

        if (!paymentGateway) {
            return ApiResponse.badRequest(res, 'Payment gateway is required')
        }

        const order = await ordersService.createOrder(
            userId,
            parseInt(courseId),
            paymentGateway,
            billingAddress
        )

        return ApiResponse.created(
            res,
            order,
            'Order created successfully'
        )
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
        } = req.query

        const filters = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            paymentStatus: paymentStatus || undefined,
            paymentGateway: paymentGateway || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            sort: sort || 'newest',
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
            'Orders retrieved successfully'
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
            return ApiResponse.badRequest(res, 'Invalid order ID')
        }

        const order = await ordersService.getOrderById(orderId, userId)

        return ApiResponse.success(
            res,
            order,
            'Order retrieved successfully'
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
            return ApiResponse.badRequest(res, 'Order code is required')
        }

        const order = await ordersService.getOrderByCode(orderCode, userId)

        return ApiResponse.success(
            res,
            order,
            'Order retrieved successfully'
        )
    })
}

export default new OrdersController()

