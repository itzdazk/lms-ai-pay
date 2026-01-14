// src/validators/category.validator.js
import { body, param, query } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'

const createCategoryValidator = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Tên danh mục không được để trống')
        .isLength({ min: 2, max: 100 })
        .withMessage('Tên danh mục phải từ 2 đến 100 ký tự'),

    body('slug')
        .trim()
        .notEmpty()
        .withMessage('Đường dẫn danh mục không được để trống')
        .isLength({ min: 2, max: 100 })
        .withMessage('Đường dẫn danh mục phải từ 2 đến 100 ký tự')
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage(
            'Đường dẫn chỉ được chứa chữ thường, số và dấu gạch ngang'
        ),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Mô tả không được vượt quá 1000 ký tự'),

    body('imageUrl')
        .optional()
        .trim()
        .isURL()
        .withMessage('URL hình ảnh phải là đường dẫn hợp lệ'),

    body('parentId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID danh mục cha phải là số nguyên dương'),

    body('sortOrder')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Thứ tự sắp xếp phải là số nguyên không âm'),

    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive phải là giá trị boolean'),

    validate,
]

const updateCategoryValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID danh mục phải là số nguyên dương'),

    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Tên danh mục phải từ 2 đến 100 ký tự'),

    body('slug')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Đường dẫn danh mục phải từ 2 đến 100 ký tự')
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage(
            'Đường dẫn chỉ được chứa chữ thường, số và dấu gạch ngang'
        ),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Mô tả không được vượt quá 1000 ký tự'),

    body('imageUrl')
        .optional()
        .trim()
        .isURL()
        .withMessage('URL hình ảnh phải là đường dẫn hợp lệ'),

    body('parentId')
        .optional()
        .custom((value) => {
            if (value === null || value === '') return true
            return Number.isInteger(Number(value)) && Number(value) > 0
        })
        .withMessage('ID danh mục cha phải là số nguyên dương hoặc null'),

    body('sortOrder')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Thứ tự sắp xếp phải là số nguyên không âm'),

    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive phải là giá trị boolean'),

    validate,
]

const getCategoryByIdValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID danh mục phải là số nguyên dương'),

    validate,
]

const getCategoryBySlugValidator = [
    param('slug')
        .trim()
        .notEmpty()
        .withMessage('Đường dẫn danh mục không được để trống')
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage('Định dạng đường dẫn không hợp lệ'),

    validate,
]

const getCategoriesValidator = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Số trang phải là số nguyên dương'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Giới hạn phải từ 1 đến 100'),

    query('parentId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID danh mục cha phải là số nguyên dương'),

    query('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive phải là giá trị boolean'),

    query('search')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Từ khóa tìm kiếm phải từ 1 đến 100 ký tự'),

    validate,
]

const getCategoryCoursesValidator = [
    param('id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID danh mục phải là số nguyên dương'),

    param('slug')
        .optional()
        .trim()
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage('Định dạng đường dẫn không hợp lệ'),

    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Số trang phải là số nguyên dương'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Giới hạn phải từ 1 đến 100'),

    query('level')
        .optional()
        .isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
        .withMessage('Trình độ không hợp lệ'),

    query('sort')
        .optional()
        .isIn(['newest', 'popular', 'rating', 'price_asc', 'price_desc'])
        .withMessage('Tùy chọn sắp xếp không hợp lệ'),

    validate,
]

const deleteCategoryValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID danh mục phải là số nguyên dương'),

    validate,
]

export {
    createCategoryValidator,
    updateCategoryValidator,
    getCategoryByIdValidator,
    getCategoryBySlugValidator,
    getCategoriesValidator,
    getCategoryCoursesValidator,
    deleteCategoryValidator,
}
