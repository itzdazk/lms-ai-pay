import { body, check, param } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'

const createMoMoPaymentValidator = [
    body('orderId')
        .notEmpty()
        .withMessage('orderId is required')
        .isInt({ min: 1 })
        .withMessage('orderId must be a positive integer'),
    validate,
]

const signatureFieldValidator = (fieldName = 'signature') =>
    check(fieldName)
        .custom((value, { req }) => {
            const payload = {
                ...req.body,
                ...req.query,
            }
            return (
                value ||
                payload.signature ||
                payload.Signature ||
                payload[fieldName] ||
                payload[fieldName.toUpperCase()]
            )
        })
        .withMessage('signature is required')

const momoSharedValidators = [
    check('orderId').notEmpty().withMessage('orderId is required'),
    check('amount')
        .notEmpty()
        .withMessage('amount is required')
        .isNumeric()
        .withMessage('amount must be numeric'),
    check('resultCode')
        .notEmpty()
        .withMessage('resultCode is required')
        .isNumeric()
        .withMessage('resultCode must be numeric'),
    signatureFieldValidator('signature'),
    validate,
]

const momoCallbackValidator = momoSharedValidators

const momoWebhookValidator = momoSharedValidators

const refundOrderValidator = [
    param('orderId')
        .notEmpty()
        .withMessage('orderId is required')
        .isInt({ min: 1 })
        .withMessage('orderId must be a positive integer'),
    body('amount')
        .optional()
        .isFloat({ gt: 0 })
        .withMessage('amount must be greater than 0'),
    body('reason')
        .optional()
        .isLength({ min: 1, max: 500 })
        .withMessage('reason must be between 1 and 500 characters'),
    validate,
]

export {
    createMoMoPaymentValidator,
    momoCallbackValidator,
    momoWebhookValidator,
    refundOrderValidator,
}


