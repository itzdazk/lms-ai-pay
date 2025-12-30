// src/routes/student-dashboard.routes.js
import express from 'express'
import studentDashboardController from '../controllers/student-dashboard.controller.js'
import { authenticate } from '../middlewares/authenticate.middleware.js'
import { isStudent } from '../middlewares/role.middleware.js'

const router = express.Router()

// All student dashboard endpoints require authentication
router.use(authenticate)

/**
 * @route   GET /api/v1/dashboard/student
 * @desc    Get student dashboard overview
 * @access  Private (Student)
 */
router.get('/', isStudent, studentDashboardController.getStudentDashboard)

/**
 * @route   GET /api/v1/dashboard/student/stats
 * @desc    Get student statistics
 * @access  Private (Student)
 */
router.get('/stats', isStudent, studentDashboardController.getStudentStats)

/**
 * @route   GET /api/v1/dashboard/student/enrolled-courses
 * @desc    Get student enrolled courses with progress
 * @access  Private (Student)
 */
router.get(
    '/enrolled-courses',
    isStudent,
    studentDashboardController.getStudentEnrolledCourses
)

/**
 * @route   GET /api/v1/dashboard/student/continue-watching
 * @desc    Get continue watching lessons
 * @access  Private (Student)
 */
router.get(
    '/continue-watching',
    isStudent,
    studentDashboardController.getStudentContinueWatching
)

/**
 * @route   GET /api/v1/dashboard/student/recent-activities
 * @desc    Get recent activities timeline
 * @access  Private (Student)
 */
router.get(
    '/recent-activities',
    isStudent,
    studentDashboardController.getRecentActivities
)

/**
 * @route   GET /api/v1/dashboard/student/quiz-performance
 * @desc    Get quiz performance analytics
 * @access  Private (Student)
 */
router.get(
    '/quiz-performance',
    isStudent,
    studentDashboardController.getQuizPerformance
)

/**
 * @route   GET /api/v1/dashboard/student/study-time
 * @desc    Get study time analytics
 * @access  Private (Student)
 */
router.get(
    '/study-time',
    isStudent,
    studentDashboardController.getStudyTimeAnalytics
)

/**
 * @route   GET /api/v1/dashboard/student/recommendations
 * @desc    Get AI-powered course recommendations
 * @access  Private (Student)
 */
router.get(
    '/recommendations',
    isStudent,
    studentDashboardController.getRecommendations
)

/**
 * @route   GET /api/v1/dashboard/student/learning-streak
 * @desc    Get learning streak
 * @access  Private (Student)
 */
router.get(
    '/learning-streak',
    isStudent,
    studentDashboardController.getLearningStreak
)

/**
 * @route   GET /api/v1/dashboard/student/calendar-heatmap
 * @desc    Get calendar heatmap
 * @access  Private (Student)
 */
router.get(
    '/calendar-heatmap',
    isStudent,
    studentDashboardController.getCalendarHeatmap
)

/**
 * @route   GET /api/v1/dashboard/student/certificates
 * @desc    Get certificates
 * @access  Private (Student)
 */
router.get(
    '/certificates',
    isStudent,
    studentDashboardController.getCertificates
)

/**
 * @route   GET /api/v1/dashboard/student/goals
 * @desc    Get learning goals
 * @access  Private (Student)
 */
router.get('/goals', isStudent, studentDashboardController.getLearningGoals)

/**
 * @route   POST /api/v1/dashboard/student/goals
 * @desc    Create learning goal
 * @access  Private (Student)
 */
router.post('/goals', isStudent, studentDashboardController.createLearningGoal)

/**
 * @route   PUT /api/v1/dashboard/student/goals/:id
 * @desc    Update learning goal
 * @access  Private (Student)
 */
router.put(
    '/goals/:id',
    isStudent,
    studentDashboardController.updateLearningGoal
)

/**
 * @route   DELETE /api/v1/dashboard/student/goals/:id
 * @desc    Delete learning goal
 * @access  Private (Student)
 */
router.delete(
    '/goals/:id',
    isStudent,
    studentDashboardController.deleteLearningGoal
)

/**
 * @route   GET /api/v1/dashboard/student/bookmarks
 * @desc    Get bookmarks
 * @access  Private (Student)
 */
router.get('/bookmarks', isStudent, studentDashboardController.getBookmarks)

/**
 * @route   POST /api/v1/dashboard/student/bookmarks
 * @desc    Create bookmark
 * @access  Private (Student)
 */
router.post('/bookmarks', isStudent, studentDashboardController.createBookmark)

/**
 * @route   DELETE /api/v1/dashboard/student/bookmarks/:id
 * @desc    Delete bookmark
 * @access  Private (Student)
 */
router.delete(
    '/bookmarks/:id',
    isStudent,
    studentDashboardController.deleteBookmark
)

/**
 * @route   GET /api/v1/dashboard/student/notes-summary
 * @desc    Get notes summary
 * @access  Private (Student)
 */
router.get(
    '/notes-summary',
    isStudent,
    studentDashboardController.getNotesSummary
)

/**
 * @route   GET /api/v1/dashboard/student/courses/:courseId/progress-detail
 * @desc    Get course progress detail
 * @access  Private (Student)
 */
router.get(
    '/courses/:courseId/progress-detail',
    isStudent,
    studentDashboardController.getCourseProgressDetail
)

export default router
