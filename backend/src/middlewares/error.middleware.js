// src/middlewares/error.middleware.js
import logger from '../config/logger.config.js'
import ApiResponse from '../utils/response.util.js'
import { HTTP_STATUS, ERROR_CODES } from '../config/constants.js'

/**
 * Handle 404 Not Found
 */
const notFound = (req, res, next) => {
    const error = new Error(`Đường dẫn không tồn tại - ${req.originalUrl}`)
    error.statusCode = HTTP_STATUS.NOT_FOUND
    next(error)
}

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    let message = err.message || 'Lỗi máy chủ nội bộ'
    let errorCode = err.code || ERROR_CODES.INTERNAL_ERROR

    // Log error
    logger.error('Lỗi:', {
        message: err.message,
        stack: err.stack,
        statusCode,
        path: req.path,
        method: req.method,
    })

    if (!err.code) {
        switch (statusCode) {
            case HTTP_STATUS.UNAUTHORIZED:
                errorCode = ERROR_CODES.AUTHENTICATION_ERROR
                break
            case HTTP_STATUS.FORBIDDEN:
                errorCode = ERROR_CODES.AUTHORIZATION_ERROR
                break
            case HTTP_STATUS.NOT_FOUND:
                errorCode = ERROR_CODES.NOT_FOUND
                break
            case HTTP_STATUS.UNPROCESSABLE_ENTITY:
                errorCode = ERROR_CODES.VALIDATION_ERROR
                break
            case HTTP_STATUS.CONFLICT:
                errorCode = ERROR_CODES.DUPLICATE_ENTRY
                break
            case HTTP_STATUS.TOO_MANY_REQUESTS:
                errorCode = ERROR_CODES.RATE_LIMIT_ERROR
                break
            case HTTP_STATUS.BAD_REQUEST:
                errorCode = ERROR_CODES.VALIDATION_ERROR
                break
            default:
                errorCode = ERROR_CODES.INTERNAL_ERROR
        }
    }

    // Prisma errors
    if (err.code && err.code.startsWith('P')) {
        statusCode = HTTP_STATUS.BAD_REQUEST

        switch (err.code) {
            case 'P2002':
                // Unique constraint violation
                const field = err.meta?.target?.[0] || 'field'
                message = `${field} đã tồn tại`
                errorCode = ERROR_CODES.DUPLICATE_ENTRY
                statusCode = HTTP_STATUS.CONFLICT
                break
            case 'P2025':
                // Record not found
                message = 'Không tìm thấy bản ghi'
                errorCode = ERROR_CODES.NOT_FOUND
                statusCode = HTTP_STATUS.NOT_FOUND
                break
            case 'P2003':
                // Foreign key constraint
                message = 'Không tìm thấy bản ghi liên quan'
                errorCode = ERROR_CODES.NOT_FOUND
                statusCode = HTTP_STATUS.NOT_FOUND
                break
            default:
                message = 'Thao tác truy vấn cơ sở dữ liệu thất bại'
        }
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = HTTP_STATUS.UNAUTHORIZED
        message = 'Token không hợp lệ'
        errorCode = ERROR_CODES.AUTHENTICATION_ERROR
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = HTTP_STATUS.UNAUTHORIZED
        message = 'Token đã hết hạn'
        errorCode = ERROR_CODES.AUTHENTICATION_ERROR
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY
        errorCode = ERROR_CODES.VALIDATION_ERROR
    }

    // Multer errors
    if (err.name === 'MulterError') {
        statusCode = HTTP_STATUS.BAD_REQUEST
        errorCode = ERROR_CODES.FILE_UPLOAD_ERROR

        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'Kích thước tệp vượt quá giới hạn'
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            message = 'Trường tệp không mong đợi'
        }
    }

    // Cast errors
    if (err.name === 'CastError') {
        statusCode = HTTP_STATUS.BAD_REQUEST
        message = `Giá trị không hợp lệ ${err.path}: ${err.value}`
        errorCode = ERROR_CODES.VALIDATION_ERROR
    }

    // Development vs Production error response
    const errorResponse = {
        success: false,
        error: {
            code: errorCode,
            message,
        },
    }

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
        errorResponse.error.stack = err.stack
        errorResponse.error.details = err.details
    }

    return res.status(statusCode).json(errorResponse)
}

/**
 * Async handler wrapper to catch errors
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next)
    }
}

export { notFound, errorHandler, asyncHandler }
