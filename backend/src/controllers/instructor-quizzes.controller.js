// src/controllers/instructor-quizzes.controller.js
import { asyncHandler } from '../middlewares/error.middleware.js';
import { PAGINATION, HTTP_STATUS } from '../config/constants.js';
import ApiResponse from '../utils/response.util.js';
import instructorQuizzesService from '../services/instructor-quizzes.service.js';
import aiQuizGenerationService from '../services/ai-quiz-generation.service.js';
import { prisma } from '../config/database.config.js';

class InstructorQuizzesController {
    /**
     * POST /api/v1/instructor/lessons/:lessonId/quizzes
     */
    createLessonQuiz = asyncHandler(async (req, res) => {
        const lessonId = parseInt(req.params.lessonId, 10);
        const userId = req.user.id;
        const userRole = req.user.role;

        const quiz = await instructorQuizzesService.createQuizForLesson({
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
     * PUT /api/v1/instructor/quizzes/:id
     */
    updateQuiz = asyncHandler(async (req, res) => {
        const quizId = parseInt(req.params.id, 10);
        const userId = req.user.id;
        const userRole = req.user.role;

        const quiz = await instructorQuizzesService.updateQuiz({
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

        await instructorQuizzesService.deleteQuiz({
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

        const quiz = await instructorQuizzesService.setQuizPublishStatus({
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

        const result = await instructorQuizzesService.getInstructorQuizSubmissions({
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

        const analytics = await instructorQuizzesService.getQuizAnalytics({
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
     * POST /api/v1/instructor/quizzes/generate-from-lesson
     * Generate quiz questions from lesson using AI
     */
    generateQuizFromLesson = asyncHandler(async (req, res) => {
        const { lessonId } = req.body;
        const {
            numQuestions = 5,
            difficulty = 'medium',
            includeExplanation = true,
            useCache = true
        } = req.body;

        // Verify lesson ownership
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                course: {
                    select: {
                        instructorId: true
                    }
                }
            }
        });

        if (!lesson) {
            return ApiResponse.error(
                res,
                'Lesson not found',
                HTTP_STATUS.NOT_FOUND
            );
        }

        if (lesson.course.instructorId !== req.user.id && req.user.role !== 'admin') {
            return ApiResponse.error(
                res,
                'Unauthorized: You do not have permission to generate quiz for this lesson',
                HTTP_STATUS.FORBIDDEN
            );
        }

        // Generate questions
        const questions = await aiQuizGenerationService.generateQuizFromLesson(
            lessonId,
            {
                numQuestions: parseInt(numQuestions),
                difficulty,
                includeExplanation,
                useCache
            }
        );

        return ApiResponse.success(
            res,
            {
                lessonId,
                questions,
                count: questions.length,
                metadata: {
                    difficulty,
                    includeExplanation,
                    generatedAt: new Date().toISOString()
                }
            },
            'Quiz questions generated successfully',
            HTTP_STATUS.OK
        );
    });

    /**
     * POST /api/v1/instructor/quizzes/generate-from-course
     * Generate quiz questions from course using AI
     */
    generateQuizFromCourse = asyncHandler(async (req, res) => {
        const { courseId } = req.body;
        const {
            numQuestions = 10,
            difficulty = 'medium',
            includeExplanation = true,
            useCache = true
        } = req.body;

        // Verify course ownership
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                instructorId: true,
                title: true
            }
        });

        if (!course) {
            return ApiResponse.error(
                res,
                'Course not found',
                HTTP_STATUS.NOT_FOUND
            );
        }

        if (course.instructorId !== req.user.id && req.user.role !== 'admin') {
            return ApiResponse.error(
                res,
                'Unauthorized: You do not have permission to generate quiz for this course',
                HTTP_STATUS.FORBIDDEN
            );
        }

        // Generate questions
        const questions = await aiQuizGenerationService.generateQuizFromCourse(
            courseId,
            {
                numQuestions: parseInt(numQuestions),
                difficulty,
                includeExplanation,
                useCache
            }
        );

        return ApiResponse.success(
            res,
            {
                courseId,
                questions,
                count: questions.length,
                metadata: {
                    difficulty,
                    includeExplanation,
                    generatedAt: new Date().toISOString()
                }
            },
            'Quiz questions generated successfully',
            HTTP_STATUS.OK
        );
    });
}

export default new InstructorQuizzesController();

