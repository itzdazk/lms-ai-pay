// src/validators/lesson-notes.validator.js
import { body, param } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'

export const getLessonNoteValidator = [
    param('lessonId')
        .isInt({ min: 1 })
        .withMessage('ID bài học phải là số nguyên dương'),
    validate,
]

export const upsertLessonNoteValidator = [
    param('lessonId')
        .isInt({ min: 1 })
        .withMessage('ID bài học phải là số nguyên dương'),
    body('content')
        .optional()
        .isString()
        .withMessage('Nội dung ghi chú phải là chuỗi ký tự'),
    validate,
]

export const deleteLessonNoteValidator = [
    param('lessonId')
        .isInt({ min: 1 })
        .withMessage('ID bài học phải là số nguyên dương'),
    validate,
]

export const getCourseNotesValidator = [
    param('courseId')
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là số nguyên dương'),
    validate,
]
