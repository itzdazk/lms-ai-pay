// src/validators/admin-course.validator.js
import { body, param, query } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'
import { COURSE_STATUS, COURSE_LEVEL } from '../config/constants.js'

/**
 * Validator for getting all courses (admin)
 */
export const getAllCoursesValidator = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page phải là một số nguyên dương'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must phải nằm trong khoảng 1 đến 100'),
    query('search')
        .optional()
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Từ khóa tìm kiếm phải có độ dài từ 1 đến 200 ký tự'),
    query('status')
        .optional()
        .isIn(Object.values(COURSE_STATUS))
        .withMessage(
            `Trạng thái phải là một trong: ${Object.values(COURSE_STATUS).join(', ')}`
        ),
    query('categoryId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID danh mục phải là một số nguyên dương'),
    query('level')
        .optional()
        .isIn(Object.values(COURSE_LEVEL))
        .withMessage(
            `Mức độ phải là một trong: ${Object.values(COURSE_LEVEL).join(', ')}`
        ),
    query('instructorId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID giảng viên phải là một số nguyên dương'),
    query('isFeatured')
        .optional()
        .isBoolean()
        .withMessage('isFeatured phải là kiểu boolean'),
    query('sort')
        .optional()
        .isIn([
            'newest',
            'oldest',
            'updated',
            'updated-oldest',
            'popular',
            'enrollments',
            'rating',
            'price_asc',
            'price_desc',
            'views',
            'title',
        ])
        .withMessage(
            'Sắp xếp phải là một trong: newest, oldest, updated, updated-oldest, popular, enrollments, rating, price_asc, price_desc, views, title'
        ),
    query('minPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Giá tối thiểu phải là một số không âm'),
    query('maxPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Giá tối đa phải là một số không âm'),
    query('minEnrollments')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Số học viên tối thiểu phải là một số nguyên không âm'),
    query('maxEnrollments')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Số học viên tối đa phải là một số nguyên không âm'),
    query('minRating')
        .optional()
        .isFloat({ min: 0, max: 5 })
        .withMessage('Đánh giá tối thiểu phải nằm trong khoảng 0 đến 5'),
    validate,
]

/**
 * Validator for toggling course featured status
 */
export const toggleCourseFeaturedValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là một số nguyên dương'),
    body('isFeatured')
        .notEmpty()
        .withMessage('isFeatured là bắt buộc')
        .isBoolean()
        .withMessage('isFeatured phải là kiểu boolean'),
    validate,
]
