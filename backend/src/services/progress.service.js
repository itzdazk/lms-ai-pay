// src/services/progress.service.js
import { prisma } from '../config/database.config.js'
import logger from '../config/logger.config.js'
import { HTTP_STATUS, ENROLLMENT_STATUS } from '../config/constants.js'
import config from '../config/app.config.js'
import notificationsService from './notifications.service.js'

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
        })

        // Lấy progress của user cho các lesson này
        const progresses = await prisma.progress.findMany({
            where: {
                userId,
                lessonId: { in: lessons.map((l) => l.id) },
            },
            select: { lessonId: true, isCompleted: true, quizCompleted: true },
        })
        const progressMap = new Map(progresses.map((p) => [p.lessonId, p]))

        // Kết hợp lesson và progress, trả về lessonOrder và sort sẵn
        return lessons.map((lesson) => {
            const p = progressMap.get(lesson.id)
            return {
                lessonId: lesson.id,
                lessonOrder: lesson.lessonOrder,
                isCompleted: p ? p.isCompleted : false,
                quizCompleted: p ? (p.quizCompleted ?? false) : false,
            }
        })
    }
    /**
     * Get course progress for a user
     * Auto-calculates progress percentage based on completed lessons
     */
    async getCourseProgress(userId, courseId) {
        // Check if user is enrolled (not DROPPED)
        const enrollment = await prisma.enrollment.findFirst({
            where: {
                userId,
                courseId,
                status: {
                    in: [ENROLLMENT_STATUS.ACTIVE, ENROLLMENT_STATUS.COMPLETED],
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
        })

        if (!enrollment) {
            const error = new Error('Bạn chưa đăng ký khóa học này')
            error.statusCode = HTTP_STATUS.FORBIDDEN
            throw error
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
        })

        const totalLessons = enrollment.course.lessons.length
        const completedLessons = progressRecords.filter(
            (p) => p.isCompleted
        ).length

        // Calculate progress percentage
        const progressPercentage =
            totalLessons > 0
                ? Math.round((completedLessons / totalLessons) * 100 * 100) /
                  100
                : 0

        // Get lessons with progress
        const lessonsWithProgress = enrollment.course.lessons.map((lesson) => {
            const progress = progressRecords.find(
                (p) => p.lessonId === lesson.id
            )
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
            }
        })

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
        }
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
        })

        if (!lesson) {
            const error = new Error('Không tìm thấy khóa học')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Check if user is enrolled (not DROPPED)
        const enrollment = await prisma.enrollment.findFirst({
            where: {
                userId,
                courseId: lesson.courseId,
                status: {
                    in: [ENROLLMENT_STATUS.ACTIVE, ENROLLMENT_STATUS.COMPLETED],
                },
            },
        })

        if (!enrollment) {
            const error = new Error('Bạn chưa đăng ký vào khóa học này')
            error.statusCode = HTTP_STATUS.FORBIDDEN
            throw error
        }

        // Get progress record
        const progress = await prisma.progress.findUnique({
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
        }
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
        })

        if (!lesson) {
            const error = new Error('Không tìm thấy khóa học')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Check if user is enrolled (not DROPPED)
        const enrollment = await prisma.enrollment.findFirst({
            where: {
                userId,
                courseId: lesson.courseId,
                status: {
                    in: [ENROLLMENT_STATUS.ACTIVE, ENROLLMENT_STATUS.COMPLETED],
                },
            },
        })

        if (!enrollment) {
            const error = new Error('Bạn chưa đăng ký vào khóa học này')
            error.statusCode = HTTP_STATUS.FORBIDDEN
            throw error
        }

        // Update enrollment startedAt if not set
        if (!enrollment.startedAt) {
            await prisma.enrollment.update({
                where: { id: enrollment.id },
                data: {
                    startedAt: new Date(),
                    lastAccessedAt: new Date(),
                },
            })
        } else {
            // Update lastAccessedAt
            await prisma.enrollment.update({
                where: { id: enrollment.id },
                data: {
                    lastAccessedAt: new Date(),
                },
            })
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
        })

        return {
            progress: {
                id: progress.id,
                isCompleted: progress.isCompleted,
                watchDuration: progress.watchDuration,
                lastPosition: progress.lastPosition,
                attemptsCount: progress.attemptsCount,
            },
        }
    }

    /**
     * Update lesson progress (video position, watch duration)
     */
    async updateProgress(userId, lessonId, data) {
        const { position } = data

        // Get lesson
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
        })

        if (!lesson) {
            const error = new Error('Không tìm thấy khóa học')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Check if user is enrolled (not DROPPED)
        const enrollment = await prisma.enrollment.findFirst({
            where: {
                userId,
                courseId: lesson.courseId,
                status: {
                    in: [ENROLLMENT_STATUS.ACTIVE, ENROLLMENT_STATUS.COMPLETED],
                },
            },
        })

        if (!enrollment) {
            const error = new Error('Bạn chưa đăng ký vào khóa học này')
            error.statusCode = HTTP_STATUS.FORBIDDEN
            throw error
        }

        // Lấy progress hiện tại (nếu có)
        const currentProgress = await prisma.progress.findUnique({
            where: {
                userId_lessonId: {
                    userId,
                    lessonId,
                },
            },
        })

        const updateData = {}
        if (position !== undefined) {
            // --- Anti-cheat: kiểm tra thời gian học hợp lệ ---
            let isCheat = false
            if (currentProgress && currentProgress.updatedAt) {
                const now = Date.now()
                const lastUpdated = new Date(
                    currentProgress.updatedAt
                ).getTime()
                const deltaTime = (now - lastUpdated) / 1000 // giây
                const deltaLearned =
                    position - (currentProgress.lastPosition ?? 0)
                const ALLOWED_ERROR = 3 // sai số nhỏ (giây)
                if (deltaLearned > deltaTime + ALLOWED_ERROR) {
                    logger.warn(
                        `Anti-cheat: User ${userId} tried to update lesson ${lessonId} with deltaLearned=${deltaLearned}s > deltaTime=${deltaTime}s (allowed error ${ALLOWED_ERROR}s). Request ignored.`
                    )
                    return currentProgress // Bỏ qua request gian lận
                }
            }
            updateData.lastPosition = position
            // Luôn cập nhật watchDuration nếu position lớn hơn watchDuration hiện tại
            let newWatchDuration =
                currentProgress === null ||
                position > (currentProgress.watchDuration ?? 0)
                    ? position
                    : currentProgress.watchDuration
            if (
                currentProgress === null ||
                position > (currentProgress.watchDuration ?? 0)
            ) {
                updateData.watchDuration = position
            }
            const threshold = config.VIDEO_COMPLETE_THRESHOLD || 0.7
            // Tự động đánh dấu completed nếu đã xem >= threshold video
            if (
                lesson.videoDuration &&
                newWatchDuration >= lesson.videoDuration * threshold
            ) {
                updateData.isCompleted = true
                updateData.completedAt = new Date()
                // Đảm bảo watchedDuration = videoDuration khi hoàn thành
                updateData.watchDuration = lesson.videoDuration

                // Kiểm tra quiz: nếu không có quiz hoặc quiz không xuất bản thì quizCompleted=true
                const quiz = await prisma.quiz.findUnique({
                    where: { lessonId: lesson.id },
                })
                if (!quiz || quiz.isPublished === false) {
                    updateData.quizCompleted = true
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
        })

        // If this update marked the lesson as completed, refresh course progress percentage
        const shouldUpdateCourseProgress =
            updateData.isCompleted === true ||
            (!currentProgress?.isCompleted && progress.isCompleted === true)
        if (shouldUpdateCourseProgress) {
            await this.updateCourseProgress(userId, lesson.courseId)
        }

        // Update enrollment lastAccessedAt
        await prisma.enrollment.update({
            where: { id: enrollment.id },
            data: {
                lastAccessedAt: new Date(),
            },
        })

        return {
            progress: {
                isCompleted: progress.isCompleted,
                watchDuration: progress.watchDuration,
                lastPosition: progress.lastPosition,
                attemptsCount: progress.attemptsCount,
            },
        }
    }

    /**
     * Get resume position for a lesson
     */
    async getResumePosition(userId, lessonId) {
        // Get lesson
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
        })

        if (!lesson) {
            const error = new Error('Không tìm thấy khóa học')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Check if user is enrolled (not DROPPED)
        const enrollment = await prisma.enrollment.findFirst({
            where: {
                userId,
                courseId: lesson.courseId,
                status: {
                    in: [ENROLLMENT_STATUS.ACTIVE, ENROLLMENT_STATUS.COMPLETED],
                },
            },
        })

        if (!enrollment) {
            const error = new Error('Bạn chưa đăng ký vào khóa học này')
            error.statusCode = HTTP_STATUS.FORBIDDEN
            throw error
        }

        // Get progress record
        const progress = await prisma.progress.findUnique({
            where: {
                userId_lessonId: {
                    userId,
                    lessonId,
                },
            },
        })

        return {
            lessonId: lesson.id,
            videoDuration: lesson.videoDuration,
            resumePosition: progress?.lastPosition || 0,
            isCompleted: progress?.isCompleted || false,
        }
    }

    /**
     * Auto-update course progress percentage
     * Called when lesson is completed
     */
    async updateCourseProgress(userId, courseId) {
        // Get enrollment (not DROPPED)
        const enrollment = await prisma.enrollment.findFirst({
            where: {
                userId,
                courseId,
                status: {
                    in: [ENROLLMENT_STATUS.ACTIVE, ENROLLMENT_STATUS.COMPLETED],
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
        })

        if (!enrollment) {
            return
        }

        // Get all completed lessons
        const completedProgress = await prisma.progress.findMany({
            where: {
                userId,
                courseId,
                isCompleted: true,
            },
        })

        const totalLessons = enrollment.course.lessons.length
        const completedLessons = completedProgress.length

        // Calculate progress percentage
        const progressPercentage =
            totalLessons > 0
                ? Math.round((completedLessons / totalLessons) * 100 * 100) /
                  100
                : 0

        // Update enrollment
        const updateData = {
            progressPercentage,
            lastAccessedAt: new Date(),
        }

        // If 100% completed, mark enrollment as completed
        if (progressPercentage >= 100 && !enrollment.completedAt) {
            updateData.completedAt = new Date()
            updateData.status = ENROLLMENT_STATUS.COMPLETED

            // Create notification for course completed (student)
            await notificationsService.notifyCourseCompleted(
                userId,
                courseId,
                enrollment.course.title
            )

            // Notify instructor about student completing course
            try {
                const student = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { fullName: true },
                })
                const instructorId = enrollment.course.instructorId
                if (instructorId && student) {
                    await notificationsService.notifyInstructorStudentCompletedCourse(
                        instructorId,
                        courseId,
                        enrollment.course.title,
                        student.fullName,
                        userId
                    )
                }
            } catch (error) {
                logger.error(
                    `Failed to notify instructor about course completion: ${error.message}`
                )
                // Don't fail progress update if notification fails
            }
        }

        await prisma.enrollment.update({
            where: { id: enrollment.id },
            data: updateData,
        })

        logger.info(
            `Updated course progress for user ${userId}, course ${courseId}: ${progressPercentage}%`
        )
        // --- Update course completionRate after enrollment completed ---
        if (updateData.status === ENROLLMENT_STATUS.COMPLETED) {
            // Đếm tổng số enrollment và số enrollment đã hoàn thành
            const [totalEnrollments, completedEnrollments] = await Promise.all([
                prisma.enrollment.count({ where: { courseId } }),
                prisma.enrollment.count({
                    where: { courseId, status: ENROLLMENT_STATUS.COMPLETED },
                }),
            ])
            const completionRate =
                totalEnrollments > 0
                    ? Math.round(
                          (completedEnrollments / totalEnrollments) * 10000
                      ) / 100
                    : 0
            await prisma.course.update({
                where: { id: courseId },
                data: { completionRate },
            })
            logger.info(
                `Updated course completionRate for course ${courseId}: ${completionRate}%`
            )
        }
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
        })

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
        }))
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
        })

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
        }))
    }

    /**
     * Merge viewed segments, calculate total watched time, and check completion
     * @param {Array<{start:number,end:number}>} segments
     * @param {number} videoDuration
     * @param {number} [threshold=0.75] - percent required to complete (default 75%)
     * @returns {{mergedSegments: Array<{start:number,end:number}>, totalWatched: number, isCompleted: boolean}}
     */
    calculateLessonCompletion(segments, videoDuration, threshold = 0.75) {
        if (
            !Array.isArray(segments) ||
            segments.length === 0 ||
            !videoDuration
        ) {
            return { mergedSegments: [], totalWatched: 0, isCompleted: false }
        }
        // Sort segments by start
        segments = segments
            .filter(
                (s) =>
                    typeof s.start === 'number' &&
                    typeof s.end === 'number' &&
                    s.end > s.start
            )
            .sort((a, b) => a.start - b.start)
        const merged = []
        for (const seg of segments) {
            if (merged.length === 0) {
                merged.push({ ...seg })
            } else {
                const last = merged[merged.length - 1]
                if (seg.start <= last.end) {
                    // Overlap or adjacent: merge
                    last.end = Math.max(last.end, seg.end)
                } else {
                    merged.push({ ...seg })
                }
            }
        }
        // Calculate total watched time
        const totalWatched = merged.reduce(
            (sum, seg) => sum + (seg.end - seg.start),
            0
        )
        // Completion: watched >= threshold * videoDuration
        const isCompleted = totalWatched >= videoDuration * threshold
        return { mergedSegments: merged, totalWatched, isCompleted }
    }
}

export default new ProgressService()
