// src/middlewares/auth.middleware.js
import JWTUtil from '../utils/jwt.util.js';
import ApiResponse from '../utils/response.util.js';
import { prisma } from '../config/database.config.js';
import { USER_STATUS } from '../config/constants.js';
import logger from '../config/logger.config.js';

/**
 * Authenticate user using JWT token
 */
const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return ApiResponse.unauthorized(res, 'No token provided')
        }

        const token = authHeader.substring(7) // Remove 'Bearer ' prefix

        // Verify token
        let decoded
        try {
            decoded = JWTUtil.verifyAccessToken(token)
        } catch (error) {
            return ApiResponse.unauthorized(res, error.message)
        }

        // Check if user exists and is active
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                role: true,
                status: true,
                avatarUrl: true,
                emailVerified: true,
            },
        })

        if (!user) {
            return ApiResponse.unauthorized(res, 'User not found')
        }

        if (user.status !== USER_STATUS.ACTIVE) {
            return ApiResponse.forbidden(res, 'Your account is not active')
        }

        // Attach user to request
        req.user = user
        next()
    } catch (error) {
        logger.error('Authentication error:', error)
        return ApiResponse.error(res, 'Authentication failed')
    }
}

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuthenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next()
        }

        const token = authHeader.substring(7)

        try {
            const decoded = JWTUtil.verifyAccessToken(token)

            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    fullName: true,
                    role: true,
                    status: true,
                    avatarUrl: true,
                },
            })

            if (user && user.status === USER_STATUS.ACTIVE) {
                req.user = user
            }
        } catch (error) {
            // Silently fail for optional auth
            logger.debug('Optional auth failed:', error.message)
        }

        next()
    } catch (error) {
        logger.error('Optional authentication error:', error)
        next()
    }
}

/**
 * Check if email is verified
 */
const requireEmailVerification = (req, res, next) => {
    if (!req.user.emailVerified) {
        return ApiResponse.forbidden(
            res,
            'Please verify your email address to access this resource'
        )
    }
    next()
}

export {
    authenticate,
    optionalAuthenticate,
    requireEmailVerification,
};





