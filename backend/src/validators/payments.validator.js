import { body, check, param } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'

// ==================== MoMo Validators ====================

const createMoMoPaymentValidator = [
    body('orderId')
        .notEmpty()
        .withMessage('ID đơn hàng là bắt buộc')
        .isInt({ min: 1 })
        .withMessage('ID đơn hàng phải là số nguyên dương'),
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
        .withMessage('Chữ ký là bắt buộc')

const momoSharedValidators = [
    check('orderId').notEmpty().withMessage('ID đơn hàng là bắt buộc'),
    check('amount')
        .notEmpty()
        .withMessage('Số tiền là bắt buộc')
        .isNumeric()
        .withMessage('Số tiền phải là số'),
    check('resultCode')
        .notEmpty()
        .withMessage('Mã kết quả là bắt buộc')
        .isNumeric()
        .withMessage('Mã kết quả phải là số'),
    signatureFieldValidator('signature'),
    validate,
]

const momoCallbackValidator = momoSharedValidators

const momoWebhookValidator = momoSharedValidators

// ==================== VNPay Validators (MỚI) ====================

const createVNPayPaymentValidator = [
    body('orderId')
        .notEmpty()
        .withMessage('ID đơn hàng là bắt buộc')
        .isInt({ min: 1 })
        .withMessage('ID đơn hàng phải là số nguyên dương'),
    validate,
]

const vnpayCallbackValidator = [
    check('vnp_TxnRef').notEmpty().withMessage('vnp_TxnRef là bắt buộc'),
    check('vnp_Amount')
        .notEmpty()
        .withMessage('vnp_Amount là bắt buộc')
        .isNumeric()
        .withMessage('vnp_Amount phải là số'),
    check('vnp_ResponseCode')
        .notEmpty()
        .withMessage('vnp_ResponseCode là bắt buộc'),
    check('vnp_SecureHash')
        .notEmpty()
        .withMessage('vnp_SecureHash là bắt buộc'),
    validate,
]

const vnpayWebhookValidator = [
    check('vnp_TxnRef').notEmpty().withMessage('vnp_TxnRef là bắt buộc'),
    check('vnp_Amount')
        .notEmpty()
        .withMessage('vnp_Amount là bắt buộc')
        .isNumeric()
        .withMessage('vnp_Amount phải là số'),
    check('vnp_ResponseCode')
        .notEmpty()
        .withMessage('vnp_ResponseCode là bắt buộc'),
    check('vnp_SecureHash')
        .notEmpty()
        .withMessage('vnp_SecureHash là bắt buộc'),
    validate,
]

// ==================== Refund Validator ====================

const refundOrderValidator = [
    param('orderId')
        .notEmpty()
        .withMessage('ID đơn hàng là bắt buộc')
        .isInt({ min: 1 })
        .withMessage('ID đơn hàng phải là số nguyên dương'),
    body('amount')
        .optional()
        .isFloat({ gt: 0 })
        .withMessage('Số tiền phải lớn hơn 0'),
    body('reason')
        .optional()
        .isLength({ min: 1, max: 500 })
        .withMessage('Lý do phải có độ dài từ 1 đến 500 ký tự'),
    validate,
]

export {
    // MoMo
    createMoMoPaymentValidator,
    momoCallbackValidator,
    momoWebhookValidator,
    // VNPay
    createVNPayPaymentValidator,
    vnpayCallbackValidator,
    vnpayWebhookValidator,
    // Refund
    refundOrderValidator,
}
