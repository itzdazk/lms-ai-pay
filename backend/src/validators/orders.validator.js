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
        .withMessage('ID khóa học là bắt buộc')
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là số nguyên dương'),
    body('paymentGateway')
        .notEmpty()
        .withMessage('Cổng thanh toán là bắt buộc')
        .isIn(Object.values(PAYMENT_GATEWAY))
        .withMessage(
            `Cổng thanh toán phải là một trong: ${Object.values(PAYMENT_GATEWAY).join(', ')}`
        ),
    body('billingAddress')
        .optional()
        .isObject()
        .withMessage('Địa chỉ thanh toán phải là một đối tượng'),
    body('billingAddress.fullName')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Họ và tên phải có độ dài từ 1 đến 100 ký tự'),
    body('billingAddress.email')
        .optional()
        .isEmail()
        .withMessage('Email phải hợp lệ'),
    body('billingAddress.phone')
        .optional()
        .trim()
        .isLength({ min: 10, max: 20 })
        .withMessage('Số điện thoại phải có độ dài từ 10 đến 20 ký tự'),
    body('billingAddress.address')
        .optional()
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Địa chỉ phải có độ dài từ 1 đến 255 ký tự'),
    validate,
]

/**
 * Validator for getting orders list
 */
export const getOrdersValidator = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Trang phải là số nguyên dương'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Giới hạn phải từ 1 đến 100'),
    query('paymentStatus')
        .optional()
        .isIn(Object.values(PAYMENT_STATUS))
        .withMessage(
            `Trạng thái thanh toán phải là một trong: ${Object.values(PAYMENT_STATUS).join(', ')}`
        ),
    query('paymentGateway')
        .optional()
        .isIn(Object.values(PAYMENT_GATEWAY))
        .withMessage(
            `Cổng thanh toán phải là một trong: ${Object.values(PAYMENT_GATEWAY).join(', ')}`
        ),
    query('startDate')
        .optional()
        .isISO8601()
        .withMessage('Ngày bắt đầu phải là định dạng ISO 8601 hợp lệ'),
    query('endDate')
        .optional()
        .isISO8601()
        .withMessage('Ngày kết thúc phải là định dạng ISO 8601 hợp lệ'),
    query('sort')
        .optional()
        .isIn(['newest', 'oldest', 'amount_asc', 'amount_desc'])
        .withMessage(
            'Sắp xếp phải là một trong: newest, oldest, amount_asc, amount_desc'
        ),
    validate,
]

/**
 * Validator for getting order by ID
 */
export const getOrderByIdValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID đơn hàng phải là số nguyên dương'),
    validate,
]

/**
 * Validator for getting order by code
 */
export const getOrderByCodeValidator = [
    param('orderCode')
        .notEmpty()
        .withMessage('Mã đơn hàng là bắt buộc')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Mã đơn hàng phải có độ dài từ 1 đến 50 ký tự'),
    validate,
]

/**
 * Validator for cancelling order
 */
export const cancelOrderValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID đơn hàng phải là số nguyên dương'),
    validate,
]
