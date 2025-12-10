// src/routes/instructor-course.routes.js
import express from 'express'
import instructorCourseController from '../controllers/instructor-course.controller.js'
import { authenticate } from '../middlewares/authenticate.middleware.js'
import { isAdmin, isInstructor } from '../middlewares/role.middleware.js'
import {
    getInstructorCoursesValidator,
    getInstructorCourseByIdValidator,
    createCourseValidator,
    updateCourseValidator,
    deleteCourseValidator,
    changeCourseStatusValidator,
    uploadVideoPreviewValidator,
    getCourseAnalyticsValidator,
    addTagsToCourseValidator,
    removeTagFromCourseValidator,
} from '../validators/instructor-course.validator.js'
import { uploadThumbnail, uploadVideoPreview } from '../config/multer.config.js'

const router = express.Router()

// All routes require authentication and instructor role
router.use(authenticate)
router.use(isInstructor)

/**
 * @route   GET /api/v1/instructor/courses/statistics
 * @desc    Get course statistics for the authenticated instructor
 * @access  Private (Instructor/Admin)
 * @note    Must be defined before /:id routes to avoid conflict
 */
router.get('/statistics', instructorCourseController.getCourseStatistics)

/**
 * @route   GET /api/v1/instructor/courses
 * @desc    Get all courses of the authenticated instructor
 * @access  Private (Instructor/Admin)
 * @query   page, limit, search, status, categoryId, level, sort
 */
router.get(
    '/',
    getInstructorCoursesValidator,
    instructorCourseController.getInstructorCourses
)

/**
 * @route   POST /api/v1/instructor/courses
 * @desc    Create a new course
 * @access  Private (Instructor/Admin)
 */
router.post('/', createCourseValidator, instructorCourseController.createCourse)

/**
 * @route   GET /api/v1/instructor/courses/:id/analytics
 * @desc    Get detailed analytics for a course
 * @access  Private (Instructor/Admin)
 * @note    More specific route - MUST be defined BEFORE /:id route
 */
router.get(
    '/:id/analytics',
    getCourseAnalyticsValidator,
    instructorCourseController.getCourseAnalytics
)

/**
 * @route   GET /api/v1/instructor/courses/:id
 * @desc    Get a single course by ID with full details
 * @access  Private (Instructor/Admin)
 * @note    Must be defined AFTER /:id/analytics route
 */
router.get(
    '/:id',
    getInstructorCourseByIdValidator,
    instructorCourseController.getInstructorCourseById
)

/**
 * @route   PUT /api/v1/instructor/courses/:id
 * @desc    Update a course
 * @access  Private (Instructor/Admin)
 */
router.put(
    '/:id',
    updateCourseValidator,
    instructorCourseController.updateCourse
)

/**
 * @route   DELETE /api/v1/instructor/courses/:id
 * @desc    Delete a course
 * @access  Private (Instructor/Admin)
 */
router.delete(
    '/:id',
    deleteCourseValidator,
    instructorCourseController.deleteCourse
)

/**
 * @route   PATCH /api/v1/instructor/courses/:id/thumbnail
 * @desc    Upload course thumbnail
 * @access  Private (Instructor/Admin)
 */
router.patch(
    '/:id/thumbnail',
    uploadThumbnail,
    instructorCourseController.uploadThumbnail
)

/**
 * @route   PATCH /api/v1/instructor/courses/:id/preview
 * @desc    Upload course video preview
 * @access  Private (Instructor/Admin)
 */
router.patch(
    '/:id/preview',
    uploadVideoPreview,
    instructorCourseController.uploadVideoPreview
)

/**
 * @route   POST /api/v1/instructor/courses/:id/tags
 * @desc    Add tags to a course
 * @access  Private (Instructor/Admin)
 */
router.post(
    '/:id/tags',
    addTagsToCourseValidator,
    instructorCourseController.addTagsToCourse
)

/**
 * @route   DELETE /api/v1/instructor/courses/:id/tags/:tagId
 * @desc    Remove a tag from a course
 * @access  Private (Instructor/Admin)
 */
router.delete(
    '/:id/tags/:tagId',
    removeTagFromCourseValidator,
    instructorCourseController.removeTagFromCourse
)

/**
 * @route   PATCH /api/v1/instructor/courses/:id/status
 * @desc    Change course status (draft/published/archived)
 * @access  Private (Instructor/Admin)
 */
router.patch(
    '/:id/status',
    changeCourseStatusValidator,
    instructorCourseController.changeCourseStatus
)

export default router
