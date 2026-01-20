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
        .withMessage('Loại phải là chuỗi ký tự')
        .isIn([
            UPLOAD_TYPES.IMAGE.AVATAR,
            UPLOAD_TYPES.IMAGE.THUMBNAIL,
            UPLOAD_TYPES.IMAGE.SYSTEM,
            UPLOAD_TYPES.IMAGE.GENERAL,
            UPLOAD_TYPES.VIDEO.LESSON,
            UPLOAD_TYPES.VIDEO.PREVIEW,
            UPLOAD_TYPES.VIDEO.GENERAL,
            UPLOAD_TYPES.DOCUMENT.TRANSCRIPT,
            UPLOAD_TYPES.DOCUMENT.MATERIAL,
            UPLOAD_TYPES.DOCUMENT.GENERAL,
        ])
        .withMessage('Loại tệp không hợp lệ'),

    query('courseId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là số nguyên dương'),

    query('lessonId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID bài học phải là số nguyên dương'),

    validate,

    // Custom validation for file
    (req, res, next) => {
        if (!req.file) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Chưa có tệp nào được tải lên',
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
        .withMessage('ID tệp là bắt buộc')
        .isLength({ min: 1, max: 255 })
        .withMessage('ID tệp phải có độ dài từ 1 đến 255 ký tự'),

    validate,
]

/**
 * Validator for get upload status
 */
const getUploadStatusValidator = [
    param('fileId')
        .trim()
        .notEmpty()
        .withMessage('ID tệp là bắt buộc')
        .isLength({ min: 1, max: 255 })
        .withMessage('ID tệp phải có độ dài từ 1 đến 255 ký tự'),

    validate,
]

/**
 * Validator for get user files
 */
const getUserFilesValidator = [
    query('type')
        .optional()
        .isString()
        .withMessage('Loại phải là chuỗi ký tự')
        .isIn(['image', 'video', 'document'])
        .withMessage(
            'Danh mục tệp không hợp lệ. Phải là: image, video hoặc document'
        ),

    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Trang phải là số nguyên dương'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Giới hạn phải nằm trong khoảng từ 1 đến 100'),

    validate,
]

export {
    uploadFileValidator,
    deleteFileValidator,
    getUploadStatusValidator,
    getUserFilesValidator,
}
