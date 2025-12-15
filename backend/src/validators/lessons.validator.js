// src/validators/lessons.validator.js
import { body, param, query } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'

const getLessonByIdValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Lesson ID must be a positive integer'),
    validate,
]

const getLessonVideoValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Lesson ID must be a positive integer'),
    validate,
]

const getLessonTranscriptValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Lesson ID must be a positive integer'),
    validate,
]

const createLessonValidator = [
    param('courseId')
        .isInt({ min: 1 })
        .withMessage('Course ID must be a positive integer'),

    body('title')
        .trim()
        .notEmpty()
        .withMessage('Lesson title is required')
        .isLength({ min: 2, max: 200 })
        .withMessage('Lesson title must be between 2 and 200 characters'),

    body('slug')
        .optional()
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Lesson slug must be between 2 and 200 characters')
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage(
            'Slug must contain only lowercase letters, numbers and hyphens'
        ),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Description must not exceed 2000 characters'),

    body('content')
        .optional()
        .trim()
        .isLength({ max: 10000 })
        .withMessage('Content must not exceed 10000 characters'),

    body('lessonOrder')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Lesson order must be a positive integer'),

    body('isPreview')
        .optional()
        .isBoolean()
        .withMessage('isPreview must be a boolean'),

    body('isPublished')
        .optional()
        .isBoolean()
        .withMessage('isPublished must be a boolean'),

    body('chapterId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Chapter ID must be a positive integer'),

    validate,
]

const updateLessonValidator = [
    param('courseId')
        .isInt({ min: 1 })
        .withMessage('Course ID must be a positive integer'),

    param('id')
        .isInt({ min: 1 })
        .withMessage('Lesson ID must be a positive integer'),

    body('title')
        .optional()
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Lesson title must be between 2 and 200 characters'),

    body('slug')
        .optional()
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Lesson slug must be between 2 and 200 characters')
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage(
            'Slug must contain only lowercase letters, numbers and hyphens'
        ),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Description must not exceed 2000 characters'),

    body('content')
        .optional()
        .trim()
        .isLength({ max: 10000 })
        .withMessage('Content must not exceed 10000 characters'),

    body('lessonOrder')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Lesson order must be a positive integer'),

    body('isPreview')
        .optional()
        .isBoolean()
        .withMessage('isPreview must be a boolean'),

    body('isPublished')
        .optional()
        .isBoolean()
        .withMessage('isPublished must be a boolean'),

    validate,
]

const deleteLessonValidator = [
    param('courseId')
        .isInt({ min: 1 })
        .withMessage('Course ID must be a positive integer'),

    param('id')
        .isInt({ min: 1 })
        .withMessage('Lesson ID must be a positive integer'),

    validate,
]

const uploadVideoValidator = [
    param('courseId')
        .isInt({ min: 1 })
        .withMessage('Course ID must be a positive integer'),

    param('id')
        .isInt({ min: 1 })
        .withMessage('Lesson ID must be a positive integer'),

    validate,
]

const uploadTranscriptValidator = [
    param('courseId')
        .isInt({ min: 1 })
        .withMessage('Course ID must be a positive integer'),

    param('id')
        .isInt({ min: 1 })
        .withMessage('Lesson ID must be a positive integer'),

    validate,
]

const reorderLessonValidator = [
    param('courseId')
        .isInt({ min: 1 })
        .withMessage('Course ID must be a positive integer'),

    param('id')
        .isInt({ min: 1 })
        .withMessage('Lesson ID must be a positive integer'),

    body('newOrder')
        .isInt({ min: 1 })
        .withMessage('New order must be a positive integer'),

    validate,
]

const publishLessonValidator = [
    param('courseId')
        .isInt({ min: 1 })
        .withMessage('Course ID must be a positive integer'),

    param('id')
        .isInt({ min: 1 })
        .withMessage('Lesson ID must be a positive integer'),

    body('isPublished')
        .isBoolean()
        .withMessage('isPublished must be a boolean'),

    validate,
]

export {
    getLessonByIdValidator,
    getLessonVideoValidator,
    getLessonTranscriptValidator,
    createLessonValidator,
    updateLessonValidator,
    deleteLessonValidator,
    uploadVideoValidator,
    uploadTranscriptValidator,
    reorderLessonValidator,
    publishLessonValidator,
}



