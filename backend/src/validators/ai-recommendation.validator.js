// backend/src/validators/ai-recommendation.validator.js
import { param, query } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'

/**
 * Xác thực tham số truy vấn lấy đề xuất
 */
const getRecommendationsValidator = [
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit phải nằm trong khoảng 1 đến 50')
        .toInt(),
    query('forceRefresh')
        .optional()
        .isBoolean()
        .withMessage('forceRefresh phải là kiểu boolean'),
    validate,
]

/**
 * Xác thực tham số và truy vấn lấy các khóa học tương tự
 */
const getSimilarCoursesValidator = [
    param('courseId')
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là một số nguyên dương')
        .toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 20 })
        .withMessage('Limit phải nằm trong khoảng 1 đến 20')
        .toInt(),
    validate,
]

/**
 * Xác thực tham số đánh dấu đã xem
 */
const markAsViewedValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID đề xuất phải là một số nguyên dương')
        .toInt(),
    validate,
]

export {
    getRecommendationsValidator,
    getSimilarCoursesValidator,
    markAsViewedValidator,
}
