// src/services/quizzes.service.js
// Base service with shared utilities for quiz operations
import { prisma } from '../config/database.config.js';
import {
    COURSE_STATUS,
    ENROLLMENT_STATUS,
    ERROR_CODES,
    HTTP_STATUS,
    USER_ROLES,
} from '../config/constants.js';
import logger from '../config/logger.config.js';

/**
 * Base class with shared utilities for quiz services
 * Protected methods (convention: no # prefix) can be accessed by extending classes
 */
class QuizzesService {
    /**
     * Sanitize quiz questions for public consumption
     * Questions come from Question table via quiz.questionItems
     * Removes correct answers unless explicitly allowed
     */
    sanitizeQuestions(questionItems = [], includeCorrectAnswers = false) {
        if (!Array.isArray(questionItems)) {
            return [];
        }

        const normalizeOptions = (opts) => {
            if (Array.isArray(opts)) {
                return opts;
            }
            if (opts && typeof opts === 'object') {
                const keys = Object.keys(opts).sort();
                return keys.map((k) => opts[k]);
            }
            return [];
        };

        const toIndex = (answer, opts, type) => {
            const options = normalizeOptions(opts);
            if (!includeCorrectAnswers) return null;

            if (typeof answer === 'number' && Number.isFinite(answer)) {
                return answer;
            }

            if (typeof answer === 'string') {
                // Try parse numeric index encoded as string
                const n = Number.parseInt(answer, 10);
                if (!Number.isNaN(n)) {
                    return n;
                }

                // Map letter (A, B, C, ...) to index
                const upper = answer.trim().toUpperCase();
                if (upper.length === 1 && upper >= 'A' && upper <= 'Z') {
                    return upper.charCodeAt(0) - 'A'.charCodeAt(0);
                }

                // Match by option text (case-insensitive)
                const idxByText = options.findIndex((opt) =>
                    String(opt ?? '')
                        .trim()
                        .toLowerCase() === upper.toLowerCase()
                );
                if (idxByText !== -1) {
                    return idxByText;
                }

                // True/False mapping
                if (type === 'true_false') {
                    const tf = upper === 'TRUE' || upper === 'T' ? 'true' : upper === 'FALSE' || upper === 'F' ? 'false' : upper;
                    if (tf === 'true') return 0;
                    if (tf === 'false') return 1;
                }
            }

            return null;
        };

        return questionItems.map((question) => {
            if (typeof question !== 'object' || question === null) {
                return question;
            }

            const { correctAnswer, id, quizId, createdAt, updatedAt, options, type, ...rest } = question;

            const normalizedOptions = normalizeOptions(options);

            if (includeCorrectAnswers) {
                const mappedCorrect =
                    type === 'short_answer'
                        ? (typeof correctAnswer === 'string'
                              ? correctAnswer
                              : correctAnswer !== undefined && correctAnswer !== null
                              ? String(correctAnswer)
                              : '')
                        : toIndex(correctAnswer, options, type);

                return {
                    id, // include id for instructor edit operations
                    ...rest,
                    type,
                    options: normalizedOptions,
                    correctAnswer: mappedCorrect,
                };
            }

            return { ...rest, type, options: normalizedOptions };
        });
    }

    /**
     * Sanitize quiz response
     */
    sanitizeQuiz(quiz, options = {}) {
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
            isPublished: quiz.isPublished,
            createdAt: quiz.createdAt,
            updatedAt: quiz.updatedAt,
        };

        if (includeQuestions) {
            // Use questionItems from relation if available, otherwise fallback to questions JSON
            const questionsToUse = quiz.questionItems && Array.isArray(quiz.questionItems) 
                ? quiz.questionItems 
                : (Array.isArray(quiz.questions) ? quiz.questions : []);
            
            sanitizedQuiz.questions = this.sanitizeQuestions(
                questionsToUse,
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
    buildNotFoundError(message) {
        const error = new Error(message);
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        error.code = ERROR_CODES.NOT_FOUND;
        return error;
    }

    /**
     * Helper to build forbidden error
     */
    buildForbiddenError(message) {
        const error = new Error(message);
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        error.code = ERROR_CODES.AUTHORIZATION_ERROR;
        return error;
    }

    /**
     * Helper to build bad request error
     */
    buildBadRequestError(message) {
        const error = new Error(message);
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        error.code = ERROR_CODES.VALIDATION_ERROR;
        return error;
    }

    /**
     * Helper to build conflict error
     */
    buildConflictError(message) {
        const error = new Error(message);
        error.statusCode = HTTP_STATUS.CONFLICT;
        error.code = ERROR_CODES.DUPLICATE_ENTRY;
        return error;
    }

    /**
     * Resolve course ID associated with a quiz
     */
    resolveCourseId(quiz) {
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
    async fetchQuizWithContext(quizId) {
        return prisma.quiz.findUnique({
            where: { id: quizId },
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
    }

    /**
     * Resolve instructor ID associated with a quiz
     */
    getCourseInstructorId(quiz) {
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
    ensureInstructorOwnership(instructorId, userId, userRole) {
        if (userRole === USER_ROLES.ADMIN) {
            return;
        }

        if (instructorId === null || instructorId === undefined) {
            throw this.buildForbiddenError(
                'Instructor permission cannot be verified for this resource'
            );
        }

        if (instructorId !== userId) {
            throw this.buildForbiddenError(
                'You are not the instructor of this course'
            );
        }
    }

    /**
     * Ensure instructor or admin can manage the quiz
     */
    ensureInstructorQuizAccess(quiz, userId, userRole) {
        if (!quiz) {
            throw this.buildNotFoundError('Quiz not found');
        }

        const instructorId = this.getCourseInstructorId(quiz);
        this.ensureInstructorOwnership(instructorId, userId, userRole);
    }

    /**
     * Fetch lesson with course context
     */
    async fetchLessonWithCourse(lessonId) {
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
    async fetchCourseSummary(courseId) {
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
    buildQuizDataFromPayload(payload = {}, options = {}) {
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

        // Note: questions are now managed separately in the Question table
        // They are not included in quiz.questions anymore (kept for backward compatibility only)
        // Use buildQuestionsDataFromPayload() to handle question data

        if (!isUpdate || 'passingScore' in payload) {
            if (payload.passingScore !== undefined) {
                data.passingScore = Number(payload.passingScore);
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
     * Build questions data from payload
     * Returns array of question objects to be created/updated in Question table
     */
    buildQuestionsDataFromPayload(questions = [], quizId) {
        if (!Array.isArray(questions)) {
            return [];
        }

        return questions.map((q, index) => ({
            quizId,
            question: typeof q.question === 'string' ? q.question.trim() : '',
            type: q.type || 'multiple_choice',
            options: q.options || [],
            correctAnswer: q.correctAnswer || null,
            explanation: q.explanation || null,
            questionOrder: index,
        }));
    }

    /**
     * Ensure the user has access to the quiz (enrollment, progress, or privileged role)
     * Rules:
     * - Admin: Always allowed
     * - Instructor: Must be instructor of the course
     * - Student: Must be enrolled AND have reached the lesson (if quiz is for a lesson)
     */
    async ensureQuizAccess(quiz, userId, userRole) {
        if (!quiz) {
            throw this.buildNotFoundError('Quiz not found');
        }

        // Admin always has access
        if (userRole === USER_ROLES.ADMIN) {
            return;
        }

        // Instructor: Check if they own the course
        if (userRole === USER_ROLES.INSTRUCTOR) {
            const instructorId = this.getCourseInstructorId(quiz);

            if (instructorId === null) {
                throw this.buildForbiddenError(
                    'Instructor permission cannot be verified for this quiz'
                );
            }

            if (instructorId !== userId) {
                throw this.buildForbiddenError(
                    'You are not the instructor of this course'
                );
            }

            return;
        }

        // Student: Check enrollment AND progress
        const courseId = this.resolveCourseId(quiz);

        if (!courseId) {
            return; // Quiz không thuộc course nào → cho phép
        }

        // 1. Check enrollment
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
            throw this.buildForbiddenError(
                'You are not enrolled in this course'
            );
        }

        // 2. If quiz is for a specific lesson, check if student has reached that lesson
        if (quiz.lessonId) {
            const lesson = await prisma.lesson.findUnique({
                where: { id: quiz.lessonId },
                select: {
                    id: true,
                    lessonOrder: true,
                    courseId: true,
                    isPreview: true, // Preview lessons are always accessible
                },
            });

            if (!lesson) {
                throw this.buildNotFoundError('Lesson not found');
            }

            // Preview lessons are always accessible
            if (lesson.isPreview) {
                return;
            }

            // Check if student has progress for this lesson
            const lessonProgress = await prisma.progress.findUnique({
                where: {
                    userId_lessonId: {
                        userId,
                        lessonId: lesson.id,
                    },
                },
                select: {
                    id: true,
                    isCompleted: true,
                },
            });

            // If student has progress for this lesson → Allow
            if (lessonProgress) {
                return;
            }

            // Check if student has completed previous lessons
            const previousLessons = await prisma.lesson.findMany({
                where: {
                    courseId: lesson.courseId,
                    lessonOrder: {
                        lt: lesson.lessonOrder, // Previous lessons
                    },
                    isPublished: true,
                },
                select: {
                    id: true,
                    lessonOrder: true,
                },
                orderBy: {
                    lessonOrder: 'asc',
                },
            });

            // Check if student has completed all previous lessons
            if (previousLessons.length > 0) {
                const completedLessons = await prisma.progress.findMany({
                    where: {
                        userId,
                        lessonId: {
                            in: previousLessons.map(l => l.id),
                        },
                        isCompleted: true,
                    },
                    select: {
                        lessonId: true,
                    },
                });

                const completedLessonIds = new Set(
                    completedLessons.map(p => p.lessonId)
                );

                // Check if all previous lessons are completed
                const allPreviousCompleted = previousLessons.every(l =>
                    completedLessonIds.has(l.id)
                );

                if (!allPreviousCompleted) {
                    throw this.buildForbiddenError(
                        'You must complete previous lessons before taking this quiz'
                    );
                }
            }

            // If no previous lessons or all completed → Allow
            return;
        }

        // Quiz for course (not specific lesson) → Allow if enrolled
        return;
    }

    /**
     * Normalize provided answers into a map
     */
    buildAnswersMap(answers = []) {
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
    getQuestionKey(question, index) {
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
    isAnswerCorrect(providedAnswer, correctAnswer) {
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
    gradeQuiz(quiz, answersPayload = []) {
        // Use questionItems from Question table if available, fallback to legacy questions JSON
        let questions = [];
        if (quiz?.questionItems && Array.isArray(quiz.questionItems)) {
            questions = quiz.questionItems;
        } else if (Array.isArray(quiz?.questions)) {
            questions = quiz.questions;
        }
        
        const answersMap = this.buildAnswersMap(answersPayload);

        let correctCount = 0;

        const gradedAnswers = questions.map((question, index) => {
            const questionKey = this.getQuestionKey(question, index);
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

            const isCorrect = this.isAnswerCorrect(
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
    buildSubmissionResponse(submission, options = {}) {
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
     * Ensure quiz is published and visible
     */
    assertQuizVisibility(quiz) {
        if (!quiz) {
            throw this.buildNotFoundError('Quiz not found');
        }

        if (!quiz.isPublished) {
            throw this.buildNotFoundError('Quiz is not published');
        }

        if (quiz.lesson) {
            if (!quiz.lesson.isPublished) {
                throw this.buildNotFoundError(
                    'Quiz lesson is not published'
                );
            }

            if (
                quiz.lesson.course &&
                quiz.lesson.course.status !== COURSE_STATUS.PUBLISHED
            ) {
                throw this.buildNotFoundError('Course is not published');
            }
        }

        if (
            quiz.course &&
            quiz.course.status !== COURSE_STATUS.PUBLISHED
        ) {
            throw this.buildNotFoundError('Course is not published');
        }
    }
}

export default QuizzesService;

