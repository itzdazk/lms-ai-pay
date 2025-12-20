// src/controllers/admin-course.controller.js
import adminCourseService from '../services/admin-course.service.js'
import ApiResponse from '../utils/response.util.js'
import { asyncHandler } from '../middlewares/error.middleware.js'

class AdminCourseController {
    /**
     * @route   GET /api/v1/admin/courses
     * @desc    Get all courses with admin filters
     * @access  Private (Admin)
     */
    getAllCourses = asyncHandler(async (req, res) => {
        const {
            page,
            limit,
            search,
            status,
            categoryId,
            level,
            instructorId,
            isFeatured,
            sort,
            minPrice,
            maxPrice,
            minEnrollments,
            maxEnrollments,
            minRating,
        } = req.query

        const filters = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            search: search || undefined,
            status: status || undefined,
            categoryId: categoryId || undefined,
            level: level || undefined,
            instructorId: instructorId || undefined,
            isFeatured:
                isFeatured === 'true'
                    ? true
                    : isFeatured === 'false'
                      ? false
                      : undefined,
            sort: sort || 'newest',
            minPrice: minPrice || undefined,
            maxPrice: maxPrice || undefined,
            minEnrollments: minEnrollments || undefined,
            maxEnrollments: maxEnrollments || undefined,
            minRating: minRating || undefined,
        }

        const result = await adminCourseService.getAllCourses(filters)

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
     * @route   PATCH /api/v1/admin/courses/:id/featured
     * @desc    Toggle course featured status
     * @access  Private (Admin)
     */
    toggleCourseFeatured = asyncHandler(async (req, res) => {
        const { id } = req.params
        const { isFeatured } = req.body
        const courseId = parseInt(id)

        if (isNaN(courseId)) {
            return ApiResponse.badRequest(res, 'Invalid course ID')
        }

        if (typeof isFeatured !== 'boolean') {
            return ApiResponse.badRequest(res, 'isFeatured must be a boolean')
        }

        const course = await adminCourseService.toggleCourseFeatured(
            courseId,
            isFeatured
        )

        return ApiResponse.success(
            res,
            course,
            `Course ${isFeatured ? 'featured' : 'unfeatured'} successfully`
        )
    })

    /**
     * @route   GET /api/v1/admin/courses/analytics
     * @desc    Get comprehensive platform analytics
     * @access  Private (Admin)
     */
    getPlatformAnalytics = asyncHandler(async (req, res) => {
        const analytics = await adminCourseService.getPlatformAnalytics()

        return ApiResponse.success(
            res,
            analytics,
            'Platform analytics retrieved successfully'
        )
    })

    /**
     * Get all instructors for course filtering
     * @route   GET /api/v1/admin/courses/instructors
     * @access  Private (Admin)
     */
    getInstructorsForCourses = asyncHandler(async (req, res) => {
        const limit = parseInt(req.query.limit) || 1000
        const instructors = await adminCourseService.getInstructorsForCourses(limit)

        return ApiResponse.success(
            res,
            instructors,
            'Instructors retrieved successfully'
        )
    })
}

export default new AdminCourseController()
