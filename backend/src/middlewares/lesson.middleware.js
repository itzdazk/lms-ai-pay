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
            return ApiResponse.badRequest(res, 'Course ID and Lesson ID are required')
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
            return ApiResponse.notFound(res, 'Lesson not found')
        }

        if (lesson.courseId !== courseId) {
            return ApiResponse.badRequest(res, 'Lesson does not belong to this course')
        }

        // Attach lesson to request for later use
        req.lesson = lesson
        next()
    } catch (error) {
        return ApiResponse.error(res, 'Error checking lesson', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }
}


/**
 * Middleware: Only allow access to lesson if previous lesson is completed
 * Assumes lessons have lessonOrder and chapterId fields
 * - If lesson is first in course, allow
 * - Else, check previous lesson in order (same chapter or previous chapter)
 *   and require user's progress.isCompleted = true
 */
const restrictLessonAccess = async (req, res, next) => {
    try {
        const userId = req.user?.id
        const lessonId = parseInt(req.params.id)
        if (!userId || !lessonId) {
            return ApiResponse.badRequest(res, 'User and lesson ID required')
        }
        // Get current lesson info
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            select: { id: true, courseId: true, chapterId: true, lessonOrder: true },
        })
        if (!lesson) return ApiResponse.notFound(res, 'Lesson not found')
        // Find previous lesson in course order
        const prevLesson = await prisma.lesson.findFirst({
            where: {
                courseId: lesson.courseId,
                OR: [
                    // Same chapter, lower order
                    { chapterId: lesson.chapterId, lessonOrder: { lt: lesson.lessonOrder } },
                    // Previous chapters (any lessonOrder)
                    { chapterId: { lt: lesson.chapterId } },
                ],
            },
            orderBy: [
                { chapterId: 'desc' },
                { lessonOrder: 'desc' },
            ],
        })
        if (!prevLesson) return next() // First lesson, allow
        // Check progress of previous lesson
        const progress = await prisma.progress.findFirst({
            where: {
                userId,
                lessonId: prevLesson.id,
                isCompleted: true,
            },
        })
        if (!progress) {
            return ApiResponse.error(
                res,
                'Bạn cần hoàn thành bài học trước để truy cập bài học này.',
                HTTP_STATUS.FORBIDDEN
            )
        }
        next()
    } catch (error) {
        return ApiResponse.error(res, 'Error checking lesson access', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }
}

export { checkLessonExists, restrictLessonAccess }

