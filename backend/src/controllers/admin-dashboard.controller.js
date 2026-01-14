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
            'Truy xuất bảng điều khiển admin thành công'
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
            'Truy xuất thống kê người dùng thành công'
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
            'Truy xuất thống kê hệ thống chi tiết thành công'
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
            'Truy xuất phân tích người dùng thành công'
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
            'Truy xuất phân tích khóa học thành công'
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
            'Truy xuất phân tích doanh thu thành công'
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
            'Truy xuất hoạt động gần đây thành công'
        )
    })
}

export default new AdminDashboardController()
