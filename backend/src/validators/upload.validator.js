// src/validators/upload.validator.js
import { query, param } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'
import { HTTP_STATUS, UPLOAD_TYPES } from '../config/constants.js'

/**
 * Validator for file upload
 * Kiểm tra sau khi multer đã xử lý file
 */
const uploadFileValidator = [
    // Validate query parameters
    query('type')
        .optional()
        .isString()
        .withMessage('Type must be a string')
        .isIn([
            UPLOAD_TYPES.IMAGE.AVATAR,
            UPLOAD_TYPES.IMAGE.THUMBNAIL,
            UPLOAD_TYPES.IMAGE.GENERAL,
            UPLOAD_TYPES.VIDEO.LESSON,
            UPLOAD_TYPES.VIDEO.PREVIEW,
            UPLOAD_TYPES.VIDEO.GENERAL,
            UPLOAD_TYPES.DOCUMENT.TRANSCRIPT,
            UPLOAD_TYPES.DOCUMENT.MATERIAL,
            UPLOAD_TYPES.DOCUMENT.GENERAL,
        ])
        .withMessage('Invalid file type'),

    query('courseId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Course ID must be a positive integer'),

    query('lessonId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Lesson ID must be a positive integer'),

    validate,

    // Custom validation for file
    (req, res, next) => {
        if (!req.file) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'No file uploaded',
            })
        }
        next()
    },
]

/**
 * Validator for delete file
 */
const deleteFileValidator = [
    param('fileId')
        .trim()
        .notEmpty()
        .withMessage('File ID is required')
        .isLength({ min: 1, max: 255 })
        .withMessage('File ID must be between 1 and 255 characters'),

    validate,
]

/**
 * Validator for get upload status
 */
const getUploadStatusValidator = [
    param('fileId')
        .trim()
        .notEmpty()
        .withMessage('File ID is required')
        .isLength({ min: 1, max: 255 })
        .withMessage('File ID must be between 1 and 255 characters'),

    validate,
]

/**
 * Validator for get user files
 */
const getUserFilesValidator = [
    query('type')
        .optional()
        .isString()
        .withMessage('Type must be a string')
        .isIn(['image', 'video', 'document'])
        .withMessage(
            'Invalid file category. Must be: image, video, or document'
        ),

    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),

    validate,
]

export {
    uploadFileValidator,
    deleteFileValidator,
    getUploadStatusValidator,
    getUserFilesValidator,
}
