// backend/src/controllers/admin-revenue-stats.controller.js
import adminRevenueStatsService from '../services/admin-revenue-stats.service.js'
import ApiResponse from '../utils/response.util.js'
import { asyncHandler } from '../middlewares/error.middleware.js'

class AdminRevenueStatsController {
    /**
     * @route   GET /api/v1/admin/revenue/stats
     * @desc    Get revenue statistics by year and month
     * @access  Private (Admin)
     * @query   year (optional), month (optional)
     */
    getRevenueStats = asyncHandler(async (req, res) => {
        const { year, month } = req.query

        const yearNum = year ? parseInt(year) : null
        const monthNum = month ? parseInt(month) : null

        // Validate month if provided
        if (monthNum && (monthNum < 1 || monthNum > 12)) {
            return ApiResponse.error(
                res,
                'Invalid month. Month must be between 1 and 12.',
                null,
                400
            )
        }

        const stats = await adminRevenueStatsService.getRevenueStats(yearNum, monthNum)

        return ApiResponse.success(
            res,
            stats,
            'Revenue statistics retrieved successfully'
        )
    })
}

export default new AdminRevenueStatsController()
