// src/middlewares/authorize.middleware.js
import ApiResponse from '../utils/response.util.js'

/**
 * Authorize user based on roles
 * @param {Array<string>} allowedRoles - Array of allowed roles
 */
const authorize = (allowedRoles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return ApiResponse.unauthorized(res, 'Authentication required')
        }

        if (!allowedRoles.includes(req.user.role)) {
            return ApiResponse.forbidden(
                res,
                'You do not have permission to access this resource'
            )
        }

        next()
    }
}

export { authorize }
