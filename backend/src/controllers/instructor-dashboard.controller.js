// src/controllers/instructor-dashboard.controller.js
import { asyncHandler } from '../middlewares/error.middleware.js'
import ApiResponse from '../utils/response.util.js'
import instructorDashboardService from '../services/instructor-dashboard.service.js'
import { USER_ROLES } from '../config/constants.js'

class InstructorDashboardController {
    /**
     * @route   GET /api/v1/dashboard/instructor
     * @desc    Get instructor dashboard overview
     * @access  Private (Instructor, Admin)
     */
    getInstructorDashboard = asyncHandler(async (req, res) => {
        const instructorId = req.user.id

        // Admin can view any instructor's dashboard by passing instructorId in query
        const targetInstructorId =
            req.user.role === USER_ROLES.ADMIN && req.query.instructorId
                ? parseInt(req.query.instructorId)
                : instructorId

        const dashboard =
            await instructorDashboardService.getInstructorDashboard(
                targetInstructorId
            )

        return ApiResponse.success(
            res,
            dashboard,
            'Instructor dashboard retrieved successfully'
        )
    })

    /**
     * @route   GET /api/v1/dashboard/instructor/stats
     * @desc    Get instructor statistics
     * @access  Private (Instructor, Admin)
     */
    getInstructorStats = asyncHandler(async (req, res) => {
        const instructorId = req.user.id

        // Admin can view any instructor's stats by passing instructorId in query
        const targetInstructorId =
            req.user.role === USER_ROLES.ADMIN && req.query.instructorId
                ? parseInt(req.query.instructorId)
                : instructorId

        const stats =
            await instructorDashboardService.getInstructorStats(
                targetInstructorId
            )

        return ApiResponse.success(
            res,
            stats,
            'Instructor statistics retrieved successfully'
        )
    })

    /**
     * @route   GET /api/v1/dashboard/instructor/revenue
     * @desc    Get instructor revenue data
     * @access  Private (Instructor, Admin)
     */
    getInstructorRevenue = asyncHandler(async (req, res) => {
        const instructorId = req.user.id
        const period = req.query.period || 'month' // day, week, month, year

        // Admin can view any instructor's revenue by passing instructorId in query
        const targetInstructorId =
            req.user.role === USER_ROLES.ADMIN && req.query.instructorId
                ? parseInt(req.query.instructorId)
                : instructorId

        const revenue = await instructorDashboardService.getInstructorRevenue(
            targetInstructorId,
            { period }
        )

        return ApiResponse.success(
            res,
            revenue,
            'Instructor revenue retrieved successfully'
        )
    })

    /**
     * @route   GET /api/v1/dashboard/instructor/analytics
     * @desc    Get instructor analytics
     * @access  Private (Instructor, Admin)
     */
    getInstructorAnalytics = asyncHandler(async (req, res) => {
        const instructorId = req.user.id

        // Admin can view any instructor's analytics by passing instructorId in query
        const targetInstructorId =
            req.user.role === USER_ROLES.ADMIN && req.query.instructorId
                ? parseInt(req.query.instructorId)
                : instructorId

        const analytics =
            await instructorDashboardService.getInstructorAnalytics(
                targetInstructorId
            )

        return ApiResponse.success(
            res,
            analytics,
            'Instructor analytics retrieved successfully'
        )
    })

    /**
     * @route   GET /api/v1/dashboard/instructor/orders
     * @desc    Get instructor orders (orders for their courses)
     * @access  Private (Instructor, Admin)
     */
    getInstructorOrders = asyncHandler(async (req, res) => {
        const instructorId = req.user.id
        const {
            page,
            limit,
            search,
            paymentStatus,
            paymentGateway,
            courseId,
            startDate,
            endDate,
            sort,
        } = req.query

        // Admin can view any instructor's orders by passing instructorId in query
        const targetInstructorId =
            req.user.role === USER_ROLES.ADMIN && req.query.instructorId
                ? parseInt(req.query.instructorId)
                : instructorId

        const filters = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            search: search || undefined,
            paymentStatus: paymentStatus || undefined,
            paymentGateway: paymentGateway || undefined,
            courseId: courseId || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            sort: sort || 'newest',
        }

        const result = await instructorDashboardService.getInstructorOrders(
            targetInstructorId,
            filters
        )

        return ApiResponse.paginated(
            res,
            result.orders,
            {
                page: filters.page,
                limit: filters.limit,
                total: result.total,
            },
            'Instructor orders retrieved successfully'
        )
    })

    /**
     * @route   GET /api/v1/dashboard/instructor/enrollments
     * @desc    Get instructor enrollments (enrollments for their courses)
     * @access  Private (Instructor, Admin)
     */
    getInstructorEnrollments = asyncHandler(async (req, res) => {
        const instructorId = req.user.id
        const {
            page,
            limit,
            search,
            courseId,
            status,
            startDate,
            endDate,
            sort,
        } = req.query

        // Admin can view any instructor's enrollments by passing instructorId in query
        const targetInstructorId =
            req.user.role === USER_ROLES.ADMIN && req.query.instructorId
                ? parseInt(req.query.instructorId)
                : instructorId

        const filters = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            search: search || undefined,
            courseId: courseId || undefined,
            status: status || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            sort: sort || 'newest',
        }

        const result =
            await instructorDashboardService.getInstructorEnrollments(
                targetInstructorId,
                filters
            )

        return ApiResponse.paginated(
            res,
            result.enrollments,
            {
                page: filters.page,
                limit: filters.limit,
                total: result.total,
            },
            'Instructor enrollments retrieved successfully'
        )
    })

    /**
     * @route   GET /api/v1/dashboard/instructor/students
     * @desc    Get instructor students list
     * @access  Private (Instructor, Admin)
     */
    getInstructorStudents = asyncHandler(async (req, res) => {
        const instructorId = req.user.id
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 20
        const search = req.query.search || ''

        // Admin can view any instructor's students by passing instructorId in query
        const targetInstructorId =
            req.user.role === USER_ROLES.ADMIN && req.query.instructorId
                ? parseInt(req.query.instructorId)
                : instructorId

        const result = await instructorDashboardService.getInstructorStudents(
            targetInstructorId,
            { page, limit, search }
        )

        return ApiResponse.success(
            res,
            result,
            'Instructor students retrieved successfully'
        )
    })
}

export default new InstructorDashboardController()
