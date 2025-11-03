// src/middlewares/error.middleware.js
const logger = require('../config/logger.config')
const ApiResponse = require('../utils/response.util')
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants')

/**
 * Handle 404 Not Found
 */
const notFound = (req, res, next) => {
    const error = new Error(`Route not found - ${req.originalUrl}`)
    error.statusCode = HTTP_STATUS.NOT_FOUND
    next(error)
}

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    let message = err.message || 'Internal Server Error'
    let errorCode = err.code || ERROR_CODES.INTERNAL_ERROR

    // Log error
    logger.error('Error:', {
        message: err.message,
        stack: err.stack,
        statusCode,
        path: req.path,
        method: req.method,
    })

    // Prisma errors
    if (err.code && err.code.startsWith('P')) {
        statusCode = HTTP_STATUS.BAD_REQUEST

        switch (err.code) {
            case 'P2002':
                // Unique constraint violation
                const field = err.meta?.target?.[0] || 'field'
                message = `${field} already exists`
                errorCode = ERROR_CODES.DUPLICATE_ENTRY
                statusCode = HTTP_STATUS.CONFLICT
                break
            case 'P2025':
                // Record not found
                message = 'Record not found'
                errorCode = ERROR_CODES.NOT_FOUND
                statusCode = HTTP_STATUS.NOT_FOUND
                break
            case 'P2003':
                // Foreign key constraint
                message = 'Related record not found'
                errorCode = ERROR_CODES.NOT_FOUND
                statusCode = HTTP_STATUS.NOT_FOUND
                break
            default:
                message = 'Database operation failed'
        }
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = HTTP_STATUS.UNAUTHORIZED
        message = 'Invalid token'
        errorCode = ERROR_CODES.AUTHENTICATION_ERROR
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = HTTP_STATUS.UNAUTHORIZED
        message = 'Token expired'
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
            message = 'File size exceeds limit'
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            message = 'Unexpected file field'
        }
    }

    // Cast errors
    if (err.name === 'CastError') {
        statusCode = HTTP_STATUS.BAD_REQUEST
        message = `Invalid ${err.path}: ${err.value}`
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

module.exports = {
    notFound,
    errorHandler,
    asyncHandler,
}


