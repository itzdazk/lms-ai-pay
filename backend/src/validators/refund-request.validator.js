// backend/src/validators/refund-request.validator.js
import { body, param, query } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'

export const createRefundRequestValidator = [
    body('orderId')
        .isInt({ min: 1 })
        .withMessage('Order ID must be a positive integer'),
    body('reason')
        .trim()
        .notEmpty()
        .withMessage('Reason is required')
        .isLength({ min: 10, max: 1000 })
        .withMessage('Reason must be between 10 and 1000 characters'),
    body('reasonType')
        .optional()
        .isIn(['MEDICAL', 'FINANCIAL_EMERGENCY', 'DISSATISFACTION', 'OTHER'])
        .withMessage(
            'Reason type must be one of: MEDICAL, FINANCIAL_EMERGENCY, DISSATISFACTION, OTHER'
        ),
    validate,
]

export const getRefundRequestByIdValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Refund request ID must be a positive integer'),
    validate,
]

export const getRefundRequestByOrderIdValidator = [
    param('orderId')
        .isInt({ min: 1 })
        .withMessage('Order ID must be a positive integer'),
    validate,
]

export const getStudentRefundRequestsValidator = [
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
        .isIn(['PENDING', 'APPROVED', 'REJECTED'])
        .withMessage('Status must be one of: PENDING, APPROVED, REJECTED'),
    validate,
]
