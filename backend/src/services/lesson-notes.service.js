// src/services/lesson-notes.service.js
import { prisma } from '../config/database.config.js';
import logger from '../config/logger.config.js';
import { HTTP_STATUS } from '../config/constants.js';

class LessonNotesService {
    /**
     * Get note for a lesson
     * GET /api/v1/notes/lessons/:lessonId
     */
    async getLessonNote(userId, lessonId) {
        // Get lesson with course info
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                course: true,
            },
        });

        if (!lesson) {
            const error = new Error('Lesson not found');
            error.statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }

        // Check if user is enrolled
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId: lesson.courseId,
                },
            },
        });

        if (!enrollment) {
            const error = new Error('You are not enrolled in this course');
            error.statusCode = HTTP_STATUS.FORBIDDEN;
            throw error;
        }

        // Get note
        const note = await prisma.lessonNote.findUnique({
            where: {
                userId_lessonId: {
                    userId,
                    lessonId,
                },
            },
        });

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
        };
    }

    /**
     * Create or update note for a lesson
     * PUT /api/v1/notes/lessons/:lessonId
     */
    async upsertLessonNote(userId, lessonId, content) {
        // Get lesson with course info
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                course: true,
            },
        });

        if (!lesson) {
            const error = new Error('Lesson not found');
            error.statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }

        // Check if user is enrolled
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId: lesson.courseId,
                },
            },
        });

        if (!enrollment) {
            const error = new Error('You are not enrolled in this course');
            error.statusCode = HTTP_STATUS.FORBIDDEN;
            throw error;
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
        });

        logger.info(
            `Note ${note.id ? 'updated' : 'created'} for user ${userId}, lesson ${lessonId}`
        );

        return {
            note: {
                id: note.id,
                content: note.content,
                createdAt: note.createdAt,
                updatedAt: note.updatedAt,
            },
        };
    }

    /**
     * Delete note for a lesson
     * DELETE /api/v1/notes/lessons/:lessonId
     */
    async deleteLessonNote(userId, lessonId) {
        // Get lesson
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
        });

        if (!lesson) {
            const error = new Error('Lesson not found');
            error.statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }

        // Check if user is enrolled
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId: lesson.courseId,
                },
            },
        });

        if (!enrollment) {
            const error = new Error('You are not enrolled in this course');
            error.statusCode = HTTP_STATUS.FORBIDDEN;
            throw error;
        }

        // Delete note
        await prisma.lessonNote.deleteMany({
            where: {
                userId,
                lessonId,
            },
        });

        logger.info(`Note deleted for user ${userId}, lesson ${lessonId}`);

        return { success: true };
    }

    /**
     * Get all notes for a course
     * GET /api/v1/notes/courses/:courseId
     */
    async getCourseNotes(userId, courseId) {
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
        });

        if (!enrollment) {
            const error = new Error('You are not enrolled in this course');
            error.statusCode = HTTP_STATUS.FORBIDDEN;
            throw error;
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
        });

        return {
            course: {
                id: enrollment.course.id,
                title: enrollment.course.title,
            },
            notes: notes.map((note) => ({
                id: note.id,
                lesson: note.lesson,
                content: note.content,
                createdAt: note.createdAt,
                updatedAt: note.updatedAt,
            })),
        };
    }
}

export default new LessonNotesService();

