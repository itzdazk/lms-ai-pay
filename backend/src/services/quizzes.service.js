// src/services/quizzes.service.js
import { prisma } from '../config/database.config.js';
import {
    COURSE_STATUS,
    ENROLLMENT_STATUS,
    ERROR_CODES,
    HTTP_STATUS,
    PAGINATION,
    USER_ROLES,
} from '../config/constants.js';
import logger from '../config/logger.config.js';

class QuizzesService {
    /**
     * Sanitize quiz questions for public consumption
     * Removes correct answers unless explicitly allowed
     */
    #sanitizeQuestions(questions = [], includeCorrectAnswers = false) {
        if (!Array.isArray(questions)) {
            return [];
        }

        return questions.map((question) => {
            if (typeof question !== 'object' || question === null) {
                return question;
            }

            const { correctAnswer, ...rest } = question;

            if (includeCorrectAnswers) {
                return {
                    ...rest,
                    correctAnswer,
                };
            }

            return rest;
        });
    }

    /**
     * Sanitize quiz response
     */
    #sanitizeQuiz(quiz, options = {}) {
        const {
            includeCorrectAnswers = false,
            includeQuestions = true,
        } = options;

        if (!quiz) {
            return null;
        }

        const sanitizedQuiz = {
            id: quiz.id,
            title: quiz.title,
            description: quiz.description,
            lessonId: quiz.lessonId,
            courseId: quiz.courseId,
            passingScore: quiz.passingScore,
            attemptsAllowed: quiz.attemptsAllowed,
            isPublished: quiz.isPublished,
            createdAt: quiz.createdAt,
            updatedAt: quiz.updatedAt,
        };

        if (includeQuestions) {
            sanitizedQuiz.questions = this.#sanitizeQuestions(
                quiz.questions,
                includeCorrectAnswers
            );
        }

        if (quiz.lesson) {
            sanitizedQuiz.lesson = {
                id: quiz.lesson.id,
                title: quiz.lesson.title,
                isPublished: quiz.lesson.isPublished,
                course: quiz.lesson.course
                    ? {
                          id: quiz.lesson.course.id,
                          title: quiz.lesson.course.title,
                          slug: quiz.lesson.course.slug,
                          status: quiz.lesson.course.status,
                      }
                    : null,
            };
        }

        if (quiz.course) {
            sanitizedQuiz.course = {
                id: quiz.course.id,
                title: quiz.course.title,
                slug: quiz.course.slug,
                status: quiz.course.status,
            };
        }

        return sanitizedQuiz;
    }

    /**
     * Helper to build not found error
     */
    #buildNotFoundError(message) {
        const error = new Error(message);
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        error.code = ERROR_CODES.NOT_FOUND;
        return error;
    }

    /**
     * Helper to build forbidden error
     */
    #buildForbiddenError(message) {
        const error = new Error(message);
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        error.code = ERROR_CODES.AUTHORIZATION_ERROR;
        return error;
    }

    /**
     * Helper to build bad request error
     */
    #buildBadRequestError(message) {
        const error = new Error(message);
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        error.code = ERROR_CODES.VALIDATION_ERROR;
        return error;
    }

    /**
     * Resolve course ID associated with a quiz
     */
    #resolveCourseId(quiz) {
        if (!quiz) {
            return null;
        }

        if (quiz.courseId) {
            return quiz.courseId;
        }

        if (quiz.course?.id) {
            return quiz.course.id;
        }

        if (quiz.lesson?.courseId) {
            return quiz.lesson.courseId;
        }

        if (quiz.lesson?.course?.id) {
            return quiz.lesson.course.id;
        }

        return null;
    }

    /**
     * Fetch quiz with context required for access control
     */
    async #fetchQuizWithContext(quizId) {
        return prisma.quiz.findUnique({
            where: { id: quizId },
            include: {
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
    }

    /**
     * Resolve instructor ID associated with a quiz
     */
    #getCourseInstructorId(quiz) {
        if (!quiz) {
            return null;
        }

        if (quiz.course?.instructorId) {
            return quiz.course.instructorId;
        }

        if (quiz.lesson?.course?.instructorId) {
            return quiz.lesson.course.instructorId;
        }

        return null;
    }

    /**
     * Ensure the acting user is the course instructor or an admin
     */
    #ensureInstructorOwnership(instructorId, userId, userRole) {
        if (userRole === USER_ROLES.ADMIN) {
            return;
        }

        if (instructorId === null || instructorId === undefined) {
            throw this.#buildForbiddenError(
                'Instructor permission cannot be verified for this resource'
            );
        }

        if (instructorId !== userId) {
            throw this.#buildForbiddenError(
                'You are not the instructor of this course'
            );
        }
    }

    /**
     * Ensure instructor or admin can manage the quiz
     */
    #ensureInstructorQuizAccess(quiz, userId, userRole) {
        if (!quiz) {
            throw this.#buildNotFoundError('Quiz not found');
        }

        const instructorId = this.#getCourseInstructorId(quiz);
        this.#ensureInstructorOwnership(instructorId, userId, userRole);
    }

    /**
     * Fetch lesson with course context
     */
    async #fetchLessonWithCourse(lessonId) {
        if (!lessonId) {
            return null;
        }

        return prisma.lesson.findUnique({
            where: { id: lessonId },
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
                        instructorId: true,
                    },
                },
            },
        });
    }

    /**
     * Fetch course summary
     */
    async #fetchCourseSummary(courseId) {
        if (!courseId) {
            return null;
        }

        return prisma.course.findUnique({
            where: { id: courseId },
            select: {
                id: true,
                title: true,
                slug: true,
                status: true,
                instructorId: true,
            },
        });
    }

    /**
     * Normalize quiz payload fields
     */
    #buildQuizDataFromPayload(payload = {}, options = {}) {
        const { isUpdate = false } = options;
        const data = {};

        if (!isUpdate || 'title' in payload) {
            data.title =
                typeof payload.title === 'string'
                    ? payload.title.trim()
                    : payload.title;
        }

        if ('description' in payload) {
            data.description =
                payload.description === null
                    ? null
                    : typeof payload.description === 'string'
                    ? payload.description
                    : String(payload.description ?? '');
        }

        if (!isUpdate || 'questions' in payload) {
            data.questions = Array.isArray(payload.questions)
                ? payload.questions
                : payload.questions ?? [];
        }

        if (!isUpdate || 'passingScore' in payload) {
            if (payload.passingScore !== undefined) {
                data.passingScore = Number(payload.passingScore);
            }
        }

        if (!isUpdate || 'attemptsAllowed' in payload) {
            if (payload.attemptsAllowed !== undefined) {
                data.attemptsAllowed = Number(payload.attemptsAllowed);
            }
        }

        if (!isUpdate || 'isPublished' in payload) {
            if (payload.isPublished !== undefined) {
                data.isPublished = Boolean(payload.isPublished);
            }
        }

        return data;
    }

    /**
     * Ensure the user has access to the quiz (enrollment or privileged role)
     */
    async #ensureQuizAccess(quiz, userId, userRole) {
        if (!quiz) {
            throw this.#buildNotFoundError('Quiz not found');
        }

        if (userRole === USER_ROLES.ADMIN) {
            return;
        }

        if (userRole === USER_ROLES.INSTRUCTOR) {
            const instructorId = this.#getCourseInstructorId(quiz);

            if (instructorId === null) {
                throw this.#buildForbiddenError(
                    'Instructor permission cannot be verified for this quiz'
                );
            }

            if (instructorId !== userId) {
                throw this.#buildForbiddenError(
                    'You are not the instructor of this course'
                );
            }

            return;
        }

        const courseId = this.#resolveCourseId(quiz);

        if (!courseId) {
            return;
        }

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
        });

        if (
            !enrollment ||
            enrollment.status === ENROLLMENT_STATUS.DROPPED
        ) {
            throw this.#buildForbiddenError(
                'You are not enrolled in this course'
            );
        }
    }

    /**
     * Normalize provided answers into a map
     */
    #buildAnswersMap(answers = []) {
        if (!Array.isArray(answers)) {
            return new Map();
        }

        const map = new Map();

        answers.forEach((answer) => {
            if (!answer || typeof answer !== 'object') {
                return;
            }

            const questionId =
                answer.questionId ??
                answer.id ??
                answer.question ??
                answer.questionIndex;

            if (questionId === undefined || questionId === null) {
                return;
            }

            const normalizedId = String(questionId);

            map.set(normalizedId, {
                answer:
                    answer.answer ??
                    answer.value ??
                    answer.selectedOption ??
                    answer.selectedAnswer ??
                    null,
                timeSpent:
                    typeof answer.timeSpent === 'number'
                        ? Math.max(0, Math.trunc(answer.timeSpent))
                        : null,
            });
        });

        return map;
    }

    /**
     * Resolve question identifier
     */
    #getQuestionKey(question, index) {
        if (!question || typeof question !== 'object') {
            return String(index + 1);
        }

        const identifier =
            question.id ??
            question.questionId ??
            question.key ??
            question.uid ??
            question.slug ??
            question.order ??
            null;

        return identifier !== null && identifier !== undefined
            ? String(identifier)
            : String(index + 1);
    }

    /**
     * Compare answer values
     */
    #isAnswerCorrect(providedAnswer, correctAnswer) {
        if (correctAnswer === undefined || correctAnswer === null) {
            return false;
        }

        if (Array.isArray(correctAnswer)) {
            const normalizedProvided = Array.isArray(providedAnswer)
                ? providedAnswer
                : [providedAnswer];

            const correctSet = new Set(
                correctAnswer.map((value) =>
                    value !== null && value !== undefined
                        ? String(value).trim().toLowerCase()
                        : ''
                )
            );

            const providedSet = new Set(
                normalizedProvided.map((value) =>
                    value !== null && value !== undefined
                        ? String(value).trim().toLowerCase()
                        : ''
                )
            );

            if (correctSet.size !== providedSet.size) {
                return false;
            }

            for (const value of correctSet) {
                if (!providedSet.has(value)) {
                    return false;
                }
            }

            return true;
        }

        if (
            typeof providedAnswer === 'string' ||
            typeof correctAnswer === 'string'
        ) {
            return (
                String(providedAnswer ?? '')
                    .trim()
                    .toLowerCase() ===
                String(correctAnswer ?? '').trim().toLowerCase()
            );
        }

        return providedAnswer === correctAnswer;
    }

    /**
     * Grade quiz answers
     */
    #gradeQuiz(quiz, answersPayload = []) {
        const questions = Array.isArray(quiz?.questions)
            ? quiz.questions
            : [];
        const answersMap = this.#buildAnswersMap(answersPayload);

        let correctCount = 0;

        const gradedAnswers = questions.map((question, index) => {
            const questionKey = this.#getQuestionKey(question, index);
            const correctAnswer =
                question && typeof question === 'object'
                    ? question.correctAnswer ?? null
                    : null;
            const answerEntry = answersMap.get(questionKey) ?? null;
            const providedAnswer =
                answerEntry && 'answer' in answerEntry
                    ? answerEntry.answer
                    : null;
            const timeSpent =
                answerEntry && 'timeSpent' in answerEntry
                    ? answerEntry.timeSpent
                    : null;

            const isCorrect = this.#isAnswerCorrect(
                providedAnswer,
                correctAnswer
            );

            if (isCorrect) {
                correctCount += 1;
            }

            return {
                questionId: questionKey,
                providedAnswer:
                    providedAnswer !== undefined ? providedAnswer : null,
                correctAnswer,
                isCorrect,
                timeSpent,
            };
        });

        const totalQuestions = questions.length || 0;
        const score =
            totalQuestions > 0
                ? Number.parseFloat(
                      ((correctCount / totalQuestions) * 100).toFixed(2)
                  )
                : 0;

        return {
            gradedAnswers,
            correctCount,
            totalQuestions,
            score,
        };
    }

    /**
     * Build consistent submission response
     */
    #buildSubmissionResponse(submission, options = {}) {
        if (!submission) {
            return null;
        }

        const {
            includeAnswers = true,
            attemptNumber = undefined,
        } = options;

        const response = {
            id: submission.id,
            quizId: submission.quizId,
            userId: submission.userId,
            score:
                submission.score !== null && submission.score !== undefined
                    ? Number(submission.score)
                    : null,
            isPassed: submission.isPassed ?? null,
            submittedAt: submission.submittedAt,
        };

        if (includeAnswers) {
            response.answers = submission.answers ?? [];
        }

        if (attemptNumber !== undefined) {
            response.attemptNumber = attemptNumber;
        }

        return response;
    }

    /**
     * Ensure quiz is available publicly
     */
    #assertQuizVisibility(quiz) {
        if (!quiz) {
            throw this.#buildNotFoundError('Quiz not found');
        }

        if (!quiz.isPublished) {
            throw this.#buildNotFoundError('Quiz is not published');
        }

        if (quiz.lesson) {
            if (!quiz.lesson.isPublished) {
                throw this.#buildNotFoundError(
                    'Quiz lesson is not published'
                );
            }

            if (
                quiz.lesson.course &&
                quiz.lesson.course.status !== COURSE_STATUS.PUBLISHED
            ) {
                throw this.#buildNotFoundError('Course is not published');
            }
        }

        if (
            quiz.course &&
            quiz.course.status !== COURSE_STATUS.PUBLISHED
        ) {
            throw this.#buildNotFoundError('Course is not published');
        }
    }

    /**
     * Get quiz by ID (public)
     */
    async getQuizById(quizId) {
        const quiz = await this.#fetchQuizWithContext(quizId);

        this.#assertQuizVisibility(quiz);

        logger.info(`Retrieved quiz ${quizId} (public view)`);

        return this.#sanitizeQuiz(quiz);
    }

    /**
     * Get quizzes for a lesson (public)
     */
    async getLessonQuizzes(lessonId) {
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
        });

        logger.info(
            `Retrieved ${quizzes.length} quizzes for lesson ${lessonId}`
        );

        return quizzes.map((quiz) => this.#sanitizeQuiz(quiz));
    }

    /**
     * Get quizzes for a course (public)
     */
    async getCourseQuizzes(courseId) {
        const quizzes = await prisma.quiz.findMany({
            where: {
                courseId,
                isPublished: true,
                course: {
                    status: COURSE_STATUS.PUBLISHED,
                },
            },
            orderBy: { createdAt: 'asc' },
            include: {
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
        });

        logger.info(
            `Retrieved ${quizzes.length} quizzes for course ${courseId}`
        );

        return quizzes.map((quiz) => this.#sanitizeQuiz(quiz));
    }

    /**
     * Create quiz for a lesson (instructor)
     */
    async createQuizForLesson({ lessonId, userId, userRole, payload }) {
        const lesson = await this.#fetchLessonWithCourse(lessonId);

        if (!lesson) {
            throw this.#buildNotFoundError('Lesson not found');
        }

        const course =
            lesson.course ??
            (lesson.courseId
                ? await this.#fetchCourseSummary(lesson.courseId)
                : null);

        const instructorId = course?.instructorId ?? null;
        this.#ensureInstructorOwnership(instructorId, userId, userRole);

        const quizData = this.#buildQuizDataFromPayload(payload);
        quizData.lessonId = lesson.id;
        quizData.courseId = lesson.courseId ?? null;

        if (!quizData.title) {
            throw this.#buildBadRequestError('Quiz title is required');
        }

        if (
            !Array.isArray(quizData.questions) ||
            quizData.questions.length === 0
        ) {
            throw this.#buildBadRequestError(
                'Quiz must include at least one question'
            );
        }

        const created = await prisma.quiz.create({
            data: quizData,
        });

        logger.info(
            `Instructor ${userId} created quiz ${created.id} for lesson ${lesson.id}`
        );

        const quiz = await this.#fetchQuizWithContext(created.id);

        return this.#sanitizeQuiz(quiz, {
            includeCorrectAnswers: true,
        });
    }

    /**
     * Create quiz for a course (instructor)
     */
    async createQuizForCourse({ courseId, userId, userRole, payload }) {
        const course = await this.#fetchCourseSummary(courseId);

        if (!course) {
            throw this.#buildNotFoundError('Course not found');
        }

        this.#ensureInstructorOwnership(course.instructorId, userId, userRole);

        const quizData = this.#buildQuizDataFromPayload(payload);
        quizData.courseId = course.id;

        if (!quizData.title) {
            throw this.#buildBadRequestError('Quiz title is required');
        }

        if (
            !Array.isArray(quizData.questions) ||
            quizData.questions.length === 0
        ) {
            throw this.#buildBadRequestError(
                'Quiz must include at least one question'
            );
        }

        const created = await prisma.quiz.create({
            data: quizData,
        });

        logger.info(
            `Instructor ${userId} created quiz ${created.id} for course ${course.id}`
        );

        const quiz = await this.#fetchQuizWithContext(created.id);

        return this.#sanitizeQuiz(quiz, {
            includeCorrectAnswers: true,
        });
    }

    /**
     * Update quiz details (instructor)
     */
    async updateQuiz({ quizId, userId, userRole, payload }) {
        const quiz = await this.#fetchQuizWithContext(quizId);

        this.#ensureInstructorQuizAccess(quiz, userId, userRole);

        const updateData = this.#buildQuizDataFromPayload(payload, {
            isUpdate: true,
        });

        if (Object.keys(updateData).length === 0) {
            throw this.#buildBadRequestError('No updates provided');
        }

        const updated = await prisma.quiz.update({
            where: { id: quizId },
            data: updateData,
        });

        logger.info(`Instructor ${userId} updated quiz ${quizId}`);

        const refreshed = await this.#fetchQuizWithContext(updated.id);

        return this.#sanitizeQuiz(refreshed, {
            includeCorrectAnswers: true,
        });
    }

    /**
     * Delete quiz (instructor)
     */
    async deleteQuiz({ quizId, userId, userRole }) {
        const quiz = await this.#fetchQuizWithContext(quizId);

        this.#ensureInstructorQuizAccess(quiz, userId, userRole);

        await prisma.quiz.delete({
            where: { id: quizId },
        });

        logger.info(`Instructor ${userId} deleted quiz ${quizId}`);
    }

    /**
     * Publish or unpublish quiz (instructor)
     */
    async setQuizPublishStatus({ quizId, userId, userRole, isPublished }) {
        const quiz = await this.#fetchQuizWithContext(quizId);

        this.#ensureInstructorQuizAccess(quiz, userId, userRole);

        const updated = await prisma.quiz.update({
            where: { id: quizId },
            data: {
                isPublished: Boolean(isPublished),
            },
        });

        logger.info(
            `Instructor ${userId} set quiz ${quizId} publish status to ${isPublished}`
        );

        const refreshed = await this.#fetchQuizWithContext(updated.id);

        return this.#sanitizeQuiz(refreshed, {
            includeCorrectAnswers: true,
        });
    }


    /**
     * Submit quiz answers (student)
     */
    async submitQuiz({ quizId, userId, userRole, answers }) {
        const quiz = await this.#fetchQuizWithContext(quizId);

        this.#assertQuizVisibility(quiz);
        await this.#ensureQuizAccess(quiz, userId, userRole);

        const attemptsAllowed = quiz.attemptsAllowed ?? 0;
        const unlimitedAttempts = attemptsAllowed <= 0;

        const attemptsCount = await prisma.quizSubmission.count({
            where: {
                quizId,
                userId,
            },
        });

        if (!unlimitedAttempts && attemptsCount >= attemptsAllowed) {
            throw this.#buildForbiddenError(
                'You have reached the maximum number of attempts for this quiz'
            );
        }

        const grading = this.#gradeQuiz(quiz, answers);
        const isPassed = grading.score >= quiz.passingScore;

        const submission = await prisma.quizSubmission.create({
            data: {
                quizId,
                userId,
                answers: grading.gradedAnswers,
                score: grading.score.toFixed(2),
                isPassed,
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
        });

        logger.info(
            `User ${userId} submitted quiz ${quizId} (score: ${grading.score})`
        );

        const attemptsUsed = attemptsCount + 1;
        const attemptsRemaining = unlimitedAttempts
            ? null
            : Math.max(attemptsAllowed - attemptsUsed, 0);

        return {
            submission: this.#buildSubmissionResponse(submission, {
                includeAnswers: true,
                attemptNumber: attemptsUsed,
            }),
            summary: {
                totalQuestions: grading.totalQuestions,
                correctAnswers: grading.correctCount,
                score: grading.score,
                passingScore: quiz.passingScore,
                isPassed,
                attemptsAllowed: unlimitedAttempts ? null : attemptsAllowed,
                attemptsUsed,
                attemptsRemaining,
                hasRemainingAttempts:
                    unlimitedAttempts || attemptsRemaining > 0,
            },
            quiz: this.#sanitizeQuiz(quiz, {
                includeCorrectAnswers: false,
            }),
        };
    }

    /**
     * Get quiz submissions for the current user
     */
    async getQuizSubmissions({ quizId, userId, userRole, page, limit }) {
        const quiz = await this.#fetchQuizWithContext(quizId);

        this.#assertQuizVisibility(quiz);
        await this.#ensureQuizAccess(quiz, userId, userRole);

        const sanitizedPage = Number.isInteger(page) && page > 0 ? page : 1;
        const sanitizedLimit =
            Number.isInteger(limit) && limit > 0
                ? Math.min(limit, PAGINATION.MAX_LIMIT)
                : Math.min(10, PAGINATION.MAX_LIMIT);

        const skip = (sanitizedPage - 1) * sanitizedLimit;

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
        ]);

        const submissions = items.map((submission, index) => {
            const attemptNumber = total - (skip + index);
            return this.#buildSubmissionResponse(submission, {
                includeAnswers: false,
                attemptNumber,
            });
        });

        return {
            items: submissions,
            total,
            page: sanitizedPage,
            limit: sanitizedLimit,
        };
    }

    /**
     * Get quiz submission detail by ID
     */
    async getQuizSubmissionById({
        quizId,
        submissionId,
        userId,
        userRole,
    }) {
        const quiz = await this.#fetchQuizWithContext(quizId);

        this.#assertQuizVisibility(quiz);
        await this.#ensureQuizAccess(quiz, userId, userRole);

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
        });

        if (!submission || submission.quizId !== quizId) {
            throw this.#buildNotFoundError('Quiz submission not found');
        }

        if (
            submission.userId !== userId &&
            userRole !== USER_ROLES.ADMIN &&
            userRole !== USER_ROLES.INSTRUCTOR
        ) {
            throw this.#buildForbiddenError(
                'You do not have permission to view this submission'
            );
        }

        return this.#buildSubmissionResponse(submission, {
            includeAnswers: true,
        });
    }

    /**
     * Get attempts summary for a quiz
     */
    async getQuizAttemptsSummary({ quizId, userId, userRole }) {
        const quiz = await this.#fetchQuizWithContext(quizId);

        this.#assertQuizVisibility(quiz);
        await this.#ensureQuizAccess(quiz, userId, userRole);

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
        ]);

        const attemptsAllowed = quiz.attemptsAllowed ?? 0;
        const unlimitedAttempts = attemptsAllowed <= 0;
        const attemptsRemaining = unlimitedAttempts
            ? null
            : Math.max(attemptsAllowed - attemptsCount, 0);

        return {
            quizId,
            attemptsAllowed: unlimitedAttempts ? null : attemptsAllowed,
            attemptsUsed: attemptsCount,
            attemptsRemaining,
            hasRemainingAttempts:
                unlimitedAttempts || attemptsRemaining > 0,
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
        };
    }

    /**
     * Get latest quiz result
     */
    async getLatestQuizResult({ quizId, userId, userRole }) {
        const quiz = await this.#fetchQuizWithContext(quizId);

        this.#assertQuizVisibility(quiz);
        await this.#ensureQuizAccess(quiz, userId, userRole);

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
        });

        if (!submission) {
            return null;
        }

        return this.#buildSubmissionResponse(submission, {
            includeAnswers: true,
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
        const quiz = await this.#fetchQuizWithContext(quizId);

        this.#ensureInstructorQuizAccess(quiz, userId, userRole);

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
            const response = this.#buildSubmissionResponse(submission, {
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
        const quiz = await this.#fetchQuizWithContext(quizId);

        this.#ensureInstructorQuizAccess(quiz, userId, userRole);

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
            quiz: this.#sanitizeQuiz(quiz, {
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
            ...this.#sanitizeQuiz(quiz, {
                includeCorrectAnswers: true,
            }),
            submissionCount: quiz._count?.submissions ?? 0,
            instructorId: this.#getCourseInstructorId(quiz),
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
        const quiz = await this.#fetchQuizWithContext(quizId);

        if (!quiz) {
            throw this.#buildNotFoundError('Quiz not found');
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
            const response = this.#buildSubmissionResponse(submission, {
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

export default new QuizzesService();



