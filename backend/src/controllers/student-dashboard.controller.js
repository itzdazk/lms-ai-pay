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

        const dashboard =
            await studentDashboardService.getStudentDashboard(userId)

        return ApiResponse.success(
            res,
            dashboard,
            'Truy xuất bảng điều khiển học viên thành công'
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
            'Truy xuất thống kê học viên thành công'
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

        const enrolledCourses =
            await studentDashboardService.getStudentEnrolledCourses(
                userId,
                limit
            )

        return ApiResponse.success(
            res,
            enrolledCourses,
            'Truy xuất khóa học đã đăng ký thành công'
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
            await studentDashboardService.getStudentContinueWatching(
                userId,
                limit
            )

        return ApiResponse.success(
            res,
            continueWatching,
            'Truy xuất danh sách bài học đang xem thành công'
        )
    })

    /**
     * @route   GET /api/v1/dashboard/student/recent-activities
     * @desc    Get recent activities timeline
     * @access  Private (Student)
     */
    getRecentActivities = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const limit = parseInt(req.query.limit) || 10
        const type = req.query.type // ENROLLMENT, LESSON_COMPLETED, QUIZ_SUBMITTED
        const dateFrom = req.query.dateFrom

        const result = await studentDashboardService.getRecentActivities(
            userId,
            {
                limit,
                type,
                dateFrom,
            }
        )

        return ApiResponse.success(
            res,
            result.activities,
            'Truy xuất hoạt động gần đây thành công',
            undefined,
            result.meta
        )
    })

    /**
     * @route   GET /api/v1/dashboard/student/quiz-performance
     * @desc    Get quiz performance analytics
     * @access  Private (Student)
     */
    getQuizPerformance = asyncHandler(async (req, res) => {
        const userId = req.user.id

        const performance =
            await studentDashboardService.getQuizPerformance(userId)

        return ApiResponse.success(
            res,
            performance,
            'Truy xuất thành tích bài trắc nghiệm thành công'
        )
    })

    /**
     * @route   GET /api/v1/dashboard/student/study-time
     * @desc    Get study time analytics
     * @access  Private (Student)
     */
    getStudyTimeAnalytics = asyncHandler(async (req, res) => {
        const userId = req.user.id

        const analytics =
            await studentDashboardService.getStudyTimeAnalytics(userId)

        return ApiResponse.success(
            res,
            analytics,
            'Truy xuất phân tích thời gian học thành công'
        )
    })

    /**
     * @route   GET /api/v1/dashboard/student/recommendations
     * @desc    Get AI-powered course recommendations
     * @access  Private (Student)
     */
    getRecommendations = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const limit = parseInt(req.query.limit) || 10

        const recommendations =
            await studentDashboardService.getRecommendations(userId, { limit })

        return ApiResponse.success(
            res,
            recommendations,
            'Truy xuất đề xuất khóa học thành công'
        )
    })

    /**
     * @route   GET /api/v1/dashboard/student/learning-streak
     * @desc    Get learning streak
     * @access  Private (Student)
     */
    getLearningStreak = asyncHandler(async (req, res) => {
        const userId = req.user.id

        const streak = await studentDashboardService.getLearningStreak(userId)

        return ApiResponse.success(
            res,
            streak,
            'Truy xuất đề xuất học liên tục thành công'
        )
    })

    /**
     * @route   GET /api/v1/dashboard/student/calendar-heatmap
     * @desc    Get calendar heatmap
     * @access  Private (Student)
     */
    getCalendarHeatmap = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const year = parseInt(req.query.year)
        const month = parseInt(req.query.month)

        const heatmap = await studentDashboardService.getCalendarHeatmap(
            userId,
            year,
            month
        )

        return ApiResponse.success(
            res,
            heatmap,
            'Truy xuất bản đồ lịch thành công'
        )
    })

    /**
     * @route   GET /api/v1/dashboard/student/certificates
     * @desc    Get certificates
     * @access  Private (Student)
     */
    getCertificates = asyncHandler(async (req, res) => {
        const userId = req.user.id

        const certificates =
            await studentDashboardService.getCertificates(userId)

        return ApiResponse.success(
            res,
            certificates,
            'Truy xuất chứng chỉ thành công'
        )
    })

    /**
     * @route   GET /api/v1/dashboard/student/goals
     * @desc    Get learning goals
     * @access  Private (Student)
     */
    getLearningGoals = asyncHandler(async (req, res) => {
        const userId = req.user.id

        const goals = await studentDashboardService.getLearningGoals(userId)

        return ApiResponse.success(
            res,
            goals,
            'Truy xuất mục tiêu học tập thành công'
        )
    })

    /**
     * @route   POST /api/v1/dashboard/student/goals
     * @desc    Create learning goal
     * @access  Private (Student)
     */
    createLearningGoal = asyncHandler(async (req, res) => {
        const userId = req.user.id

        const goal = await studentDashboardService.createLearningGoal(
            userId,
            req.body
        )

        return ApiResponse.success(
            res,
            goal,
            'Mục tiêu học tập đã được tạo thành công',
            201
        )
    })

    /**
     * @route   PUT /api/v1/dashboard/student/goals/:id
     * @desc    Update learning goal
     * @access  Private (Student)
     */
    updateLearningGoal = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const goalId = parseInt(req.params.id)

        const goal = await studentDashboardService.updateLearningGoal(
            userId,
            goalId,
            req.body
        )

        return ApiResponse.success(
            res,
            goal,
            'Mục tiêu học tập đã được cập nhật thành công'
        )
    })

    /**
     * @route   DELETE /api/v1/dashboard/student/goals/:id
     * @desc    Delete learning goal
     * @access  Private (Student)
     */
    deleteLearningGoal = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const goalId = parseInt(req.params.id)

        await studentDashboardService.deleteLearningGoal(userId, goalId)

        return ApiResponse.success(
            res,
            null,
            'Mục tiêu học tập đã bị xóa thành công',
            204
        )
    })

    /**
     * @route   GET /api/v1/dashboard/student/bookmarks
     * @desc    Get bookmarks
     * @access  Private (Student)
     */
    getBookmarks = asyncHandler(async (req, res) => {
        const userId = req.user.id

        const bookmarks = await studentDashboardService.getBookmarks(userId)

        return ApiResponse.success(
            res,
            bookmarks,
            'Truy xuất đánh dấu thành công'
        )
    })

    /**
     * @route   POST /api/v1/dashboard/student/bookmarks
     * @desc    Create bookmark
     * @access  Private (Student)
     */
    createBookmark = asyncHandler(async (req, res) => {
        const userId = req.user.id

        const bookmark = await studentDashboardService.createBookmark(
            userId,
            req.body
        )

        return ApiResponse.success(
            res,
            bookmark,
            'Đánh dấu đã được tạo thành công',
            201
        )
    })

    /**
     * @route   DELETE /api/v1/dashboard/student/bookmarks/:id
     * @desc    Delete bookmark
     * @access  Private (Student)
     */
    deleteBookmark = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const bookmarkId = parseInt(req.params.id)

        await studentDashboardService.deleteBookmark(userId, bookmarkId)

        return ApiResponse.success(
            res,
            null,
            'Đánh dấu đã bị xóa thành công',
            204
        )
    })

    /**
     * @route   GET /api/v1/dashboard/student/notes-summary
     * @desc    Get notes summary
     * @access  Private (Student)
     */
    getNotesSummary = asyncHandler(async (req, res) => {
        const userId = req.user.id

        const summary = await studentDashboardService.getNotesSummary(userId)

        return ApiResponse.success(
            res,
            summary,
            'Truy xuất tóm tắt ghi chú thành công'
        )
    })

    /**
     * @route   GET /api/v1/dashboard/student/courses/:courseId/progress-detail
     * @desc    Get course progress detail
     * @access  Private (Student)
     */
    getCourseProgressDetail = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const courseId = parseInt(req.params.courseId)

        const detail = await studentDashboardService.getCourseProgressDetail(
            userId,
            courseId
        )

        return ApiResponse.success(
            res,
            detail,
            'Truy xuất chi tiết tiến độ khóa học thành công'
        )
    })
}

export default new StudentDashboardController()
