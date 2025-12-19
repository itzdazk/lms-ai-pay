// src/routes/admin-course.routes.js
import express from 'express'
import adminCourseController from '../controllers/admin-course.controller.js'
import { authenticate } from '../middlewares/authenticate.middleware.js'
import { isAdmin } from '../middlewares/role.middleware.js'
import {
    getAllCoursesValidator,
    toggleCourseFeaturedValidator,
} from '../validators/admin-course.validator.js'

const router = express.Router()

// All routes require authentication and admin role
router.use(authenticate)
router.use(isAdmin)

/**
 * @route   GET /api/v1/admin/courses/analytics
 * @desc    Get comprehensive platform analytics
 * @access  Private (Admin)
 * @note    Must be defined before /:id routes to avoid conflict
 */
router.get('/analytics', adminCourseController.getPlatformAnalytics)

/**
 * @route   GET /api/v1/admin/courses/instructors
 * @desc    Get all instructors for course filtering (admin only)
 * @access  Private (Admin)
 * @query   limit (max 1000 for filtering)
 */
router.get('/instructors', adminCourseController.getInstructorsForCourses)

/**
 * @route   GET /api/v1/admin/courses
 * @desc    Get all courses with admin filters
 * @access  Private (Admin)
 * @query   page, limit, search, status, categoryId, level, instructorId, isFeatured, sort, minPrice, maxPrice, minEnrollments, maxEnrollments, minRating
 */
router.get('/', getAllCoursesValidator, adminCourseController.getAllCourses)

/**
 * @route   PATCH /api/v1/admin/courses/:id/featured
 * @desc    Toggle course featured status
 * @access  Private (Admin)
 */
router.patch(
    '/:id/featured',
    toggleCourseFeaturedValidator,
    adminCourseController.toggleCourseFeatured
)

export default router
