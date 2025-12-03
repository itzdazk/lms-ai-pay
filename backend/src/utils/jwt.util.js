// src/utils/jwt.util.js
import jwt from 'jsonwebtoken';
import config from '../config/app.config.js';
import logger from '../config/logger.config.js';
import { JWT_EXPIRY } from '../config/constants.js';

class JWTUtil {
    /**
     * Generate access token
     */
    static generateAccessToken(payload) {
        try {
            return jwt.sign(payload, config.JWT_SECRET, {
                expiresIn: JWT_EXPIRY.ACCESS_TOKEN,
                issuer: 'elearning-api',
            })
        } catch (error) {
            logger.error('Error generating access token:', error)
            throw error
        }
    }

    /**
     * Generate refresh token
     */
    static generateRefreshToken(payload) {
        try {
            return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
                expiresIn: JWT_EXPIRY.REFRESH_TOKEN,
                issuer: 'elearning-api',
            })
        } catch (error) {
            logger.error('Error generating refresh token:', error)
            throw error
        }
    }

    /**
     * Generate both access and refresh tokens
     */
    static generateTokens(payload) {
        return {
            accessToken: this.generateAccessToken(payload),
            refreshToken: this.generateRefreshToken(payload),
        }
    }

    /**
     * Verify access token
     */
    static verifyAccessToken(token) {
        try {
            return jwt.verify(token, config.JWT_SECRET)
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Access token expired')
            }
            if (error.name === 'JsonWebTokenError') {
                throw new Error('Invalid access token')
            }
            throw error
        }
    }

    /**
     * Verify refresh token
     */
    static verifyRefreshToken(token) {
        try {
            return jwt.verify(token, config.JWT_REFRESH_SECRET)
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Refresh token expired')
            }
            if (error.name === 'JsonWebTokenError') {
                throw new Error('Invalid refresh token')
            }
            throw error
        }
    }

    /**
     * Decode token without verification
     */
    static decode(token) {
        return jwt.decode(token)
    }

    /**
     * Generate email verification token
     */
    static generateEmailVerificationToken(userId) {
        return jwt.sign(
            { userId, type: 'email_verification' },
            config.JWT_SECRET,
            { expiresIn: JWT_EXPIRY.EMAIL_VERIFICATION }
        )
    }

    /**
     * Generate password reset token
     */
    static generatePasswordResetToken(userId) {
        return jwt.sign({ userId, type: 'password_reset' }, config.JWT_SECRET, {
            expiresIn: JWT_EXPIRY.PASSWORD_RESET,
        })
    }

    /**
     * Verify email verification token
     */
    static verifyEmailVerificationToken(token) {
        try {
            const decoded = jwt.verify(token, config.JWT_SECRET)
            if (decoded.type !== 'email_verification') {
                throw new Error('Invalid token type')
            }
            return decoded
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Verification token expired')
            }
            throw new Error('Invalid verification token')
        }
    }

    /**
     * Verify password reset token
     */
    static verifyPasswordResetToken(token) {
        try {
            const decoded = jwt.verify(token, config.JWT_SECRET)
            if (decoded.type !== 'password_reset') {
                throw new Error('Invalid token type')
            }
            return decoded
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Reset token expired')
            }
            throw new Error('Invalid reset token')
        }
    }
}

export default JWTUtil;


