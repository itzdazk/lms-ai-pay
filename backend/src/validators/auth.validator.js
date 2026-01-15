// src/validators/auth.validator.js
import { body } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'

const registerValidator = [
    body('userName')
        .trim()
        .notEmpty()
        .withMessage('Tên đăng nhập không được để trống')
        .isLength({ min: 3, max: 50 })
        .withMessage('Tên đăng nhập phải từ 3 đến 50 ký tự')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage(
            'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới'
        ),

    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email không được để trống')
        .isEmail()
        .withMessage('Vui lòng nhập email hợp lệ')
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage('Mật khẩu không được để trống')
        .isLength({ min: 8 })
        .withMessage('Mật khẩu phải có ít nhất 8 ký tự')
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/
        )
        .withMessage(
            'Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường, một chữ số và một ký tự đặc biệt'
        ),

    body('fullName')
        .trim()
        .notEmpty()
        .withMessage('Họ và tên không được để trống')
        .isLength({ min: 2, max: 100 })
        .withMessage('Họ và tên phải từ 2 đến 100 ký tự'),

    body('role')
        .optional()
        .isIn(['STUDENT', 'INSTRUCTOR', 'ADMIN'])
        .withMessage('Vai trò không hợp lệ'),

    validate,
]

const loginValidator = [
    body('identifier')
        .trim()
        .notEmpty()
        .withMessage('Email hoặc tên đăng nhập không được để trống'),

    body('password').notEmpty().withMessage('Mật khẩu không được để trống'),

    validate,
]

const verifyEmailValidator = [
    body('token').notEmpty().withMessage('Mã xác thực không được để trống'),

    validate,
]

const forgotPasswordValidator = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email không được để trống')
        .isEmail()
        .withMessage('Vui lòng nhập email hợp lệ')
        .normalizeEmail(),

    validate,
]

const resetPasswordValidator = [
    body('token')
        .notEmpty()
        .withMessage('Mã đặt lại mật khẩu không được để trống'),

    body('password')
        .notEmpty()
        .withMessage('Mật khẩu không được để trống')
        .isLength({ min: 8 })
        .withMessage('Mật khẩu phải có ít nhất 8 ký tự')
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/
        )
        .withMessage(
            'Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường, một chữ số và một ký tự đặc biệt'
        ),

    validate,
]

const changePasswordValidator = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Mật khẩu hiện tại không được để trống'),

    body('newPassword')
        .notEmpty()
        .withMessage('Mật khẩu mới không được để trống')
        .isLength({ min: 8 })
        .withMessage('Mật khẩu phải có ít nhất 8 ký tự')
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/
        )
        .withMessage(
            'Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường, một chữ số và một ký tự đặc biệt'
        )
        .custom((value, { req }) => {
            if (value === req.body.currentPassword) {
                throw new Error('Mật khẩu mới phải khác với mật khẩu hiện tại')
            }
            return true
        }),

    validate,
]


const googleLoginValidator = [
    body('idToken').notEmpty().withMessage('ID Token không được để trống'),
    validate,
]

export {
    registerValidator,
    loginValidator,
    verifyEmailValidator,
    forgotPasswordValidator,
    resetPasswordValidator,
    changePasswordValidator,
    googleLoginValidator,
}
