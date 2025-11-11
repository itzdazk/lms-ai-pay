// backend/src/validators/orders.validator.js
import { body, param, query } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'
import { PAYMENT_STATUS, PAYMENT_GATEWAY } from '../config/constants.js'

/**
 * Validator for creating an order
 */
export const createOrderValidator = [
    body('courseId')
        .notEmpty()
        .withMessage('Course ID is required')
        .isInt({ min: 1 })
        .withMessage('Course ID must be a positive integer'),
    body('paymentGateway')
        .notEmpty()
        .withMessage('Payment gateway is required')
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
        .isLength({ min: 1, max: 100 })
        .withMessage('Full name must be between 1 and 100 characters'),
    body('billingAddress.email')
        .optional()
        .isEmail()
        .withMessage('Email must be valid'),
    body('billingAddress.phone')
        .optional()
        .trim()
        .isLength({ min: 10, max: 20 })
        .withMessage('Phone must be between 10 and 20 characters'),
    body('billingAddress.address')
        .optional()
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Address must be between 1 and 255 characters'),
    validate,
]

/**
 * Validator for getting orders list
 */
export const getOrdersValidator = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('paymentStatus')
        .optional()
        .isIn(Object.values(PAYMENT_STATUS))
        .withMessage(
            `Payment status must be one of: ${Object.values(PAYMENT_STATUS).join(', ')}`
        ),
    query('paymentGateway')
        .optional()
        .isIn(Object.values(PAYMENT_GATEWAY))
        .withMessage(
            `Payment gateway must be one of: ${Object.values(PAYMENT_GATEWAY).join(', ')}`
        ),
    query('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid ISO 8601 date'),
    query('sort')
        .optional()
        .isIn(['newest', 'oldest', 'amount_asc', 'amount_desc'])
        .withMessage(
            'Sort must be one of: newest, oldest, amount_asc, amount_desc'
        ),
    validate,
]

/**
 * Validator for getting order by ID
 */
export const getOrderByIdValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Order ID must be a positive integer'),
    validate,
]

/**
 * Validator for getting order by code
 */
export const getOrderByCodeValidator = [
    param('orderCode')
        .notEmpty()
        .withMessage('Order code is required')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Order code must be between 1 and 50 characters'),
    validate,
]

/**
 * Validator for cancelling order
 */
export const cancelOrderValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Order ID must be a positive integer'),
    validate,
]
