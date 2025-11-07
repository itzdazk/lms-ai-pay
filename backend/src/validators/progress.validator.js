// src/validators/progress.validator.js
import { param, body } from 'express-validator';
import { validate } from '../middlewares/validate.middleware.js';

// Get course progress validator
export const getCourseProgressValidator = [
    param('courseId')
        .isInt({ min: 1 })
        .withMessage('Course ID must be a positive integer'),
    validate,
];

// Get lesson progress validator
export const getLessonProgressValidator = [
    param('lessonId')
        .isInt({ min: 1 })
        .withMessage('Lesson ID must be a positive integer'),
    validate,
];

// Start lesson validator
export const startLessonValidator = [
    param('lessonId')
        .isInt({ min: 1 })
        .withMessage('Lesson ID must be a positive integer'),
    validate,
];

// Update progress validator
export const updateProgressValidator = [
    param('lessonId')
        .isInt({ min: 1 })
        .withMessage('Lesson ID must be a positive integer'),
    body('position')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Position must be a non-negative integer'),
    body('watchDuration')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Watch duration must be a non-negative integer'),
    validate,
];

// Complete lesson validator
export const completeLessonValidator = [
    param('lessonId')
        .isInt({ min: 1 })
        .withMessage('Lesson ID must be a positive integer'),
    validate,
];

// Get resume position validator
export const getResumePositionValidator = [
    param('lessonId')
        .isInt({ min: 1 })
        .withMessage('Lesson ID must be a positive integer'),
    validate,
];


