// src/routes/auth.routes.js
import express from 'express'
import authController from '../controllers/auth.controller.js'
import { authenticate } from '../middlewares/authenticate.middleware.js'
import {
    registerValidator,
    loginValidator,
    verifyEmailValidator,
    forgotPasswordValidator,
    resetPasswordValidator,
} from '../validators/auth.validator.js'
import rateLimit from 'express-rate-limit'
import config from '../config/app.config.js'
import { RATE_LIMITS } from '../config/constants.js'

const router = express.Router()

// Rate limiter for auth endpoints
// Disabled in development and test mode for easier testing
const authLimiter =
    config.NODE_ENV === 'development' || config.NODE_ENV === 'test'
        ? (req, res, next) => next() // Skip rate limiting in development and test
        : rateLimit({
              windowMs: RATE_LIMITS.AUTH.windowMs,
              max: RATE_LIMITS.AUTH.max,
              message: 'Quá nhiều lần thử xác thực, vui lòng thử lại sau.',
          })

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post(
    '/register',
    authLimiter,
    registerValidator,
    authController.register
)

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authLimiter, loginValidator, authController.login)

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout)

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh-token', authController.refreshToken)

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Verify email address
 * @access  Public
 */
router.post('/verify-email', verifyEmailValidator, authController.verifyEmail)

/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Resend email verification
 * @access  Private
 */
router.post(
    '/resend-verification',
    authenticate,
    authController.resendVerification
)

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post(
    '/forgot-password',
    authLimiter,
    forgotPasswordValidator,
    authController.forgotPassword
)

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
    '/reset-password',
    resetPasswordValidator,
    authController.resetPassword
)

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, authController.getMe)

/**
 * @route   GET /api/v1/auth/sessions
 * @desc    Get all active sessions for current user
 * @access  Private
 */
router.get('/sessions', authenticate, authController.getSessions)

/**
 * @route   DELETE /api/v1/auth/sessions/:sessionId
 * @desc    Logout a specific session
 * @access  Private
 */
router.delete(
    '/sessions/:sessionId',
    authenticate,
    authController.logoutSession
)

export default router
