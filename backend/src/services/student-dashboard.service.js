// src/services/student-dashboard.service.js
import { prisma } from '../config/database.config.js'
import { ENROLLMENT_STATUS } from '../config/constants.js'

class StudentDashboardService {
    /**
     * Get student dashboard overview
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Dashboard data
     */
    async getStudentDashboard(userId) {
        // Get stats
        const stats = await this.getStudentStats(userId)

        // Get enrolled courses with progress
        const enrolledCourses = await this.getStudentEnrolledCourses(userId)

        // Get continue watching
        const continueWatching = await this.getStudentContinueWatching(userId, 5)

        return {
            stats,
            enrolledCourses,
            continueWatching,
        }
    }

    /**
     * Get student statistics
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Statistics
     */
    async getStudentStats(userId) {
        // Total enrollments (all statuses)
        const totalEnrollments = await prisma.enrollment.count({
            where: { userId },
        })

        // Active enrollments
        const activeEnrollments = await prisma.enrollment.count({
            where: {
                userId,
                status: ENROLLMENT_STATUS.ACTIVE,
            },
        })

        // Completed enrollments
        const completedEnrollments = await prisma.enrollment.count({
            where: {
                userId,
                status: ENROLLMENT_STATUS.COMPLETED,
            },
        })

        // Total lessons completed
        const totalLessonsCompleted = await prisma.progress.count({
            where: {
                userId,
                isCompleted: true,
            },
        })

        // Total study time (in minutes) - sum of watchDuration from progress
        const progressRecords = await prisma.progress.findMany({
            where: { userId },
            select: { watchDuration: true },
        })

        const totalStudyTime = progressRecords.reduce(
            (sum, record) => sum + (record.watchDuration || 0),
            0
        )

        // Courses in progress (enrolled but not completed)
        const coursesInProgress = await prisma.enrollment.count({
            where: {
                userId,
                status: ENROLLMENT_STATUS.ACTIVE,
                completedAt: null,
            },
        })

        return {
            totalEnrollments,
            activeEnrollments,
            completedEnrollments,
            coursesInProgress,
            totalLessonsCompleted,
            totalStudyTime, // in minutes
        }
    }

    /**
     * Get student enrolled courses with progress
     * @param {number} userId - User ID
     * @param {number} limit - Limit results
     * @returns {Promise<Array>} Enrolled courses
     */
    async getStudentEnrolledCourses(userId, limit = 10) {
        const enrollments = await prisma.enrollment.findMany({
            where: {
                userId,
                status: {
                    in: [ENROLLMENT_STATUS.ACTIVE, ENROLLMENT_STATUS.COMPLETED],
                },
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        thumbnailUrl: true,
                        totalLessons: true,
                        ratingAvg: true,
                        ratingCount: true,
                        instructor: {
                            select: {
                                id: true,
                                fullName: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                lastAccessedAt: 'desc',
            },
            take: limit,
        })

        // Calculate progress for each enrollment
        const enrollmentsWithProgress = await Promise.all(
            enrollments.map(async (enrollment) => {
                // Count completed lessons for this course
                const completedLessons = await prisma.progress.count({
                    where: {
                        userId,
                        courseId: enrollment.courseId,
                        isCompleted: true,
                    },
                })

                const progressPercentage =
                    enrollment.course.totalLessons > 0
                        ? Math.round(
                              (completedLessons / enrollment.course.totalLessons) * 100
                          )
                        : 0

                return {
                    id: enrollment.id,
                    courseId: enrollment.courseId,
                    enrolledAt: enrollment.enrolledAt,
                    lastAccessedAt: enrollment.lastAccessedAt,
                    completedAt: enrollment.completedAt,
                    status: enrollment.status,
                    progressPercentage,
                    completedLessons,
                    totalLessons: enrollment.course.totalLessons,
                    course: enrollment.course,
                }
            })
        )

        return enrollmentsWithProgress
    }

    /**
     * Get continue watching lessons for student
     * @param {number} userId - User ID
     * @param {number} limit - Limit results
     * @returns {Promise<Array>} Continue watching lessons
     */
    async getStudentContinueWatching(userId, limit = 10) {
        // Get progress records that are not completed and have watchDuration > 0
        const progressRecords = await prisma.progress.findMany({
            where: {
                userId,
                isCompleted: false,
                watchDuration: {
                    gt: 0,
                },
            },
            include: {
                lesson: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        videoUrl: true,
                        videoDuration: true,
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

        return progressRecords.map((progress) => ({
            id: progress.lesson.id,
            title: progress.lesson.title,
            slug: progress.lesson.slug,
            videoUrl: progress.lesson.videoUrl,
            videoDuration: progress.lesson.videoDuration,
            watchDuration: progress.watchDuration,
            position: progress.position,
            course: progress.lesson.course,
            lastWatchedAt: progress.updatedAt,
        }))
    }
}

export default new StudentDashboardService()


