// src/validators/course.validator.js
import { param, query } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'
import { COURSE_LEVEL } from '../config/constants.js'

// Get courses validator
const getCoursesValidator = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Số trang phải là số nguyên dương'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Giới hạn phải từ 1 đến 100'),

    query('search')
        .optional()
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Từ khóa tìm kiếm phải từ 1 đến 200 ký tự'),

    query('categoryId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID danh mục phải là số nguyên dương'),

    query('level')
        .optional()
        .isIn([
            COURSE_LEVEL.BEGINNER,
            COURSE_LEVEL.INTERMEDIATE,
            COURSE_LEVEL.ADVANCED,
        ])
        .withMessage('Trình độ khóa học không hợp lệ'),

    query('minPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Giá tối thiểu phải là số không âm'),

    query('maxPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Giá tối đa phải là số không âm'),

    query('isFeatured')
        .optional()
        .isBoolean()
        .withMessage('isFeatured phải là giá trị boolean'),

    query('instructorId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID giảng viên phải là số nguyên dương'),

    query('sort')
        .optional()
        .isIn(['newest', 'popular', 'rating', 'price_asc', 'price_desc'])
        .withMessage('Tùy chọn sắp xếp không hợp lệ'),

    query('tagId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID thẻ phải là số nguyên hợp lệ'),

    query('tagIds')
        .optional()
        .custom((value) => {
            if (Array.isArray(value)) {
                return value.every(
                    (id) => !isNaN(parseInt(id)) && parseInt(id) > 0
                )
            }
            if (typeof value === 'string') {
                const ids = value.split(',').map((id) => id.trim())
                return ids.every(
                    (id) => !isNaN(parseInt(id)) && parseInt(id) > 0
                )
            }
            return false
        })
        .withMessage(
            'ID thẻ phải là số nguyên hợp lệ (phân cách bằng dấu phẩy hoặc mảng)'
        ),

    validate,
]

// Get featured/trending courses validator
const getLimitValidator = [
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Giới hạn phải từ 1 đến 50'),

    validate,
]

// Get course by ID validator
const getCourseByIdValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là số nguyên dương'),

    validate,
]

// Get course by slug validator
const getCourseBySlugValidator = [
    param('slug')
        .trim()
        .notEmpty()
        .withMessage('Đường dẫn khóa học không được để trống')
        .isLength({ min: 1, max: 200 })
        .withMessage('Đường dẫn phải từ 1 đến 200 ký tự')
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage('Định dạng đường dẫn không hợp lệ'),

    validate,
]

export {
    getCoursesValidator,
    getLimitValidator,
    getCourseByIdValidator,
    getCourseBySlugValidator,
}
