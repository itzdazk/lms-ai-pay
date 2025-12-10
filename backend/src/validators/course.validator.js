// src/validators/course.validator.js
import { param, query } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'
import { COURSE_LEVEL } from '../config/constants.js'

// Get courses validator
const getCoursesValidator = [
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
        .withMessage('Search query must be between 1 and 200 characters'),

    query('categoryId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Category ID must be a positive integer'),

    query('level')
        .optional()
        .isIn([
            COURSE_LEVEL.BEGINNER,
            COURSE_LEVEL.INTERMEDIATE,
            COURSE_LEVEL.ADVANCED,
        ])
        .withMessage('Invalid course level'),

    query('minPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Minimum price must be a non-negative number'),

    query('maxPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Maximum price must be a non-negative number'),

    query('isFeatured')
        .optional()
        .isBoolean()
        .withMessage('isFeatured must be a boolean'),

    query('instructorId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Instructor ID must be a positive integer'),

    query('sort')
        .optional()
        .isIn(['newest', 'popular', 'rating', 'price_asc', 'price_desc'])
        .withMessage('Invalid sort option'),

    query('tagId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Tag ID must be a valid integer'),

    query('tagIds')
        .optional()
        .custom((value) => {
            if (Array.isArray(value)) {
                return value.every((id) => !isNaN(parseInt(id)) && parseInt(id) > 0)
            }
            if (typeof value === 'string') {
                const ids = value.split(',').map((id) => id.trim())
                return ids.every((id) => !isNaN(parseInt(id)) && parseInt(id) > 0)
            }
            return false
        })
        .withMessage('Tag IDs must be valid integers (comma-separated or array)'),

    validate,
]

// Get featured/trending courses validator
const getLimitValidator = [
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50'),

    validate,
]

// Get course by ID validator
const getCourseByIdValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Course ID must be a positive integer'),

    validate,
]

// Get course by slug validator
const getCourseBySlugValidator = [
    param('slug')
        .trim()
        .notEmpty()
        .withMessage('Course slug is required')
        .isLength({ min: 1, max: 200 })
        .withMessage('Slug must be between 1 and 200 characters')
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage('Invalid slug format'),

    validate,
]

export {
    getCoursesValidator,
    getLimitValidator,
    getCourseByIdValidator,
    getCourseBySlugValidator,
}
