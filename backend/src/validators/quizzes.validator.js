// src/validators/quizzes.validator.js
import { body, param, query } from 'express-validator';
import { validate } from '../middlewares/validate.middleware.js';

const getQuizByIdValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Quiz ID must be a positive integer'),
    validate,
];

const getLessonQuizzesValidator = [
    param('lessonId')
        .isInt({ min: 1 })
        .withMessage('Lesson ID must be a positive integer'),
    validate,
];

const getCourseQuizzesValidator = [
    param('courseId')
        .isInt({ min: 1 })
        .withMessage('Course ID must be a positive integer'),
    validate,
];

const submitQuizValidator = [
    param('quizId')
        .isInt({ min: 1 })
        .withMessage('Quiz ID must be a positive integer'),
    body('answers')
        .isArray({ min: 1 })
        .withMessage('Answers must be a non-empty array'),
    body('answers.*.questionId')
        .isInt({ min: 1 })
        .withMessage('Each answer must include a positive questionId'),
    body('answers.*.answer')
        .not()
        .isEmpty()
        .withMessage('Each answer must include a non-empty answer value'),
    body('answers.*.timeSpent')
        .optional()
        .isInt({ min: 0 })
        .withMessage('timeSpent must be a non-negative integer when provided'),
    validate,
];

const paginationQueryValidator = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('limit must be between 1 and 100'),
];

const getQuizSubmissionsValidator = [
    param('quizId')
        .isInt({ min: 1 })
        .withMessage('Quiz ID must be a positive integer'),
    ...paginationQueryValidator,
    validate,
];

const getQuizSubmissionDetailsValidator = [
    param('quizId')
        .isInt({ min: 1 })
        .withMessage('Quiz ID must be a positive integer'),
    param('submissionId')
        .isInt({ min: 1 })
        .withMessage('Submission ID must be a positive integer'),
    validate,
];

const getQuizAttemptsValidator = [
    param('quizId')
        .isInt({ min: 1 })
        .withMessage('Quiz ID must be a positive integer'),
    validate,
];

const createLessonQuizValidator = [
    param('lessonId')
        .isInt({ min: 1 })
        .withMessage('Lesson ID must be a positive integer'),
    body('title')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Title is required'),
    body('description')
        .optional({ nullable: true })
        .isString()
        .withMessage('Description must be a string'),
    body('questions')
        .isArray({ min: 1 })
        .withMessage('Questions must be a non-empty array'),
    body('passingScore')
        .isInt({ min: 0, max: 100 })
        .withMessage('Passing score must be between 0 and 100'),
    body('attemptsAllowed')
        .optional({ nullable: true })
        .isInt({ min: 0 })
        .withMessage('Attempts allowed must be greater than or equal to 0'),
    body('isPublished')
        .optional()
        .isBoolean()
        .withMessage('isPublished must be a boolean'),
    validate,
];

const createCourseQuizValidator = [
    param('courseId')
        .isInt({ min: 1 })
        .withMessage('Course ID must be a positive integer'),
    body('title')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Title is required'),
    body('description')
        .optional({ nullable: true })
        .isString()
        .withMessage('Description must be a string'),
    body('questions')
        .isArray({ min: 1 })
        .withMessage('Questions must be a non-empty array'),
    body('passingScore')
        .isInt({ min: 0, max: 100 })
        .withMessage('Passing score must be between 0 and 100'),
    body('attemptsAllowed')
        .optional({ nullable: true })
        .isInt({ min: 0 })
        .withMessage('Attempts allowed must be greater than or equal to 0'),
    body('isPublished')
        .optional()
        .isBoolean()
        .withMessage('isPublished must be a boolean'),
    validate,
];

const updateQuizValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Quiz ID must be a positive integer'),
    body('title')
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Title must be a non-empty string'),
    body('description')
        .optional({ nullable: true })
        .isString()
        .withMessage('Description must be a string'),
    body('questions')
        .optional()
        .isArray({ min: 1 })
        .withMessage('Questions must be an array with at least one item'),
    body('passingScore')
        .optional()
        .isInt({ min: 0, max: 100 })
        .withMessage('Passing score must be between 0 and 100'),
    body('attemptsAllowed')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Attempts allowed must be greater than or equal to 0'),
    validate,
];

const deleteQuizValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Quiz ID must be a positive integer'),
    validate,
];

const publishQuizValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Quiz ID must be a positive integer'),
    body('isPublished')
        .isBoolean()
        .withMessage('isPublished must be provided as a boolean'),
    validate,
];

const getInstructorQuizSubmissionsValidator = [
    param('quizId')
        .isInt({ min: 1 })
        .withMessage('Quiz ID must be a positive integer'),
    ...paginationQueryValidator,
    query('studentId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('studentId must be a positive integer'),
    query('isPassed')
        .optional()
        .isBoolean()
        .withMessage('isPassed must be a boolean'),
    validate,
];

const getQuizAnalyticsValidator = [
    param('quizId')
        .isInt({ min: 1 })
        .withMessage('Quiz ID must be a positive integer'),
    validate,
];

const getAdminQuizzesValidator = [
    ...paginationQueryValidator,
    query('courseId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('courseId must be a positive integer'),
    query('lessonId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('lessonId must be a positive integer'),
    query('instructorId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('instructorId must be a positive integer'),
    query('isPublished')
        .optional()
        .isBoolean()
        .withMessage('isPublished must be a boolean'),
    validate,
];

const getAdminQuizSubmissionsValidator = [
    param('quizId')
        .isInt({ min: 1 })
        .withMessage('Quiz ID must be a positive integer'),
    ...paginationQueryValidator,
    query('studentId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('studentId must be a positive integer'),
    query('isPassed')
        .optional()
        .isBoolean()
        .withMessage('isPassed must be a boolean'),
    validate,
];

const generateQuizFromLessonValidator = [
    body('lessonId')
        .isInt({ min: 1 })
        .withMessage('Lesson ID must be a positive integer'),
    body('numQuestions')
        .optional()
        .isInt({ min: 1, max: 20 })
        .withMessage('Number of questions must be between 1 and 20'),
    body('difficulty')
        .optional()
        .isIn(['easy', 'medium', 'hard'])
        .withMessage('Difficulty must be one of: easy, medium, hard'),
    body('includeExplanation')
        .optional()
        .isBoolean()
        .withMessage('includeExplanation must be a boolean'),
    body('useCache')
        .optional()
        .isBoolean()
        .withMessage('useCache must be a boolean'),
    validate,
];

const generateQuizFromCourseValidator = [
    body('courseId')
        .isInt({ min: 1 })
        .withMessage('Course ID must be a positive integer'),
    body('numQuestions')
        .optional()
        .isInt({ min: 1, max: 30 })
        .withMessage('Number of questions must be between 1 and 30'),
    body('difficulty')
        .optional()
        .isIn(['easy', 'medium', 'hard'])
        .withMessage('Difficulty must be one of: easy, medium, hard'),
    body('includeExplanation')
        .optional()
        .isBoolean()
        .withMessage('includeExplanation must be a boolean'),
    body('useCache')
        .optional()
        .isBoolean()
        .withMessage('useCache must be a boolean'),
    validate,
];

export {
    getQuizByIdValidator,
    getLessonQuizzesValidator,
    getCourseQuizzesValidator,
    submitQuizValidator,
    getQuizSubmissionsValidator,
    getQuizSubmissionDetailsValidator,
    getQuizAttemptsValidator,
    createLessonQuizValidator,
    createCourseQuizValidator,
    updateQuizValidator,
    deleteQuizValidator,
    publishQuizValidator,
    getInstructorQuizSubmissionsValidator,
    getQuizAnalyticsValidator,
    getAdminQuizzesValidator,
    getAdminQuizSubmissionsValidator,
    generateQuizFromLessonValidator,
    generateQuizFromCourseValidator,
};



