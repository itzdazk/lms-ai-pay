// src/validators/lesson-notes.validator.js
import { body, param } from 'express-validator';
import { validate } from '../middlewares/validate.middleware.js';

export const getLessonNoteValidator = [
    param('lessonId')
        .isInt({ min: 1 })
        .withMessage('Lesson ID must be a positive integer'),
    validate,
];

export const upsertLessonNoteValidator = [
    param('lessonId')
        .isInt({ min: 1 })
        .withMessage('Lesson ID must be a positive integer'),
    body('content')
        .optional()
        .isString()
        .withMessage('Content must be a string'),
    validate,
];

export const deleteLessonNoteValidator = [
    param('lessonId')
        .isInt({ min: 1 })
        .withMessage('Lesson ID must be a positive integer'),
    validate,
];

export const getCourseNotesValidator = [
    param('courseId')
        .isInt({ min: 1 })
        .withMessage('Course ID must be a positive integer'),
    validate,
];

