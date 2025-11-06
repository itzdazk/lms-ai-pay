// src/controllers/course.controller.js
import courseService from '../services/course.service.js'
import ApiResponse from '../utils/response.util.js'
import { asyncHandler } from '../middlewares/error.middleware.js'

class CourseController {
    /**
     * @route   GET /api/v1/courses
     * @desc    Get all courses with filters, search, sort
     * @access  Public
     */
    getCourses = asyncHandler(async (req, res) => {
        const {
            page,
            limit,
            search,
            categoryId,
            level,
            minPrice,
            maxPrice,
            isFeatured,
            instructorId,
            sort,
        } = req.query

        const filters = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            search: search || undefined,
            categoryId: categoryId || undefined,
            level: level || undefined,
            minPrice: minPrice || undefined,
            maxPrice: maxPrice || undefined,
            isFeatured: isFeatured || undefined,
            instructorId: instructorId || undefined,
            sort: sort || 'newest', // newest, popular, rating, price_asc, price_desc
        }

        const result = await courseService.getCourses(filters)

        return ApiResponse.paginated(
            res,
            result.courses,
            {
                page: filters.page,
                limit: filters.limit,
                total: result.total,
            },
            'Courses retrieved successfully'
        )
    })

    /**
     * @route   GET /api/v1/courses/featured
     * @desc    Get featured courses
     * @access  Public
     */
    getFeaturedCourses = asyncHandler(async (req, res) => {
        const { limit } = req.query
        const limitNum = parseInt(limit) || 10

        const courses = await courseService.getFeaturedCourses(limitNum)

        return ApiResponse.success(
            res,
            courses,
            'Featured courses retrieved successfully'
        )
    })

    /**
     * @route   GET /api/v1/courses/trending
     * @desc    Get trending courses
     * @access  Public
     */
    getTrendingCourses = asyncHandler(async (req, res) => {
        const { limit } = req.query
        const limitNum = parseInt(limit) || 10

        const courses = await courseService.getTrendingCourses(limitNum)

        return ApiResponse.success(
            res,
            courses,
            'Trending courses retrieved successfully'
        )
    })

    /**
     * @route   GET /api/v1/courses/slug/:slug
     * @desc    Get course by slug
     * @access  Public
     */
    getCourseBySlug = asyncHandler(async (req, res) => {
        const { slug } = req.params

        const course = await courseService.getCourseBySlug(slug)

        return ApiResponse.success(res, course, 'Course retrieved successfully')
    })

    /**
     * @route   GET /api/v1/courses/:id
     * @desc    Get course by ID
     * @access  Public
     */
    getCourseById = asyncHandler(async (req, res) => {
        const { id } = req.params
        const courseId = parseInt(id)

        if (isNaN(courseId)) {
            return ApiResponse.badRequest(res, 'Invalid course ID')
        }

        const course = await courseService.getCourseById(courseId)

        return ApiResponse.success(res, course, 'Course retrieved successfully')
    })
}

export default new CourseController()
