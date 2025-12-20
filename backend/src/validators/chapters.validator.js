// src/validators/chapters.validator.js
import { body, param, query } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'

const getChaptersByCourseValidator = [
    param('courseId')
        .isInt({ min: 1 })
        .withMessage('Course ID must be a positive integer'),
    query('includeLessons')
        .optional()
        .isBoolean()
        .withMessage('includeLessons must be a boolean'),
    validate,
]

const getChapterByIdValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Chapter ID must be a positive integer'),
    query('includeLessons')
        .optional()
        .isBoolean()
        .withMessage('includeLessons must be a boolean'),
    validate,
]

const createChapterValidator = [
    param('courseId')
        .isInt({ min: 1 })
        .withMessage('Course ID must be a positive integer'),

    body('title')
        .trim()
        .notEmpty()
        .withMessage('Chapter title is required')
        .isLength({ min: 2, max: 200 })
        .withMessage('Chapter title must be between 2 and 200 characters'),

    body('slug')
        .optional()
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Chapter slug must be between 2 and 200 characters')
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage(
            'Slug must contain only lowercase letters, numbers and hyphens'
        ),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Description must not exceed 2000 characters'),

    body('chapterOrder')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Chapter order must be a positive integer'),

    body('isPublished')
        .optional()
        .isBoolean()
        .withMessage('isPublished must be a boolean'),

    validate,
]

const updateChapterValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Chapter ID must be a positive integer'),

    body('title')
        .optional()
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Chapter title must be between 2 and 200 characters'),

    body('slug')
        .optional()
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Chapter slug must be between 2 and 200 characters')
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage(
            'Slug must contain only lowercase letters, numbers and hyphens'
        ),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Description must not exceed 2000 characters'),

    body('chapterOrder')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Chapter order must be a positive integer'),

    body('isPublished')
        .optional()
        .isBoolean()
        .withMessage('isPublished must be a boolean'),

    validate,
]

const deleteChapterValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Chapter ID must be a positive integer'),
    validate,
]

const reorderChaptersValidator = [
    param('courseId')
        .isInt({ min: 1 })
        .withMessage('Course ID must be a positive integer'),

    body('chapterIds')
        .isArray({ min: 1 })
        .withMessage('chapterIds must be a non-empty array')
        .custom((value) => {
            if (!Array.isArray(value)) {
                throw new Error('chapterIds must be an array')
            }
            if (value.length === 0) {
                throw new Error('chapterIds array cannot be empty')
            }
            const allIntegers = value.every(
                (id) => Number.isInteger(parseInt(id)) && parseInt(id) > 0
            )
            if (!allIntegers) {
                throw new Error(
                    'All chapter IDs must be positive integers'
                )
            }
            return true
        }),

    validate,
]

export {
    getChaptersByCourseValidator,
    getChapterByIdValidator,
    createChapterValidator,
    updateChapterValidator,
    deleteChapterValidator,
    reorderChaptersValidator,
}

