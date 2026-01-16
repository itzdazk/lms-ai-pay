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
        .withMessage('Số trang phải là số nguyên dương'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Giới hạn phải từ 1 đến 100'),
    query('status')
        .optional()
        .isIn(Object.values(ENROLLMENT_STATUS))
        .withMessage(
            `Trạng thái phải là một trong: ${Object.values(ENROLLMENT_STATUS).join(', ')}`
        ),
    query('search')
        .optional()
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Từ khóa tìm kiếm phải từ 1 đến 200 ký tự'),
    query('sort')
        .optional()
        .isIn(['newest', 'oldest', 'progress', 'lastAccessed'])
        .withMessage(
            'Sắp xếp phải là một trong: newest, oldest, progress, lastAccessed'
        ),
    validate,
]

/**
 * Validator for getting enrollment by ID
 */
export const getEnrollmentByIdValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID ghi danh phải là số nguyên dương'),
    validate,
]

/**
 * Validator for getting active enrollments
 */
export const getActiveEnrollmentsValidator = [
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Giới hạn phải từ 1 đến 50'),
    validate,
]

/**
 * Validator for getting completed enrollments
 */
export const getCompletedEnrollmentsValidator = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Số trang phải là số nguyên dương'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Giới hạn phải từ 1 đến 100'),
    validate,
]

/**
 * Validator for enrolling in free course
 */
export const enrollInFreeCourseValidator = [
    body('courseId')
        .notEmpty()
        .withMessage('ID khóa học không được để trống')
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là số nguyên dương'),
    validate,
]

/**
 * Validator for checking enrollment
 */
export const checkEnrollmentValidator = [
    param('courseId')
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là số nguyên dương'),
    validate,
]

/**
 * Validator for enrolling in a course (free or paid)
 */
export const enrollInCourseValidator = [
    body('courseId')
        .notEmpty()
        .withMessage('ID khóa học không được để trống')
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là số nguyên dương'),
    body('paymentGateway')
        .optional()
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
        .isLength({ min: 1, max: 200 })
        .withMessage('Họ và tên phải từ 1 đến 200 ký tự'),
    body('billingAddress.email')
        .optional()
        .isEmail()
        .withMessage('Email phải là địa chỉ email hợp lệ'),
    body('billingAddress.phone')
        .optional()
        .trim()
        .isLength({ min: 1, max: 20 })
        .withMessage('Số điện thoại phải từ 1 đến 20 ký tự'),
    body('billingAddress.address')
        .optional()
        .trim()
        .isLength({ min: 1, max: 500 })
        .withMessage('Địa chỉ phải từ 1 đến 500 ký tự'),
    validate,
]
