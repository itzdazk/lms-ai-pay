// backend/src/validators/search.validator.js
import { body, query } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'
import { COURSE_LEVEL } from '../config/constants.js'

/**
 * Validator for searching courses
 */
export const searchCoursesValidator = [
    query('q')
        .optional()
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Từ khóa tìm kiếm phải có độ dài từ 1 đến 200 ký tự'),

    query('category')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Danh mục phải là số nguyên dương'),

    query('tags')
        .optional()
        .trim()
        .isLength({ min: 1, max: 500 })
        .withMessage('Thẻ phải có độ dài từ 1 đến 500 ký tự')
        .matches(/^[a-z0-9,\-]+$/i)
        .withMessage(
            'Thẻ phải là các giá trị chữ và số cách nhau bởi dấu phẩy và gạch ngang'
        ),

    query('level')
        .optional()
        .isIn(Object.values(COURSE_LEVEL))
        .withMessage(
            `Trình độ phải là một trong: ${Object.values(COURSE_LEVEL).join(', ')}`
        ),

    query('price')
        .optional()
        .isIn(['free', 'paid'])
        .withMessage('Lọc giá phải là "free" hoặc "paid"'),

    query('rating')
        .optional()
        .isFloat({ min: 0, max: 5 })
        .withMessage('Đánh giá phải từ 0 đến 5'),

    query('featured')
        .optional()
        .isBoolean()
        .withMessage('Featured phải là giá trị boolean'),

    query('sort')
        .optional()
        .isIn([
            'newest',
            'oldest',
            'price_asc',
            'price_desc',
            'rating',
            'enrolled',
        ])
        .withMessage(
            'Sắp xếp phải là một trong: newest, oldest, price_asc, price_desc, rating, enrolled'
        ),

    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Trang phải là số nguyên dương'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Giới hạn phải từ 1 đến 100'),

    validate,
]

/**
 * Validator for searching instructors
 */
export const searchInstructorsValidator = [
    query('q')
        .optional()
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Từ khóa tìm kiếm phải có độ dài từ 1 đến 200 ký tự'),

    query('sort')
        .optional()
        .isIn(['popular', 'name', 'newest'])
        .withMessage('Sắp xếp phải là một trong: popular, name, newest'),

    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Trang phải là số nguyên dương'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Giới hạn phải từ 1 đến 100'),

    validate,
]

/**
 * Validator for search suggestions
 */
export const getSearchSuggestionsValidator = [
    query('q')
        .trim()
        .notEmpty()
        .withMessage('Từ khóa tìm kiếm là bắt buộc')
        .isLength({ min: 2, max: 200 })
        .withMessage('Từ khóa tìm kiếm phải có độ dài từ 2 đến 200 ký tự'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Giới hạn phải từ 1 đến 50'),

    validate,
]

/**
 * Validator for voice search
 */
export const processVoiceSearchValidator = [
    body('transcript')
        .trim()
        .notEmpty()
        .withMessage('Nội dung phiên âm là bắt buộc')
        .isLength({ min: 2, max: 1000 })
        .withMessage('Nội dung phiên âm phải có độ dài từ 2 đến 1000 ký tự'),

    validate,
]
