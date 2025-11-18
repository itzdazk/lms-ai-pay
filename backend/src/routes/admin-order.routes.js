// backend/src/routes/admin-order.routes.js
import express from 'express'
import adminOrderController from '../controllers/admin-order.controller.js'
import { authenticate } from '../middlewares/authenticate.middleware.js'
import { isAdmin } from '../middlewares/role.middleware.js'

const router = express.Router()

// All routes require authentication and admin role
router.use(authenticate)
router.use(isAdmin)

/**
 * @route   GET /api/v1/admin/orders/stats
 * @desc    Get order statistics for admin dashboard
 * @access  Private (Admin)
 * @note    Must be defined before /:id routes to avoid conflict
 */
router.get('/stats', adminOrderController.getOrderStatistics)

/**
 * @route   GET /api/v1/admin/orders/revenue-trend
 * @desc    Get revenue trend (last 30 days)
 * @access  Private (Admin)
 */
router.get('/revenue-trend', adminOrderController.getRevenueTrend)

/**
 * @route   GET /api/v1/admin/orders
 * @desc    Get all orders with admin filters
 * @access  Private (Admin)
 * @query   page, limit, paymentStatus, search, sort, startDate, endDate, minAmount, maxAmount
 */
router.get('/', adminOrderController.getAllOrders)

export default router
