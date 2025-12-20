// backend/src/controllers/admin-dashboard.controller.js
import adminDashboardService from '../services/admin-dashboard.service.js'
import ApiResponse from '../utils/response.util.js'
import { asyncHandler } from '../middlewares/error.middleware.js'

class AdminDashboardController {
    /**
     * @route   GET /api/v1/dashboard/admin
     * @desc    Get admin dashboard overview with key metrics
     * @access  Private (Admin)
     */
    getDashboard = asyncHandler(async (req, res) => {
        const dashboard = await adminDashboardService.getDashboardOverview()

        return ApiResponse.success(
            res,
            dashboard,
            'Admin dashboard retrieved successfully'
        )
    })

    /**
     * @route   GET /api/v1/dashboard/admin/user-stats
     * @desc    Get user statistics only
     * @access  Private (Admin)
     */
    getUserStats = asyncHandler(async (req, res) => {
        const stats = await adminDashboardService.getUserStats()

        return ApiResponse.success(
            res,
            stats,
            'User statistics retrieved successfully'
        )
    })

    /**
     * @route   GET /api/v1/dashboard/admin/stats
     * @desc    Get detailed system statistics
     * @access  Private (Admin)
     */
    getSystemStats = asyncHandler(async (req, res) => {
        const stats = await adminDashboardService.getSystemStats()

        return ApiResponse.success(
            res,
            stats,
            'System statistics retrieved successfully'
        )
    })

    /**
     * @route   GET /api/v1/dashboard/admin/users-analytics
     * @desc    Get user analytics (registration trends, top users, etc.)
     * @access  Private (Admin)
     */
    getUsersAnalytics = asyncHandler(async (req, res) => {
        const analytics = await adminDashboardService.getUsersAnalytics()

        return ApiResponse.success(
            res,
            analytics,
            'User analytics retrieved successfully'
        )
    })

    /**
     * @route   GET /api/v1/dashboard/admin/courses-analytics
     * @desc    Get course analytics (distribution, top courses, etc.)
     * @access  Private (Admin)
     */
    getCoursesAnalytics = asyncHandler(async (req, res) => {
        const analytics = await adminDashboardService.getCoursesAnalytics()

        return ApiResponse.success(
            res,
            analytics,
            'Course analytics retrieved successfully'
        )
    })

    /**
     * @route   GET /api/v1/dashboard/admin/revenue
     * @desc    Get revenue analytics (trends, payment methods, top courses)
     * @access  Private (Admin)
     */
    getRevenueAnalytics = asyncHandler(async (req, res) => {
        const analytics = await adminDashboardService.getRevenueAnalytics()

        return ApiResponse.success(
            res,
            analytics,
            'Revenue analytics retrieved successfully'
        )
    })

    /**
     * @route   GET /api/v1/dashboard/admin/activities
     * @desc    Get recent platform activities (orders, enrollments, users, courses)
     * @access  Private (Admin)
     */
    getRecentActivities = asyncHandler(async (req, res) => {
        const { limit } = req.query
        const limitNum = parseInt(limit) || 20

        const activities =
            await adminDashboardService.getRecentActivities(limitNum)

        return ApiResponse.success(
            res,
            activities,
            'Recent activities retrieved successfully'
        )
    })
}

export default new AdminDashboardController()
