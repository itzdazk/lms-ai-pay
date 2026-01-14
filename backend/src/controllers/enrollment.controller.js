// backend/src/controllers/enrollment.controller.js
import enrollmentService from '../services/enrollment.service.js'
import ApiResponse from '../utils/response.util.js'
import { asyncHandler } from '../middlewares/error.middleware.js'

class EnrollmentController {
    /**
     * @route   GET /api/v1/enrollments
     * @desc    Get user's enrollments with filters
     * @access  Private (Student/Instructor/Admin)
     */
    getEnrollments = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const { page, limit, status, search, sort } = req.query

        const filters = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            status: status || undefined,
            search: search || undefined,
            sort: sort || 'newest',
        }

        const result = await enrollmentService.getUserEnrollments(
            userId,
            filters
        )

        return ApiResponse.paginated(
            res,
            result.enrollments,
            {
                page: filters.page,
                limit: filters.limit,
                total: result.total,
            },
            'Truy xuất danh sách ghi danh thành công'
        )
    })

    /**
     * @route   GET /api/v1/enrollments/:id
     * @desc    Get enrollment details by ID
     * @access  Private (Student/Instructor/Admin)
     */
    getEnrollmentById = asyncHandler(async (req, res) => {
        const { id } = req.params
        const enrollmentId = parseInt(id)
        const userId = req.user.id

        if (isNaN(enrollmentId)) {
            return ApiResponse.badRequest(res, 'ID ghi danh không hợp lệ')
        }

        const enrollment = await enrollmentService.getEnrollmentById(
            enrollmentId,
            userId
        )

        return ApiResponse.success(
            res,
            enrollment,
            'Truy xuất chi tiết ghi danh thành công'
        )
    })

    /**
     * @route   GET /api/v1/enrollments/active
     * @desc    Get active enrollments (currently learning)
     * @access  Private (Student/Instructor/Admin)
     */
    getActiveEnrollments = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const { limit } = req.query
        const limitNum = parseInt(limit) || 10

        const enrollments = await enrollmentService.getActiveEnrollments(
            userId,
            limitNum
        )

        return ApiResponse.success(
            res,
            enrollments,
            'Truy xuất danh sách ghi danh thành công'
        )
    })

    /**
     * @route   GET /api/v1/enrollments/completed
     * @desc    Get completed enrollments
     * @access  Private (Student/Instructor/Admin)
     */
    getCompletedEnrollments = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const { page, limit } = req.query

        const filters = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
        }

        const result = await enrollmentService.getCompletedEnrollments(
            userId,
            filters
        )

        return ApiResponse.paginated(
            res,
            result.enrollments,
            {
                page: filters.page,
                limit: filters.limit,
                total: result.total,
            },
            'Truy xuất danh sách ghi danh thành công'
        )
    })

    /**
     * @route   POST /api/v1/enrollments
     * @desc    Enroll in a course (free or paid)
     * @access  Private (Student/Instructor/Admin)
     * @body    courseId (required), paymentGateway (required if paid), billingAddress (optional)
     */
    enrollInCourse = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const { courseId, paymentGateway, billingAddress } = req.body

        if (!courseId) {
            return ApiResponse.badRequest(res, 'ID khóa học là bắt buộc')
        }

        const result = await enrollmentService.enrollInCourse(
            userId,
            parseInt(courseId),
            paymentGateway || null,
            billingAddress || null
        )

        // If course is FREE, return success with enrollment
        if (!result.requiresPayment) {
            return ApiResponse.created(
                res,
                result.enrollment,
                'Đã ghi danh thành công'
            )
        }

        // If course is PAID, return order created response
        return ApiResponse.created(
            res,
            result.order,
            result.message ||
                'Đã tạo đơn hàng thành công. Vui lòng tiến hành thanh toán.'
        )
    })

    /**
     * @route   GET /api/v1/enrollments/check/:courseId
     * @desc    Check if user is enrolled in a course
     * @access  Private (Student/Instructor/Admin)
     */
    checkEnrollment = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const { courseId } = req.params
        const courseIdNum = parseInt(courseId)

        if (isNaN(courseIdNum)) {
            return ApiResponse.badRequest(res, 'ID khóa học không hợp lệ')
        }

        const result = await enrollmentService.checkEnrollment(
            userId,
            courseIdNum
        )

        return ApiResponse.success(
            res,
            result,
            'Truy xuất trạng thái ghi danh thành công'
        )
    })
}

export default new EnrollmentController()
