// backend/src/routes/orders.routes.js
import express from 'express'
import ordersController from '../controllers/orders.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import {
    createOrderValidator,
    getOrdersValidator,
    getOrderByIdValidator,
    getOrderByCodeValidator,
    cancelOrderValidator,
} from '../validators/orders.validator.js'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

/**
 * @route   GET /api/v1/orders/stats
 * @desc    Get user's order statistics
 * @access  Private (Student/Instructor/Admin)
 * @note    Must be defined BEFORE /:id routes to avoid conflict
 */
router.get('/stats', ordersController.getUserOrderStats)

/**
 * @route   GET /api/v1/orders
 * @desc    Get user's orders with filters and pagination
 * @access  Private (Student/Instructor/Admin)
 * @query   page, limit, paymentStatus, paymentGateway, startDate, endDate, sort
 */
router.get('/', getOrdersValidator, ordersController.getOrders)

/**
 * @route   GET /api/v1/orders/code/:orderCode
 * @desc    Get order details by order code
 * @access  Private (Student/Instructor/Admin)
 * @note    Must be defined BEFORE /:id to avoid route conflict
 */
router.get(
    '/code/:orderCode',
    getOrderByCodeValidator,
    ordersController.getOrderByCode
)

/**
 * @route   GET /api/v1/orders/:id
 * @desc    Get order details by ID
 * @access  Private (Student/Instructor/Admin)
 */
router.get('/:id', getOrderByIdValidator, ordersController.getOrderById)

/**
 * @route   POST /api/v1/orders
 * @desc    Create a new order
 * @access  Private (Student/Instructor/Admin)
 * @body    courseId, paymentGateway, billingAddress (optional)
 */
router.post('/', createOrderValidator, ordersController.createOrder)

/**
 * @route   PATCH /api/v1/orders/:id/cancel
 * @desc    Cancel pending order
 * @access  Private (Student/Instructor/Admin)
 */
router.patch('/:id/cancel', cancelOrderValidator, ordersController.cancelOrder)

export default router
