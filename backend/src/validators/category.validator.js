// src/validators/category.validator.js
import { body, param, query } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'

const createCategoryValidator = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Category name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Category name must be between 2 and 100 characters'),

    body('slug')
        .trim()
        .notEmpty()
        .withMessage('Category slug is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Category slug must be between 2 and 100 characters')
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage(
            'Slug must contain only lowercase letters, numbers and hyphens'
        ),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must not exceed 1000 characters'),

    body('imageUrl')
        .optional()
        .trim()
        .isURL()
        .withMessage('Image URL must be a valid URL'),

    body('parentId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Parent ID must be a positive integer'),

    body('sortOrder')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Sort order must be a non-negative integer'),

    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean'),

    validate,
]

const updateCategoryValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Category ID must be a positive integer'),

    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Category name must be between 2 and 100 characters'),

    body('slug')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Category slug must be between 2 and 100 characters')
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage(
            'Slug must contain only lowercase letters, numbers and hyphens'
        ),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must not exceed 1000 characters'),

    body('imageUrl')
        .optional()
        .trim()
        .isURL()
        .withMessage('Image URL must be a valid URL'),

    body('parentId')
        .optional()
        .custom((value) => {
            if (value === null || value === '') return true
            return Number.isInteger(Number(value)) && Number(value) > 0
        })
        .withMessage('Parent ID must be a positive integer or null'),

    body('sortOrder')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Sort order must be a non-negative integer'),

    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean'),

    validate,
]

const getCategoryByIdValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Category ID must be a positive integer'),

    validate,
]

const getCategoryBySlugValidator = [
    param('slug')
        .trim()
        .notEmpty()
        .withMessage('Category slug is required')
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage('Invalid slug format'),

    validate,
]

const getCategoriesValidator = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),

    query('parentId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Parent ID must be a positive integer'),

    query('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean'),

    query('search')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search term must be between 1 and 100 characters'),

    validate,
]

const getCategoryCoursesValidator = [
    param('id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Category ID must be a positive integer'),

    param('slug')
        .optional()
        .trim()
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage('Invalid slug format'),

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

const deleteCategoryValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Category ID must be a positive integer'),

    validate,
]

export {
    createCategoryValidator,
    updateCategoryValidator,
    getCategoryByIdValidator,
    getCategoryBySlugValidator,
    getCategoriesValidator,
    getCategoryCoursesValidator,
    deleteCategoryValidator,
}
