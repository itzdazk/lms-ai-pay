// src/validators/tags.validator.js
import { body, param, query } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'

const createTagValidator = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Tên thẻ là bắt buộc')
        .isLength({ min: 2, max: 50 })
        .withMessage('Tên thẻ phải có độ dài từ 2 đến 50 ký tự'),

    body('slug')
        .trim()
        .notEmpty()
        .withMessage('Slug thẻ là bắt buộc')
        .isLength({ min: 2, max: 50 })
        .withMessage('Slug thẻ phải có độ dài từ 2 đến 50 ký tự')
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage('Slug chỉ được chứa chữ thường, số và dấu gạch ngang'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Mô tả không được vượt quá 500 ký tự'),

    validate,
]

const updateTagValidator = [
    param('id').isInt({ min: 1 }).withMessage('ID thẻ phải là số nguyên dương'),

    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Tên thẻ phải có độ dài từ 2 đến 50 ký tự'),

    body('slug')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Slug thẻ phải có độ dài từ 2 đến 50 ký tự')
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage('Slug chỉ được chứa chữ thường, số và dấu gạch ngang'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Mô tả không được vượt quá 500 ký tự'),

    validate,
]

const getTagByIdValidator = [
    param('id').isInt({ min: 1 }).withMessage('ID thẻ phải là số nguyên dương'),

    validate,
]

const getTagsValidator = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Trang phải là số nguyên dương'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Giới hạn phải nằm trong khoảng từ 1 đến 100'),

    query('search')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Từ khóa tìm kiếm phải có độ dài từ 1 đến 100 ký tự'),

    validate,
]

const getTagCoursesValidator = [
    param('id').isInt({ min: 1 }).withMessage('ID thẻ phải là số nguyên dương'),

    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Trang phải là số nguyên dương'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Giới hạn phải nằm trong khoảng từ 1 đến 100'),

    query('level')
        .optional()
        .isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
        .withMessage('Cấp độ không hợp lệ'),

    query('sort')
        .optional()
        .isIn(['newest', 'popular', 'rating', 'price_asc', 'price_desc'])
        .withMessage('Tùy chọn sắp xếp không hợp lệ'),

    validate,
]

const deleteTagValidator = [
    param('id').isInt({ min: 1 }).withMessage('ID thẻ phải là số nguyên dương'),

    validate,
]

export {
    createTagValidator,
    updateTagValidator,
    getTagByIdValidator,
    getTagsValidator,
    getTagCoursesValidator,
    deleteTagValidator,
}
