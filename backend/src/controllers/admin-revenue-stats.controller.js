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

    /**
     * @route   GET /api/v1/admin/revenue/instructors
     * @desc    Get instructors revenue statistics with filters, search, sort, and pagination
     * @access  Private (Admin)
     * @query   year (optional), month (optional), search (optional), sortBy (optional), page (optional), limit (optional)
     */
    getInstructorsRevenue = asyncHandler(async (req, res) => {
        const { year, month, search, sortBy, page, limit } = req.query

        const yearNum = year ? parseInt(year) : null
        const monthNum = month ? parseInt(month) : null
        const searchStr = search || ''
        const sortByStr = sortBy === 'courseCount' ? 'courseCount' : 'revenue'
        const pageNum = page ? Math.max(1, parseInt(page)) : 1
        const limitNum = limit ? Math.max(1, Math.min(100, parseInt(limit))) : 10

        // Validate month if provided
        if (monthNum && (monthNum < 1 || monthNum > 12)) {
            return ApiResponse.error(
                res,
                'Invalid month. Month must be between 1 and 12.',
                null,
                400
            )
        }

        const result = await adminRevenueStatsService.getInstructorsRevenue(
            yearNum,
            monthNum,
            searchStr,
            sortByStr,
            pageNum,
            limitNum
        )

        return ApiResponse.success(
            res,
            result,
            'Instructors revenue statistics retrieved successfully'
        )
    })
}

export default new AdminRevenueStatsController()
