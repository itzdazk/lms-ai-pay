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

export { checkLessonExists }

