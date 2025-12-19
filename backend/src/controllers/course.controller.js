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
            tagId,
            tagIds,
        } = req.query

        // Support both tagId (single) and tagIds (array) for backward compatibility
        let tagIdsArray = undefined
        if (tagIds) {
            // Handle comma-separated string or array
            if (Array.isArray(tagIds)) {
                tagIdsArray = tagIds.map((id) => parseInt(id)).filter((id) => !isNaN(id))
            } else if (typeof tagIds === 'string') {
                tagIdsArray = tagIds
                    .split(',')
                    .map((id) => parseInt(id.trim()))
                    .filter((id) => !isNaN(id))
            }
        } else if (tagId) {
            // Legacy support: single tagId
            tagIdsArray = [parseInt(tagId)]
        }

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
            sort: sort || 'newest',
            tagId: tagId || undefined, // Legacy
            tagIds: tagIdsArray,
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

    /**
     * @route   GET /api/v1/courses/:id/lessons
     * @desc    Get course lessons
     * @access  Public
     */
    getCourseLessons = asyncHandler(async (req, res) => {
        const { id } = req.params
        const courseId = parseInt(id)

        if (isNaN(courseId)) {
            return ApiResponse.badRequest(res, 'Invalid course ID')
        }

        const result = await courseService.getCourseLessons(courseId)

        return ApiResponse.success(
            res,
            result,
            'Course lessons retrieved successfully'
        )
    })

    /**
     * @route   GET /api/v1/courses/:id/instructor
     * @desc    Get course instructor details
     * @access  Public
     */
    getCourseInstructor = asyncHandler(async (req, res) => {
        const { id } = req.params
        const courseId = parseInt(id)

        if (isNaN(courseId)) {
            return ApiResponse.badRequest(res, 'Invalid course ID')
        }

        const instructor = await courseService.getCourseInstructor(courseId)

        return ApiResponse.success(
            res,
            instructor,
            'Instructor details retrieved successfully'
        )
    })

    /**
     * @route   POST /api/v1/courses/:id/view
     * @desc    Increment course view count
     * @access  Public
     */
    incrementViewCount = asyncHandler(async (req, res) => {
        const { id } = req.params
        const courseId = parseInt(id)

        if (isNaN(courseId)) {
            return ApiResponse.badRequest(res, 'Invalid course ID')
        }

        const result = await courseService.incrementViewCount(courseId)

        return ApiResponse.success(
            res,
            result,
            'View count updated successfully'
        )
    })

    /**
     * @route   GET /api/v1/courses/levels/counts
     * @desc    Get course counts by level
     * @access  Public
     */
    getCourseCountsByLevel = asyncHandler(async (req, res) => {
        const counts = await courseService.getCourseCountsByLevel()

        return ApiResponse.success(
            res,
            counts,
            'Course counts by level retrieved successfully'
        )
    })

    /**
     * @route   GET /api/v1/courses/prices/counts
     * @desc    Get course counts by price type
     * @access  Public
     */
    getCourseCountsByPrice = asyncHandler(async (req, res) => {
        const counts = await courseService.getCourseCountsByPrice()

        return ApiResponse.success(
            res,
            counts,
            'Course counts by price retrieved successfully'
        )
    })
}

export default new CourseController()
