// src/controllers/quizzes.controller.js
// Quiz endpoints - Require authentication and authorization
// Chỉ student đã đăng ký, instructor đã tạo course, hoặc admin mới được truy cập
import { asyncHandler } from '../middlewares/error.middleware.js'
import ApiResponse from '../utils/response.util.js'
import studentQuizzesService from '../services/student-quizzes.service.js'

class QuizzesController {
    /**
     * GET /api/v1/quizzes/:id
     * Requires: Authentication + Authorization (enrollment/instructor/admin)
     */
    getQuizById = asyncHandler(async (req, res) => {
        const quizId = parseInt(req.params.id, 10)
        const userId = req.user.id
        const userRole = req.user.role

        const quiz = await studentQuizzesService.getQuizById(
            quizId,
            userId,
            userRole
        )

        return ApiResponse.success(
            res,
            quiz,
            'Truy xuất bài trắc nghiệm thành công'
        )
    })

    /**
     * GET /api/v1/lessons/:lessonId/quizzes
     * Requires: Authentication + Authorization (enrollment/instructor/admin)
     */
    getLessonQuizzes = asyncHandler(async (req, res) => {
        const lessonId = parseInt(req.params.lessonId, 10)
        const userId = req.user.id
        const userRole = req.user.role

        const quizzes = await studentQuizzesService.getLessonQuizzes(
            lessonId,
            userId,
            userRole
        )

        return ApiResponse.success(
            res,
            quizzes,
            'Truy xuất bài trắc nghiệm của bài học thành công'
        )
    })

    /**
     * GET /api/v1/courses/:courseId/quizzes
     * Requires: Authentication + Authorization (enrollment/instructor/admin)
     */
    getCourseQuizzes = asyncHandler(async (req, res) => {
        const courseId = parseInt(req.params.courseId, 10)
        const userId = req.user.id
        const userRole = req.user.role

        const quizzes = await studentQuizzesService.getCourseQuizzes(
            courseId,
            userId,
            userRole
        )

        return ApiResponse.success(
            res,
            quizzes,
            'Truy xuất bài trắc nghiệm của khóa học thành công'
        )
    })
}

export default new QuizzesController()
// src/controllers/quizzes.controller.js
