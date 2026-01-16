// backend/src/validators/refund-request.validator.js
import { body, param, query } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'

export const createRefundRequestValidator = [
    body('orderId')
        .isInt({ min: 1 })
        .withMessage('ID đơn hàng phải là số nguyên dương'),
    body('reason')
        .trim()
        .notEmpty()
        .withMessage('Lý do là bắt buộc')
        .isLength({ min: 10, max: 1000 })
        .withMessage('Lý do phải có độ dài từ 10 đến 1000 ký tự'),
    body('reasonType')
        .optional()
        .isIn(['MEDICAL', 'FINANCIAL_EMERGENCY', 'DISSATISFACTION', 'OTHER'])
        .withMessage(
            'Loại lý do phải là một trong: MEDICAL, FINANCIAL_EMERGENCY, DISSATISFACTION, OTHER'
        ),
    validate,
]

export const getRefundRequestByIdValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID yêu cầu hoàn tiền phải là số nguyên dương'),
    validate,
]

export const getRefundRequestByOrderIdValidator = [
    param('orderId')
        .isInt({ min: 1 })
        .withMessage('ID đơn hàng phải là số nguyên dương'),
    validate,
]

export const getStudentRefundRequestsValidator = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Trang phải là số nguyên dương'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Giới hạn phải từ 1 đến 100'),
    query('status')
        .optional()
        .isIn(['PENDING', 'APPROVED', 'REJECTED'])
        .withMessage(
            'Trạng thái phải là một trong: PENDING, APPROVED, REJECTED'
        ),
    validate,
]
