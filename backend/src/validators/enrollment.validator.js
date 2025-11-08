// backend/src/validators/enrollment.validator.js
import { body, param, query } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'
import { ENROLLMENT_STATUS, PAYMENT_GATEWAY } from '../config/constants.js'

/**
 * Validator for getting enrollments list
 */
export const getEnrollmentsValidator = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('status')
        .optional()
        .isIn(Object.values(ENROLLMENT_STATUS))
        .withMessage(
            `Status must be one of: ${Object.values(ENROLLMENT_STATUS).join(', ')}`
        ),
    query('search')
        .optional()
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Search term must be between 1 and 200 characters'),
    query('sort')
        .optional()
        .isIn(['newest', 'oldest', 'progress', 'lastAccessed'])
        .withMessage(
            'Sort must be one of: newest, oldest, progress, lastAccessed'
        ),
    validate,
]

/**
 * Validator for getting enrollment by ID
 */
export const getEnrollmentByIdValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Enrollment ID must be a positive integer'),
    validate,
]

/**
 * Validator for getting active enrollments
 */
export const getActiveEnrollmentsValidator = [
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50'),
    validate,
]

/**
 * Validator for getting completed enrollments
 */
export const getCompletedEnrollmentsValidator = [
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
 * Validator for enrolling in free course
 */
export const enrollInFreeCourseValidator = [
    body('courseId')
        .notEmpty()
        .withMessage('Course ID is required')
        .isInt({ min: 1 })
        .withMessage('Course ID must be a positive integer'),
    validate,
]

/**
 * Validator for checking enrollment
 */
export const checkEnrollmentValidator = [
    param('courseId')
        .isInt({ min: 1 })
        .withMessage('Course ID must be a positive integer'),
    validate,
]

/**
 * Validator for enrolling in a course (free or paid)
 */
export const enrollInCourseValidator = [
    body('courseId')
        .notEmpty()
        .withMessage('Course ID is required')
        .isInt({ min: 1 })
        .withMessage('Course ID must be a positive integer'),
    body('paymentGateway')
        .optional()
        .isIn(Object.values(PAYMENT_GATEWAY))
        .withMessage(
            `Payment gateway must be one of: ${Object.values(PAYMENT_GATEWAY).join(', ')}`
        ),
    body('billingAddress')
        .optional()
        .isObject()
        .withMessage('Billing address must be an object'),
    body('billingAddress.fullName')
        .optional()
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Full name must be between 1 and 200 characters'),
    body('billingAddress.email')
        .optional()
        .isEmail()
        .withMessage('Email must be a valid email address'),
    body('billingAddress.phone')
        .optional()
        .trim()
        .isLength({ min: 1, max: 20 })
        .withMessage('Phone must be between 1 and 20 characters'),
    body('billingAddress.address')
        .optional()
        .trim()
        .isLength({ min: 1, max: 500 })
        .withMessage('Address must be between 1 and 500 characters'),
    validate,
]
