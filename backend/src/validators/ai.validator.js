// src/validators/ai.validator.js
import { body, param, query } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'

/**
 * Validate conversation ID param
 */
export const conversationIdValidator = [
    param('id').isInt({ min: 1 }).withMessage('ID cuộc hội thoại không hợp lệ'),
    validate,
]

/**
 * Validate message ID param
 */
export const messageIdValidator = [
    param('id').isInt({ min: 1 }).withMessage('ID tin nhắn không hợp lệ'),
    validate,
]

/**
 * Validate create conversation
 */
export const createConversationValidator = [
    body('courseId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID khóa học không hợp lệ'),

    body('lessonId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID bài học không hợp lệ'),

    body('title')
        .optional()
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Tiêu đề phải từ 1 đến 200 ký tự'),

    validate,
]

/**
 * Validate send message for Advisor (public, stricter limit)
 */
export const sendMessageValidatorAdvisor = [
    body('message')
        .trim()
        .notEmpty()
        .withMessage('Tin nhắn không được để trống')
        .isLength({ min: 1, max: 2000 })
        .withMessage('Tin nhắn phải từ 1 đến 2000 ký tự'),

    validate,
]

/**
 * Validate send message for Tutor (authenticated, more lenient)
 */
export const sendMessageValidatorTutor = [
    body('message')
        .trim()
        .notEmpty()
        .withMessage('Tin nhắn không được để trống')
        .isLength({ min: 1, max: 5000 })
        .withMessage('Tin nhắn phải từ 1 đến 5000 ký tự'),

    validate,
]

/**
 * Legacy validator - defaults to Tutor limits for backward compatibility
 */
export const sendMessageValidator = sendMessageValidatorTutor

/**
 * Validate feedback
 */
export const feedbackMessageValidator = [
    body('isHelpful')
        .isBoolean()
        .withMessage('isHelpful phải là giá trị boolean'),

    body('feedbackText')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Nội dung phản hồi không được vượt quá 1000 ký tự'),

    validate,
]

/**
 * Validate search query
 */
export const searchValidator = [
    query('q')
        .trim()
        .notEmpty()
        .withMessage('Từ khóa tìm kiếm không được để trống')
        .isLength({ min: 2, max: 200 })
        .withMessage('Từ khóa tìm kiếm phải từ 2 đến 200 ký tự'),

    query('courseId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID khóa học không hợp lệ'),

    query('lessonId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID bài học không hợp lệ'),

    validate,
]

/**
 * Validate messages list query params
 * Supports optional order (asc|desc)
 */
export const messagesQueryValidator = [
    query('order')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage("Thứ tự sắp xếp phải là 'asc' hoặc 'desc'"),
    validate,
]
