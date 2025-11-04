// src/services/auth.service.js
import { prisma } from '../config/database.config.js';
import BcryptUtil from '../utils/bcrypt.util.js';
import JWTUtil from '../utils/jwt.util.js';
import { USER_STATUS, USER_ROLES } from '../config/constants.js';
import logger from '../config/logger.config.js';

class AuthService {
    /**
     * Register new user
     */
    async register(data) {
        const {
            username,
            email,
            password,
            fullName,
            role = USER_ROLES.STUDENT,
        } = data

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { username }],
            },
        })

        if (existingUser) {
            if (existingUser.email === email) {
                throw new Error('Email already exists')
            }
            if (existingUser.username === username) {
                throw new Error('Username already exists')
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
                username,
                email,
                passwordHash,
                fullName,
                role,
                status: USER_STATUS.ACTIVE,
                emailVerificationToken,
            },
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                role: true,
                status: true,
                emailVerified: true,
                createdAt: true,
            },
        })

        // Generate tokens
        const tokens = JWTUtil.generateTokens({
            userId: user.id,
            role: user.role,
        })

        logger.info(`New user registered: ${user.email}`)

        return {
            user,
            tokens,
            emailVerificationToken,
        }
    }

    /**
     * Login user
     */
    async login(email, password) {
        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
        })

        if (!user) {
            throw new Error('Invalid email or password')
        }

        // Check if user is active
        if (user.status !== USER_STATUS.ACTIVE) {
            throw new Error('Your account is not active')
        }

        // Verify password
        const isPasswordValid = await BcryptUtil.compare(
            password,
            user.passwordHash
        )

        if (!isPasswordValid) {
            throw new Error('Invalid email or password')
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        })

        // Generate tokens
        const tokens = JWTUtil.generateTokens({
            userId: user.id,
            role: user.role,
        })

        logger.info(`User logged in: ${user.email}`)

        return {
            user: {
                id: user.id,
                username: user.username,
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
                },
            })

            if (!user) {
                throw new Error('User not found')
            }

            if (user.status !== USER_STATUS.ACTIVE) {
                throw new Error('User account is not active')
            }

            const tokens = JWTUtil.generateTokens({
                userId: user.id,
                role: user.role,
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
            })

            if (!user) {
                throw new Error('Invalid verification token')
            }

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    emailVerified: true,
                    emailVerifiedAt: new Date(),
                    emailVerificationToken: null,
                },
            })

            logger.info(`Email verified for user: ${user.email}`)

            return true
        } catch (error) {
            throw new Error('Email verification failed')
        }
    }

    /**
     * Request password reset
     */
    async forgotPassword(email) {
        const user = await prisma.user.findUnique({
            where: { email },
        })

        if (!user) {
            // Don't reveal if user exists
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

        logger.info(`Password reset requested for: ${user.email}`)

        return { resetToken }
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

            logger.info(`Password reset successful for: ${user.email}`)

            return true
        } catch (error) {
            throw new Error('Password reset failed')
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
            data: { passwordHash },
        })

        logger.info(`Password changed for user: ${user.email}`)

        return true
    }
}

export default new AuthService();
