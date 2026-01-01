// src/controllers/instructor-course.controller.js
import instructorCourseService from '../services/instructor-course.service.js'
import ApiResponse from '../utils/response.util.js'
import { asyncHandler } from '../middlewares/error.middleware.js'

class InstructorCourseController {
    /**
     * @route   GET /api/v1/instructor/courses
     * @desc    Get all courses of the authenticated instructor
     * @access  Private (Instructor/Admin)
     */
    getInstructorCourses = asyncHandler(async (req, res) => {
        const instructorId = req.user.id
        const { page, limit, search, status, categoryId, level, sort } =
            req.query

        const filters = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            search: search || undefined,
            status: status || undefined,
            categoryId: categoryId || undefined,
            level: level || undefined,
            sort: sort || 'newest',
        }

        const result = await instructorCourseService.getInstructorCourses(
            instructorId,
            filters
        )

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
     * @route   GET /api/v1/instructor/courses/:id
     * @desc    Get a single course by ID with full details
     * @access  Private (Instructor/Admin)
     */
    getInstructorCourseById = asyncHandler(async (req, res) => {
        const { id } = req.params
        const instructorId = req.user.id
        const isAdmin = req.user.role === 'ADMIN'
        const courseId = parseInt(id)

        if (isNaN(courseId)) {
            return ApiResponse.badRequest(res, 'Invalid course ID')
        }

        const course = await instructorCourseService.getInstructorCourseById(
            courseId,
            instructorId,
            isAdmin
        )

        return ApiResponse.success(res, course, 'Course retrieved successfully')
    })

    /**
     * @route   POST /api/v1/instructor/courses
     * @desc    Create a new course
     * @access  Private (Instructor/Admin)
     */
    createCourse = asyncHandler(async (req, res) => {
        const instructorId = req.user.id
        const courseData = req.body

        const course = await instructorCourseService.createCourse(
            instructorId,
            courseData
        )

        return ApiResponse.created(res, course, 'Course created successfully')
    })

    /**
     * @route   PUT /api/v1/instructor/courses/:id
     * @desc    Update a course
     * @access  Private (Instructor/Admin)
     */
    updateCourse = asyncHandler(async (req, res) => {
        const { id } = req.params
        const instructorId = req.user.id
        const isAdmin = req.user.role === 'ADMIN'
        const courseId = parseInt(id)

        if (isNaN(courseId)) {
            return ApiResponse.badRequest(res, 'Invalid course ID')
        }

        const updateData = req.body

        const course = await instructorCourseService.updateCourse(
            courseId,
            instructorId,
            updateData,
            isAdmin
        )

        return ApiResponse.success(res, course, 'Course updated successfully')
    })

    /**
     * @route   DELETE /api/v1/instructor/courses/:id
     * @desc    Delete a course
     * @access  Private (Instructor/Admin)
     */
    deleteCourse = asyncHandler(async (req, res) => {
        const { id } = req.params
        const instructorId = req.user.id
        const isAdmin = req.user.role === 'ADMIN'
        const courseId = parseInt(id)

        if (isNaN(courseId)) {
            return ApiResponse.badRequest(res, 'Invalid course ID')
        }

        await instructorCourseService.deleteCourse(courseId, instructorId, isAdmin)

        return ApiResponse.success(res, null, 'Course deleted successfully')
    })

    /**
     * @route   PATCH /api/v1/instructor/courses/:id/status
     * @desc    Change course status (draft/published/archived)
     * @access  Private (Instructor/Admin)
     */
    changeCourseStatus = asyncHandler(async (req, res) => {
        const { id } = req.params
        const { status } = req.body
        const instructorId = req.user.id
        const isAdmin = req.user.role === 'ADMIN'
        const courseId = parseInt(id)

        if (isNaN(courseId)) {
            return ApiResponse.badRequest(res, 'Invalid course ID')
        }

        if (!status) {
            return ApiResponse.badRequest(res, 'Status is required')
        }

        const course = await instructorCourseService.changeCourseStatus(
            courseId,
            instructorId,
            status,
            isAdmin
        )

        return ApiResponse.success(
            res,
            course,
            `Course status changed to ${status} successfully`
        )
    })

    /**
     * @route   GET /api/v1/instructor/courses/statistics
     * @desc    Get course statistics for the authenticated instructor
     * @access  Private (Instructor/Admin)
     */
    getCourseStatistics = asyncHandler(async (req, res) => {
        const instructorId = req.user.id

        const statistics =
            await instructorCourseService.getCourseStatistics(instructorId)

        return ApiResponse.success(
            res,
            statistics,
            'Course statistics retrieved successfully'
        )
    })

    /**
     * @route   PATCH /api/v1/instructor/courses/:id/thumbnail
     * @desc    Upload course thumbnail
     * @access  Private (Instructor/Admin)
     */
    uploadThumbnail = asyncHandler(async (req, res) => {
        const { id } = req.params
        const instructorId = req.user.id
        const userRole = req.user.role
        const isAdmin = userRole === 'ADMIN'
        const courseId = parseInt(id)

        if (isNaN(courseId)) {
            return ApiResponse.badRequest(res, 'Invalid course ID')
        }

        if (!req.file) {
            return ApiResponse.badRequest(res, 'No thumbnail file uploaded')
        }

        const course = await instructorCourseService.uploadThumbnail(
            courseId,
            instructorId,
            req.file,
            userRole,
            isAdmin
        )

        return ApiResponse.success(
            res,
            course,
            'Thumbnail uploaded successfully'
        )
    })

    /**
     * @route   PATCH /api/v1/instructor/courses/:id/video-preview
     * @desc    Upload course video preview
     * @access  Private (Instructor/Admin)
     */
    uploadVideoPreview = asyncHandler(async (req, res) => {
        const { id } = req.params
        const instructorId = req.user.id
        const userRole = req.user.role
        const isAdmin = userRole === 'ADMIN'
        const courseId = parseInt(id)

        if (isNaN(courseId)) {
            return ApiResponse.badRequest(res, 'Invalid course ID')
        }

        if (!req.file) {
            return ApiResponse.badRequest(res, 'No video preview file uploaded')
        }

        const course = await instructorCourseService.uploadVideoPreview(
            courseId,
            instructorId,
            req.file,
            userRole,
            isAdmin
        )

        return ApiResponse.success(
            res,
            course,
            'Video preview uploaded successfully'
        )
    })

    /**
     * @route   POST /api/v1/instructor/courses/:id/tags
     * @desc    Add tags to a course
     * @access  Private (Instructor/Admin)
     */
    addTagsToCourse = asyncHandler(async (req, res) => {
        const { id } = req.params
        const { tagIds } = req.body
        const instructorId = req.user.id
        const isAdmin = req.user.role === 'ADMIN'
        const courseId = parseInt(id)

        if (isNaN(courseId)) {
            return ApiResponse.badRequest(res, 'Invalid course ID')
        }

        if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
            return ApiResponse.badRequest(
                res,
                'Tag IDs array is required and must not be empty'
            )
        }

        const course = await instructorCourseService.addTagsToCourse(
            courseId,
            instructorId,
            tagIds,
            isAdmin
        )

        return ApiResponse.success(res, course, 'Tags added successfully')
    })

    /**
     * @route   DELETE /api/v1/instructor/courses/:id/tags/:tagId
     * @desc    Remove a tag from a course
     * @access  Private (Instructor/Admin)
     */
    removeTagFromCourse = asyncHandler(async (req, res) => {
        const { id, tagId } = req.params
        const instructorId = req.user.id
        const isAdmin = req.user.role === 'ADMIN'
        const courseId = parseInt(id)
        const tagIdInt = parseInt(tagId)

        if (isNaN(courseId)) {
            return ApiResponse.badRequest(res, 'Invalid course ID')
        }

        if (isNaN(tagIdInt)) {
            return ApiResponse.badRequest(res, 'Invalid tag ID')
        }

        const course = await instructorCourseService.removeTagFromCourse(
            courseId,
            instructorId,
            tagIdInt,
            isAdmin
        )

        return ApiResponse.success(res, course, 'Tag removed successfully')
    })

    /**
     * @route   GET /api/v1/instructor/courses/:id/analytics
     * @desc    Get detailed analytics for a course
     * @access  Private (Instructor/Admin)
     */
    getCourseAnalytics = asyncHandler(async (req, res) => {
        const { id } = req.params
        const instructorId = req.user.id
        const isAdmin = req.user.role === 'ADMIN'
        const courseId = parseInt(id)

        if (isNaN(courseId)) {
            return ApiResponse.badRequest(res, 'Invalid course ID')
        }

        const analytics = await instructorCourseService.getCourseAnalytics(
            courseId,
            instructorId,
            isAdmin
        )

        return ApiResponse.success(
            res,
            analytics,
            'Course analytics retrieved successfully'
        )
    })
}

export default new InstructorCourseController()
