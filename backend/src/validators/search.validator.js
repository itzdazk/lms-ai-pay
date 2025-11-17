// backend/src/validators/search.validator.js
import { body, query } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'
import { COURSE_LEVEL } from '../config/constants.js'

/**
 * Validator for searching courses
 */
export const searchCoursesValidator = [
    query('q')
        .optional()
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Search query must be between 1 and 200 characters'),

    query('category')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Category must be a positive integer'),

    query('tags')
        .optional()
        .trim()
        .isLength({ min: 1, max: 500 })
        .withMessage('Tags must be between 1 and 500 characters')
        .matches(/^[a-z0-9,\-]+$/i)
        .withMessage(
            'Tags must be comma-separated alphanumeric values with hyphens'
        ),

    query('level')
        .optional()
        .isIn(Object.values(COURSE_LEVEL))
        .withMessage(
            `Level must be one of: ${Object.values(COURSE_LEVEL).join(', ')}`
        ),

    query('price')
        .optional()
        .isIn(['free', 'paid'])
        .withMessage('Price filter must be either "free" or "paid"'),

    query('rating')
        .optional()
        .isFloat({ min: 0, max: 5 })
        .withMessage('Rating must be between 0 and 5'),

    query('featured')
        .optional()
        .isBoolean()
        .withMessage('Featured must be a boolean'),

    query('sort')
        .optional()
        .isIn([
            'newest',
            'oldest',
            'price_asc',
            'price_desc',
            'rating',
            'enrolled',
        ])
        .withMessage(
            'Sort must be one of: newest, oldest, price_asc, price_desc, rating, enrolled'
        ),

    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),

    validate,
]

/**
 * Validator for searching instructors
 */
export const searchInstructorsValidator = [
    query('q')
        .optional()
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Search query must be between 1 and 200 characters'),

    query('sort')
        .optional()
        .isIn(['popular', 'name', 'newest'])
        .withMessage('Sort must be one of: popular, name, newest'),

    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),

    validate,
]

/**
 * Validator for search suggestions
 */
export const getSearchSuggestionsValidator = [
    query('q')
        .trim()
        .notEmpty()
        .withMessage('Search query is required')
        .isLength({ min: 2, max: 200 })
        .withMessage('Search query must be between 2 and 200 characters'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50'),

    validate,
]

/**
 * Validator for voice search
 */
export const processVoiceSearchValidator = [
    body('transcript')
        .trim()
        .notEmpty()
        .withMessage('Transcript is required')
        .isLength({ min: 2, max: 1000 })
        .withMessage('Transcript must be between 2 and 1000 characters'),

    validate,
]
