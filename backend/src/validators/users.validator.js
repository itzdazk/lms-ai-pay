// src/validators/users.validator.js
import { body, query, param } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'
import { USER_ROLES, USER_STATUS } from '../config/constants.js'

// Update profile validator
const updateProfileValidator = [
    body('fullName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Họ và tên phải có độ dài từ 2 đến 100 ký tự'),

    body('phone')
        .optional()
        .trim()
        .matches(/^0\d{9}$/)
        .withMessage(
            'Số điện thoại phải có đúng 10 chữ số và bắt đầu bằng số 0'
        ),

    body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Tiểu sử không được vượt quá 500 ký tự'),

    validate,
]

// Change password validator
const changePasswordValidator = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Mật khẩu hiện tại là bắt buộc'),

    body('newPassword')
        .notEmpty()
        .withMessage('Mật khẩu mới là bắt buộc')
        .isLength({ min: 8 })
        .withMessage('Mật khẩu phải có ít nhất 8 ký tự')
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/
        )
        .withMessage(
            'Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường, một chữ số và một ký tự đặc biệt'
        ),

    body('confirmPassword')
        .notEmpty()
        .withMessage('Xác nhận mật khẩu là bắt buộc')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('Mật khẩu không khớp')
            }
            return true
        }),

    validate,
]

// Get users list validator (Admin only)
const getUsersValidator = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Trang phải là số nguyên dương'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Giới hạn phải nằm trong khoảng từ 1 đến 100'),

    query('role')
        .optional()
        .isIn([
            USER_ROLES.ADMIN,
            USER_ROLES.INSTRUCTOR,
            USER_ROLES.STUDENT,
            USER_ROLES.GUEST,
        ])
        .withMessage('Vai trò không hợp lệ'),

    query('status')
        .optional()
        .isIn([USER_STATUS.ACTIVE, USER_STATUS.INACTIVE, USER_STATUS.BANNED])
        .withMessage('Trạng thái không hợp lệ'),

    query('search')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Từ khóa tìm kiếm phải có độ dài từ 1 đến 100 ký tự'),

    validate,
]

// Update user validator (Admin only)
const updateUserValidator = [
    body('fullName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Họ và tên phải có độ dài từ 2 đến 100 ký tự'),

    body('phone')
        .optional()
        .trim()
        .matches(/^0\d{9}$/)
        .withMessage(
            'Số điện thoại phải có đúng 10 chữ số và bắt đầu bằng số 0'
        ),

    body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Tiểu sử không được vượt quá 500 ký tự'),

    body('role')
        .optional()
        .isIn([USER_ROLES.INSTRUCTOR, USER_ROLES.STUDENT])
        .withMessage(
            'Vai trò không hợp lệ. Chỉ cho phép vai trò STUDENT và INSTRUCTOR'
        ),

    body('status')
        .optional()
        .isIn([USER_STATUS.ACTIVE, USER_STATUS.INACTIVE, USER_STATUS.BANNED])
        .withMessage('Trạng thái không hợp lệ'),

    body('emailVerified')
        .optional()
        .isBoolean()
        .withMessage('emailVerified phải là giá trị boolean'),

    validate,
]

// ID parameter validator
const userIdValidator = [
    param('id').isInt({ min: 1 }).withMessage('ID người dùng không hợp lệ'),
    validate,
]

// Change role validator (Admin only)
const changeRoleValidator = [
    param('id').isInt({ min: 1 }).withMessage('ID người dùng không hợp lệ'),

    body('role')
        .notEmpty()
        .withMessage('Vai trò là bắt buộc')
        .isIn([USER_ROLES.INSTRUCTOR, USER_ROLES.STUDENT])
        .withMessage(
            'Vai trò không hợp lệ. Chỉ cho phép vai trò STUDENT và INSTRUCTOR'
        ),

    validate,
]

// Change status validator (Admin only)
const changeStatusValidator = [
    param('id').isInt({ min: 1 }).withMessage('ID người dùng không hợp lệ'),

    body('status')
        .notEmpty()
        .withMessage('Trạng thái là bắt buộc')
        .isIn([USER_STATUS.ACTIVE, USER_STATUS.INACTIVE, USER_STATUS.BANNED])
        .withMessage('Trạng thái không hợp lệ'),

    validate,
]

// Get user enrollments validator (Admin only)
const getUserEnrollmentsValidator = [
    param('id').isInt({ min: 1 }).withMessage('ID người dùng không hợp lệ'),

    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Trang phải là số nguyên dương'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Giới hạn phải nằm trong khoảng từ 1 đến 100'),

    query('status')
        .optional()
        .isIn(['ACTIVE', 'COMPLETED', 'DROPPED', 'EXPIRED'])
        .withMessage('Trạng thái không hợp lệ'),

    query('search')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Từ khóa tìm kiếm phải có độ dài từ 1 đến 100 ký tự'),

    query('sort')
        .optional()
        .isIn(['newest', 'oldest', 'progress', 'lastAccessed'])
        .withMessage('Tùy chọn sắp xếp không hợp lệ'),

    validate,
]

// Delete user enrollment validator (Admin only)
const deleteUserEnrollmentValidator = [
    param('id').isInt({ min: 1 }).withMessage('ID người dùng không hợp lệ'),

    param('enrollmentId')
        .isInt({ min: 1 })
        .withMessage('ID đăng ký không hợp lệ'),

    validate,
]

export {
    updateProfileValidator,
    changePasswordValidator,
    getUsersValidator,
    updateUserValidator,
    userIdValidator,
    changeRoleValidator,
    changeStatusValidator,
    getUserEnrollmentsValidator,
    deleteUserEnrollmentValidator,
}
