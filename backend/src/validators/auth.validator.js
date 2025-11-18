// src/validators/auth.validator.js
import { body } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'

const registerValidator = [
    body('userName')
        .trim()
        .notEmpty()
        .withMessage('userName is required')
        .isLength({ min: 3, max: 50 })
        .withMessage('userName must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage(
            'userName can only contain letters, numbers and underscores'
        ),

    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/
        )
        .withMessage(
            'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
        ),

    body('fullName')
        .trim()
        .notEmpty()
        .withMessage('Full name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters'),

    body('role')
        .optional()
        .isIn(['STUDENT', 'INSTRUCTOR', 'ADMIN'])
        .withMessage('Invalid role'),

    validate,
]

const loginValidator = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),

    body('password').notEmpty().withMessage('Password is required'),

    validate,
]

const verifyEmailValidator = [
    body('token').notEmpty().withMessage('Verification token is required'),

    validate,
]

const forgotPasswordValidator = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),

    validate,
]

const resetPasswordValidator = [
    body('token').notEmpty().withMessage('Reset token is required'),

    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/
        )
        .withMessage(
            'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
        ),

    validate,
]

const changePasswordValidator = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),

    body('newPassword')
        .notEmpty()
        .withMessage('New password is required')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/
        )
        .withMessage(
            'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
        )
        .custom((value, { req }) => {
            if (value === req.body.currentPassword) {
                throw new Error(
                    'New password must be different from current password'
                )
            }
            return true
        }),

    validate,
]

export {
    registerValidator,
    loginValidator,
    verifyEmailValidator,
    forgotPasswordValidator,
    resetPasswordValidator,
    changePasswordValidator,
}
