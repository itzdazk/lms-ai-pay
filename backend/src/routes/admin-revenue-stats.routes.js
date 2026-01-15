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

export default router
