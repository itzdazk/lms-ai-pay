// src/controllers/auth.controller.js
import authService from '../services/auth.service.js'
import ApiResponse from '../utils/response.util.js'
import { asyncHandler } from '../middlewares/error.middleware.js'
import config from '../config/app.config.js'
import CookieUtil from '../utils/cookie.utils.js'

class AuthController {
    /**
     * @route   POST /api/v1/auth/register
     * @desc    Register new user
     * @access  Public
     */
    register = asyncHandler(async (req, res) => {
        const { username, email, password, fullName, role } = req.body

        const result = await authService.register({
            username,
            email,
            password,
            fullName,
            role,
        })

        CookieUtil.setAuthTokens(res, result.tokens)

        return ApiResponse.created(
            res,
            {
                user: result.user,
            },
            'Registration successful'
        )
    })

    /**
     * @route   POST /api/v1/auth/login
     * @desc    Login user
     * @access  Public
     */
    login = asyncHandler(async (req, res) => {
        const { email, password } = req.body
        const result = await authService.login(email, password)

        CookieUtil.setAuthTokens(res, result.tokens)

        return ApiResponse.success(
            res,
            {
                user: result.user,
            },
            'Login successful'
        )
    })

    /**
     * @route   POST /api/v1/auth/logout
     * @desc    Logout user
     * @access  Private
     */
    logout = asyncHandler(async (req, res) => {
        CookieUtil.clearAuthTokens(res)
        return ApiResponse.success(res, null, 'Logout successful')
    })

    /**
     * @route   POST /api/v1/auth/refresh-token
     * @desc    Refresh access token
     * @access  Public
     */
    refreshToken = asyncHandler(async (req, res) => {
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken

        if (!refreshToken) {
            return ApiResponse.unauthorized(res, 'Refresh token not found')
        }

        const tokens = await authService.refreshToken(refreshToken)

        // Update 2 cookie
        res.cookie('accessToken', tokens.accessToken, {
            httpOnly: true,
            secure: config.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        })

        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: config.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        })

        return ApiResponse.success(res, null, 'Token refreshed successfully')
    })

    /**
     * @route   POST /api/v1/auth/verify-email
     * @desc    Verify email address
     * @access  Public
     */
    verifyEmail = asyncHandler(async (req, res) => {
        const { token } = req.body

        await authService.verifyEmail(token)

        return ApiResponse.success(res, null, 'Email verified successfully')
    })

    /**
     * @route   POST /api/v1/auth/resend-verification
     * @desc    Resend email verification
     * @access  Private
     */
    resendVerification = asyncHandler(async (req, res) => {
        const result = await authService.resendVerification(req.user.id)

        return ApiResponse.success(res, null, result.message)
    })

    /**
     * @route   POST /api/v1/auth/forgot-password
     * @desc    Request password reset
     * @access  Public
     */
    forgotPassword = asyncHandler(async (req, res) => {
        const { email } = req.body

        await authService.forgotPassword(email)

        return ApiResponse.success(
            res,
            null,
            'If the email exists, a password reset link has been sent'
        )
    })

    /**
     * @route   POST /api/v1/auth/reset-password
     * @desc    Reset password with token
     * @access  Public
     */
    resetPassword = asyncHandler(async (req, res) => {
        const { token, password } = req.body

        await authService.resetPassword(token, password)

        return ApiResponse.success(res, null, 'Password reset successful')
    })

    /**
     * @route   GET /api/v1/auth/me
     * @desc    Get current user
     * @access  Private
     */
    getMe = asyncHandler(async (req, res) => {
        return ApiResponse.success(res, req.user, 'User retrieved successfully')
    })
}

export default new AuthController()
