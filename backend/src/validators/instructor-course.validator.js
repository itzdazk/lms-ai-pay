// src/validators/instructor-course.validator.js
import { body, param, query } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'
import { COURSE_STATUS, COURSE_LEVEL } from '../config/constants.js'

/**
 * Validator for getting instructor courses
 */
export const getInstructorCoursesValidator = [
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
    query('sort')
        .optional()
        .isIn(['newest', 'oldest', 'updated', 'popular', 'rating'])
        .withMessage(
            'Sort must be one of: newest, oldest, updated, popular, rating'
        ),
    validate,
]

/**
 * Validator for creating a course
 */
export const createCourseValidator = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ min: 5, max: 200 })
        .withMessage('Title must be between 5 and 200 characters'),
    body('slug')
        .optional()
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Slug must be between 5 and 200 characters')
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage(
            'Slug must be lowercase alphanumeric with hyphens (e.g., my-course-slug)'
        ),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 10000 })
        .withMessage('Description must not exceed 10000 characters'),
    body('shortDescription')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Short description must not exceed 500 characters'),
    body('thumbnailUrl')
        .optional()
        .trim()
        .isURL()
        .withMessage('Thumbnail URL must be a valid URL'),
    body('videoPreviewUrl')
        .optional()
        .trim()
        .isURL()
        .withMessage('Video preview URL must be a valid URL'),
    body('videoPreviewDuration')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Video preview duration must be a non-negative integer'),
    body('price')
        .notEmpty()
        .withMessage('Price is required')
        .isFloat({ min: 0 })
        .withMessage('Price must be a non-negative number'),
    body('discountPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Discount price must be a non-negative number')
        .custom((value, { req }) => {
            if (
                value &&
                req.body.price &&
                parseFloat(value) > parseFloat(req.body.price)
            ) {
                throw new Error(
                    'Discount price must be less than or equal to price'
                )
            }
            return true
        }),
    body('categoryId')
        .notEmpty()
        .withMessage('Category ID is required')
        .isInt({ min: 1 })
        .withMessage('Category ID must be a positive integer'),
    body('level')
        .optional()
        .isIn(Object.values(COURSE_LEVEL))
        .withMessage(
            `Level must be one of: ${Object.values(COURSE_LEVEL).join(', ')}`
        ),
    body('durationHours')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Duration hours must be a non-negative integer'),
    body('language')
        .optional()
        .trim()
        .isLength({ min: 2, max: 10 })
        .withMessage('Language must be between 2 and 10 characters'),
    body('requirements')
        .optional()
        .trim()
        .isLength({ max: 5000 })
        .withMessage('Requirements must not exceed 5000 characters'),
    body('whatYouLearn')
        .optional()
        .trim()
        .isLength({ max: 5000 })
        .withMessage('What you learn must not exceed 5000 characters'),
    body('courseObjectives')
        .optional()
        .trim()
        .isLength({ max: 5000 })
        .withMessage('Course objectives must not exceed 5000 characters'),
    body('targetAudience')
        .optional()
        .trim()
        .isLength({ max: 5000 })
        .withMessage('Target audience must not exceed 5000 characters'),
    body('status')
        .optional()
        .isIn(Object.values(COURSE_STATUS))
        .withMessage(
            `Status must be one of: ${Object.values(COURSE_STATUS).join(', ')}`
        ),
    body('isFeatured')
        .optional()
        .isBoolean()
        .withMessage('isFeatured must be a boolean'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('tags.*')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Each tag ID must be a positive integer'),
    validate,
]

/**
 * Validator for updating a course
 */
export const updateCourseValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Course ID must be a positive integer'),
    body('title')
        .optional()
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Title must be between 5 and 200 characters'),
    body('slug')
        .optional()
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Slug must be between 5 and 200 characters')
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage(
            'Slug must be lowercase alphanumeric with hyphens (e.g., my-course-slug)'
        ),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 10000 })
        .withMessage('Description must not exceed 10000 characters'),
    body('shortDescription')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Short description must not exceed 500 characters'),
    body('thumbnailUrl')
        .optional()
        .trim()
        .isURL()
        .withMessage('Thumbnail URL must be a valid URL'),
    body('videoPreviewUrl')
        .optional()
        .trim()
        .isURL()
        .withMessage('Video preview URL must be a valid URL'),
    body('videoPreviewDuration')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Video preview duration must be a non-negative integer'),
    body('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Price must be a non-negative number'),
    body('discountPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Discount price must be a non-negative number')
        .custom((value, { req }) => {
            if (
                value &&
                req.body.price &&
                parseFloat(value) > parseFloat(req.body.price)
            ) {
                throw new Error(
                    'Discount price must be less than or equal to price'
                )
            }
            return true
        }),
    body('categoryId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Category ID must be a positive integer'),
    body('level')
        .optional()
        .isIn(Object.values(COURSE_LEVEL))
        .withMessage(
            `Level must be one of: ${Object.values(COURSE_LEVEL).join(', ')}`
        ),
    body('durationHours')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Duration hours must be a non-negative integer'),
    body('totalLessons')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Total lessons must be a non-negative integer'),
    body('language')
        .optional()
        .trim()
        .isLength({ min: 2, max: 10 })
        .withMessage('Language must be between 2 and 10 characters'),
    body('requirements')
        .optional()
        .trim()
        .isLength({ max: 5000 })
        .withMessage('Requirements must not exceed 5000 characters'),
    body('whatYouLearn')
        .optional()
        .trim()
        .isLength({ max: 5000 })
        .withMessage('What you learn must not exceed 5000 characters'),
    body('courseObjectives')
        .optional()
        .trim()
        .isLength({ max: 5000 })
        .withMessage('Course objectives must not exceed 5000 characters'),
    body('targetAudience')
        .optional()
        .trim()
        .isLength({ max: 5000 })
        .withMessage('Target audience must not exceed 5000 characters'),
    body('isFeatured')
        .optional()
        .isBoolean()
        .withMessage('isFeatured must be a boolean'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('tags.*')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Each tag ID must be a positive integer'),
    validate,
]

/**
 * Validator for deleting a course
 */
export const deleteCourseValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Course ID must be a positive integer'),
    validate,
]

/**
 * Validator for changing course status
 */
export const changeCourseStatusValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Course ID must be a positive integer'),
    body('status')
        .notEmpty()
        .withMessage('Status is required')
        .isIn(Object.values(COURSE_STATUS))
        .withMessage(
            `Status must be one of: ${Object.values(COURSE_STATUS).join(', ')}`
        ),
    validate,
]

/**
 * Validator for uploading video preview
 */
export const uploadVideoPreviewValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Course ID must be a positive integer'),
    body('videoPreviewUrl')
        .notEmpty()
        .withMessage('Video preview URL is required')
        .trim()
        .isURL()
        .withMessage('Video preview URL must be a valid URL'),
    body('videoPreviewDuration')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Video preview duration must be a non-negative integer'),
    validate,
]

/**
 * Validator for getting a single course by ID
 */
export const getInstructorCourseByIdValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Course ID must be a positive integer'),
    validate,
]

/**
 * Validator for getting course analytics
 */
export const getCourseAnalyticsValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Course ID must be a positive integer'),
    validate,
]

/**
 * Validator for adding tags to course
 */
export const addTagsToCourseValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Course ID must be a positive integer'),
    body('tagIds')
        .notEmpty()
        .withMessage('Tag IDs are required')
        .isArray({ min: 1 })
        .withMessage('Tag IDs must be a non-empty array'),
    body('tagIds.*')
        .isInt({ min: 1 })
        .withMessage('Each tag ID must be a positive integer'),
    validate,
]

/**
 * Validator for removing tag from course
 */
export const removeTagFromCourseValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Course ID must be a positive integer'),
    param('tagId')
        .isInt({ min: 1 })
        .withMessage('Tag ID must be a positive integer'),
    validate,
]
