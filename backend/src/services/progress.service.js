// src/services/progress.service.js
import { prisma } from '../config/database.config.js';
import logger from '../config/logger.config.js';
import { HTTP_STATUS, ENROLLMENT_STATUS } from '../config/constants.js';
import notificationsService from './notifications.service.js';

class ProgressService {
        /**
         * Get progress status for all lessons in a course (for LessonList UI)
         * Returns: [{ lessonId, isCompleted, quizCompleted }]
         */
        async getCourseLessonProgressList(userId, courseId) {
            // Lấy tất cả lesson thuộc course, có lessonOrder
            const lessons = await prisma.lesson.findMany({
                where: { courseId, isPublished: true },
                select: { id: true, lessonOrder: true },
                orderBy: { lessonOrder: 'asc' },
            });

            // Lấy progress của user cho các lesson này
            const progresses = await prisma.progress.findMany({
                where: {
                    userId,
                    lessonId: { in: lessons.map(l => l.id) },
                },
                select: { lessonId: true, isCompleted: true, quizCompleted: true },
            });
            const progressMap = new Map(progresses.map(p => [p.lessonId, p]));

            // Kết hợp lesson và progress, trả về lessonOrder và sort sẵn
            return lessons.map(lesson => {
                const p = progressMap.get(lesson.id);
                return {
                    lessonId: lesson.id,
                    lessonOrder: lesson.lessonOrder,
                    isCompleted: p ? p.isCompleted : false,
                    quizCompleted: p ? (p.quizCompleted ?? false) : false,
                };
            });
        }
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
                          lessonId: lesson.id,
                          isCompleted: progress.isCompleted,
                          quizCompleted: progress.quizCompleted ?? false,
                          completedAt: progress.completedAt,
                          watchDuration: progress.watchDuration,
                          lastPosition: progress.lastPosition,
                          attemptsCount: progress.attemptsCount,
                      }
                    : {
                          lessonId: lesson.id,
                          isCompleted: false,
                          quizCompleted: false,
                          completedAt: null,
                          watchDuration: 0,
                          lastPosition: 0,
                          attemptsCount: 0,
                      },
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
        const { position } = data;

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

        // Lấy progress hiện tại (nếu có)
        const currentProgress = await prisma.progress.findUnique({
            where: {
                userId_lessonId: {
                    userId,
                    lessonId,
                },
            },
        });

        const updateData = {};
        if (position !== undefined) {
            updateData.lastPosition = position;
            // Luôn cập nhật watchDuration nếu position lớn hơn watchDuration hiện tại
            let newWatchDuration = currentProgress === null || position > (currentProgress.watchDuration ?? 0)
                ? position
                : currentProgress.watchDuration;
            if (currentProgress === null || position > (currentProgress.watchDuration ?? 0)) {
                updateData.watchDuration = position;
            }
                        // Tự động đánh dấu completed nếu đã xem >= 70% video
                        if (lesson.videoDuration && newWatchDuration >= lesson.videoDuration * 0.7) {
                                updateData.isCompleted = true;
                                updateData.completedAt = new Date();

                                // Kiểm tra quiz: nếu không có quiz hoặc quiz không xuất bản thì quizCompleted=true
                                const quiz = await prisma.quiz.findUnique({
                                    where: { lessonId: lesson.id },
                                });
                                if (!quiz || quiz.isPublished === false) {
                                    updateData.quizCompleted = true;
                                }
                        }
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
                watchDuration: position || 0,
                isCompleted: false,
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

        // Kiểm tra watchDuration đã đủ 70% videoDuration chưa
        const progressRecord = await prisma.progress.findUnique({
            where: {
                userId_lessonId: {
                    userId,
                    lessonId,
                },
            },
        });
        const videoDuration = lesson.videoDuration || 0;
        const watched = progressRecord?.watchDuration || 0;
        if (!videoDuration || watched < videoDuration * 0.7) {
            const error = new Error('Bạn cần xem ít nhất 70% video để hoàn thành bài học này.');
            error.statusCode = HTTP_STATUS.FORBIDDEN;
            throw error;
        }
        // Kiểm tra quiz: nếu không có quiz hoặc quiz không xuất bản thì quizCompleted=true
        let quizCompleted = false;
        const quiz = await prisma.quiz.findUnique({ where: { lessonId: lesson.id } });
        if (!quiz || quiz.isPublished === false) {
            quizCompleted = true;
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
                quizCompleted,
            },
            update: {
                isCompleted: true,
                completedAt: new Date(),
                quizCompleted,
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

    /**
     * Merge viewed segments, calculate total watched time, and check completion
     * @param {Array<{start:number,end:number}>} segments
     * @param {number} videoDuration
     * @param {number} [threshold=0.75] - percent required to complete (default 75%)
     * @returns {{mergedSegments: Array<{start:number,end:number}>, totalWatched: number, isCompleted: boolean}}
     */
    calculateLessonCompletion(segments, videoDuration, threshold = 0.75) {
        if (!Array.isArray(segments) || segments.length === 0 || !videoDuration) {
            return { mergedSegments: [], totalWatched: 0, isCompleted: false };
        }
        // Sort segments by start
        segments = segments
            .filter(s => typeof s.start === 'number' && typeof s.end === 'number' && s.end > s.start)
            .sort((a, b) => a.start - b.start);
        const merged = [];
        for (const seg of segments) {
            if (merged.length === 0) {
                merged.push({ ...seg });
            } else {
                const last = merged[merged.length - 1];
                if (seg.start <= last.end) {
                    // Overlap or adjacent: merge
                    last.end = Math.max(last.end, seg.end);
                } else {
                    merged.push({ ...seg });
                }
            }
        }
        // Calculate total watched time
        const totalWatched = merged.reduce((sum, seg) => sum + (seg.end - seg.start), 0);
        // Completion: watched >= threshold * videoDuration
        const isCompleted = totalWatched >= videoDuration * threshold;
        return { mergedSegments: merged, totalWatched, isCompleted };
    }
}

export default new ProgressService();

