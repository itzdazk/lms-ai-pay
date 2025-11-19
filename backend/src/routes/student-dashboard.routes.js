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

export default router


