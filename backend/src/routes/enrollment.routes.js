// backend/src/routes/enrollment.routes.js
import express from 'express'
import enrollmentController from '../controllers/enrollment.controller.js'
import { authenticate } from '../middlewares/authenticate.middleware.js'
import {
    getEnrollmentsValidator,
    getEnrollmentByIdValidator,
    getActiveEnrollmentsValidator,
    getCompletedEnrollmentsValidator,
    enrollInFreeCourseValidator,
    checkEnrollmentValidator,
    enrollInCourseValidator,
} from '../validators/enrollment.validator.js'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

/**
 * @route   GET /api/v1/enrollments/active
 * @desc    Get active enrollments (currently learning)
 * @access  Private (Student/Instructor/Admin)
 * @query   limit (default: 10, max: 50)
 * @note    Must be defined BEFORE /:id to avoid route conflict
 */
router.get(
    '/active',
    getActiveEnrollmentsValidator,
    enrollmentController.getActiveEnrollments,
)

/**
 * @route   GET /api/v1/enrollments/completed
 * @desc    Get completed enrollments
 * @access  Private (Student/Instructor/Admin)
 * @query   page, limit
 * @note    Must be defined BEFORE /:id to avoid route conflict
 */
router.get(
    '/completed',
    getCompletedEnrollmentsValidator,
    enrollmentController.getCompletedEnrollments,
)

/**
 * @route   GET /api/v1/enrollments/check/:courseId
 * @desc    Check if user is enrolled in a course
 * @access  Private (Student/Instructor/Admin)
 * @note    Must be defined BEFORE /:id to avoid route conflict
 */
router.get(
    '/check/:courseId',
    checkEnrollmentValidator,
    enrollmentController.checkEnrollment,
)

/**
 * @route   GET /api/v1/enrollments
 * @desc    Get user's enrollments with filters
 * @access  Private (Student/Instructor/Admin)
 * @query   page, limit, status, search, sort
 */
router.get('/', getEnrollmentsValidator, enrollmentController.getEnrollments)

/**
 * @route   GET /api/v1/enrollments/:id
 * @desc    Get enrollment details by ID
 * @access  Private (Student/Instructor/Admin)
 */
router.get(
    '/:id',
    getEnrollmentByIdValidator,
    enrollmentController.getEnrollmentById,
)

/**
 * @route   POST /api/v1/enrollments
 * @desc    Enroll in a course (free or paid)
 * @access  Private (Student/Instructor/Admin)
 * @body    courseId (required), paymentGateway (required if paid), billingAddress (optional)
 * @note    If course is free, enrollment is created immediately
 *          If course is paid, order is created automatically and returned
 */
router.post('/', enrollInCourseValidator, enrollmentController.enrollInCourse)
export default router
