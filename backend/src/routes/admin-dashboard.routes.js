// backend/src/routes/admin-dashboard.routes.js
import express from 'express'
import adminDashboardController from '../controllers/admin-dashboard.controller.js'
import { authenticate } from '../middlewares/authenticate.middleware.js'
import { USER_ROLES } from '../config/constants.js'
import { authorize } from '../middlewares/role.middleware.js'

const router = express.Router()

// Apply authentication and admin authorization to all routes
router.use(authenticate)
router.use(authorize(USER_ROLES.ADMIN))

/**
 * @route   GET /api/v1/dashboard/admin
 * @desc    Get admin dashboard overview
 * @access  Private (Admin)
 */
router.get('/', adminDashboardController.getDashboard)

/**
 * @route   GET /api/v1/dashboard/admin/stats
 * @desc    Get system statistics
 * @access  Private (Admin)
 */
router.get('/stats', adminDashboardController.getSystemStats)

/**
 * @route   GET /api/v1/dashboard/admin/users-analytics
 * @desc    Get user analytics
 * @access  Private (Admin)
 */
router.get('/users-analytics', adminDashboardController.getUsersAnalytics)

/**
 * @route   GET /api/v1/dashboard/admin/courses-analytics
 * @desc    Get course analytics
 * @access  Private (Admin)
 */
router.get('/courses-analytics', adminDashboardController.getCoursesAnalytics)

/**
 * @route   GET /api/v1/dashboard/admin/revenue
 * @desc    Get revenue analytics
 * @access  Private (Admin)
 */
router.get('/revenue', adminDashboardController.getRevenueAnalytics)

/**
 * @route   GET /api/v1/dashboard/admin/activities
 * @desc    Get recent activities
 * @access  Private (Admin)
 */
router.get('/activities', adminDashboardController.getRecentActivities)

export default router
