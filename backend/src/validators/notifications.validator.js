// src/validators/notifications.validator.js
import { param, query } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'

const paginationValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
]

const getNotificationsValidator = [...paginationValidation, validate]

const getNotificationByIdValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Notification ID must be a positive integer'),
    validate,
]

const markNotificationReadValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Notification ID must be a positive integer'),
    validate,
]

const deleteNotificationValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Notification ID must be a positive integer'),
    validate,
]

export {
    getNotificationsValidator,
    getNotificationByIdValidator,
    markNotificationReadValidator,
    deleteNotificationValidator,
}

