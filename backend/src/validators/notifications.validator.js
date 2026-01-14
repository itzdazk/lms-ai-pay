// src/validators/notifications.validator.js
import { param, query } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'

const paginationValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Trang phải là số nguyên dương'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Giới hạn phải từ 1 đến 100'),
]

const getNotificationsValidator = [...paginationValidation, validate]

const getNotificationByIdValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID thông báo phải là số nguyên dương'),
    validate,
]

const markNotificationReadValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID thông báo phải là số nguyên dương'),
    validate,
]

const deleteNotificationValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID thông báo phải là số nguyên dương'),
    validate,
]

export {
    getNotificationsValidator,
    getNotificationByIdValidator,
    markNotificationReadValidator,
    deleteNotificationValidator,
}
