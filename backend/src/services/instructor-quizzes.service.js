// src/services/instructor-quizzes.service.js
// Instructor quiz service - extends base service
import { prisma } from '../config/database.config.js';
import { PAGINATION } from '../config/constants.js';
import logger from '../config/logger.config.js';
import QuizzesService from './quizzes.service.js';

class InstructorQuizzesService extends QuizzesService {
    /**
     * List quizzes for a lesson (instructor/admin) - include drafts
     */
    async getLessonQuizzes({ lessonId, userId, userRole }) {
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

        const quizzes = await prisma.quiz.findMany({
            where: { lessonId },
            orderBy: { createdAt: 'asc' },
            include: {
                questionItems: {
                    orderBy: { questionOrder: 'asc' },
                },
                lesson: {
                    select: {
                        id: true,
                        title: true,
                        isPublished: true,
                        courseId: true,
                        course: {
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                                status: true,
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
                        status: true,
                        instructorId: true,
                    },
                },
            },
        });

        return quizzes.map((quiz) =>
            this.sanitizeQuiz(quiz, { includeCorrectAnswers: true })
        );
    }
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

        // Enforce: at most one quiz per lesson
        const existingQuiz = await prisma.quiz.findFirst({
            where: { lessonId: lesson.id },
            select: { id: true },
        });
        if (existingQuiz) {
            throw this.buildConflictError('Lesson already has a quiz');
        }

        const quizData = this.buildQuizDataFromPayload(payload);
        quizData.lessonId = lesson.id;
        quizData.courseId = lesson.courseId ?? null;

        if (!quizData.title) {
            throw this.buildBadRequestError('Quiz title is required');
        }

        // If questions are provided, validate as array, but not required
        if (payload.questions && !Array.isArray(payload.questions)) {
            throw this.buildBadRequestError('Questions must be an array');
        }

        // Always set isPublished to false by default on creation
        quizData.isPublished = false;

        // Create quiz
        const created = await prisma.quiz.create({
            data: quizData,
        });

        // If questions are provided, create them
        if (payload.questions && Array.isArray(payload.questions) && payload.questions.length > 0) {
            const questionsData = this.buildQuestionsDataFromPayload(payload.questions, created.id);
            if (questionsData.length > 0) {
                await prisma.question.createMany({
                    data: questionsData,
                });
            }
        }

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

        // Only throw if both updateData and questions are empty
        if (Object.keys(updateData).length === 0 && !payload.questions) {
            throw this.buildBadRequestError('No updates provided');
        }

        const updated = await prisma.quiz.update({
            where: { id: quizId },
            data: updateData,
        });

        // Handle questions update if provided
        if (payload.questions && Array.isArray(payload.questions)) {
            // Delete old questions
            await prisma.question.deleteMany({
                where: { quizId },
            });

            // Create new questions
            const questionsData = this.buildQuestionsDataFromPayload(payload.questions, quizId);
            if (questionsData.length > 0) {
                await prisma.question.createMany({
                    data: questionsData,
                });
            }
        }

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

        // Lấy lessonId trước khi xóa quiz
        const lessonId = quiz.lessonId;

        await prisma.quiz.delete({
            where: { id: quizId },
        });

        // Sau khi xóa quiz, cập nhật progress: nếu isCompleted=true thì set quizCompleted=true
        await prisma.progress.updateMany({
            where: {
                lessonId,
                isCompleted: true,
                quizCompleted: false,
            },
            data: {
                quizCompleted: true,
            },
        });

        logger.info(`Instructor ${userId} deleted quiz ${quizId} and updated related progress records`);
    }

    /**
     * Publish or unpublish quiz (instructor)
     */
    async setQuizPublishStatus({ quizId, userId, userRole, isPublished }) {
        const quiz = await this.fetchQuizWithContext(quizId);

        this.ensureInstructorQuizAccess(quiz, userId, userRole);

        // Prevent publishing if quiz has no questions
        if (isPublished) {
            // quiz.questionItems may be undefined if not included, so fetch with questions if needed
            let questionCount = 0;
            if (quiz.questionItems && Array.isArray(quiz.questionItems)) {
                questionCount = quiz.questionItems.length;
            } else {
                // fallback: count questions from DB
                questionCount = await prisma.question.count({ where: { quizId } });
            }
            if (questionCount === 0) {
                throw this.buildBadRequestError('Quiz must have at least one question to be published');
            }
        }

        const updated = await prisma.quiz.update({
            where: { id: quizId },
            data: {
                isPublished: Boolean(isPublished),
            },
        });

        // Nếu chuyển sang ẩn (isPublished=false), cập nhật progress: nếu isCompleted=true thì set quizCompleted=true
        if (!isPublished) {
            const lessonId = quiz.lessonId;
            await prisma.progress.updateMany({
                where: {
                    lessonId,
                    isCompleted: true,
                    quizCompleted: false,
                },
                data: {
                    quizCompleted: true,
                },
            });
            logger.info(`Instructor ${userId} unpublished quiz ${quizId} and updated related progress records`);
        } else {
            logger.info(`Instructor ${userId} set quiz ${quizId} publish status to ${isPublished}`);
        }

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

    /**
     * Create a single question for a quiz (instructor)
     */
    async createQuestion({ quizId, userId, userRole, payload }) {
        const quiz = await this.fetchQuizWithContext(quizId);
        this.ensureInstructorQuizAccess(quiz, userId, userRole);

        // Determine next order
        const last = await prisma.question.findFirst({
            where: { quizId },
            orderBy: { questionOrder: 'desc' },
            select: { questionOrder: true },
        });
        const nextOrder = (last?.questionOrder ?? -1) + 1;

        const options = Array.isArray(payload.options) || typeof payload.options === 'object'
            ? payload.options
            : [];

        const data = {
            quizId,
            question: typeof payload.question === 'string' ? payload.question.trim() : '',
            type: payload.type || 'multiple_choice',
            options,
            correctAnswer:
                payload.correctAnswer === null || payload.correctAnswer === undefined
                    ? null
                    : String(payload.correctAnswer),
            explanation: payload.explanation ?? null,
            questionOrder: Number.isInteger(payload.questionOrder) ? payload.questionOrder : nextOrder,
        };

        const created = await prisma.question.create({ data });
        logger.info(`Instructor ${userId} created question ${created.id} in quiz ${quizId}`);

        // Return sanitized question
        const sanitized = this.sanitizeQuestions([
            { ...created }
        ], true)[0];
        return sanitized;
    }

    /**
     * Update a single question in a quiz (instructor)
     */
    async updateQuestion({ quizId, questionId, userId, userRole, payload }) {
        const quiz = await this.fetchQuizWithContext(quizId);
        this.ensureInstructorQuizAccess(quiz, userId, userRole);

        const question = await prisma.question.findUnique({
            where: { id: questionId },
            select: { id: true, quizId: true },
        });
        if (!question || question.quizId !== quizId) {
            throw this.buildNotFoundError('Question not found in this quiz');
        }

        const updateData = {};
        if ('question' in payload) {
            updateData.question = typeof payload.question === 'string' ? payload.question.trim() : '';
        }
        if ('type' in payload) {
            updateData.type = payload.type || 'multiple_choice';
        }
        if ('options' in payload) {
            updateData.options = Array.isArray(payload.options) || typeof payload.options === 'object'
                ? payload.options
                : [];
        }
        if ('correctAnswer' in payload) {
            updateData.correctAnswer = payload.correctAnswer === null || payload.correctAnswer === undefined
                ? null
                : String(payload.correctAnswer);
        }
        if ('explanation' in payload) {
            updateData.explanation = payload.explanation ?? null;
        }

        const updated = await prisma.question.update({ where: { id: questionId }, data: updateData });
        logger.info(`Instructor ${userId} updated question ${questionId} in quiz ${quizId}`);

        const sanitized = this.sanitizeQuestions([
            { ...updated }
        ], true)[0];
        return sanitized;
    }

    /**
     * Delete a single question in a quiz (instructor)
     */
    async deleteQuestion({ quizId, questionId, userId, userRole }) {
        const quiz = await this.fetchQuizWithContext(quizId);
        this.ensureInstructorQuizAccess(quiz, userId, userRole);

        // Count questions in the quiz
        const questionCount = await prisma.question.count({ where: { quizId } });

        // Prevent deleting the last question if quiz is public
        if (quiz.isPublished && questionCount === 1) {
            throw this.buildBadRequestError('Không thể xóa câu hỏi cuối cùng khi câu hỏi ôn tập đang ở trạng thái công khai. Vui lòng ẩn trước khi xóa.');
        }

        const question = await prisma.question.findUnique({
            where: { id: questionId },
            select: { id: true, quizId: true },
        });
        if (!question || question.quizId !== quizId) {
            throw this.buildNotFoundError('Question not found in this quiz');
        }

        await prisma.question.delete({ where: { id: questionId } });
        logger.info(`Instructor ${userId} deleted question ${questionId} in quiz ${quizId}`);
    }

    /**
     * Reorder questions by array of { questionId, order }
     */
    async reorderQuestions({ quizId, userId, userRole, orders = [] }) {
        const quiz = await this.fetchQuizWithContext(quizId);
        this.ensureInstructorQuizAccess(quiz, userId, userRole);

        if (!Array.isArray(orders) || orders.length === 0) {
            throw this.buildBadRequestError('Orders must be a non-empty array');
        }

        const ids = orders.map((o) => o.questionId);
        const existing = await prisma.question.findMany({
            where: { id: { in: ids }, quizId },
            select: { id: true },
        });
        const existingIds = new Set(existing.map((q) => q.id));
        for (const { questionId } of orders) {
            if (!existingIds.has(questionId)) {
                throw this.buildNotFoundError(`Question ${questionId} not found in this quiz`);
            }
        }

        await prisma.$transaction(
            orders.map(({ questionId, order }) =>
                prisma.question.update({
                    where: { id: questionId },
                    data: { questionOrder: Number(order) },
                })
            )
        );

        logger.info(`Instructor ${userId} reordered questions in quiz ${quizId}`);

        const refreshed = await this.fetchQuizWithContext(quizId);
        return this.sanitizeQuiz(refreshed, { includeCorrectAnswers: true });
    }
}

export default new InstructorQuizzesService();

