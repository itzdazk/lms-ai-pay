// src/controllers/student-dashboard.controller.js
import { asyncHandler } from '../middlewares/error.middleware.js'
import ApiResponse from '../utils/response.util.js'
import studentDashboardService from '../services/student-dashboard.service.js'

class StudentDashboardController {
    /**
     * @route   GET /api/v1/dashboard/student
     * @desc    Get student dashboard overview
     * @access  Private (Student)
     */
    getStudentDashboard = asyncHandler(async (req, res) => {
        const userId = req.user.id

        const dashboard = await studentDashboardService.getStudentDashboard(userId)

        return ApiResponse.success(
            res,
            dashboard,
            'Student dashboard retrieved successfully'
        )
    })

    /**
     * @route   GET /api/v1/dashboard/student/stats
     * @desc    Get student statistics
     * @access  Private (Student)
     */
    getStudentStats = asyncHandler(async (req, res) => {
        const userId = req.user.id

        const stats = await studentDashboardService.getStudentStats(userId)

        return ApiResponse.success(
            res,
            stats,
            'Student statistics retrieved successfully'
        )
    })

    /**
     * @route   GET /api/v1/dashboard/student/enrolled-courses
     * @desc    Get student enrolled courses with progress
     * @access  Private (Student)
     */
    getStudentEnrolledCourses = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const limit = parseInt(req.query.limit) || 10

        const enrolledCourses = await studentDashboardService.getStudentEnrolledCourses(
            userId,
            limit
        )

        return ApiResponse.success(
            res,
            enrolledCourses,
            'Enrolled courses retrieved successfully'
        )
    })

    /**
     * @route   GET /api/v1/dashboard/student/continue-watching
     * @desc    Get continue watching lessons
     * @access  Private (Student)
     */
    getStudentContinueWatching = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const limit = parseInt(req.query.limit) || 10

        const continueWatching =
            await studentDashboardService.getStudentContinueWatching(userId, limit)

        return ApiResponse.success(
            res,
            continueWatching,
            'Continue watching lessons retrieved successfully'
        )
    })
}

export default new StudentDashboardController()


