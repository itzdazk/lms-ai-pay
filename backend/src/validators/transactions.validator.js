import { param, query } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'
import { PAYMENT_GATEWAY, TRANSACTION_STATUS } from '../config/constants.js'

const getTransactionsValidator = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Trang phải là số nguyên dương'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Giới hạn phải nằm trong khoảng từ 1 đến 100'),
    query('status')
        .optional()
        .isIn(Object.values(TRANSACTION_STATUS))
        .withMessage(
            `Trạng thái phải là một trong các giá trị: ${Object.values(TRANSACTION_STATUS).join(', ')}`
        ),
    query('paymentGateway')
        .optional()
        .isIn(Object.values(PAYMENT_GATEWAY))
        .withMessage(
            `Cổng thanh toán phải là một trong các giá trị: ${Object.values(PAYMENT_GATEWAY).join(', ')}`
        ),
    query('startDate')
        .optional()
        .isISO8601()
        .withMessage('Ngày bắt đầu phải là định dạng ISO 8601 hợp lệ'),
    query('endDate')
        .optional()
        .isISO8601()
        .withMessage('Ngày kết thúc phải là định dạng ISO 8601 hợp lệ'),
    query('userId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID người dùng phải là số nguyên dương'),
    query('transactionId')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('ID giao dịch không được để trống'),
    validate,
]

const getTransactionByIdValidator = [
    param('transactionId')
        .notEmpty()
        .withMessage('ID giao dịch là bắt buộc')
        .isInt({ min: 1 })
        .withMessage('ID giao dịch phải là số nguyên dương'),
    validate,
]

export { getTransactionsValidator, getTransactionByIdValidator }
