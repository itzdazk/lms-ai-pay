// src/middlewares/lesson.middleware.js
import { prisma } from '../config/database.config.js'
import ApiResponse from '../utils/response.util.js'
import { HTTP_STATUS } from '../config/constants.js'

/**
 * Check if lesson exists and belongs to course
 * Must be called before multer middleware
 */
const checkLessonExists = async (req, res, next) => {
    try {
        const courseId = parseInt(req.params.courseId)
        const lessonId = parseInt(req.params.id)

        if (!courseId || !lessonId) {
            return ApiResponse.badRequest(
                res,
                'Yêu cầu mã khóa học và mã bài học',
            )
        }

        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            select: {
                id: true,
                courseId: true,
                title: true,
            },
        })

        if (!lesson) {
            return ApiResponse.notFound(res, 'Không tìm thấy bài học')
        }

        if (lesson.courseId !== courseId) {
            return ApiResponse.badRequest(
                res,
                'Bài học không thuộc về khóa học này',
            )
        }

        // Attach lesson to request for later use
        req.lesson = lesson
        next()
    } catch (error) {
        return ApiResponse.error(
            res,
            'Lỗi kiểm tra bài học',
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
        )
    }
}

/**
 * Middleware: Only allow access to lesson if previous lesson is completed
 * Assumes lessons have lessonOrder and chapterId fields
 * - Admins and course instructors bypass this check
 * - If lesson is first in course, allow
 * - Else, check previous lesson in order (same chapter or previous chapter)
 *   and require user's progress.isCompleted = true
 */
const restrictLessonAccess = async (req, res, next) => {
    try {
        const userId = req.user?.id
        const userRole = req.user?.role
        const lessonId = parseInt(req.params.id)
        if (!userId || !lessonId) {
            return ApiResponse.badRequest(
                res,
                'Yêu cầu mã người dùng và mã bài học',
            )
        }

        // Get current lesson info with course instructor
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            select: {
                id: true,
                courseId: true,
                chapterId: true,
                lessonOrder: true,
                course: {
                    select: {
                        instructorId: true,
                    },
                },
            },
        })
        if (!lesson) return ApiResponse.notFound(res, 'Không tìm thấy bài học')

        // Admin and course instructor bypass sequential access restriction
        const isAdmin = userRole === 'ADMIN'
        // Ensure consistent type comparison
        const isCourseInstructor =
            String(lesson.course?.instructorId) === String(userId)
        if (isAdmin || isCourseInstructor) {
            return next()
        }

        // Find previous lesson in course order
        const prevLesson = await prisma.lesson.findFirst({
            where: {
                courseId: lesson.courseId,
                OR: [
                    // Same chapter, lower order
                    {
                        chapterId: lesson.chapterId,
                        lessonOrder: { lt: lesson.lessonOrder },
                    },
                    // Previous chapters (any lessonOrder)
                    { chapterId: { lt: lesson.chapterId } },
                ],
            },
            orderBy: [{ chapterId: 'desc' }, { lessonOrder: 'desc' }],
        })
        if (!prevLesson) return next() // First lesson, allow

        // Check progress of previous lesson (phải hoàn thành cả bài học và quiz nếu có)
        const progress = await prisma.progress.findFirst({
            where: {
                userId,
                lessonId: prevLesson.id,
                isCompleted: true,
                quizCompleted: true,
            },
        })
        if (!progress) {
            return ApiResponse.error(
                res,
                'Bạn cần hoàn thành bài học và câu hỏi trước để truy cập bài học này.',
                HTTP_STATUS.FORBIDDEN,
            )
        }
        next()
    } catch (error) {
        return ApiResponse.error(
            res,
            'Lỗi kiểm tra truy cập bài học',
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
        )
    }
}

export { checkLessonExists, restrictLessonAccess }
