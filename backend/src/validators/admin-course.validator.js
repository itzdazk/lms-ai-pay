// src/validators/admin-course.validator.js
import { body, param, query } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'
import { COURSE_STATUS, COURSE_LEVEL } from '../config/constants.js'

/**
 * Validator for getting all courses (admin)
 */
export const getAllCoursesValidator = [
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
        .isLength({ min: 1, max: 200 })
        .withMessage('Search term must be between 1 and 200 characters'),
    query('status')
        .optional()
        .isIn(Object.values(COURSE_STATUS))
        .withMessage(
            `Status must be one of: ${Object.values(COURSE_STATUS).join(', ')}`
        ),
    query('categoryId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Category ID must be a positive integer'),
    query('level')
        .optional()
        .isIn(Object.values(COURSE_LEVEL))
        .withMessage(
            `Level must be one of: ${Object.values(COURSE_LEVEL).join(', ')}`
        ),
    query('instructorId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Instructor ID must be a positive integer'),
    query('isFeatured')
        .optional()
        .isBoolean()
        .withMessage('isFeatured must be a boolean'),
    query('sort')
        .optional()
        .isIn([
            'newest',
            'oldest',
            'updated',
            'updated-oldest',
            'popular',
            'enrollments',
            'rating',
            'price_asc',
            'price_desc',
            'views',
            'title',
        ])
        .withMessage(
            'Sort must be one of: newest, oldest, updated, updated-oldest, popular, enrollments, rating, price_asc, price_desc, views, title'
        ),
    query('minPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Min price must be a non-negative number'),
    query('maxPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Max price must be a non-negative number'),
    query('minEnrollments')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Min enrollments must be a non-negative integer'),
    query('maxEnrollments')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Max enrollments must be a non-negative integer'),
    query('minRating')
        .optional()
        .isFloat({ min: 0, max: 5 })
        .withMessage('Min rating must be between 0 and 5'),
    validate,
]

/**
 * Validator for toggling course featured status
 */
export const toggleCourseFeaturedValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Course ID must be a positive integer'),
    body('isFeatured')
        .notEmpty()
        .withMessage('isFeatured is required')
        .isBoolean()
        .withMessage('isFeatured must be a boolean'),
    validate,
]
