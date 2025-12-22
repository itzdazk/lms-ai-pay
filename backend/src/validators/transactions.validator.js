import { param, query } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'
import { PAYMENT_GATEWAY, TRANSACTION_STATUS } from '../config/constants.js'

const getTransactionsValidator = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('limit must be between 1 and 100'),
    query('status')
        .optional()
        .isIn(Object.values(TRANSACTION_STATUS))
        .withMessage(
            `status must be one of: ${Object.values(TRANSACTION_STATUS).join(', ')}`
        ),
    query('paymentGateway')
        .optional()
        .isIn(Object.values(PAYMENT_GATEWAY))
        .withMessage(
            `paymentGateway must be one of: ${Object.values(PAYMENT_GATEWAY).join(', ')}`
        ),
    query('startDate')
        .optional()
        .isISO8601()
        .withMessage('startDate must be a valid ISO 8601 date'),
    query('endDate')
        .optional()
        .isISO8601()
        .withMessage('endDate must be a valid ISO 8601 date'),
    query('userId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('userId must be a positive integer'),
    query('transactionId')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('transactionId cannot be empty'),
    validate,
]

const getTransactionByIdValidator = [
    param('transactionId')
        .notEmpty()
        .withMessage('transactionId is required')
        .isInt({ min: 1 })
        .withMessage('transactionId must be a positive integer'),
    validate,
]

export { getTransactionsValidator, getTransactionByIdValidator }
