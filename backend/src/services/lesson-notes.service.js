import { prisma } from '../config/database.config.js'
import logger from '../config/logger.config.js'
import {
    HTTP_STATUS,
    ENROLLMENT_STATUS,
    USER_ROLES,
} from '../config/constants.js' // Added USER_ROLES

class LessonNotesService {
    /**
     * Get note for a lesson
     * GET /api/v1/notes/lessons/:lessonId
     */
    async getLessonNote(userId, lessonId, userRole = null) {
        // Get lesson with course info
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                course: true,
            },
        })

        if (!lesson) {
            const error = new Error('Không tìm thấy bài học')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // --- BYPASS CHECK FOR ADMIN/INSTRUCTOR ---
        const isAdmin = userRole === USER_ROLES.ADMIN
        const isCourseInstructor =
            userRole === USER_ROLES.INSTRUCTOR &&
            String(lesson.course.instructorId) === String(userId)

        if (!isAdmin && !isCourseInstructor) {
            // Check if user is enrolled (not DROPPED)
            const enrollment = await prisma.enrollment.findFirst({
                where: {
                    userId,
                    courseId: lesson.courseId,
                    status: {
                        in: [
                            ENROLLMENT_STATUS.ACTIVE,
                            ENROLLMENT_STATUS.COMPLETED,
                        ],
                    },
                },
            })

            if (!enrollment) {
                const error = new Error('Bạn chưa đăng ký vào khóa học này')
                error.statusCode = HTTP_STATUS.FORBIDDEN
                throw error
            }
        }

        // Get note
        const note = await prisma.lessonNote.findUnique({
            where: {
                userId_lessonId: {
                    userId,
                    lessonId,
                },
            },
        })

        return {
            lesson: {
                id: lesson.id,
                title: lesson.title,
                slug: lesson.slug,
            },
            note: note
                ? {
                      id: note.id,
                      content: note.content,
                      createdAt: note.createdAt,
                      updatedAt: note.updatedAt,
                  }
                : null,
        }
    }

    /**
     * Create or update note for a lesson
     * PUT /api/v1/notes/lessons/:lessonId
     */
    async upsertLessonNote(userId, lessonId, content, userRole = null) {
        // Get lesson with course info
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                course: true,
            },
        })

        if (!lesson) {
            const error = new Error('Không tìm thấy bài học')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // --- BYPASS CHECK FOR ADMIN/INSTRUCTOR ---
        const isAdmin = userRole === USER_ROLES.ADMIN
        const isCourseInstructor =
            userRole === USER_ROLES.INSTRUCTOR &&
            String(lesson.course.instructorId) === String(userId)

        if (!isAdmin && !isCourseInstructor) {
            // Check if user is enrolled (not DROPPED)
            const enrollment = await prisma.enrollment.findFirst({
                where: {
                    userId,
                    courseId: lesson.courseId,
                    status: {
                        in: [
                            ENROLLMENT_STATUS.ACTIVE,
                            ENROLLMENT_STATUS.COMPLETED,
                        ],
                    },
                },
            })

            if (!enrollment) {
                const error = new Error('Bạn chưa đăng ký vào khóa học này')
                error.statusCode = HTTP_STATUS.FORBIDDEN
                throw error
            }
        }

        // Upsert note
        const note = await prisma.lessonNote.upsert({
            where: {
                userId_lessonId: {
                    userId,
                    lessonId,
                },
            },
            create: {
                userId,
                lessonId,
                courseId: lesson.courseId,
                content: content || '',
            },
            update: {
                content: content || '',
            },
        })

        return {
            note: {
                id: note.id,
                content: note.content,
                createdAt: note.createdAt,
                updatedAt: note.updatedAt,
            },
        }
    }

    /**
     * Delete note for a lesson
     * DELETE /api/v1/notes/lessons/:lessonId
     */
    async deleteLessonNote(userId, lessonId, userRole = null) {
        // Get lesson
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                course: true,
            },
        })

        if (!lesson) {
            const error = new Error('Không tìm thấy bài học')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // --- BYPASS CHECK FOR ADMIN/INSTRUCTOR ---
        const isAdmin = userRole === USER_ROLES.ADMIN
        const isCourseInstructor =
            userRole === USER_ROLES.INSTRUCTOR &&
            String(lesson.course.instructorId) === String(userId)

        if (!isAdmin && !isCourseInstructor) {
            // Check if user is enrolled (not DROPPED)
            const enrollment = await prisma.enrollment.findFirst({
                where: {
                    userId,
                    courseId: lesson.courseId,
                    status: {
                        in: [
                            ENROLLMENT_STATUS.ACTIVE,
                            ENROLLMENT_STATUS.COMPLETED,
                        ],
                    },
                },
            })

            if (!enrollment) {
                const error = new Error('Bạn chưa đăng ký vào khóa học này')
                error.statusCode = HTTP_STATUS.FORBIDDEN
                throw error
            }
        }

        // Delete note
        await prisma.lessonNote.deleteMany({
            where: {
                userId,
                lessonId,
            },
        })

        return { success: true }
    }

    /**
     * Get all notes for a course
     * GET /api/v1/notes/courses/:courseId
     */
    async getCourseNotes(userId, courseId, userRole = null) {
        // --- BYPASS CHECK FOR ADMIN/INSTRUCTOR ---
        const isAdmin = userRole === USER_ROLES.ADMIN
        let isCourseInstructor = false
        if (!isAdmin && userRole === USER_ROLES.INSTRUCTOR) {
            const course = await prisma.course.findUnique({
                where: { id: courseId },
                select: { instructorId: true },
            })
            if (course && String(course.instructorId) === String(userId)) {
                isCourseInstructor = true
            }
        }

        let courseData = null

        if (!isAdmin && !isCourseInstructor) {
            // Check if user is enrolled
            const enrollment = await prisma.enrollment.findUnique({
                where: {
                    userId_courseId: {
                        userId,
                        courseId,
                    },
                },
                include: {
                    course: true,
                },
            })

            if (!enrollment) {
                const error = new Error('Bạn chưa đăng ký vào khóa học này')
                error.statusCode = HTTP_STATUS.FORBIDDEN
                throw error
            }
            courseData = enrollment.course
        } else {
            // Fetch course data if bypassed
            courseData = await prisma.course.findUnique({
                where: { id: courseId },
            })
            if (!courseData) {
                const error = new Error('Không tìm thấy khóa học')
                error.statusCode = HTTP_STATUS.NOT_FOUND
                throw error
            }
        }

        // Get all notes for this course
        const notes = await prisma.lessonNote.findMany({
            where: {
                userId,
                courseId,
            },
            include: {
                lesson: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        lessonOrder: true,
                    },
                },
            },
            orderBy: {
                lesson: {
                    lessonOrder: 'asc',
                },
            },
        })

        return {
            course: {
                id: courseData.id,
                title: courseData.title,
            },
            notes: notes.map((note) => ({
                id: note.id,
                lesson: note.lesson,
                content: note.content,
                createdAt: note.createdAt,
                updatedAt: note.updatedAt,
            })),
        }
    }
}

export default new LessonNotesService()
