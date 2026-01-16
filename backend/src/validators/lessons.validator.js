// src/validators/lessons.validator.js
import { body, param, query } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'

const getLessonByIdValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID bài học phải là số nguyên dương'),
    validate,
]

const getLessonVideoValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID bài học phải là số nguyên dương'),
    validate,
]

const getLessonTranscriptValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID bài học phải là số nguyên dương'),
    validate,
]

const createLessonValidator = [
    param('courseId')
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là số nguyên dương'),

    body('title')
        .trim()
        .notEmpty()
        .withMessage('Tiêu đề bài học là bắt buộc')
        .isLength({ min: 2, max: 200 })
        .withMessage('Tiêu đề bài học phải có độ dài từ 2 đến 200 ký tự'),

    body('slug')
        .optional()
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Slug bài học phải có độ dài từ 2 đến 200 ký tự')
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage('Slug chỉ được chứa chữ thường, số và dấu gạch ngang'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Mô tả không được vượt quá 2000 ký tự'),

    body('content')
        .optional()
        .trim()
        .isLength({ max: 10000 })
        .withMessage('Nội dung không được vượt quá 10000 ký tự'),

    body('lessonOrder')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Thứ tự bài học phải là số nguyên dương'),

    body('isPreview')
        .optional()
        .isBoolean()
        .withMessage('isPreview phải là giá trị boolean'),

    body('isPublished')
        .optional()
        .isBoolean()
        .withMessage('isPublished phải là giá trị boolean'),

    body('chapterId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID chương phải là số nguyên dương'),

    validate,
]

const updateLessonValidator = [
    param('courseId')
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là số nguyên dương'),

    param('id')
        .isInt({ min: 1 })
        .withMessage('ID bài học phải là số nguyên dương'),

    body('title')
        .optional()
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Tiêu đề bài học phải có độ dài từ 2 đến 200 ký tự'),

    body('slug')
        .optional()
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Slug bài học phải có độ dài từ 2 đến 200 ký tự')
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage('Slug chỉ được chứa chữ thường, số và dấu gạch ngang'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Mô tả không được vượt quá 2000 ký tự'),

    body('content')
        .optional()
        .trim()
        .isLength({ max: 10000 })
        .withMessage('Nội dung không được vượt quá 10000 ký tự'),

    body('lessonOrder')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Thứ tự bài học phải là số nguyên dương'),

    body('isPreview')
        .optional()
        .isBoolean()
        .withMessage('isPreview phải là giá trị boolean'),

    body('isPublished')
        .optional()
        .isBoolean()
        .withMessage('isPublished phải là giá trị boolean'),

    validate,
]

const deleteLessonValidator = [
    param('courseId')
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là số nguyên dương'),

    param('id')
        .isInt({ min: 1 })
        .withMessage('ID bài học phải là số nguyên dương'),

    validate,
]

const uploadVideoValidator = [
    param('courseId')
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là số nguyên dương'),

    param('id')
        .isInt({ min: 1 })
        .withMessage('ID bài học phải là số nguyên dương'),

    validate,
]

const uploadTranscriptValidator = [
    param('courseId')
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là số nguyên dương'),

    param('id')
        .isInt({ min: 1 })
        .withMessage('ID bài học phải là số nguyên dương'),

    validate,
]

const reorderLessonValidator = [
    param('courseId')
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là số nguyên dương'),

    param('id')
        .isInt({ min: 1 })
        .withMessage('ID bài học phải là số nguyên dương'),

    body('newOrder')
        .isInt({ min: 1 })
        .withMessage('Thứ tự mới phải là số nguyên dương'),

    validate,
]

const publishLessonValidator = [
    param('courseId')
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là số nguyên dương'),

    param('id')
        .isInt({ min: 1 })
        .withMessage('ID bài học phải là số nguyên dương'),

    body('isPublished')
        .isBoolean()
        .withMessage('isPublished phải là giá trị boolean'),

    validate,
]

const reorderLessonsValidator = [
    param('courseId')
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là số nguyên dương'),

    param('chapterId')
        .isInt({ min: 1 })
        .withMessage('ID chương phải là số nguyên dương'),

    body('lessonIds')
        .isArray()
        .withMessage('Danh sách ID bài học phải là một mảng')
        .notEmpty()
        .withMessage('Danh sách ID bài học không được để trống'),

    body('lessonIds.*')
        .isInt({ min: 1 })
        .withMessage('Mỗi ID bài học phải là số nguyên dương'),

    validate,
]

const requestTranscriptValidator = [
    param('courseId')
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là số nguyên dương'),

    param('id')
        .isInt({ min: 1 })
        .withMessage('ID bài học phải là số nguyên dương'),

    validate,
]

export {
    getLessonByIdValidator,
    getLessonVideoValidator,
    getLessonTranscriptValidator,
    createLessonValidator,
    updateLessonValidator,
    deleteLessonValidator,
    uploadVideoValidator,
    uploadTranscriptValidator,
    reorderLessonValidator,
    reorderLessonsValidator,
    publishLessonValidator,
    requestTranscriptValidator,
}
