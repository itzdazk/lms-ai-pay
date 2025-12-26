// src/validators/ai.validator.js
import { body, param, query } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'

/**
 * Validate conversation ID param
 */
export const conversationIdValidator = [
    param('id').isInt({ min: 1 }).withMessage('Invalid conversation ID'),
    validate,
]

/**
 * Validate message ID param
 */
export const messageIdValidator = [
    param('id').isInt({ min: 1 }).withMessage('Invalid message ID'),
    validate,
]

/**
 * Validate create conversation
 */
export const createConversationValidator = [
    body('courseId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Invalid course ID'),

    body('lessonId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Invalid lesson ID'),

    body('title')
        .optional()
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Title must be between 1 and 200 characters'),

    validate,
]

/**
 * Validate send message for Advisor (public, stricter limit)
 */
export const sendMessageValidatorAdvisor = [
    body('message')
        .trim()
        .notEmpty()
        .withMessage('Message is required')
        .isLength({ min: 1, max: 2000 })
        .withMessage('Message must be between 1 and 2000 characters'),

    validate,
]

/**
 * Validate send message for Tutor (authenticated, more lenient)
 */
export const sendMessageValidatorTutor = [
    body('message')
        .trim()
        .notEmpty()
        .withMessage('Message is required')
        .isLength({ min: 1, max: 5000 })
        .withMessage('Message must be between 1 and 5000 characters'),

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
    body('isHelpful').isBoolean().withMessage('isHelpful must be a boolean'),

    body('feedbackText')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Feedback text must not exceed 1000 characters'),

    validate,
]

/**
 * Validate search query
 */
export const searchValidator = [
    query('q')
        .trim()
        .notEmpty()
        .withMessage('Search query is required')
        .isLength({ min: 2, max: 200 })
        .withMessage('Query must be between 2 and 200 characters'),

    query('courseId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Invalid course ID'),

    query('lessonId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Invalid lesson ID'),

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
        .withMessage("order must be 'asc' or 'desc'"),
    validate,
]
