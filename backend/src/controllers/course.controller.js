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
}

export default new CourseController()
