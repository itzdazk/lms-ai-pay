// src/utils/response.util.js
import { HTTP_STATUS } from '../config/constants.js';

class ApiResponse {
    /**
     * Send success response
     */
    static success(
        res,
        data = null,
        message = 'Success',
        statusCode = HTTP_STATUS.OK
    ) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
        })
    }

    /**
     * Send created response
     */
    static created(
        res,
        data = null,
        message = 'Resource created successfully'
    ) {
        return res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message,
            data,
        })
    }

    /**
     * Send no content response
     */
    static noContent(res) {
        return res.status(HTTP_STATUS.NO_CONTENT).send()
    }

    /**
     * Send error response
     */
    static error(
        res,
        message = 'An error occurred',
        statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
        errors = null
    ) {
        const response = {
            success: false,
            message,
        }

        if (errors) {
            response.errors = errors
        }

        return res.status(statusCode).json(response)
    }

    /**
     * Send validation error response
     */
    static validationError(res, errors, message = 'Validation failed') {
        return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
            success: false,
            message,
            errors,
        })
    }

    /**
     * Send not found response
     */
    static notFound(res, message = 'Resource not found') {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message,
        })
    }

    /**
     * Send unauthorized response
     */
    static unauthorized(res, message = 'Unauthorized access') {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message,
        })
    }

    /**
     * Send forbidden response
     */
    static forbidden(res, message = 'Access forbidden') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
            success: false,
            message,
        })
    }

    /**
     * Send conflict response
     */
    static conflict(res, message = 'Resource already exists') {
        return res.status(HTTP_STATUS.CONFLICT).json({
            success: false,
            message,
        })
    }

    /**
     * Send bad request response
     */
    static badRequest(res, message = 'Bad request') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message,
        })
    }

    /**
     * Send paginated response
     */
    static paginated(res, data, pagination, message = 'Success') {
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message,
            data,
            pagination: {
                page: pagination.page,
                limit: pagination.limit,
                total: pagination.total,
                totalPages: Math.ceil(pagination.total / pagination.limit),
            },
        })
    }
}

export default ApiResponse;

