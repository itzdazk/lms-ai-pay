// src/services/student-dashboard.service.js
import { prisma } from '../config/database.config.js'
import { ENROLLMENT_STATUS, COURSE_STATUS } from '../config/constants.js'
import aiRecommendationService from './ai-recommendation.service.js'

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
        const continueWatching = await this.getStudentContinueWatching(
            userId,
            5
        )

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
                              (completedLessons /
                                  enrollment.course.totalLessons) *
                                  100
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

    /**
     * Get recent activities for student
     * @param {number} userId - User ID
     * @param {Object} options - Options (limit, type, dateFrom)
     * @returns {Promise<Object>} Recent activities with pagination
     */
    async getRecentActivities(userId, options = {}) {
        const { limit = 10, type, dateFrom } = options

        const activities = []

        // Get enrollments
        if (!type || type === 'ENROLLMENT') {
            const enrollments = await prisma.enrollment.findMany({
                where: {
                    userId,
                    ...(dateFrom && {
                        enrolledAt: {
                            gte: new Date(dateFrom),
                        },
                    }),
                },
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
                orderBy: {
                    enrolledAt: 'desc',
                },
                take: limit,
            })

            activities.push(
                ...enrollments.map((enrollment) => ({
                    type: 'ENROLLMENT',
                    timestamp: enrollment.enrolledAt,
                    course: {
                        id: enrollment.course.id,
                        title: enrollment.course.title,
                        slug: enrollment.course.slug,
                        thumbnailUrl: enrollment.course.thumbnailUrl,
                    },
                }))
            )
        }

        // Get lesson completions
        if (!type || type === 'LESSON_COMPLETED') {
            const completedLessons = await prisma.progress.findMany({
                where: {
                    userId,
                    isCompleted: true,
                    ...(dateFrom && {
                        completedAt: {
                            gte: new Date(dateFrom),
                        },
                    }),
                },
                include: {
                    lesson: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            course: {
                                select: {
                                    id: true,
                                    title: true,
                                    slug: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    completedAt: 'desc',
                },
                take: limit,
            })

            activities.push(
                ...completedLessons.map((progress) => ({
                    type: 'LESSON_COMPLETED',
                    timestamp: progress.completedAt,
                    course: {
                        id: progress.lesson.course.id,
                        title: progress.lesson.course.title,
                        slug: progress.lesson.course.slug,
                    },
                    lesson: {
                        id: progress.lesson.id,
                        title: progress.lesson.title,
                        slug: progress.lesson.slug,
                    },
                    data: {
                        watchDuration: progress.watchDuration,
                        completedAt: progress.completedAt,
                    },
                }))
            )
        }

        // Get quiz submissions
        if (!type || type === 'QUIZ_SUBMITTED') {
            const quizSubmissions = await prisma.quizSubmission.findMany({
                where: {
                    userId,
                    ...(dateFrom && {
                        submittedAt: {
                            gte: new Date(dateFrom),
                        },
                    }),
                },
                include: {
                    quiz: {
                        select: {
                            id: true,
                            title: true,
                            lesson: {
                                select: {
                                    id: true,
                                    course: {
                                        select: {
                                            id: true,
                                            title: true,
                                            slug: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    submittedAt: 'desc',
                },
                take: limit,
            })

            activities.push(
                ...quizSubmissions.map((submission) => ({
                    type: 'QUIZ_SUBMITTED',
                    timestamp: submission.submittedAt,
                    course: {
                        id: submission.quiz.lesson.course.id,
                        title: submission.quiz.lesson.course.title,
                        slug: submission.quiz.lesson.course.slug,
                    },
                    quiz: {
                        id: submission.quiz.id,
                        title: submission.quiz.title,
                        score: submission.score,
                        isPassed: submission.isPassed,
                    },
                }))
            )
        }

        // Sort by timestamp descending and limit
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        const limitedActivities = activities.slice(0, limit)

        // Get total count for pagination
        const totalCount = await this._getTotalActivityCount(
            userId,
            type,
            dateFrom
        )

        return {
            activities: limitedActivities,
            meta: {
                total: totalCount,
                limit,
                hasMore: totalCount > limit,
            },
        }
    }

    /**
     * Helper: Get total activity count
     */
    async _getTotalActivityCount(userId, type, dateFrom) {
        let count = 0

        if (!type || type === 'ENROLLMENT') {
            count += await prisma.enrollment.count({
                where: {
                    userId,
                    ...(dateFrom && {
                        enrolledAt: {
                            gte: new Date(dateFrom),
                        },
                    }),
                },
            })
        }

        if (!type || type === 'LESSON_COMPLETED') {
            count += await prisma.progress.count({
                where: {
                    userId,
                    isCompleted: true,
                    ...(dateFrom && {
                        completedAt: {
                            gte: new Date(dateFrom),
                        },
                    }),
                },
            })
        }

        if (!type || type === 'QUIZ_SUBMITTED') {
            count += await prisma.quizSubmission.count({
                where: {
                    userId,
                    ...(dateFrom && {
                        submittedAt: {
                            gte: new Date(dateFrom),
                        },
                    }),
                },
            })
        }

        return count
    }

    /**
     * Get quiz performance analytics
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Quiz performance data
     */
    async getQuizPerformance(userId) {
        // Get all quiz submissions
        const submissions = await prisma.quizSubmission.findMany({
            where: { userId },
            include: {
                quiz: {
                    select: {
                        id: true,
                        title: true,
                        lesson: {
                            select: {
                                course: {
                                    select: {
                                        id: true,
                                        title: true,
                                    },
                                },
                            },
                        },
                        passingScore: true,
                    },
                },
            },
            orderBy: {
                submittedAt: 'desc',
            },
        })

        if (submissions.length === 0) {
            return {
                overall: {
                    totalQuizzes: 0,
                    averageScore: 0,
                    passRate: 0,
                    perfectScores: 0,
                    totalAttempts: 0,
                },
                recentQuizzes: [],
                performanceTrend: [],
                weakTopics: [],
            }
        }

        // Calculate overall stats
        const totalQuizzes = new Set(submissions.map((s) => s.quizId)).size
        const totalAttempts = submissions.length
        const scores = submissions
            .map((s) => (s.score ? Number(s.score) : 0))
            .filter((s) => s > 0)
        const averageScore =
            scores.length > 0
                ? scores.reduce((sum, score) => sum + score, 0) / scores.length
                : 0
        const passedCount = submissions.filter(
            (s) => s.isPassed === true
        ).length
        const passRate =
            totalAttempts > 0 ? (passedCount / totalAttempts) * 100 : 0
        const perfectScores = submissions.filter(
            (s) => s.score && Number(s.score) === 100
        ).length

        // Get recent quizzes (last 10)
        const recentQuizzes = submissions.slice(0, 10).map((submission) => ({
            id: submission.id,
            quizTitle: submission.quiz.title,
            courseTitle: submission.quiz.lesson.course.title,
            score: submission.score ? Number(submission.score) : 0,
            passingScore: submission.quiz.passingScore,
            isPassed: submission.isPassed,
            submittedAt: submission.submittedAt,
        }))

        // Calculate performance trend (last 30 days, grouped by week)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const recentSubmissions = submissions.filter(
            (s) => new Date(s.submittedAt) >= thirtyDaysAgo
        )

        // Group by week
        const weeklyGroups = {}
        recentSubmissions.forEach((submission) => {
            const date = new Date(submission.submittedAt)
            const weekStart = new Date(date)
            weekStart.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
            const weekKey = weekStart.toISOString().split('T')[0]

            if (!weeklyGroups[weekKey]) {
                weeklyGroups[weekKey] = []
            }
            if (submission.score) {
                weeklyGroups[weekKey].push(Number(submission.score))
            }
        })

        const performanceTrend = Object.entries(weeklyGroups)
            .map(([date, scores]) => ({
                date,
                averageScore:
                    scores.length > 0
                        ? scores.reduce((sum, s) => sum + s, 0) / scores.length
                        : 0,
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date))

        // Weak topics (quizzes with average score < 70)
        const quizScores = {}
        submissions.forEach((submission) => {
            const quizId = submission.quizId
            if (!quizScores[quizId]) {
                quizScores[quizId] = {
                    quizTitle: submission.quiz.title,
                    scores: [],
                }
            }
            if (submission.score) {
                quizScores[quizId].scores.push(Number(submission.score))
            }
        })

        const weakTopics = Object.values(quizScores)
            .map((quiz) => {
                const avgScore =
                    quiz.scores.length > 0
                        ? quiz.scores.reduce((sum, s) => sum + s, 0) /
                          quiz.scores.length
                        : 0
                return {
                    topic: quiz.quizTitle,
                    quizCount: quiz.scores.length,
                    averageScore: Math.round(avgScore * 100) / 100,
                }
            })
            .filter((topic) => topic.averageScore < 70)
            .sort((a, b) => a.averageScore - b.averageScore)
            .slice(0, 5)

        return {
            overall: {
                totalQuizzes,
                averageScore: Math.round(averageScore * 100) / 100,
                passRate: Math.round(passRate * 100) / 100,
                perfectScores,
                totalAttempts,
            },
            recentQuizzes,
            performanceTrend,
            weakTopics,
        }
    }

    /**
     * Get study time analytics
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Study time analytics
     */
    async getStudyTimeAnalytics(userId) {
        // Get all progress records
        const progressRecords = await prisma.progress.findMany({
            where: { userId },
            select: {
                watchDuration: true,
                courseId: true,
                updatedAt: true,
                lesson: {
                    select: {
                        course: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                },
            },
        })

        const now = new Date()
        const todayStart = new Date(now)
        todayStart.setHours(0, 0, 0, 0)

        const weekStart = new Date(now)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        weekStart.setHours(0, 0, 0, 0)

        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

        // Calculate totals
        const today = progressRecords
            .filter((p) => new Date(p.updatedAt) >= todayStart)
            .reduce((sum, p) => sum + (p.watchDuration || 0), 0)

        const thisWeek = progressRecords
            .filter((p) => new Date(p.updatedAt) >= weekStart)
            .reduce((sum, p) => sum + (p.watchDuration || 0), 0)

        const thisMonth = progressRecords
            .filter((p) => new Date(p.updatedAt) >= monthStart)
            .reduce((sum, p) => sum + (p.watchDuration || 0), 0)

        const allTime = progressRecords.reduce(
            (sum, p) => sum + (p.watchDuration || 0),
            0
        )

        // Calculate daily average (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const recentRecords = progressRecords.filter(
            (p) => new Date(p.updatedAt) >= thirtyDaysAgo
        )
        const totalRecentTime = recentRecords.reduce(
            (sum, p) => sum + (p.watchDuration || 0),
            0
        )
        const dailyAverage = totalRecentTime / 30 // seconds per day

        // Study time by course (top 5)
        const courseTimeMap = {}
        progressRecords.forEach((p) => {
            // Skip if course is not available (shouldn't happen, but safety check)
            if (!p.lesson?.course) {
                return
            }

            const course = p.lesson.course
            if (!courseTimeMap[p.courseId]) {
                courseTimeMap[p.courseId] = {
                    courseId: p.courseId,
                    courseTitle: course.title,
                    studyTime: 0,
                }
            }
            courseTimeMap[p.courseId].studyTime += p.watchDuration || 0
        })

        const byCourse = Object.values(courseTimeMap)
            .sort((a, b) => b.studyTime - a.studyTime)
            .slice(0, 5)
            .map((course) => ({
                courseId: course.courseId,
                courseTitle: course.courseTitle,
                studyTime: course.studyTime,
                formatted: this._formatStudyTime(course.studyTime),
                percentage:
                    allTime > 0 ? (course.studyTime / allTime) * 100 : 0,
            }))

        // Trend (last 30 days)
        const trendMap = {}
        recentRecords.forEach((p) => {
            const date = new Date(p.updatedAt).toISOString().split('T')[0]
            if (!trendMap[date]) {
                trendMap[date] = 0
            }
            trendMap[date] += p.watchDuration || 0
        })

        const trend = Object.entries(trendMap)
            .map(([date, studyTime]) => ({
                date,
                studyTime,
                formatted: this._formatStudyTime(studyTime),
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date))

        return {
            totals: {
                today,
                thisWeek,
                thisMonth,
                allTime,
            },
            formatted: {
                today: this._formatStudyTime(today),
                thisWeek: this._formatStudyTime(thisWeek),
                thisMonth: this._formatStudyTime(thisMonth),
                allTime: this._formatStudyTime(allTime),
            },
            dailyAverage: Math.round(dailyAverage),
            byCourse,
            trend,
        }
    }

    /**
     * Format study time from seconds to "Xh Ym" format
     */
    _formatStudyTime(seconds) {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        if (hours > 0) {
            return `${hours}h ${minutes}m`
        }
        return `${minutes}m`
    }

    /**
     * Get AI-powered course recommendations
     * @param {number} userId - User ID
     * @param {Object} options - Options (limit)
     * @returns {Promise<Array>} Recommended courses
     */
    async getRecommendations(userId, options = {}) {
        const { limit = 10 } = options

        try {
            const recommendations =
                await aiRecommendationService.getRecommendationsForUser(
                    userId,
                    {
                        limit,
                        forceRefresh: false,
                    }
                )

            return recommendations.map((rec) => ({
                id: rec.course.id,
                title: rec.course.title,
                slug: rec.course.slug,
                thumbnailUrl: rec.course.thumbnailUrl,
                description: rec.course.shortDescription,
                instructor: rec.course.instructor,
                price: rec.course.price,
                discountPrice: rec.course.discountPrice,
                ratingAvg: rec.course.ratingAvg,
                ratingCount: rec.course.ratingCount,
                enrolledCount: rec.course.enrolledCount,
                score: rec.score,
                reason: rec.reason,
            }))
        } catch (error) {
            // Fallback to empty array if recommendation service fails
            return []
        }
    }

    /**
     * Get learning streak for student
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Learning streak data
     */
    async getLearningStreak(userId) {
        // Get all completed lessons with completion dates
        const completedLessons = await prisma.progress.findMany({
            where: {
                userId,
                isCompleted: true,
                completedAt: { not: null },
            },
            select: {
                completedAt: true,
            },
            orderBy: {
                completedAt: 'desc',
            },
        })

        if (completedLessons.length === 0) {
            return {
                currentStreak: 0,
                longestStreak: 0,
                lastLearningDate: null,
                streakMaintained: false,
                daysUntilStreakBreak: 0,
                weeklyPattern: {
                    monday: false,
                    tuesday: false,
                    wednesday: false,
                    thursday: false,
                    friday: false,
                    saturday: false,
                    sunday: false,
                },
            }
        }

        // Get unique learning dates
        const learningDates = new Set()
        completedLessons.forEach((progress) => {
            const date = new Date(progress.completedAt)
            const dateStr = date.toISOString().split('T')[0]
            learningDates.add(dateStr)
        })

        const sortedDates = Array.from(learningDates)
            .map((d) => new Date(d))
            .sort((a, b) => b - a)

        // Calculate current streak
        let currentStreak = 0
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        let checkDate = new Date(today)
        let streakMaintained = false

        for (const date of sortedDates) {
            const dateOnly = new Date(date)
            dateOnly.setHours(0, 0, 0, 0)

            if (dateOnly.getTime() === checkDate.getTime()) {
                currentStreak++
                checkDate.setDate(checkDate.getDate() - 1)
                if (currentStreak === 1) {
                    streakMaintained = true
                }
            } else if (
                dateOnly.getTime() === yesterday.getTime() &&
                currentStreak === 0
            ) {
                // Started yesterday
                currentStreak = 1
                checkDate.setDate(checkDate.getDate() - 1)
                streakMaintained = true
            } else if (currentStreak > 0) {
                // Streak broken
                break
            }
        }

        // Calculate longest streak
        let longestStreak = 1
        let tempStreak = 1
        for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = new Date(sortedDates[i - 1])
            const currDate = new Date(sortedDates[i])
            const diffDays = Math.floor(
                (prevDate - currDate) / (1000 * 60 * 60 * 24)
            )

            if (diffDays === 1) {
                tempStreak++
                longestStreak = Math.max(longestStreak, tempStreak)
            } else {
                tempStreak = 1
            }
        }

        // Calculate weekly pattern (last 4 weeks)
        const fourWeeksAgo = new Date(today)
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

        const weeklyPattern = {
            monday: false,
            tuesday: false,
            wednesday: false,
            thursday: false,
            friday: false,
            saturday: false,
            sunday: false,
        }

        sortedDates.forEach((date) => {
            if (date >= fourWeeksAgo) {
                const dayOfWeek = date.getDay()
                const dayNames = [
                    'sunday',
                    'monday',
                    'tuesday',
                    'wednesday',
                    'thursday',
                    'friday',
                    'saturday',
                ]
                weeklyPattern[dayNames[dayOfWeek]] = true
            }
        })

        const lastLearningDate =
            sortedDates.length > 0
                ? sortedDates[0].toISOString().split('T')[0]
                : null

        // Days until streak break (if maintained today, 0; if yesterday, 1; if broken, 0)
        let daysUntilStreakBreak = 0
        if (streakMaintained) {
            const lastDate = new Date(sortedDates[0])
            lastDate.setHours(0, 0, 0, 0)
            const daysDiff = Math.floor(
                (today - lastDate) / (1000 * 60 * 60 * 24)
            )
            daysUntilStreakBreak = daysDiff === 0 ? 0 : 1
        }

        return {
            currentStreak,
            longestStreak,
            lastLearningDate,
            streakMaintained,
            daysUntilStreakBreak,
            weeklyPattern,
        }
    }

    /**
     * Get calendar heatmap data
     * @param {number} userId - User ID
     * @param {number} year - Year
     * @param {number} month - Month (1-12)
     * @returns {Promise<Object>} Calendar heatmap data
     */
    async getCalendarHeatmap(userId, year, month) {
        const targetYear = year || new Date().getFullYear()
        const targetMonth = month || new Date().getMonth() + 1

        const startDate = new Date(targetYear, targetMonth - 1, 1)
        const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59)

        // Get all progress records in the month
        const progressRecords = await prisma.progress.findMany({
            where: {
                userId,
                updatedAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                updatedAt: true,
                watchDuration: true,
                isCompleted: true,
            },
        })

        // Group by date
        const dayMap = {}
        const daysInMonth = new Date(targetYear, targetMonth, 0).getDate()

        // Initialize all days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            dayMap[dateStr] = {
                date: dateStr,
                lessonCount: 0,
                studyMinutes: 0,
                level: 'NONE',
            }
        }

        // Process progress records
        progressRecords.forEach((progress) => {
            const date = new Date(progress.updatedAt)
            const dateStr = date.toISOString().split('T')[0]

            if (dayMap[dateStr]) {
                dayMap[dateStr].studyMinutes += Math.floor(
                    (progress.watchDuration || 0) / 60
                )
                if (progress.isCompleted) {
                    dayMap[dateStr].lessonCount++
                }
            }
        })

        // Calculate level for each day
        const allStudyMinutes = Object.values(dayMap).map((d) => d.studyMinutes)
        const maxMinutes = Math.max(...allStudyMinutes, 1)

        Object.values(dayMap).forEach((day) => {
            if (day.studyMinutes === 0 && day.lessonCount === 0) {
                day.level = 'NONE'
            } else if (day.studyMinutes < maxMinutes * 0.33) {
                day.level = 'LOW'
            } else if (day.studyMinutes < maxMinutes * 0.66) {
                day.level = 'MEDIUM'
            } else {
                day.level = 'HIGH'
            }
        })

        const days = Object.values(dayMap)
        const activeDays = days.filter((d) => d.level !== 'NONE').length
        const totalLessons = days.reduce((sum, d) => sum + d.lessonCount, 0)
        const totalStudyMinutes = days.reduce(
            (sum, d) => sum + d.studyMinutes,
            0
        )

        return {
            year: targetYear,
            month: targetMonth,
            days,
            summary: {
                totalDays: daysInMonth,
                activeDays,
                totalLessons,
                totalStudyMinutes,
            },
        }
    }

    /**
     * Get certificates for student
     * @param {number} userId - User ID
     * @returns {Promise<Array>} Certificates
     */
    async getCertificates(userId) {
        // Get completed enrollments
        const completedEnrollments = await prisma.enrollment.findMany({
            where: {
                userId,
                status: ENROLLMENT_STATUS.COMPLETED,
                completedAt: { not: null },
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        instructor: {
                            select: {
                                id: true,
                                fullName: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                completedAt: 'desc',
            },
        })

        return completedEnrollments.map((enrollment, index) => ({
            id: enrollment.id,
            courseId: enrollment.courseId,
            courseTitle: enrollment.course.title,
            courseSlug: enrollment.course.slug,
            instructorName: enrollment.course.instructor.fullName,
            completedAt: enrollment.completedAt,
            certificateUrl: `/certificates/${enrollment.id}.pdf`, // Placeholder
            certificateCode: `CERT-${new Date(enrollment.completedAt).getFullYear()}-${String(enrollment.id).padStart(6, '0')}`,
            thumbnailUrl: null, // Can be added later
        }))
    }

    /**
     * Get learning goals for student
     * @param {number} userId - User ID
     * @returns {Promise<Array>} Learning goals
     */
    async getLearningGoals(userId) {
        const goals = await prisma.learningGoal.findMany({
            where: { userId },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        return goals.map((goal) => {
            const percentage =
                goal.targetValue > 0
                    ? (goal.currentValue / goal.targetValue) * 100
                    : 0

            return {
                id: goal.id,
                type: goal.type,
                targetValue: goal.targetValue,
                currentValue: goal.currentValue,
                percentage: Math.min(percentage, 100),
                status: goal.status,
                deadline: goal.deadline,
                course: goal.course,
                createdAt: goal.createdAt,
            }
        })
    }

    /**
     * Create learning goal
     * @param {number} userId - User ID
     * @param {Object} data - Goal data
     * @returns {Promise<Object>} Created goal
     */
    async createLearningGoal(userId, data) {
        const { type, targetValue, courseId, deadline } = data

        const goal = await prisma.learningGoal.create({
            data: {
                userId,
                type,
                targetValue,
                currentValue: 0,
                courseId: courseId || null,
                deadline: deadline ? new Date(deadline) : null,
                status: 'IN_PROGRESS',
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                    },
                },
            },
        })

        return {
            id: goal.id,
            type: goal.type,
            targetValue: goal.targetValue,
            currentValue: goal.currentValue,
            percentage: 0,
            status: goal.status,
            deadline: goal.deadline,
            course: goal.course,
            createdAt: goal.createdAt,
        }
    }

    /**
     * Update learning goal
     * @param {number} userId - User ID
     * @param {number} goalId - Goal ID
     * @param {Object} data - Update data
     * @returns {Promise<Object>} Updated goal
     */
    async updateLearningGoal(userId, goalId, data) {
        // Verify ownership
        const existingGoal = await prisma.learningGoal.findFirst({
            where: {
                id: goalId,
                userId,
            },
        })

        if (!existingGoal) {
            throw new Error('Learning goal not found')
        }

        const updateData = {}
        if (data.type !== undefined) updateData.type = data.type
        if (data.targetValue !== undefined)
            updateData.targetValue = data.targetValue
        if (data.courseId !== undefined)
            updateData.courseId = data.courseId || null
        if (data.deadline !== undefined)
            updateData.deadline = data.deadline ? new Date(data.deadline) : null
        if (data.status !== undefined) updateData.status = data.status

        const goal = await prisma.learningGoal.update({
            where: { id: goalId },
            data: updateData,
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                    },
                },
            },
        })

        const percentage =
            goal.targetValue > 0
                ? (goal.currentValue / goal.targetValue) * 100
                : 0

        return {
            id: goal.id,
            type: goal.type,
            targetValue: goal.targetValue,
            currentValue: goal.currentValue,
            percentage: Math.min(percentage, 100),
            status: goal.status,
            deadline: goal.deadline,
            course: goal.course,
            createdAt: goal.createdAt,
        }
    }

    /**
     * Delete learning goal
     * @param {number} userId - User ID
     * @param {number} goalId - Goal ID
     * @returns {Promise<void>}
     */
    async deleteLearningGoal(userId, goalId) {
        const goal = await prisma.learningGoal.findFirst({
            where: {
                id: goalId,
                userId,
            },
        })

        if (!goal) {
            throw new Error('Learning goal not found')
        }

        await prisma.learningGoal.delete({
            where: { id: goalId },
        })
    }

    /**
     * Get bookmarks for student
     * @param {number} userId - User ID
     * @returns {Promise<Array>} Bookmarks
     */
    async getBookmarks(userId) {
        const bookmarks = await prisma.bookmark.findMany({
            where: { userId },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        thumbnailUrl: true,
                    },
                },
                lesson: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        course: {
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        return bookmarks.map((bookmark) => ({
            id: bookmark.id,
            type: bookmark.type,
            course: bookmark.course,
            lesson: bookmark.lesson,
            note: bookmark.note,
            createdAt: bookmark.createdAt,
        }))
    }

    /**
     * Create bookmark
     * @param {number} userId - User ID
     * @param {Object} data - Bookmark data
     * @returns {Promise<Object>} Created bookmark
     */
    async createBookmark(userId, data) {
        const { type, courseId, lessonId, note } = data

        if (type === 'COURSE' && !courseId) {
            throw new Error('Course ID is required for course bookmark')
        }
        if (type === 'LESSON' && (!courseId || !lessonId)) {
            throw new Error(
                'Course ID and Lesson ID are required for lesson bookmark'
            )
        }

        const bookmark = await prisma.bookmark.create({
            data: {
                userId,
                type,
                courseId: courseId || null,
                lessonId: lessonId || null,
                note: note || null,
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        thumbnailUrl: true,
                    },
                },
                lesson: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        course: {
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                            },
                        },
                    },
                },
            },
        })

        return {
            id: bookmark.id,
            type: bookmark.type,
            course: bookmark.course,
            lesson: bookmark.lesson,
            note: bookmark.note,
            createdAt: bookmark.createdAt,
        }
    }

    /**
     * Delete bookmark
     * @param {number} userId - User ID
     * @param {number} bookmarkId - Bookmark ID
     * @returns {Promise<void>}
     */
    async deleteBookmark(userId, bookmarkId) {
        const bookmark = await prisma.bookmark.findFirst({
            where: {
                id: bookmarkId,
                userId,
            },
        })

        if (!bookmark) {
            throw new Error('Bookmark not found')
        }

        await prisma.bookmark.delete({
            where: { id: bookmarkId },
        })
    }

    /**
     * Get notes summary for student
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Notes summary
     */
    async getNotesSummary(userId) {
        // Get all notes
        const allNotes = await prisma.lessonNote.findMany({
            where: { userId },
            include: {
                lesson: {
                    select: {
                        id: true,
                        title: true,
                        course: {
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
        })

        // Get recent notes (last 10)
        const recentNotes = allNotes.slice(0, 10).map((note) => ({
            id: note.id,
            lessonId: note.lessonId,
            lessonTitle: note.lesson.title,
            courseId: note.lesson.course.id,
            courseTitle: note.lesson.course.title,
            content: note.content,
            contentPreview:
                note.content.length > 100
                    ? note.content.substring(0, 100) + '...'
                    : note.content,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
        }))

        // Group by course
        const byCourseMap = {}
        allNotes.forEach((note) => {
            const courseId = note.lesson.course.id
            if (!byCourseMap[courseId]) {
                byCourseMap[courseId] = {
                    courseId,
                    courseTitle: note.lesson.course.title,
                    noteCount: 0,
                }
            }
            byCourseMap[courseId].noteCount++
        })

        const byCourse = Object.values(byCourseMap)

        return {
            totalNotes: allNotes.length,
            recentNotes,
            byCourse,
        }
    }

    /**
     * Get course progress detail
     * @param {number} userId - User ID
     * @param {number} courseId - Course ID
     * @returns {Promise<Object>} Course progress detail
     */
    async getCourseProgressDetail(userId, courseId) {
        // Get enrollment
        const enrollment = await prisma.enrollment.findFirst({
            where: {
                userId,
                courseId,
            },
        })

        if (!enrollment) {
            throw new Error('Course not enrolled')
        }

        // Get course with chapters and lessons
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                chapters: {
                    where: { isPublished: true },
                    include: {
                        lessons: {
                            where: { isPublished: true },
                            orderBy: { lessonOrder: 'asc' },
                        },
                    },
                    orderBy: { chapterOrder: 'asc' },
                },
                lessons: {
                    where: {
                        isPublished: true,
                        chapterId: null, // Lessons without chapters
                    },
                    orderBy: { lessonOrder: 'asc' },
                },
            },
        })

        if (!course) {
            throw new Error('Course not found')
        }

        // Get all progress for this course
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
                        videoDuration: true,
                    },
                },
            },
        })

        // Get quiz submissions for this course
        const quizSubmissions = await prisma.quizSubmission.findMany({
            where: {
                userId,
                quiz: {
                    courseId,
                },
            },
            include: {
                quiz: {
                    select: {
                        id: true,
                        lessonId: true,
                    },
                },
            },
        })

        // Build lesson progress map
        const lessonProgressMap = {}
        progressRecords.forEach((progress) => {
            const videoDuration = progress.lesson?.videoDuration || 0
            lessonProgressMap[progress.lessonId] = {
                isCompleted: progress.isCompleted,
                completedAt: progress.completedAt,
                watchDuration: progress.watchDuration,
                progressPercentage:
                    videoDuration > 0
                        ? Math.min(
                              (progress.watchDuration / videoDuration) * 100,
                              100
                          )
                        : 0,
            }
        })

        // Build quiz score map
        const quizScoreMap = {}
        quizSubmissions.forEach((submission) => {
            if (submission.quiz.lessonId) {
                if (!quizScoreMap[submission.quiz.lessonId]) {
                    quizScoreMap[submission.quiz.lessonId] = []
                }
                quizScoreMap[submission.quiz.lessonId].push(
                    submission.score ? Number(submission.score) : 0
                )
            }
        })

        // Calculate average quiz score per lesson
        const lessonQuizScoreMap = {}
        Object.entries(quizScoreMap).forEach(([lessonId, scores]) => {
            const avg =
                scores.length > 0
                    ? scores.reduce((sum, s) => sum + s, 0) / scores.length
                    : null
            lessonQuizScoreMap[lessonId] = avg
        })

        // Process chapters
        const chapters = course.chapters.map((chapter) => {
            const lessons = chapter.lessons.map((lesson) => {
                const progress = lessonProgressMap[lesson.id] || {
                    isCompleted: false,
                    completedAt: null,
                    watchDuration: 0,
                    progressPercentage: 0,
                }

                return {
                    id: lesson.id,
                    title: lesson.title,
                    slug: lesson.slug,
                    lessonOrder: lesson.lessonOrder,
                    isCompleted: progress.isCompleted,
                    completedAt: progress.completedAt,
                    watchDuration: progress.watchDuration,
                    videoDuration: lesson.videoDuration,
                    progressPercentage: progress.progressPercentage,
                    quizScore: lessonQuizScoreMap[lesson.id] || null,
                }
            })

            const completedLessons = lessons.filter((l) => l.isCompleted).length
            const totalLessons = lessons.length
            const progressPercentage =
                totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

            return {
                id: chapter.id,
                title: chapter.title,
                chapterOrder: chapter.chapterOrder,
                lessons,
                completedLessons,
                totalLessons,
                progressPercentage,
            }
        })

        // Process lessons without chapters
        const orphanLessons = course.lessons.map((lesson) => {
            const progress = lessonProgressMap[lesson.id] || {
                isCompleted: false,
                completedAt: null,
                watchDuration: 0,
                progressPercentage: 0,
            }

            return {
                id: lesson.id,
                title: lesson.title,
                slug: lesson.slug,
                lessonOrder: lesson.lessonOrder,
                isCompleted: progress.isCompleted,
                completedAt: progress.completedAt,
                watchDuration: progress.watchDuration,
                videoDuration: lesson.videoDuration,
                progressPercentage: progress.progressPercentage,
                quizScore: lessonQuizScoreMap[lesson.id] || null,
            }
        })

        // Calculate statistics
        const allLessons = [
            ...chapters.flatMap((c) => c.lessons),
            ...orphanLessons,
        ]
        const totalStudyTime = allLessons.reduce(
            (sum, l) => sum + (l.watchDuration || 0),
            0
        )
        const completedLessons = allLessons.filter((l) => l.isCompleted)
        const quizScores = allLessons
            .map((l) => l.quizScore)
            .filter((s) => s !== null)
        const averageQuizScore =
            quizScores.length > 0
                ? quizScores.reduce((sum, s) => sum + s, 0) / quizScores.length
                : null

        // Estimate remaining time (average time per lesson * remaining lessons)
        const remainingLessons = allLessons.filter((l) => !l.isCompleted)
        const avgTimePerLesson =
            completedLessons.length > 0
                ? totalStudyTime / completedLessons.length
                : 0
        const estimatedTimeRemaining =
            avgTimePerLesson * remainingLessons.length

        return {
            course: {
                id: course.id,
                title: course.title,
                slug: course.slug,
                thumbnailUrl: course.thumbnailUrl,
                totalLessons: course.totalLessons,
                completedLessons: completedLessons.length,
                progressPercentage:
                    course.totalLessons > 0
                        ? (completedLessons.length / course.totalLessons) * 100
                        : 0,
            },
            enrollment: {
                enrolledAt: enrollment.enrolledAt,
                lastAccessedAt: enrollment.lastAccessedAt,
                status: enrollment.status,
            },
            chapters,
            orphanLessons: orphanLessons.length > 0 ? orphanLessons : undefined,
            statistics: {
                totalStudyTime,
                averageQuizScore: averageQuizScore
                    ? Math.round(averageQuizScore * 100) / 100
                    : null,
                estimatedTimeRemaining: Math.round(estimatedTimeRemaining),
            },
        }
    }
}

export default new StudentDashboardService()
