// src/middlewares/auth.middleware.js
import JWTUtil from '../utils/jwt.util.js'
import ApiResponse from '../utils/response.util.js'
import { prisma } from '../config/database.config.js'
import { USER_STATUS } from '../config/constants.js'
import logger from '../config/logger.config.js'

/**
 * Authenticate user using JWT token from cookie or header
 */
const authenticate = async (req, res, next) => {
    try {
        // Đọc token từ COOKIE TRƯỚC
        let token = req.cookies?.accessToken // Đọc từ cookie

        // Nếu không có trong cookie, đọc từ Authorization header
        if (!token) {
            const authHeader = req.headers.authorization
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7)
            }
        }

        // Bây giờ mới check xem có token không
        if (!token) {
            return ApiResponse.unauthorized(res, 'No token provided')
        }

        // Verify token (giữ nguyên)
        let decoded
        try {
            decoded = JWTUtil.verifyAccessToken(token)
        } catch (error) {
            return ApiResponse.unauthorized(res, error.message)
        }

        // Check if user exists and is active (giữ nguyên)
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                userName: true,
                email: true,
                fullName: true,
                role: true,
                status: true,
                avatarUrl: true,
                emailVerified: true,
                tokenVersion: true,
            },
        })

        if (!user) {
            return ApiResponse.unauthorized(res, 'User not found')
        }

        if (user.status !== USER_STATUS.ACTIVE) {
            return ApiResponse.forbidden(res, 'Your account is not active')
        }

        // Check tokenVersion
        if (decoded.tokenVersion !== user.tokenVersion) {
            return ApiResponse.unauthorized(
                res,
                'Token has been invalidated. Please login again.'
            )
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
        // Đọc token từ COOKIE TRƯỚC
        let token = req.cookies?.accessToken

        // Authorization header
        if (!token) {
            const authHeader = req.headers.authorization
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7)
            }
        }

        if (!token) {
            return next()
        }

        try {
            const decoded = JWTUtil.verifyAccessToken(token)

            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    userName: true,
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

export { authenticate, optionalAuthenticate, requireEmailVerification }
