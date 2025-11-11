// src/validators/quizzes.validator.js
import { param } from 'express-validator';
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

export {
    getQuizByIdValidator,
    getLessonQuizzesValidator,
    getCourseQuizzesValidator,
};

