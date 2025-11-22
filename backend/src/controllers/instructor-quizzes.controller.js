// src/controllers/instructor-quizzes.controller.js
import { asyncHandler } from '../middlewares/error.middleware.js';
import { PAGINATION } from '../config/constants.js';
import ApiResponse from '../utils/response.util.js';
import quizzesService from '../services/quizzes.service.js';

class InstructorQuizzesController {
    /**
     * POST /api/v1/instructor/lessons/:lessonId/quizzes
     */
    createLessonQuiz = asyncHandler(async (req, res) => {
        const lessonId = parseInt(req.params.lessonId, 10);
        const userId = req.user.id;
        const userRole = req.user.role;

        const quiz = await quizzesService.createQuizForLesson({
            lessonId,
            userId,
            userRole,
            payload: req.body,
        });

        return ApiResponse.created(
            res,
            quiz,
            'Quiz created successfully for lesson'
        );
    });

    /**
     * POST /api/v1/instructor/courses/:courseId/quizzes
     */
    createCourseQuiz = asyncHandler(async (req, res) => {
        const courseId = parseInt(req.params.courseId, 10);
        const userId = req.user.id;
        const userRole = req.user.role;

        const quiz = await quizzesService.createQuizForCourse({
            courseId,
            userId,
            userRole,
            payload: req.body,
        });

        return ApiResponse.created(
            res,
            quiz,
            'Quiz created successfully for course'
        );
    });

    /**
     * PUT /api/v1/instructor/quizzes/:id
     */
    updateQuiz = asyncHandler(async (req, res) => {
        const quizId = parseInt(req.params.id, 10);
        const userId = req.user.id;
        const userRole = req.user.role;

        const quiz = await quizzesService.updateQuiz({
            quizId,
            userId,
            userRole,
            payload: req.body,
        });

        return ApiResponse.success(
            res,
            quiz,
            'Quiz updated successfully'
        );
    });

    /**
     * DELETE /api/v1/instructor/quizzes/:id
     */
    deleteQuiz = asyncHandler(async (req, res) => {
        const quizId = parseInt(req.params.id, 10);
        const userId = req.user.id;
        const userRole = req.user.role;

        await quizzesService.deleteQuiz({
            quizId,
            userId,
            userRole,
        });

        return ApiResponse.noContent(res);
    });

    /**
     * PATCH /api/v1/instructor/quizzes/:id/publish
     */
    publishQuiz = asyncHandler(async (req, res) => {
        const quizId = parseInt(req.params.id, 10);
        const userId = req.user.id;
        const userRole = req.user.role;
        const { isPublished } = req.body;

        const quiz = await quizzesService.setQuizPublishStatus({
            quizId,
            userId,
            userRole,
            isPublished,
        });

        return ApiResponse.success(
            res,
            quiz,
            `Quiz ${isPublished ? 'published' : 'unpublished'} successfully`
        );
    });

    /**
     * GET /api/v1/instructor/quizzes/:quizId/submissions
     */
    getInstructorQuizSubmissions = asyncHandler(async (req, res) => {
        const quizId = parseInt(req.params.quizId, 10);
        const userId = req.user.id;
        const userRole = req.user.role;
        const page = req.query.page
            ? parseInt(req.query.page, 10)
            : PAGINATION.DEFAULT_PAGE;
        const limit = req.query.limit
            ? parseInt(req.query.limit, 10)
            : Math.min(20, PAGINATION.MAX_LIMIT);
        const studentId = req.query.studentId
            ? parseInt(req.query.studentId, 10)
            : undefined;
        const isPassed =
            typeof req.query.isPassed === 'boolean'
                ? req.query.isPassed
                : req.query.isPassed === 'true'
                ? true
                : req.query.isPassed === 'false'
                ? false
                : undefined;

        const result = await quizzesService.getInstructorQuizSubmissions({
            quizId,
            userId,
            userRole,
            page,
            limit,
            studentId,
            isPassed,
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
     * GET /api/v1/instructor/quizzes/:quizId/analytics
     */
    getQuizAnalytics = asyncHandler(async (req, res) => {
        const quizId = parseInt(req.params.quizId, 10);
        const userId = req.user.id;
        const userRole = req.user.role;

        const analytics = await quizzesService.getQuizAnalytics({
            quizId,
            userId,
            userRole,
        });

        return ApiResponse.success(
            res,
            analytics,
            'Quiz analytics retrieved successfully'
        );
    });
}

export default new InstructorQuizzesController();

