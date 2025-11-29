// src/controllers/student-quizzes.controller.js
import { asyncHandler } from '../middlewares/error.middleware.js';
import { PAGINATION } from '../config/constants.js';
import ApiResponse from '../utils/response.util.js';
import studentQuizzesService from '../services/student-quizzes.service.js';

class StudentQuizzesController {
    /**
     * POST /api/v1/quizzes/:quizId/submit
     */
    submitQuiz = asyncHandler(async (req, res) => {
        const quizId = parseInt(req.params.quizId, 10);
        const userId = req.user.id;
        const userRole = req.user.role;
        const answers = req.body.answers;

        const submission = await studentQuizzesService.submitQuiz({
            quizId,
            userId,
            userRole,
            answers,
        });

        return ApiResponse.created(
            res,
            submission,
            'Quiz submitted successfully'
        );
    });

    /**
     * GET /api/v1/quizzes/:quizId/submissions
     */
    getQuizSubmissions = asyncHandler(async (req, res) => {
        const quizId = parseInt(req.params.quizId, 10);
        const userId = req.user.id;
        const userRole = req.user.role;
        const page = req.query.page
            ? parseInt(req.query.page, 10)
            : PAGINATION.DEFAULT_PAGE;
        const limit = req.query.limit
            ? parseInt(req.query.limit, 10)
            : Math.min(10, PAGINATION.MAX_LIMIT);

        const result = await studentQuizzesService.getQuizSubmissions({
            quizId,
            userId,
            userRole,
            page,
            limit,
        });

        return ApiResponse.paginated(
            res,
            result.items,
            {
                page: result.page,
                limit: result.limit,
                total: result.total,
            },
            'Quiz submissions retrieved successfully'
        );
    });

    /**
     * GET /api/v1/quizzes/:quizId/submissions/:submissionId
     */
    getQuizSubmissionById = asyncHandler(async (req, res) => {
        const quizId = parseInt(req.params.quizId, 10);
        const submissionId = parseInt(req.params.submissionId, 10);
        const userId = req.user.id;
        const userRole = req.user.role;

        const submission = await studentQuizzesService.getQuizSubmissionById({
            quizId,
            submissionId,
            userId,
            userRole,
        });

        return ApiResponse.success(
            res,
            submission,
            'Quiz submission detail retrieved successfully'
        );
    });

    /**
     * GET /api/v1/quizzes/:quizId/attempts
     */
    getQuizAttempts = asyncHandler(async (req, res) => {
        const quizId = parseInt(req.params.quizId, 10);
        const userId = req.user.id;
        const userRole = req.user.role;

        const summary = await studentQuizzesService.getQuizAttemptsSummary({
            quizId,
            userId,
            userRole,
        });

        return ApiResponse.success(
            res,
            summary,
            'Quiz attempts summary retrieved successfully'
        );
    });

    /**
     * GET /api/v1/quizzes/:quizId/result/latest
     */
    getLatestQuizResult = asyncHandler(async (req, res) => {
        const quizId = parseInt(req.params.quizId, 10);
        const userId = req.user.id;
        const userRole = req.user.role;

        const latestResult = await studentQuizzesService.getLatestQuizResult({
            quizId,
            userId,
            userRole,
        });

        return ApiResponse.success(
            res,
            latestResult,
            latestResult
                ? 'Latest quiz result retrieved successfully'
                : 'No quiz submissions found'
        );
    });
}

export default new StudentQuizzesController();

