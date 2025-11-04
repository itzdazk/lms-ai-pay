// src/middlewares/validate.middleware.js
import { validationResult } from 'express-validator';
import ApiResponse from '../utils/response.util.js';
import { HTTP_STATUS, PAGINATION } from '../config/constants.js';

/**
 * Validate request using express-validator
 */
const validate = (req, res, next) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map((error) => ({
            field: error.path || error.param,
            message: error.msg,
            value: error.value,
        }))

        return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
            success: false,
            message: 'Validation failed',
            errors: formattedErrors,
        })
    }

    next()
}

/**
 * Validate request using Joi schema
 */
const validateJoi = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false,
            stripUnknown: true,
        })

        if (error) {
            const formattedErrors = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message.replace(/['"]/g, ''),
                type: detail.type,
            }))

            return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
                success: false,
                message: 'Validation failed',
                errors: formattedErrors,
            })
        }

        // Replace request data with validated and sanitized data
        req[property] = value
        next()
    }
}

/**
 * Validate pagination params
 */
const validatePagination = (req, res, next) => {
    let page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    let limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;

    // Validate page
    if (page < 1) {
        page = PAGINATION.DEFAULT_PAGE;
    }

    // Validate limit
    if (limit < 1) {
        limit = PAGINATION.DEFAULT_LIMIT;
    }
    if (limit > PAGINATION.MAX_LIMIT) {
        limit = PAGINATION.MAX_LIMIT;
    }

    // Attach to request
    req.pagination = {
        page,
        limit,
        skip: (page - 1) * limit,
    };

    next();
};

/**
 * Validate ID parameter
 */
const validateId = (paramName = 'id') => {
    return (req, res, next) => {
        const id = parseInt(req.params[paramName])

        if (isNaN(id) || id < 1) {
            return ApiResponse.badRequest(res, `Invalid ${paramName}`)
        }

        req.params[paramName] = id
        next()
    }
}

export {
    validate,
    validateJoi,
    validatePagination,
    validateId,
};

