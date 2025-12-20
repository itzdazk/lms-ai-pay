// src/routes/course.routes.js
import express from 'express'
import courseController from '../controllers/course.controller.js'
import lessonsController from '../controllers/lessons.controller.js'
import {
    getCoursesValidator,
    getLimitValidator,
    getCourseByIdValidator,
    getCourseBySlugValidator,
} from '../validators/course.validator.js'
import { authenticate } from '../middlewares/authenticate.middleware.js'
import { isEnrolledOrInstructorOrAdmin } from '../middlewares/role.middleware.js'

const router = express.Router()

/**
 * @route   GET /api/v1/courses
 * @desc    Get all courses with filters, search, sort
 * @access  Public
 * @query   Các query parameters được hỗ trợ:
 *          - page: Trang hiện tại (default: 1)
 *          - limit: Số lượng items mỗi trang (default: 20, max: 100)
 *          - search: Từ khóa tìm kiếm trong title, description
 *          - categoryId: Lọc theo category ID
 *          - level: Lọc theo level (BEGINNER|INTERMEDIATE|ADVANCED)
 *          - minPrice: Giá tối thiểu
 *          - maxPrice: Giá tối đa
 *          - isFeatured: Lọc khóa học nổi bật (true|false)
 *          - instructorId: Lọc theo instructor ID
 *          - tagId: Lọc theo tag ID
 *          - sort: Sắp xếp (newest|popular|rating|price_asc|price_desc)
 * @example /api/v1/courses?search=javascript&level=BEGINNER&tagId=5&sort=rating&page=1&limit=20
 */
router.get('/', getCoursesValidator, courseController.getCourses)

/**
 * @route   GET /api/v1/courses/featured
 * @desc    Get featured courses
 * @access  Public
 * @query   limit (default: 10, max: 50)
 */
router.get('/featured', getLimitValidator, courseController.getFeaturedCourses)

/**
 * @route   GET /api/v1/courses/trending
 * @desc    Get trending courses (based on recent enrollments and views)
 * @access  Public
 * @query   limit (default: 10, max: 50)
 */
router.get('/trending', getLimitValidator, courseController.getTrendingCourses)

/**
 * @route   GET /api/v1/courses/levels/counts
 * @desc    Get course counts by level
 * @access  Public
 */
router.get(
    '/levels/counts',
    courseController.getCourseCountsByLevel
)

/**
 * @route   GET /api/v1/courses/prices/counts
 * @desc    Get course counts by price type
 * @access  Public
 */
router.get(
    '/prices/counts',
    courseController.getCourseCountsByPrice
)

/**
 * @route   GET /api/v1/courses/slug/:slug
 * @desc    Get course details by slug
 * @access  Public
 */
router.get(
    '/slug/:slug',
    getCourseBySlugValidator,
    courseController.getCourseBySlug
)

/**
 * @route   GET /api/v1/courses/:id
 * @desc    Get course details by ID
 * @access  Public
 */
router.get('/:id', getCourseByIdValidator, courseController.getCourseById)

/**
 * @route   GET /api/v1/courses/:id/lessons
 * @desc    Get course lessons (preview only for non-enrolled users)
 * @access  Public
 */
router.get(
    '/:id/lessons',
    getCourseByIdValidator,
    courseController.getCourseLessons
)

/**
 * @route   GET /api/v1/courses/:id/instructor
 * @desc    Get course instructor details
 * @access  Public
 */
router.get(
    '/:id/instructor',
    getCourseByIdValidator,
    courseController.getCourseInstructor
)

/**
 * @route   POST /api/v1/courses/:id/view
 * @desc    Increment course view count
 * @access  Public
 */
router.post(
    '/:id/view',
    getCourseByIdValidator,
    courseController.incrementViewCount
)

/**
 * @route   GET /api/v1/courses/:slug/lessons/:lessonSlug
 * @desc    Get lesson by slug
 * @access  Private (enrolled users, course instructor, admin)
 */
router.get(
    '/slug/:slug/lessons/:lessonSlug',
    getCourseBySlugValidator,
    authenticate,
    isEnrolledOrInstructorOrAdmin(null, 'slug', 'lessonSlug'),
    lessonsController.getLessonBySlug
)

export default router
