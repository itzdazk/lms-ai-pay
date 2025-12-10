// src/services/auth.service.js
import { prisma } from '../config/database.config.js'
import BcryptUtil from '../utils/bcrypt.util.js'
import JWTUtil from '../utils/jwt.util.js'
import DeviceUtil from '../utils/device.util.js'
import { USER_STATUS, USER_ROLES, HTTP_STATUS, JWT_EXPIRY } from '../config/constants.js'
import logger from '../config/logger.config.js'
import emailService from './email.service.js'

class AuthService {
    /**
     * Register new user
     */
    async register(data, req) {
        const {
            userName,
            email,
            password,
            fullName,
            role = USER_ROLES.STUDENT,
        } = data

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { userName }],
            },
        })

        if (existingUser) {
            if (existingUser.email === email) {
                const error = new Error('Email already exists')
                error.statusCode = HTTP_STATUS.BAD_REQUEST
                throw error
            }
            if (existingUser.userName === userName) {
                const error = new Error('userName already exists')
                error.statusCode = HTTP_STATUS.BAD_REQUEST
                throw error
            }
        }

        // Hash password
        const passwordHash = await BcryptUtil.hash(password)

        // Generate email verification token
        const emailVerificationToken =
            JWTUtil.generateEmailVerificationToken(email)

        // Create user
        const user = await prisma.user.create({
            data: {
                userName,
                email,
                passwordHash,
                fullName,
                role,
                status: USER_STATUS.ACTIVE,
                emailVerificationToken,
                tokenVersion: 0,
            },
            select: {
                id: true,
                userName: true,
                email: true,
                fullName: true,
                role: true,
                status: true,
                emailVerified: true,
                tokenVersion: true,
                createdAt: true,
            },
        })

        // Create session for new user
        const deviceInfo = req ? DeviceUtil.getDeviceInfo(req) : null
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

        const session = await prisma.userSession.create({
            data: {
                userId: user.id,
                deviceId: deviceInfo?.deviceId || null,
                deviceName: deviceInfo?.deviceName || 'Unknown Device',
                ipAddress: deviceInfo?.ipAddress || null,
                userAgent: deviceInfo?.userAgent || null,
                expiresAt,
            },
        })

        // Generate tokens with sessionId
        const tokens = JWTUtil.generateTokens({
            userId: user.id,
            role: user.role,
            tokenVersion: user.tokenVersion,
            sessionId: session.id,
        })

        logger.info(`New user registered: ${user.email}`)

        // Send verification email
        try {
            await emailService.sendVerificationEmail(
                user.email,
                user.userName,
                emailVerificationToken
            )
            logger.info(`Verification email sent to: ${user.email}`)
        } catch (error) {
            logger.error('Failed to send verification email:', error)
            // Don't fail registration if email fails
        }

        return {
            user,
            tokens,
        }
    }

    /**
     * Login user
     */
    async login(email, password, req) {
        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                userName: true,
                email: true,
                fullName: true,
                role: true,
                status: true,
                avatarUrl: true,
                emailVerified: true,
                passwordHash: true,
                tokenVersion: true,
                lastLoginAt: true,
            },
        })

        if (!user) {
            const error = new Error('Invalid email or password')
            error.statusCode = HTTP_STATUS.UNAUTHORIZED
            throw error
        }

        // Check if user is active
        if (user.status !== USER_STATUS.ACTIVE) {
            const error = new Error('Your account is not active')
            error.statusCode = HTTP_STATUS.UNAUTHORIZED
            throw error
        }

        // Verify password
        const isPasswordValid = await BcryptUtil.compare(
            password,
            user.passwordHash
        )

        if (!isPasswordValid) {
            const error = new Error('Invalid email or password')
            error.statusCode = HTTP_STATUS.UNAUTHORIZED
            throw error
        }

        // Single session: Delete all existing active sessions for this user
        await prisma.userSession.deleteMany({
            where: {
                userId: user.id,
                isActive: true,
            },
        })

        // Increment tokenVersion to invalidate all old tokens
        await prisma.user.update({
            where: { id: user.id },
            data: {
                lastLoginAt: new Date(),
                tokenVersion: {
                    increment: 1,
                },
            },
        })

        // Get updated user with new tokenVersion
        const updatedUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                tokenVersion: true,
            },
        })

        // Create new session
        const deviceInfo = req ? DeviceUtil.getDeviceInfo(req) : null
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

        const session = await prisma.userSession.create({
            data: {
                userId: user.id,
                deviceId: deviceInfo?.deviceId || null,
                deviceName: deviceInfo?.deviceName || 'Unknown Device',
                ipAddress: deviceInfo?.ipAddress || null,
                userAgent: deviceInfo?.userAgent || null,
                expiresAt,
            },
        })

        // Generate tokens with sessionId
        const tokens = JWTUtil.generateTokens({
            userId: user.id,
            role: user.role,
            tokenVersion: updatedUser.tokenVersion,
            sessionId: session.id,
        })

        logger.info(`User logged in: ${user.email} (Session: ${session.id})`)

        return {
            user: {
                id: user.id,
                userName: user.userName,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                status: user.status,
                avatarUrl: user.avatarUrl,
                emailVerified: user.emailVerified,
            },
            tokens,
        }
    }

    // async logout() {

    // }

    /**
     * Refresh access token
     */
    async refreshToken(refreshToken) {
        try {
            const decoded = JWTUtil.verifyRefreshToken(refreshToken)

            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    role: true,
                    status: true,
                    tokenVersion: true,
                },
            })

            if (!user) {
                throw new Error('User not found')
            }

            if (user.status !== USER_STATUS.ACTIVE) {
                throw new Error('User account is not active')
            }

            if (decoded.tokenVersion !== user.tokenVersion) {
                throw new Error('Token has been invalidated')
            }

            // Check if session exists and is active
            if (decoded.sessionId) {
                const session = await prisma.userSession.findUnique({
                    where: { id: decoded.sessionId },
                    select: {
                        id: true,
                        isActive: true,
                        expiresAt: true,
                    },
                })

                if (!session || !session.isActive) {
                    throw new Error('Session has been invalidated')
                }

                if (session.expiresAt < new Date()) {
                    throw new Error('Session has expired')
                }

                // Update last activity
                await prisma.userSession.update({
                    where: { id: session.id },
                    data: { lastActivityAt: new Date() },
                })
            }

            const tokens = JWTUtil.generateTokens({
                userId: user.id,
                role: user.role,
                tokenVersion: user.tokenVersion,
                sessionId: decoded.sessionId,
            })

            return tokens
        } catch (error) {
            throw new Error('Invalid refresh token')
        }
    }

    /**
     * Verify email
     */
    async verifyEmail(token) {
        try {
            const decoded = JWTUtil.verifyEmailVerificationToken(token)

            const user = await prisma.user.findFirst({
                where: {
                    emailVerificationToken: token,
                },
                select: {
                    id: true,
                    email: true,
                    userName: true,
                    emailVerified: true,
                },
            })

            if (!user) {
                throw new Error('Invalid verification token')
            }

            if (user.emailVerified) {
                throw new Error('Email already verified')
            }

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    emailVerified: true,
                    emailVerifiedAt: new Date(),
                    emailVerificationToken: null,
                },
            })

            // Send welcome email
            try {
                await emailService.sendWelcomeEmail(user.email, user.userName)
            } catch (error) {
                logger.error('Failed to send welcome email:', error)
            }

            logger.info(`Email verified for user: ${user.email}`)

            return true
        } catch (error) {
            if (error.message === 'Email already verified') {
                throw error
            }
            throw new Error('Email verification failed')
        }
    }

    /**
     * Resend email verification
     */
    async resendVerification(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                userName: true,
                emailVerified: true,
            },
        })

        if (!user) {
            throw new Error('User not found')
        }

        if (user.emailVerified) {
            throw new Error('Email already verified')
        }

        // Generate new verification token
        const emailVerificationToken = JWTUtil.generateEmailVerificationToken(
            user.email
        )

        // Update user with new token
        await prisma.user.update({
            where: { id: user.id },
            data: { emailVerificationToken },
        })

        // Send verification email
        await emailService.sendVerificationEmail(
            user.email,
            user.userName,
            emailVerificationToken
        )

        logger.info(`Verification email resent to: ${user.email}`)

        return { message: 'Verification email sent' }
    }

    /**
     * Request password reset
     */
    async forgotPassword(email) {
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                userName: true,
            },
        })

        if (!user) {
            // Don't reveal if user exists
            logger.info(
                `Password reset requested for non-existent email: ${email}`
            )
            return { message: 'If the email exists, a reset link will be sent' }
        }

        const resetToken = JWTUtil.generatePasswordResetToken(user.id)
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken: resetToken,
                passwordResetExpires: resetExpires,
            },
        })

        // Send password reset email
        try {
            await emailService.sendPasswordResetEmail(
                user.email,
                user.userName,
                resetToken
            )
            logger.info(`Password reset email sent to: ${user.email}`)
        } catch (error) {
            logger.error('Failed to send password reset email:', error)
            throw new Error('Failed to send password reset email')
        }

        return { message: 'Password reset email sent' }
    }

    /**
     * Reset password
     */
    async resetPassword(token, newPassword) {
        try {
            const decoded = JWTUtil.verifyPasswordResetToken(token)

            const user = await prisma.user.findFirst({
                where: {
                    id: decoded.userId,
                    passwordResetToken: token,
                    passwordResetExpires: {
                        gt: new Date(),
                    },
                },
                select: {
                    id: true,
                    email: true,
                    userName: true,
                },
            })

            if (!user) {
                throw new Error('Invalid or expired reset token')
            }

            const passwordHash = await BcryptUtil.hash(newPassword)

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    passwordHash,
                    passwordResetToken: null,
                    passwordResetExpires: null,
                },
            })

            // Send confirmation email
            try {
                await emailService.sendPasswordChangeConfirmation(
                    user.email,
                    user.userName
                )
            } catch (error) {
                logger.error(
                    'Failed to send password change confirmation:',
                    error
                )
            }

            logger.info(`Password reset successful for: ${user.email}`)

            return true
        } catch (error) {
            if (error.message === 'Invalid or expired reset token') {
                throw error
            }
            throw new Error('Password reset failed')
        }
    }

    /**
     * Invalidate all tokens for a user (logout all sessions)
     * @param {number} userId - User ID
     * @returns {Promise<boolean>}
     */
    async invalidateAllTokens(userId) {
        try {
            // Deactivate all sessions
            await prisma.userSession.updateMany({
                where: { userId, isActive: true },
                data: { isActive: false },
            })

            // Increment tokenVersion
            await prisma.user.update({
                where: { id: userId },
                data: {
                    tokenVersion: {
                        increment: 1,
                    },
                },
            })

            logger.info(`All tokens invalidated for user ID: ${userId}`)
            return true
        } catch (error) {
            logger.error('Error invalidating tokens:', error)
            throw new Error('Failed to invalidate tokens')
        }
    }

    /**
     * Logout current session
     * @param {string} sessionId - Session ID
     * @param {number} userId - User ID
     * @returns {Promise<boolean>}
     */
    async logoutSession(sessionId, userId) {
        try {
            const session = await prisma.userSession.findFirst({
                where: {
                    id: sessionId,
                    userId: userId,
                    isActive: true,
                },
            })

            if (!session) {
                throw new Error('Session not found')
            }

            // Deactivate session
            await prisma.userSession.update({
                where: { id: sessionId },
                data: { isActive: false },
            })

            logger.info(`Session logged out: ${sessionId}`)
            return true
        } catch (error) {
            logger.error('Error logging out session:', error)
            throw new Error('Failed to logout session')
        }
    }

    /**
     * Get all active sessions for a user
     * @param {number} userId - User ID
     * @returns {Promise<Array>}
     */
    async getSessions(userId) {
        try {
            const sessions = await prisma.userSession.findMany({
                where: {
                    userId,
                    isActive: true,
                    expiresAt: {
                        gt: new Date(),
                    },
                },
                select: {
                    id: true,
                    deviceId: true,
                    deviceName: true,
                    ipAddress: true,
                    userAgent: true,
                    lastActivityAt: true,
                    createdAt: true,
                    expiresAt: true,
                },
                orderBy: {
                    lastActivityAt: 'desc',
                },
            })

            return sessions
        } catch (error) {
            logger.error('Error getting sessions:', error)
            throw new Error('Failed to get sessions')
        }
    }

    /**
     * Change password
     */
    async changePassword(userId, currentPassword, newPassword) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        })

        if (!user) {
            throw new Error('User not found')
        }

        const isPasswordValid = await BcryptUtil.compare(
            currentPassword,
            user.passwordHash
        )

        if (!isPasswordValid) {
            throw new Error('Current password is incorrect')
        }

        const passwordHash = await BcryptUtil.hash(newPassword)

        await prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash,
                tokenVersion: {
                    increment: 1,
                },
            },
        })

        logger.info(`Password changed for user: ${user.email}`)

        return true
    }
}

export default new AuthService()
