// backend/src/validators/ai-recommendation.validator.js
import { param, query } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'

/**
 * Validate get recommendations query params
 */
const getRecommendationsValidator = [
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50')
        .toInt(),
    query('forceRefresh')
        .optional()
        .isBoolean()
        .withMessage('forceRefresh must be boolean'),
    validate,
]

/**
 * Validate get similar courses params and query
 */
const getSimilarCoursesValidator = [
    param('courseId')
        .isInt({ min: 1 })
        .withMessage('Course ID must be a positive integer')
        .toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 20 })
        .withMessage('Limit must be between 1 and 20')
        .toInt(),
    validate,
]

/**
 * Validate mark as viewed params
 */
const markAsViewedValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Recommendation ID must be a positive integer')
        .toInt(),
    validate,
]

export {
    getRecommendationsValidator,
    getSimilarCoursesValidator,
    markAsViewedValidator,
}
