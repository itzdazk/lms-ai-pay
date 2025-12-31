// src/services/student-quizzes.service.js
// Student quiz service - extends base service
import { prisma } from '../config/database.config.js'
import {
    PAGINATION,
    USER_ROLES,
    COURSE_STATUS,
    ENROLLMENT_STATUS,
} from '../config/constants.js'
import logger from '../config/logger.config.js'
import QuizzesService from './quizzes.service.js'

class StudentQuizzesService extends QuizzesService {
    /**
     * Get quiz by ID
     * Requires: Authentication + Authorization (enrollment/instructor/admin)
     */
    async getQuizById(quizId, userId, userRole) {
        const quiz = await this.fetchQuizWithContext(quizId)

        this.assertQuizVisibility(quiz)

        // Check access permission
        await this.ensureQuizAccess(quiz, userId, userRole)

        logger.info(
            `Retrieved quiz ${quizId} by user ${userId} (role: ${userRole})`
        )

        return this.sanitizeQuiz(quiz)
    }

    /**
     * Get quizzes for a lesson
     * Requires: Authentication + Authorization (enrollment/instructor/admin)
     */
    async getLessonQuizzes(lessonId, userId, userRole) {
        // First, check access to the lesson
        const lesson = await this.fetchLessonWithCourse(lessonId)

        if (!lesson) {
            throw this.buildNotFoundError('Lesson not found')
        }

        // Check if user has access to this lesson's course
        if (userRole !== USER_ROLES.ADMIN) {
            if (userRole === USER_ROLES.INSTRUCTOR) {
                // Check if instructor owns the course
                if (lesson.course.instructorId !== userId) {
                    throw this.buildForbiddenError(
                        'You do not have permission to access quizzes for this lesson'
                    )
                }
            } else {
                // Student: Check enrollment
                const enrollment = await prisma.enrollment.findUnique({
                    where: {
                        userId_courseId: {
                            userId,
                            courseId: lesson.courseId,
                        },
                    },
                    select: {
                        status: true,
                    },
                })

                if (
                    !enrollment ||
                    enrollment.status === ENROLLMENT_STATUS.DROPPED
                ) {
                    throw this.buildForbiddenError(
                        'You are not enrolled in this course'
                    )
                }
            }
        }

        const quizzes = await prisma.quiz.findMany({
            where: {
                lessonId,
                isPublished: true,
                lesson: {
                    isPublished: true,
                    course: {
                        status: COURSE_STATUS.PUBLISHED,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
            include: {
                questionItems: {
                    orderBy: { questionOrder: 'asc' },
                },
                lesson: {
                    select: {
                        id: true,
                        title: true,
                        courseId: true,
                        isPublished: true,
                        course: {
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                                status: true,
                            },
                        },
                    },
                },
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        status: true,
                    },
                },
            },
        })

        logger.info(
            `Retrieved ${quizzes.length} quizzes for lesson ${lessonId} by user ${userId} (role: ${userRole})`
        )

        return quizzes.map((quiz) => this.sanitizeQuiz(quiz))
    }

    /**
     * Get quizzes for a course
     * Requires: Authentication + Authorization (enrollment/instructor/admin)
     */
    async getCourseQuizzes(courseId, userId, userRole) {
        // First, check access to the course
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                id: true,
                instructorId: true,
                status: true,
            },
        })

        if (!course) {
            throw this.buildNotFoundError('Course not found')
        }

        // Check if user has access to this course
        if (userRole !== USER_ROLES.ADMIN) {
            if (userRole === USER_ROLES.INSTRUCTOR) {
                // Check if instructor owns the course
                if (course.instructorId !== userId) {
                    throw this.buildForbiddenError(
                        'You do not have permission to access quizzes for this course'
                    )
                }
            } else {
                // Student: Check enrollment
                const enrollment = await prisma.enrollment.findUnique({
                    where: {
                        userId_courseId: {
                            userId,
                            courseId,
                        },
                    },
                    select: {
                        status: true,
                    },
                })

                if (
                    !enrollment ||
                    enrollment.status === ENROLLMENT_STATUS.DROPPED
                ) {
                    throw this.buildForbiddenError(
                        'You are not enrolled in this course'
                    )
                }
            }
        }

        const quizzes = await prisma.quiz.findMany({
            where: {
                courseId,
                isPublished: true,
                course: {
                    status: 'published',
                },
            },
            orderBy: { createdAt: 'asc' },
            include: {
                questionItems: {
                    orderBy: { questionOrder: 'asc' },
                },
                lesson: {
                    select: {
                        id: true,
                        title: true,
                        courseId: true,
                        isPublished: true,
                        course: {
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                                status: true,
                            },
                        },
                    },
                },
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        status: true,
                    },
                },
            },
        })

        logger.info(
            `Retrieved ${quizzes.length} quizzes for course ${courseId} by user ${userId} (role: ${userRole})`
        )

        return quizzes.map((quiz) => this.sanitizeQuiz(quiz))
    }

    /**
     * Submit quiz answers (student)
     */
    async submitQuiz({ quizId, userId, userRole, answers, startedAt }) {
        const quiz = await this.fetchQuizWithContext(quizId)

        this.assertQuizVisibility(quiz)
        await this.ensureQuizAccess(quiz, userId, userRole)

        const attemptsAllowed = null // unlimited by design
        const unlimitedAttempts = true

        const attemptsCount = await prisma.quizSubmission.count({
            where: {
                quizId,
                userId,
            },
        })

        const grading = this.gradeQuiz(quiz, answers)
        const isPassed = grading.score >= quiz.passingScore

        const submission = await prisma.quizSubmission.create({
            data: {
                quizId,
                userId,
                answers: grading.gradedAnswers,
                score: grading.score.toFixed(2),
                isPassed,
                startedAt: startedAt ? new Date(startedAt) : null,
            },
            select: {
                id: true,
                quizId: true,
                userId: true,
                answers: true,
                score: true,
                isPassed: true,
                startedAt: true,
                submittedAt: true,
            },
        })

        // Nếu đạt điểm qua, cập nhật progress.quizCompleted=true
        if (isPassed && quiz.lessonId) {
            await prisma.progress.updateMany({
                where: {
                    userId,
                    lessonId: quiz.lessonId,
                    isCompleted: true,
                    quizCompleted: false,
                },
                data: {
                    quizCompleted: true,
                },
            })
        }

        logger.info(
            `User ${userId} submitted quiz ${quizId} (score: ${grading.score})`
        )

        const attemptsUsed = attemptsCount + 1
        const attemptsRemaining = null

        return {
            submission: this.buildSubmissionResponse(submission, {
                includeAnswers: true,
                attemptNumber: attemptsUsed,
            }),
            summary: {
                totalQuestions: grading.totalQuestions,
                correctAnswers: grading.correctCount,
                score: grading.score,
                passingScore: quiz.passingScore,
                isPassed,
                attemptsAllowed: null,
                attemptsUsed,
                attemptsRemaining,
                hasRemainingAttempts: true,
            },
            quiz: this.sanitizeQuiz(quiz, {
                includeCorrectAnswers: false,
            }),
        }
    }

    /**
     * Get quiz submissions for the current user
     */
    async getQuizSubmissions({ quizId, userId, userRole, page, limit }) {
        const quiz = await this.fetchQuizWithContext(quizId)

        this.assertQuizVisibility(quiz)
        await this.ensureQuizAccess(quiz, userId, userRole)

        const sanitizedPage = Number.isInteger(page) && page > 0 ? page : 1
        const sanitizedLimit =
            Number.isInteger(limit) && limit > 0
                ? Math.min(limit, PAGINATION.MAX_LIMIT)
                : Math.min(10, PAGINATION.MAX_LIMIT)

        const skip = (sanitizedPage - 1) * sanitizedLimit

        const [items, total] = await prisma.$transaction([
            prisma.quizSubmission.findMany({
                where: {
                    quizId,
                    userId,
                },
                orderBy: {
                    submittedAt: 'desc',
                },
                skip,
                take: sanitizedLimit,
                select: {
                    id: true,
                    quizId: true,
                    userId: true,
                    answers: true,
                    score: true,
                    isPassed: true,
                    submittedAt: true,
                },
            }),
            prisma.quizSubmission.count({
                where: {
                    quizId,
                    userId,
                },
            }),
        ])

        const submissions = items.map((submission, index) => {
            const attemptNumber = total - (skip + index)
            return this.buildSubmissionResponse(submission, {
                includeAnswers: false,
                attemptNumber,
            })
        })

        return {
            items: submissions,
            total,
            page: sanitizedPage,
            limit: sanitizedLimit,
        }
    }

    /**
     * Get quiz submission detail by ID
     */
    async getQuizSubmissionById({ quizId, submissionId, userId, userRole }) {
        const quiz = await this.fetchQuizWithContext(quizId)

        this.assertQuizVisibility(quiz)
        await this.ensureQuizAccess(quiz, userId, userRole)

        const submission = await prisma.quizSubmission.findUnique({
            where: {
                id: submissionId,
            },
            select: {
                id: true,
                quizId: true,
                userId: true,
                answers: true,
                score: true,
                isPassed: true,
                submittedAt: true,
            },
        })

        if (!submission || submission.quizId !== quizId) {
            throw this.buildNotFoundError('Quiz submission not found')
        }

        if (
            submission.userId !== userId &&
            userRole !== USER_ROLES.ADMIN &&
            userRole !== USER_ROLES.INSTRUCTOR
        ) {
            throw this.buildForbiddenError(
                'You do not have permission to view this submission'
            )
        }

        return this.buildSubmissionResponse(submission, {
            includeAnswers: true,
        })
    }

    /**
     * Get attempts summary for a quiz
     */
    async getQuizAttemptsSummary({ quizId, userId, userRole }) {
        const quiz = await this.fetchQuizWithContext(quizId)

        this.assertQuizVisibility(quiz)
        await this.ensureQuizAccess(quiz, userId, userRole)

        const [attemptsCount, latestPassed] = await prisma.$transaction([
            prisma.quizSubmission.count({
                where: {
                    quizId,
                    userId,
                },
            }),
            prisma.quizSubmission.findFirst({
                where: {
                    quizId,
                    userId,
                    isPassed: true,
                },
                orderBy: {
                    submittedAt: 'desc',
                },
                select: {
                    id: true,
                    score: true,
                    submittedAt: true,
                },
            }),
        ])

        const attemptsAllowed = null
        const unlimitedAttempts = true
        const attemptsRemaining = null

        return {
            quizId,
            attemptsAllowed: null,
            attemptsUsed: attemptsCount,
            attemptsRemaining,
            hasRemainingAttempts: unlimitedAttempts || attemptsRemaining > 0,
            lastPassedSubmission: latestPassed
                ? {
                      id: latestPassed.id,
                      score:
                          latestPassed.score !== null
                              ? Number(latestPassed.score)
                              : null,
                      submittedAt: latestPassed.submittedAt,
                  }
                : null,
        }
    }

    /**
     * Get latest quiz result
     */
    async getLatestQuizResult({ quizId, userId, userRole }) {
        const quiz = await this.fetchQuizWithContext(quizId)

        this.assertQuizVisibility(quiz)
        await this.ensureQuizAccess(quiz, userId, userRole)

        const submission = await prisma.quizSubmission.findFirst({
            where: {
                quizId,
                userId,
            },
            orderBy: {
                submittedAt: 'desc',
            },
            select: {
                id: true,
                quizId: true,
                userId: true,
                answers: true,
                score: true,
                isPassed: true,
                submittedAt: true,
            },
        })

        if (!submission) {
            return null
        }

        return this.buildSubmissionResponse(submission, {
            includeAnswers: true,
        })
    }
}

export default new StudentQuizzesService()
