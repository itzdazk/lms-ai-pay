// src/services/admin-quizzes.service.js
// Admin quiz service - extends base service
import { prisma } from '../config/database.config.js';
import { PAGINATION } from '../config/constants.js';
import QuizzesService from './quizzes.service.js';

class AdminQuizzesService extends QuizzesService {
    /**
     * Admin quiz listing with filters
     */
    async getAdminQuizzes({ page, limit, filters = {} }) {
        const sanitizedPage = Number.isInteger(page) && page > 0 ? page : 1;
        const sanitizedLimit =
            Number.isInteger(limit) && limit > 0
                ? Math.min(limit, PAGINATION.MAX_LIMIT)
                : Math.min(20, PAGINATION.MAX_LIMIT);

        const skip = (sanitizedPage - 1) * sanitizedLimit;

        const whereClause = {
            ...(filters.courseId ? { courseId: filters.courseId } : {}),
            ...(filters.lessonId ? { lessonId: filters.lessonId } : {}),
            ...(typeof filters.isPublished === 'boolean'
                ? { isPublished: filters.isPublished }
                : {}),
            ...(filters.instructorId
                ? {
                      OR: [
                          {
                              course: {
                                  instructorId: filters.instructorId,
                              },
                          },
                          {
                              lesson: {
                                  course: {
                                      instructorId: filters.instructorId,
                                  },
                              },
                          },
                      ],
                  }
                : {}),
        };

        const [items, total] = await prisma.$transaction([
            prisma.quiz.findMany({
                where: whereClause,
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: sanitizedLimit,
                include: {
                    lesson: {
                        select: {
                            id: true,
                            title: true,
                            courseId: true,
                            course: {
                                select: {
                                    id: true,
                                    title: true,
                                    slug: true,
                                    instructorId: true,
                                },
                            },
                        },
                    },
                    course: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            instructorId: true,
                        },
                    },
                    _count: {
                        select: {
                            submissions: true,
                        },
                    },
                },
            }),
            prisma.quiz.count({
                where: whereClause,
            }),
        ]);

        const quizzes = items.map((quiz) => ({
            ...this.sanitizeQuiz(quiz, {
                includeCorrectAnswers: true,
            }),
            submissionCount: quiz._count?.submissions ?? 0,
            instructorId: this.getCourseInstructorId(quiz),
        }));

        return {
            items: quizzes,
            total,
            page: sanitizedPage,
            limit: sanitizedLimit,
        };
    }

    /**
     * Admin view of quiz submissions
     */
    async getAdminQuizSubmissions({
        quizId,
        page,
        limit,
        studentId,
        isPassed,
    }) {
        const quiz = await this.fetchQuizWithContext(quizId);

        if (!quiz) {
            throw this.buildNotFoundError('Quiz not found');
        }

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
                            role: true,
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
                          role: submission.user.role,
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
}

export default new AdminQuizzesService();

