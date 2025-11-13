// src/controllers/quizzes.controller.js
import { asyncHandler } from '../middlewares/error.middleware.js';
import { PAGINATION } from '../config/constants.js';
import ApiResponse from '../utils/response.util.js';
import quizzesService from '../services/quizzes.service.js';

class QuizzesController {
    /**
     * GET /api/v1/quizzes/:id
     */
    getQuizById = asyncHandler(async (req, res) => {
        const quizId = parseInt(req.params.id, 10);

        const quiz = await quizzesService.getQuizById(quizId);

        return ApiResponse.success(
            res,
            quiz,
            'Quiz retrieved successfully'
        );
    });

    /**
     * GET /api/v1/lessons/:lessonId/quizzes
     */
    getLessonQuizzes = asyncHandler(async (req, res) => {
        const lessonId = parseInt(req.params.lessonId, 10);

        const quizzes = await quizzesService.getLessonQuizzes(lessonId);

        return ApiResponse.success(
            res,
            quizzes,
            'Lesson quizzes retrieved successfully'
        );
    });

    /**
     * GET /api/v1/courses/:courseId/quizzes
     */
    getCourseQuizzes = asyncHandler(async (req, res) => {
        const courseId = parseInt(req.params.courseId, 10);

        const quizzes = await quizzesService.getCourseQuizzes(courseId);

        return ApiResponse.success(
            res,
            quizzes,
            'Course quizzes retrieved successfully'
        );
    });

    /**
     * POST /api/v1/quizzes/:quizId/submit
     */
    submitQuiz = asyncHandler(async (req, res) => {
        const quizId = parseInt(req.params.quizId, 10);
        const userId = req.user.id;
        const userRole = req.user.role;
        const answers = req.body.answers;

        const submission = await quizzesService.submitQuiz({
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

        const result = await quizzesService.getQuizSubmissions({
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

        const submission = await quizzesService.getQuizSubmissionById({
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

        const summary = await quizzesService.getQuizAttemptsSummary({
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

        const latestResult = await quizzesService.getLatestQuizResult({
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

    /**
     * GET /api/v1/admin/quizzes
     */
    getAdminQuizzes = asyncHandler(async (req, res) => {
        const page = req.query.page
            ? parseInt(req.query.page, 10)
            : PAGINATION.DEFAULT_PAGE;
        const limit = req.query.limit
            ? parseInt(req.query.limit, 10)
            : Math.min(20, PAGINATION.MAX_LIMIT);

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
        };

        const result = await quizzesService.getAdminQuizzes({
            page,
            limit,
            filters,
        });

        return ApiResponse.paginated(
            res,
            result.items,
            {
                page: result.page,
                limit: result.limit,
                total: result.total,
            },
            'Quizzes retrieved successfully'
        );
    });

    /**
     * GET /api/v1/admin/quizzes/:quizId/submissions
     */
    getAdminQuizSubmissions = asyncHandler(async (req, res) => {
        const quizId = parseInt(req.params.quizId, 10);
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

        const result = await quizzesService.getAdminQuizSubmissions({
            quizId,
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
}

export default new QuizzesController();
// src/controllers/quizzes.controller.js



