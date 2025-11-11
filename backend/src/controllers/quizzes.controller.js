// src/controllers/quizzes.controller.js
import { asyncHandler } from '../middlewares/error.middleware.js';
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
}

export default new QuizzesController();

