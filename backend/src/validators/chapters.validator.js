// src/validators/chapters.validator.js
import { body, param, query } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'

const getChaptersByCourseValidator = [
    param('courseId')
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là số nguyên dương'),
    query('includeLessons')
        .optional()
        .isBoolean()
        .withMessage('includeLessons phải là giá trị boolean'),
    validate,
]

const getChapterByIdValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID chương học phải là số nguyên dương'),
    query('includeLessons')
        .optional()
        .isBoolean()
        .withMessage('includeLessons phải là giá trị boolean'),
    validate,
]

const createChapterValidator = [
    param('courseId')
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là số nguyên dương'),

    body('title')
        .trim()
        .notEmpty()
        .withMessage('Tiêu đề chương học không được để trống')
        .isLength({ min: 2, max: 200 })
        .withMessage('Tiêu đề chương học phải từ 2 đến 200 ký tự'),

    body('slug')
        .optional()
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Đường dẫn chương học phải từ 2 đến 200 ký tự')
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage(
            'Đường dẫn chỉ được chứa chữ thường, số và dấu gạch ngang'
        ),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Mô tả không được vượt quá 2000 ký tự'),

    body('chapterOrder')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Thứ tự chương học phải là số nguyên dương'),

    body('isPublished')
        .optional()
        .isBoolean()
        .withMessage('isPublished phải là giá trị boolean'),

    validate,
]

const updateChapterValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID chương học phải là số nguyên dương'),

    body('title')
        .optional()
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Tiêu đề chương học phải từ 2 đến 200 ký tự'),

    body('slug')
        .optional()
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Đường dẫn chương học phải từ 2 đến 200 ký tự')
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage(
            'Đường dẫn chỉ được chứa chữ thường, số và dấu gạch ngang'
        ),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Mô tả không được vượt quá 2000 ký tự'),

    body('chapterOrder')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Thứ tự chương học phải là số nguyên dương'),

    body('isPublished')
        .optional()
        .isBoolean()
        .withMessage('isPublished phải là giá trị boolean'),

    validate,
]

const deleteChapterValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID chương học phải là số nguyên dương'),
    validate,
]

const reorderChaptersValidator = [
    param('courseId')
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là số nguyên dương'),

    body('chapterIds')
        .isArray({ min: 1 })
        .withMessage('chapterIds phải là mảng không rỗng')
        .custom((value) => {
            if (!Array.isArray(value)) {
                throw new Error('chapterIds phải là mảng')
            }
            if (value.length === 0) {
                throw new Error('Mảng chapterIds không được để trống')
            }
            const allIntegers = value.every(
                (id) => Number.isInteger(parseInt(id)) && parseInt(id) > 0
            )
            if (!allIntegers) {
                throw new Error('Tất cả ID chương học phải là số nguyên dương')
            }
            return true
        }),

    validate,
]

export {
    getChaptersByCourseValidator,
    getChapterByIdValidator,
    createChapterValidator,
    updateChapterValidator,
    deleteChapterValidator,
    reorderChaptersValidator,
}
