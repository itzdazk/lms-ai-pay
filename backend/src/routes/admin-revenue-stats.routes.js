// backend/src/routes/admin-revenue-stats.routes.js
import express from 'express'
import adminRevenueStatsController from '../controllers/admin-revenue-stats.controller.js'
import { authenticate } from '../middlewares/authenticate.middleware.js'
import { isAdmin } from '../middlewares/role.middleware.js'

const router = express.Router()

// All routes require authentication and admin role
router.use(authenticate)
router.use(isAdmin)

/**
 * @route   GET /api/v1/admin/revenue/stats
 * @desc    Get revenue statistics by year and month
 * @access  Private (Admin)
 * @query   year (optional), month (optional)
 */
router.get('/stats', adminRevenueStatsController.getRevenueStats)

/**
 * @route   GET /api/v1/admin/revenue/instructors
 * @desc    Get instructors revenue statistics with filters, search, sort, and pagination
 * @access  Private (Admin)
 * @query   year (optional), month (optional), search (optional), sortBy (optional), page (optional), limit (optional)
 */
router.get('/instructors', adminRevenueStatsController.getInstructorsRevenue)

export default router
