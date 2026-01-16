// src/validators/progress.validator.js
import { param, body } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'

// Get course progress validator
export const getCourseProgressValidator = [
    param('courseId')
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là số nguyên dương'),
    validate,
]

// Get lesson progress validator
export const getLessonProgressValidator = [
    param('lessonId')
        .isInt({ min: 1 })
        .withMessage('ID bài học phải là số nguyên dương'),
    validate,
]

// Start lesson validator
export const startLessonValidator = [
    param('lessonId')
        .isInt({ min: 1 })
        .withMessage('ID bài học phải là số nguyên dương'),
    validate,
]

// Update progress validator
export const updateProgressValidator = [
    param('lessonId')
        .isInt({ min: 1 })
        .withMessage('ID bài học phải là số nguyên dương'),
    body('position')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Vị trí phải là số nguyên không âm'),
    body('watchDuration')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Thời lượng xem phải là số nguyên không âm'),
    validate,
]

// Get resume position validator
export const getResumePositionValidator = [
    param('lessonId')
        .isInt({ min: 1 })
        .withMessage('ID bài học phải là số nguyên dương'),
    validate,
]
