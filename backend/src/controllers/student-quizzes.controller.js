// src/controllers/student-quizzes.controller.js
import { asyncHandler } from '../middlewares/error.middleware.js'
import { PAGINATION } from '../config/constants.js'
import ApiResponse from '../utils/response.util.js'
import studentQuizzesService from '../services/student-quizzes.service.js'

class StudentQuizzesController {
    /**
     * POST /api/v1/quizzes/:quizId/submit
     */
    submitQuiz = asyncHandler(async (req, res) => {
        const quizId = parseInt(req.params.quizId, 10)
        const userId = req.user.id
        const userRole = req.user.role
        const answers = req.body.answers
        const startedAt = req.body.startedAt // ISO 8601 string from client

        const submission = await studentQuizzesService.submitQuiz({
            quizId,
            userId,
            userRole,
            answers,
            startedAt,
        })

        return ApiResponse.created(
            res,
            submission,
            'Bài trắc nghiệm đã được gửi thành công'
        )
    })

    /**
     * GET /api/v1/quizzes/:quizId/submissions
     */
    getQuizSubmissions = asyncHandler(async (req, res) => {
        const quizId = parseInt(req.params.quizId, 10)
        const userId = req.user.id
        const userRole = req.user.role
        const page = req.query.page
            ? parseInt(req.query.page, 10)
            : PAGINATION.DEFAULT_PAGE
        const limit = req.query.limit
            ? parseInt(req.query.limit, 10)
            : Math.min(10, PAGINATION.MAX_LIMIT)

        const result = await studentQuizzesService.getQuizSubmissions({
            quizId,
            userId,
            userRole,
            page,
            limit,
        })

        return ApiResponse.paginated(
            res,
            result.items,
            {
                page: result.page,
                limit: result.limit,
                total: result.total,
            },
            'Truy xuất danh sách bài nộp trắc nghiệm thành công'
        )
    })

    /**
     * GET /api/v1/quizzes/:quizId/submissions/:submissionId
     */
    getQuizSubmissionById = asyncHandler(async (req, res) => {
        const quizId = parseInt(req.params.quizId, 10)
        const submissionId = parseInt(req.params.submissionId, 10)
        const userId = req.user.id
        const userRole = req.user.role

        const submission = await studentQuizzesService.getQuizSubmissionById({
            quizId,
            submissionId,
            userId,
            userRole,
        })

        return ApiResponse.success(
            res,
            submission,
            'Truy xuất chi tiết bài nộp trắc nghiệm thành công'
        )
    })

    /**
     * GET /api/v1/quizzes/:quizId/attempts
     */
    getQuizAttempts = asyncHandler(async (req, res) => {
        const quizId = parseInt(req.params.quizId, 10)
        const userId = req.user.id
        const userRole = req.user.role

        const summary = await studentQuizzesService.getQuizAttemptsSummary({
            quizId,
            userId,
            userRole,
        })

        return ApiResponse.success(
            res,
            summary,
            'Truy xuất tóm tắt cố gắng bài trắc nghiệm thành công'
        )
    })

    /**
     * GET /api/v1/quizzes/:quizId/result/latest
     */
    getLatestQuizResult = asyncHandler(async (req, res) => {
        const quizId = parseInt(req.params.quizId, 10)
        const userId = req.user.id
        const userRole = req.user.role

        const latestResult = await studentQuizzesService.getLatestQuizResult({
            quizId,
            userId,
            userRole,
        })

        return ApiResponse.success(
            res,
            latestResult,
            latestResult
                ? 'Truy xuất kết quả bài trắc nghiệm mới nhất thành công'
                : 'Không tìm thấy bài nộp trắc nghiệm'
        )
    })
}

export default new StudentQuizzesController()
