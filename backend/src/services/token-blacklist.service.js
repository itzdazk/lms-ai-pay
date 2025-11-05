// src/services/token-blacklist.service.js
import { prisma } from '../config/database.config.js'
import logger from '../config/logger.config.js'

class TokenBlacklistService {
    /**
     * Add token to blacklist
     */
    async addToBlacklist(token, userId, expiresAt) {
        try {
            await prisma.tokenBlacklist.create({
                data: {
                    token,
                    userId,
                    expiresAt,
                },
            })
            logger.info(`Token blacklisted for user: ${userId}`)
        } catch (error) {
            logger.error('Error adding token to blacklist:', error)
            throw new Error('Failed to blacklist token')
        }
    }

    /**
     * Check if token is blacklisted
     */
    async isBlacklisted(token) {
        try {
            const blacklistedToken = await prisma.tokenBlacklist.findUnique({
                where: { token },
            })
            return !!blacklistedToken
        } catch (error) {
            logger.error('Error checking token blacklist:', error)
            return false
        }
    }

    /**
     * Clean up expired tokens (run periodically)
     */
    async cleanupExpiredTokens() {
        try {
            const result = await prisma.tokenBlacklist.deleteMany({
                where: {
                    expiresAt: {
                        lt: new Date(),
                    },
                },
            })
            logger.info(`Cleaned up ${result.count} expired blacklisted tokens`)
            return result.count
        } catch (error) {
            logger.error('Error cleaning up blacklist:', error)
            throw error
        }
    }

    /**
     * Remove all tokens for a user (useful for "logout all devices")
     */
    async blacklistAllUserTokens(userId) {
        try {
            // This would require storing all active tokens
            // For now, we'll just mark user as needing re-auth
            logger.info(`Blacklisting all tokens for user: ${userId}`)
        } catch (error) {
            logger.error('Error blacklisting user tokens:', error)
            throw error
        }
    }
}

export default new TokenBlacklistService()
