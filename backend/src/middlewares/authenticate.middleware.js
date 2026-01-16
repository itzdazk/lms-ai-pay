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
            return ApiResponse.unauthorized(
                res,
                'Không có token nào được cung cấp.'
            )
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
            return ApiResponse.unauthorized(res, 'Không tìm thấy người dùng')
        }

        if (user.status !== USER_STATUS.ACTIVE) {
            return ApiResponse.forbidden(
                res,
                'Tài khoản của bạn không hoạt động'
            )
        }

        // Check tokenVersion
        if (decoded.tokenVersion !== user.tokenVersion) {
            return ApiResponse.unauthorized(
                res,
                'Token đã bị hết hạn. Vui lòng đăng nhập lại.'
            )
        }

        // Check session if sessionId exists in token
        if (decoded.sessionId) {
            const session = await prisma.userSession.findUnique({
                where: { id: decoded.sessionId },
                select: {
                    id: true,
                    isActive: true,
                    expiresAt: true,
                    userId: true,
                },
            })

            if (!session) {
                return ApiResponse.unauthorized(
                    res,
                    'Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.'
                )
            }

            if (!session.isActive) {
                return ApiResponse.unauthorized(
                    res,
                    'Phiên đăng nhập đã bị đăng xuất. Vui lòng đăng nhập lại.'
                )
            }

            if (session.userId !== user.id) {
                return ApiResponse.unauthorized(
                    res,
                    'Phiên đăng nhập không thuộc về người dùng này.'
                )
            }

            if (session.expiresAt < new Date()) {
                // Deactivate expired session
                await prisma.userSession.update({
                    where: { id: session.id },
                    data: { isActive: false },
                })
                return ApiResponse.unauthorized(
                    res,
                    'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
                )
            }

            // Update last activity
            await prisma.userSession.update({
                where: { id: session.id },
                data: { lastActivityAt: new Date() },
            })
        }

        // Attach user to request
        req.user = user
        next()
    } catch (error) {
        logger.error('Lỗi xác thực:', error)
        return ApiResponse.error(res, 'Xác thực thất bại')
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
            logger.debug('Xác thực tùy chọn thất bại:', error.message)
        }

        next()
    } catch (error) {
        logger.error('Lỗi xác thực tùy chọn:', error)
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
            'Vui lòng xác thực địa chỉ email của bạn để truy cập tài nguyên này.'
        )
    }
    next()
}

export { authenticate, optionalAuthenticate, requireEmailVerification }
