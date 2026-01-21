// backend/src/validators/student-coupon.validator.js
import { query } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'
import { COUPON_TYPES } from '../config/constants.js'

/**
 * Validator for getting available coupons (Student)
 */
export const getAvailableCouponsValidator = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Trang phải là số nguyên dương'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Giới hạn phải từ 1 đến 100'),
    query('type')
        .optional()
        .isIn(Object.values(COUPON_TYPES))
        .withMessage(
            `Loại mã giảm giá phải là một trong: ${Object.values(COUPON_TYPES).join(', ')}`,
        ),
    validate,
]
