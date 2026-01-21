// backend/src/validators/coupon.validator.js
import { body, param, query } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'
import { COUPON_TYPES } from '../config/constants.js'

/**
 * Validator for creating a coupon (Admin)
 */
export const createCouponValidator = [
    body('code')
        .notEmpty()
        .withMessage('Mã giảm giá là bắt buộc')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Mã giảm giá phải có độ dài từ 3 đến 50 ký tự')
        .matches(/^[A-Z0-9_-]+$/)
        .withMessage(
            'Mã giảm giá chỉ được chứa chữ in hoa, số, gạch ngang và gạch dưới',
        ),
    body('type')
        .notEmpty()
        .withMessage('Loại mã giảm giá là bắt buộc')
        .isIn(Object.values(COUPON_TYPES))
        .withMessage(
            `Loại mã giảm giá phải là một trong: ${Object.values(COUPON_TYPES).join(', ')}`,
        ),
    body('value')
        .notEmpty()
        .withMessage('Giá trị giảm giá là bắt buộc')
        .isFloat({ min: 0 })
        .withMessage('Giá trị giảm giá phải là số dương'),
    body('maxDiscount')
        .optional({ nullable: true })
        .isFloat({ min: 0 })
        .withMessage('Giảm giá tối đa phải là số dương'),
    body('minOrderValue')
        .optional({ nullable: true })
        .isFloat({ min: 0 })
        .withMessage('Giá trị đơn hàng tối thiểu phải là số dương'),
    body('applicableCourseIds')
        .optional({ nullable: true })
        .isArray()
        .withMessage('Danh sách khóa học áp dụng phải là mảng'),
    body('applicableCourseIds.*')
        .optional({ nullable: true })
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là số nguyên dương'),
    body('applicableCategoryIds')
        .optional({ nullable: true })
        .isArray()
        .withMessage('Danh sách danh mục áp dụng phải là mảng'),
    body('applicableCategoryIds.*')
        .optional({ nullable: true })
        .isInt({ min: 1 })
        .withMessage('ID danh mục phải là số nguyên dương'),
    body('startDate')
        .notEmpty()
        .withMessage('Ngày bắt đầu là bắt buộc')
        .isISO8601()
        .withMessage('Ngày bắt đầu phải là định dạng ISO 8601 hợp lệ'),
    body('endDate')
        .notEmpty()
        .withMessage('Ngày kết thúc là bắt buộc')
        .isISO8601()
        .withMessage('Ngày kết thúc phải là định dạng ISO 8601 hợp lệ')
        .custom((endDate, { req }) => {
            if (new Date(endDate) < new Date(req.body.startDate)) {
                throw new Error('Ngày kết thúc phải sau ngày bắt đầu')
            }
            return true
        }),
    body('maxUses')
        .optional({ nullable: true })
        .isInt({ min: 1 })
        .withMessage('Số lần sử dụng tối đa phải là số nguyên dương'),
    body('maxUsesPerUser')
        .optional({ nullable: true })
        .isInt({ min: 1 })
        .withMessage('Số lần sử dụng tối đa mỗi người phải là số nguyên dương'),
    validate,
]

/**
 * Validator for updating a coupon (Admin)
 */
export const updateCouponValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID mã giảm giá phải là số nguyên dương'),
    body('code')
        .optional()
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Mã giảm giá phải có độ dài từ 3 đến 50 ký tự')
        .matches(/^[A-Z0-9_-]+$/)
        .withMessage(
            'Mã giảm giá chỉ được chứa chữ in hoa, số, gạch ngang và gạch dưới',
        ),
    body('type')
        .optional()
        .isIn(Object.values(COUPON_TYPES))
        .withMessage(
            `Loại mã giảm giá phải là một trong: ${Object.values(COUPON_TYPES).join(', ')}`,
        ),
    body('value')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Giá trị giảm giá phải là số dương'),
    body('maxDiscount')
        .optional({ nullable: true })
        .isFloat({ min: 0 })
        .withMessage('Giảm giá tối đa phải là số dương'),
    body('minOrderValue')
        .optional({ nullable: true })
        .isFloat({ min: 0 })
        .withMessage('Giá trị đơn hàng tối thiểu phải là số dương'),
    body('applicableCourseIds')
        .optional({ nullable: true })
        .isArray()
        .withMessage('Danh sách khóa học áp dụng phải là mảng'),
    body('applicableCourseIds.*')
        .optional({ nullable: true })
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là số nguyên dương'),
    body('applicableCategoryIds')
        .optional({ nullable: true })
        .isArray()
        .withMessage('Danh sách danh mục áp dụng phải là mảng'),
    body('applicableCategoryIds.*')
        .optional({ nullable: true })
        .isInt({ min: 1 })
        .withMessage('ID danh mục phải là số nguyên dương'),
    body('startDate')
        .optional({ nullable: true })
        .isISO8601()
        .withMessage('Ngày bắt đầu phải là định dạng ISO 8601 hợp lệ'),
    body('endDate')
        .optional({ nullable: true })
        .isISO8601()
        .withMessage('Ngày kết thúc phải là định dạng ISO 8601 hợp lệ'),
    body('maxUses')
        .optional({ nullable: true })
        .isInt({ min: 1 })
        .withMessage('Số lần sử dụng tối đa phải là số nguyên dương'),
    body('maxUsesPerUser')
        .optional({ nullable: true })
        .isInt({ min: 1 })
        .withMessage('Số lần sử dụng tối đa mỗi người phải là số nguyên dương'),
    body('active').optional().isBoolean().withMessage('Active phải là boolean'),
    validate,
]

/**
 * Validator for getting coupons list (Admin)
 */
export const getCouponsValidator = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Trang phải là số nguyên dương'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Giới hạn phải từ 1 đến 100'),
    query('search')
        .optional()
        .trim()
        .isLength({ min: 1 })
        .withMessage('Từ khóa tìm kiếm không được rỗng'),
    query('active')
        .optional()
        .isIn(['true', 'false'])
        .withMessage('Active phải là true hoặc false'),
    query('type')
        .optional()
        .isIn(Object.values(COUPON_TYPES))
        .withMessage(
            `Loại mã giảm giá phải là một trong: ${Object.values(COUPON_TYPES).join(', ')}`,
        ),
    query('sort')
        .optional()
        .isIn(['newest', 'oldest', 'most_used', 'least_used'])
        .withMessage(
            'Sắp xếp phải là một trong: newest, oldest, most_used, least_used',
        ),
    validate,
]

/**
 * Validator for getting coupon by ID (Admin)
 */
export const getCouponByIdValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID mã giảm giá phải là số nguyên dương'),
    validate,
]

/**
 * Validator for deleting coupon (Admin)
 */
export const deleteCouponValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID mã giảm giá phải là số nguyên dương'),
    validate,
]

/**
 * Validator for getting coupon usage history (Admin)
 */
export const getCouponUsageHistoryValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID mã giảm giá phải là số nguyên dương'),
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Trang phải là số nguyên dương'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Giới hạn phải từ 1 đến 100'),
    validate,
]

/**
 * Validator for applying coupon (User)
 */
export const applyCouponValidator = [
    body('code')
        .notEmpty()
        .withMessage('Mã giảm giá là bắt buộc')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Mã giảm giá phải có độ dài từ 1 đến 50 ký tự'),
    body('orderTotal')
        .notEmpty()
        .withMessage('Tổng giá trị đơn hàng là bắt buộc')
        .isFloat({ min: 0 })
        .withMessage('Tổng giá trị đơn hàng phải là số dương'),
    body('courseIds')
        .optional()
        .isArray()
        .withMessage('Danh sách khóa học phải là mảng'),
    body('courseIds.*')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là số nguyên dương'),
    validate,
]

/**
 * Validator for toggling coupon active status (Admin)
 */
export const toggleCouponActiveValidator = [
    param('id')
        .notEmpty()
        .withMessage('ID mã giảm giá là bắt buộc')
        .isInt({ min: 1 })
        .withMessage('ID mã giảm giá phải là số nguyên dương'),
    validate,
]
