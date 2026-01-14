// src/controllers/admin-quizzes.controller.js
import { asyncHandler } from '../middlewares/error.middleware.js'
import { PAGINATION } from '../config/constants.js'
import ApiResponse from '../utils/response.util.js'
import adminQuizzesService from '../services/admin-quizzes.service.js'

class AdminQuizzesController {
    /**
     * GET /api/v1/admin/quizzes
     */
    getAdminQuizzes = asyncHandler(async (req, res) => {
        const page = req.query.page
            ? parseInt(req.query.page, 10)
            : PAGINATION.DEFAULT_PAGE
        const limit = req.query.limit
            ? parseInt(req.query.limit, 10)
            : Math.min(20, PAGINATION.MAX_LIMIT)

        const filters = {
            courseId: req.query.courseId
                ? parseInt(req.query.courseId, 10)
                : undefined,
            lessonId: req.query.lessonId
                ? parseInt(req.query.lessonId, 10)
                : undefined,
            instructorId: req.query.instructorId
                ? parseInt(req.query.instructorId, 10)
                : undefined,
            isPublished:
                typeof req.query.isPublished === 'boolean'
                    ? req.query.isPublished
                    : req.query.isPublished === 'true'
                      ? true
                      : req.query.isPublished === 'false'
                        ? false
                        : undefined,
        }

        const result = await adminQuizzesService.getAdminQuizzes({
            page,
            limit,
            filters,
        })

        return ApiResponse.paginated(
            res,
            result.items,
            {
                page: result.page,
                limit: result.limit,
                total: result.total,
            },
            'Truy xuất danh sách bài kiểm tra thành công'
        )
    })

    /**
     * GET /api/v1/admin/quizzes/:quizId/submissions
     */
    getAdminQuizSubmissions = asyncHandler(async (req, res) => {
        const quizId = parseInt(req.params.quizId, 10)
        const page = req.query.page
            ? parseInt(req.query.page, 10)
            : PAGINATION.DEFAULT_PAGE
        const limit = req.query.limit
            ? parseInt(req.query.limit, 10)
            : Math.min(20, PAGINATION.MAX_LIMIT)
        const studentId = req.query.studentId
            ? parseInt(req.query.studentId, 10)
            : undefined
        const isPassed =
            typeof req.query.isPassed === 'boolean'
                ? req.query.isPassed
                : req.query.isPassed === 'true'
                  ? true
                  : req.query.isPassed === 'false'
                    ? false
                    : undefined

        const result = await adminQuizzesService.getAdminQuizSubmissions({
            quizId,
            page,
            limit,
            studentId,
            isPassed,
        })

        return ApiResponse.paginated(
            res,
            result.items,
            {
                page: result.page,
                limit: result.limit,
                total: result.total,
            },
            'Truy xuất danh sách bài kiểm tra thành công'
        )
    })
}

export default new AdminQuizzesController()
