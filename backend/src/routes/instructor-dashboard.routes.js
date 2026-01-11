// src/routes/instructor-dashboard.routes.js
import express from 'express'
import instructorDashboardController from '../controllers/instructor-dashboard.controller.js'
import { authenticate } from '../middlewares/authenticate.middleware.js'
import { isInstructor } from '../middlewares/role.middleware.js'

const router = express.Router()

// All instructor dashboard endpoints require authentication
router.use(authenticate)

/**
 * @route   GET /api/v1/dashboard/instructor
 * @desc    Get instructor dashboard overview
 * @access  Private (Instructor, Admin)
 */
router.get(
    '/',
    isInstructor,
    instructorDashboardController.getInstructorDashboard
)

/**
 * @route   GET /api/v1/dashboard/instructor/stats
 * @desc    Get instructor statistics
 * @access  Private (Instructor, Admin)
 */
router.get(
    '/stats',
    isInstructor,
    instructorDashboardController.getInstructorStats
)

/**
 * @route   GET /api/v1/dashboard/instructor/revenue
 * @desc    Get instructor revenue data
 * @access  Private (Instructor, Admin)
 */
router.get(
    '/revenue',
    isInstructor,
    instructorDashboardController.getInstructorRevenue
)

/**
 * @route   GET /api/v1/dashboard/instructor/analytics
 * @desc    Get instructor analytics
 * @access  Private (Instructor, Admin)
 */
router.get(
    '/analytics',
    isInstructor,
    instructorDashboardController.getInstructorAnalytics
)

/**
 * @route   GET /api/v1/dashboard/instructor/orders
 * @desc    Get instructor orders (orders for their courses)
 * @access  Private (Instructor, Admin)
 */
router.get(
    '/orders',
    isInstructor,
    instructorDashboardController.getInstructorOrders
)

/**
 * @route   GET /api/v1/dashboard/instructor/revenue/orders
 * @desc    Get instructor revenue orders (paid orders for revenue report)
 * @access  Private (Instructor, Admin)
 */
router.get(
    '/revenue/orders',
    isInstructor,
    instructorDashboardController.getInstructorRevenueOrders
)

/**
 * @route   GET /api/v1/dashboard/instructor/revenue/chart
 * @desc    Get instructor revenue chart data (grouped by month or day)
 * @access  Private (Instructor, Admin)
 */
router.get(
    '/revenue/chart',
    isInstructor,
    instructorDashboardController.getInstructorRevenueChartData
)

/**
 * @route   GET /api/v1/dashboard/instructor/enrollments
 * @desc    Get instructor enrollments (enrollments for their courses)
 * @access  Private (Instructor, Admin)
 */
router.get(
    '/enrollments',
    isInstructor,
    instructorDashboardController.getInstructorEnrollments
)

/**
 * @route   GET /api/v1/dashboard/instructor/students
 * @desc    Get instructor students list
 * @access  Private (Instructor, Admin)
 */
router.get(
    '/students',
    isInstructor,
    instructorDashboardController.getInstructorStudents
)

export default router
