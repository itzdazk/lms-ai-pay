// src/services/quizzes.service.js
import { prisma } from '../config/database.config.js';
import {
    COURSE_STATUS,
    ERROR_CODES,
    HTTP_STATUS,
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
        const quiz = await prisma.quiz.findUnique({
            where: { id: quizId },
            include: {
                lesson: {
                    select: {
                        id: true,
                        title: true,
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
}

export default new QuizzesService();

