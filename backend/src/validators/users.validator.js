// src/validators/users.validator.js
import { body, query, param } from 'express-validator';
import { validate } from '../middlewares/validate.middleware.js';
import { USER_ROLES, USER_STATUS } from '../config/constants.js';

// Update profile validator
const updateProfileValidator = [
    body('fullName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters'),

    body('phone')
        .optional()
        .trim()
        .matches(/^0\d{9}$/)
        .withMessage('Phone number must be exactly 10 digits and start with 0'),

    body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Bio must not exceed 500 characters'),

    validate,
];

// Change password validator
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
        ),

    body('confirmPassword')
        .notEmpty() 
        .withMessage('Confirm password is required')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('Passwords do not match');
            }
            return true;
        }),

    validate,
];

// Get users list validator (Admin only)
const getUsersValidator = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),

    query('role')
        .optional()
        .isIn([USER_ROLES.ADMIN, USER_ROLES.INSTRUCTOR, USER_ROLES.STUDENT, USER_ROLES.GUEST])
        .withMessage('Invalid role'),

    query('status')
        .optional()
        .isIn([USER_STATUS.ACTIVE, USER_STATUS.INACTIVE, USER_STATUS.BANNED])
        .withMessage('Invalid status'),

    query('search')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search query must be between 1 and 100 characters'),

    validate,
];

// Update user validator (Admin only)
const updateUserValidator = [
    body('fullName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters'),

    body('phone')
        .optional()
        .trim()
        .matches(/^0\d{9}$/)
        .withMessage('Phone number must be exactly 10 digits and start with 0'),

    body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Bio must not exceed 500 characters'),

    body('role')
        .optional()
        .isIn([USER_ROLES.ADMIN, USER_ROLES.INSTRUCTOR, USER_ROLES.STUDENT, USER_ROLES.GUEST])
        .withMessage('Invalid role'),

    body('status')
        .optional()
        .isIn([USER_STATUS.ACTIVE, USER_STATUS.INACTIVE, USER_STATUS.BANNED])
        .withMessage('Invalid status'),

    body('emailVerified')
        .optional()
        .isBoolean()
        .withMessage('emailVerified must be a boolean'),

    validate,
];

// ID parameter validator
const userIdValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Invalid user ID'),
    validate,
];

export {
    updateProfileValidator,
    changePasswordValidator,
    getUsersValidator,
    updateUserValidator,
    userIdValidator,
};


