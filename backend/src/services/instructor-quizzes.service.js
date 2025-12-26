// src/services/instructor-quizzes.service.js
// Instructor quiz service - extends base service
import { prisma } from '../config/database.config.js';
import { PAGINATION } from '../config/constants.js';
import logger from '../config/logger.config.js';
import QuizzesService from './quizzes.service.js';

class InstructorQuizzesService extends QuizzesService {
    /**
     * Create quiz for a lesson (instructor)
     */
    async createQuizForLesson({ lessonId, userId, userRole, payload }) {
        const lesson = await this.fetchLessonWithCourse(lessonId);

        if (!lesson) {
            throw this.buildNotFoundError('Lesson not found');
        }

        const course =
            lesson.course ??
            (lesson.courseId
                ? await this.fetchCourseSummary(lesson.courseId)
                : null);

        const instructorId = course?.instructorId ?? null;
        this.ensureInstructorOwnership(instructorId, userId, userRole);

        const quizData = this.buildQuizDataFromPayload(payload);
        quizData.lessonId = lesson.id;
        quizData.courseId = lesson.courseId ?? null;

        if (!quizData.title) {
            throw this.buildBadRequestError('Quiz title is required');
        }

        if (
            !Array.isArray(quizData.questions) ||
            quizData.questions.length === 0
        ) {
            throw this.buildBadRequestError(
                'Quiz must include at least one question'
            );
        }

        const created = await prisma.quiz.create({
            data: quizData,
        });

        logger.info(
            `Instructor ${userId} created quiz ${created.id} for lesson ${lesson.id}`
        );

        const quiz = await this.fetchQuizWithContext(created.id);

        return this.sanitizeQuiz(quiz, {
            includeCorrectAnswers: true,
        });
    }

    /**
     * Update quiz details (instructor)
     */
    async updateQuiz({ quizId, userId, userRole, payload }) {
        const quiz = await this.fetchQuizWithContext(quizId);

        this.ensureInstructorQuizAccess(quiz, userId, userRole);

        const updateData = this.buildQuizDataFromPayload(payload, {
            isUpdate: true,
        });

        if (Object.keys(updateData).length === 0) {
            throw this.buildBadRequestError('No updates provided');
        }

        const updated = await prisma.quiz.update({
            where: { id: quizId },
            data: updateData,
        });

        logger.info(`Instructor ${userId} updated quiz ${quizId}`);

        const refreshed = await this.fetchQuizWithContext(updated.id);

        return this.sanitizeQuiz(refreshed, {
            includeCorrectAnswers: true,
        });
    }

    /**
     * Delete quiz (instructor)
     */
    async deleteQuiz({ quizId, userId, userRole }) {
        const quiz = await this.fetchQuizWithContext(quizId);

        this.ensureInstructorQuizAccess(quiz, userId, userRole);

        await prisma.quiz.delete({
            where: { id: quizId },
        });

        logger.info(`Instructor ${userId} deleted quiz ${quizId}`);
    }

    /**
     * Publish or unpublish quiz (instructor)
     */
    async setQuizPublishStatus({ quizId, userId, userRole, isPublished }) {
        const quiz = await this.fetchQuizWithContext(quizId);

        this.ensureInstructorQuizAccess(quiz, userId, userRole);

        const updated = await prisma.quiz.update({
            where: { id: quizId },
            data: {
                isPublished: Boolean(isPublished),
            },
        });

        logger.info(
            `Instructor ${userId} set quiz ${quizId} publish status to ${isPublished}`
        );

        const refreshed = await this.fetchQuizWithContext(updated.id);

        return this.sanitizeQuiz(refreshed, {
            includeCorrectAnswers: true,
        });
    }

    /**
     * Get quiz submissions for instructor
     */
    async getInstructorQuizSubmissions({
        quizId,
        userId,
        userRole,
        page,
        limit,
        studentId,
        isPassed,
    }) {
        const quiz = await this.fetchQuizWithContext(quizId);

        this.ensureInstructorQuizAccess(quiz, userId, userRole);

        const sanitizedPage = Number.isInteger(page) && page > 0 ? page : 1;
        const sanitizedLimit =
            Number.isInteger(limit) && limit > 0
                ? Math.min(limit, PAGINATION.MAX_LIMIT)
                : Math.min(20, PAGINATION.MAX_LIMIT);

        const skip = (sanitizedPage - 1) * sanitizedLimit;

        const whereClause = {
            quizId,
            ...(studentId ? { userId: studentId } : {}),
            ...(typeof isPassed === 'boolean' ? { isPassed } : {}),
        };

        const [items, total] = await prisma.$transaction([
            prisma.quizSubmission.findMany({
                where: whereClause,
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
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                        },
                    },
                },
            }),
            prisma.quizSubmission.count({
                where: whereClause,
            }),
        ]);

        const submissions = items.map((submission, index) => {
            const attemptNumber = total - (skip + index);
            const response = this.buildSubmissionResponse(submission, {
                includeAnswers: true,
                attemptNumber,
            });

            return {
                ...response,
                student: submission.user
                    ? {
                          id: submission.user.id,
                          fullName: submission.user.fullName,
                          email: submission.user.email,
                      }
                    : null,
            };
        });

        return {
            items: submissions,
            total,
            page: sanitizedPage,
            limit: sanitizedLimit,
        };
    }

    /**
     * Get quiz analytics summary for instructor
     */
    async getQuizAnalytics({ quizId, userId, userRole }) {
        const quiz = await this.fetchQuizWithContext(quizId);

        this.ensureInstructorQuizAccess(quiz, userId, userRole);

        const [
            aggregate,
            passCount,
            distinctStudents,
            latestSubmission,
            bestSubmission,
            attemptGroups,
        ] = await prisma.$transaction([
            prisma.quizSubmission.aggregate({
                where: { quizId },
                _count: { _all: true },
                _avg: { score: true },
            }),
            prisma.quizSubmission.count({
                where: { quizId, isPassed: true },
            }),
            prisma.quizSubmission.findMany({
                where: { quizId },
                distinct: ['userId'],
                select: { userId: true },
            }),
            prisma.quizSubmission.findFirst({
                where: { quizId },
                orderBy: { submittedAt: 'desc' },
                select: {
                    id: true,
                    userId: true,
                    score: true,
                    isPassed: true,
                    submittedAt: true,
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                        },
                    },
                },
            }),
            prisma.quizSubmission.findFirst({
                where: { quizId },
                orderBy: [
                    { score: 'desc' },
                    { submittedAt: 'asc' },
                ],
                select: {
                    id: true,
                    userId: true,
                    score: true,
                    isPassed: true,
                    submittedAt: true,
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                        },
                    },
                },
            }),
            prisma.quizSubmission.groupBy({
                by: ['userId'],
                where: { quizId },
                _count: { _all: true },
            }),
        ]);

        const totalSubmissions = aggregate?._count?._all ?? 0;
        const totalStudents = distinctStudents.length;
        const averageScore =
            aggregate?._avg?.score !== null &&
            aggregate?._avg?.score !== undefined
                ? Number(aggregate._avg.score)
                : null;
        const passRate =
            totalSubmissions > 0
                ? Number(
                      ((passCount / totalSubmissions) * 100).toFixed(2)
                  )
                : 0;

        const attemptCounts = attemptGroups.map((group) => group._count._all);

        const attemptsSummary =
            attemptCounts.length > 0
                ? {
                      min: Math.min(...attemptCounts),
                      max: Math.max(...attemptCounts),
                      average: Number(
                          (
                              attemptCounts.reduce(
                                  (acc, value) => acc + value,
                                  0
                              ) / attemptCounts.length
                          ).toFixed(2)
                      ),
                  }
                : {
                      min: 0,
                      max: 0,
                      average: 0,
                  };

        return {
            quiz: this.sanitizeQuiz(quiz, {
                includeCorrectAnswers: true,
            }),
            totals: {
                submissions: totalSubmissions,
                students: totalStudents,
                passed: passCount,
                passRate,
            },
            scores: {
                average: averageScore,
                highest:
                    bestSubmission && bestSubmission.score !== null
                        ? Number(bestSubmission.score)
                        : null,
            },
            latestSubmission: latestSubmission
                ? {
                      id: latestSubmission.id,
                      userId: latestSubmission.userId,
                      score:
                          latestSubmission.score !== null
                              ? Number(latestSubmission.score)
                              : null,
                      isPassed: latestSubmission.isPassed,
                      submittedAt: latestSubmission.submittedAt,
                      student: latestSubmission.user
                          ? {
                                id: latestSubmission.user.id,
                                fullName: latestSubmission.user.fullName,
                                email: latestSubmission.user.email,
                            }
                          : null,
                  }
                : null,
            bestSubmission: bestSubmission
                ? {
                      id: bestSubmission.id,
                      userId: bestSubmission.userId,
                      score:
                          bestSubmission.score !== null
                              ? Number(bestSubmission.score)
                              : null,
                      isPassed: bestSubmission.isPassed,
                      submittedAt: bestSubmission.submittedAt,
                      student: bestSubmission.user
                          ? {
                                id: bestSubmission.user.id,
                                fullName: bestSubmission.user.fullName,
                                email: bestSubmission.user.email,
                            }
                          : null,
                  }
                : null,
            attempts: attemptsSummary,
        };
    }
}

export default new InstructorQuizzesService();

