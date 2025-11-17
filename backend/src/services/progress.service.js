// src/services/progress.service.js
import { prisma } from '../config/database.config.js';
import logger from '../config/logger.config.js';
import { HTTP_STATUS, ENROLLMENT_STATUS } from '../config/constants.js';
import notificationsService from './notifications.service.js';

class ProgressService {
    /**
     * Get course progress for a user
     * Auto-calculates progress percentage based on completed lessons
     */
    async getCourseProgress(userId, courseId) {
        // Check if user is enrolled
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId,
                },
            },
            include: {
                course: {
                    include: {
                        lessons: {
                            where: { isPublished: true },
                            orderBy: { lessonOrder: 'asc' },
                        },
                    },
                },
            },
        });

        if (!enrollment) {
            const error = new Error('You are not enrolled in this course');
            error.statusCode = HTTP_STATUS.FORBIDDEN;
            throw error;
        }

        // Get all progress records for this course
        const progressRecords = await prisma.progress.findMany({
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
                        videoDuration: true,
                    },
                },
            },
            orderBy: {
                lesson: {
                    lessonOrder: 'asc',
                },
            },
        });

        const totalLessons = enrollment.course.lessons.length;
        const completedLessons = progressRecords.filter(
            (p) => p.isCompleted
        ).length;

        // Calculate progress percentage
        const progressPercentage =
            totalLessons > 0
                ? Math.round((completedLessons / totalLessons) * 100 * 100) /
                  100
                : 0;

        // Get lessons with progress
        const lessonsWithProgress = enrollment.course.lessons.map((lesson) => {
            const progress = progressRecords.find(
                (p) => p.lessonId === lesson.id
            );
            return {
                ...lesson,
                progress: progress
                    ? {
                          isCompleted: progress.isCompleted,
                          completedAt: progress.completedAt,
                          watchDuration: progress.watchDuration,
                          lastPosition: progress.lastPosition,
                          attemptsCount: progress.attemptsCount,
                      }
                    : null,
            };
        });

        return {
            enrollment: {
                id: enrollment.id,
                enrolledAt: enrollment.enrolledAt,
                startedAt: enrollment.startedAt,
                completedAt: enrollment.completedAt,
                progressPercentage: enrollment.progressPercentage,
                status: enrollment.status,
            },
            course: {
                id: enrollment.course.id,
                title: enrollment.course.title,
                totalLessons,
            },
            progress: {
                completedLessons,
                totalLessons,
                progressPercentage,
            },
            lessons: lessonsWithProgress,
        };
    }

    /**
     * Get lesson progress for a user
     */
    async getLessonProgress(userId, lessonId) {
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

        // Get progress record
        const progress = await prisma.progress.findUnique({
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
                videoDuration: lesson.videoDuration,
                courseId: lesson.courseId,
            },
            progress: progress
                ? {
                      isCompleted: progress.isCompleted,
                      completedAt: progress.completedAt,
                      watchDuration: progress.watchDuration,
                      lastPosition: progress.lastPosition,
                      attemptsCount: progress.attemptsCount,
                      createdAt: progress.createdAt,
                      updatedAt: progress.updatedAt,
                  }
                : {
                      isCompleted: false,
                      completedAt: null,
                      watchDuration: 0,
                      lastPosition: 0,
                      attemptsCount: 0,
                  },
        };
    }

    /**
     * Start learning a lesson
     * Creates progress record if not exists, increments attempts count
     */
    async startLesson(userId, lessonId) {
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

        // Update enrollment startedAt if not set
        if (!enrollment.startedAt) {
            await prisma.enrollment.update({
                where: { id: enrollment.id },
                data: {
                    startedAt: new Date(),
                    lastAccessedAt: new Date(),
                },
            });
        } else {
            // Update lastAccessedAt
            await prisma.enrollment.update({
                where: { id: enrollment.id },
                data: {
                    lastAccessedAt: new Date(),
                },
            });
        }

        // Get or create progress record
        const progress = await prisma.progress.upsert({
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
                attemptsCount: 1,
            },
            update: {
                attemptsCount: {
                    increment: 1,
                },
            },
        });

        return {
            progress: {
                id: progress.id,
                isCompleted: progress.isCompleted,
                watchDuration: progress.watchDuration,
                lastPosition: progress.lastPosition,
                attemptsCount: progress.attemptsCount,
            },
        };
    }

    /**
     * Update lesson progress (video position, watch duration)
     */
    async updateProgress(userId, lessonId, data) {
        const { position, watchDuration } = data;

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

        // Update or create progress record
        const updateData = {};
        if (position !== undefined) {
            updateData.lastPosition = position;
        }
        if (watchDuration !== undefined) {
            updateData.watchDuration = watchDuration;
        }

        const progress = await prisma.progress.upsert({
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
                lastPosition: position || 0,
                watchDuration: watchDuration || 0,
            },
            update: updateData,
        });

        // Update enrollment lastAccessedAt
        await prisma.enrollment.update({
            where: { id: enrollment.id },
            data: {
                lastAccessedAt: new Date(),
            },
        });

        return {
            progress: {
                id: progress.id,
                isCompleted: progress.isCompleted,
                watchDuration: progress.watchDuration,
                lastPosition: progress.lastPosition,
                attemptsCount: progress.attemptsCount,
            },
        };
    }

    /**
     * Mark lesson as completed
     * Auto-updates course progress percentage
     */
    async completeLesson(userId, lessonId) {
        // Get lesson
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                course: {
                    include: {
                        lessons: {
                            where: { isPublished: true },
                        },
                    },
                },
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

        // Update or create progress record as completed
        const progress = await prisma.progress.upsert({
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
                isCompleted: true,
                completedAt: new Date(),
            },
            update: {
                isCompleted: true,
                completedAt: new Date(),
            },
        });

        // Auto-calculate course progress percentage
        await this.updateCourseProgress(userId, lesson.courseId);

        // Create notification for lesson completed
        await notificationsService.notifyLessonCompleted(
            userId,
            lesson.id,
            lesson.courseId,
            lesson.title,
            lesson.course.title
        );

        return {
            progress: {
                id: progress.id,
                isCompleted: progress.isCompleted,
                completedAt: progress.completedAt,
                watchDuration: progress.watchDuration,
                lastPosition: progress.lastPosition,
                attemptsCount: progress.attemptsCount,
            },
        };
    }

    /**
     * Get resume position for a lesson
     */
    async getResumePosition(userId, lessonId) {
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

        // Get progress record
        const progress = await prisma.progress.findUnique({
            where: {
                userId_lessonId: {
                    userId,
                    lessonId,
                },
            },
        });

        return {
            lessonId: lesson.id,
            videoDuration: lesson.videoDuration,
            resumePosition: progress?.lastPosition || 0,
            isCompleted: progress?.isCompleted || false,
        };
    }

    /**
     * Auto-update course progress percentage
     * Called when lesson is completed
     */
    async updateCourseProgress(userId, courseId) {
        // Get enrollment
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId,
                },
            },
            include: {
                course: {
                    include: {
                        lessons: {
                            where: { isPublished: true },
                        },
                    },
                },
            },
        });

        if (!enrollment) {
            return;
        }

        // Get all completed lessons
        const completedProgress = await prisma.progress.findMany({
            where: {
                userId,
                courseId,
                isCompleted: true,
            },
        });

        const totalLessons = enrollment.course.lessons.length;
        const completedLessons = completedProgress.length;

        // Calculate progress percentage
        const progressPercentage =
            totalLessons > 0
                ? Math.round((completedLessons / totalLessons) * 100 * 100) /
                  100
                : 0;

        // Update enrollment
        const updateData = {
            progressPercentage,
            lastAccessedAt: new Date(),
        };

        // If 100% completed, mark enrollment as completed
        if (progressPercentage >= 100 && !enrollment.completedAt) {
            updateData.completedAt = new Date();
            updateData.status = ENROLLMENT_STATUS.COMPLETED;

            // Create notification for course completed
            await notificationsService.notifyCourseCompleted(
                userId,
                courseId,
                enrollment.course.title
            );
        }

        await prisma.enrollment.update({
            where: { id: enrollment.id },
            data: updateData,
        });

        logger.info(
            `Updated course progress for user ${userId}, course ${courseId}: ${progressPercentage}%`
        );
    }

    /**
     * Get continue watching lessons (lessons with progress but not completed)
     */
    async getContinueWatching(userId, limit = 10) {
        const progressRecords = await prisma.progress.findMany({
            where: {
                userId,
                isCompleted: false,
                lastPosition: {
                    gt: 0,
                },
            },
            include: {
                lesson: {
                    include: {
                        course: {
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                                thumbnailUrl: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
            take: limit,
        });

        return progressRecords.map((p) => ({
            lesson: {
                id: p.lesson.id,
                title: p.lesson.title,
                slug: p.lesson.slug,
                videoDuration: p.lesson.videoDuration,
            },
            course: p.lesson.course,
            progress: {
                lastPosition: p.lastPosition,
                watchDuration: p.watchDuration,
                updatedAt: p.updatedAt,
            },
        }));
    }

    /**
     * Get recent activities
     */
    async getRecentActivities(userId, limit = 10) {
        const progressRecords = await prisma.progress.findMany({
            where: {
                userId,
            },
            include: {
                lesson: {
                    include: {
                        course: {
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                                thumbnailUrl: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
            take: limit,
        });

        return progressRecords.map((p) => ({
            lesson: {
                id: p.lesson.id,
                title: p.lesson.title,
                slug: p.lesson.slug,
            },
            course: p.lesson.course,
            activity: {
                type: p.isCompleted ? 'completed' : 'watched',
                isCompleted: p.isCompleted,
                completedAt: p.completedAt,
                updatedAt: p.updatedAt,
            },
        }));
    }
}

export default new ProgressService();

