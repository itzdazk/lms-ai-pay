// src/validators/tags.validator.js
import { body, param, query } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'

const createTagValidator = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Tag name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Tag name must be between 2 and 50 characters'),

    body('slug')
        .trim()
        .notEmpty()
        .withMessage('Tag slug is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Tag slug must be between 2 and 50 characters')
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage(
            'Slug must contain only lowercase letters, numbers and hyphens'
        ),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description must not exceed 500 characters'),

    validate,
]

const updateTagValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Tag ID must be a positive integer'),

    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Tag name must be between 2 and 50 characters'),

    body('slug')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Tag slug must be between 2 and 50 characters')
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage(
            'Slug must contain only lowercase letters, numbers and hyphens'
        ),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description must not exceed 500 characters'),

    validate,
]

const getTagByIdValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Tag ID must be a positive integer'),

    validate,
]

const getTagsValidator = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),

    query('search')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search term must be between 1 and 100 characters'),

    validate,
]

const getTagCoursesValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Tag ID must be a positive integer'),

    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),

    query('level')
        .optional()
        .isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
        .withMessage('Invalid level'),

    query('sort')
        .optional()
        .isIn(['newest', 'popular', 'rating', 'price_asc', 'price_desc'])
        .withMessage('Invalid sort option'),

    validate,
]

const deleteTagValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Tag ID must be a positive integer'),

    validate,
]

export {
    createTagValidator,
    updateTagValidator,
    getTagByIdValidator,
    getTagsValidator,
    getTagCoursesValidator,
    deleteTagValidator,
}

