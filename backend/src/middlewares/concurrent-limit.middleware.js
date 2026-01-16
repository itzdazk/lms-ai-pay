// src/middlewares/concurrent-limit.middleware.js
import logger from '../config/logger.config.js'

/**
 * Track concurrent requests per user/IP
 * Prevents too many simultaneous AI requests that could overload Ollama
 */
class ConcurrentLimitTracker {
    constructor() {
        // Map: key -> count of active requests
        this.activeRequests = new Map()
    }

    /**
     * Increment concurrent request count for a key
     * @param {string} key - User ID or IP address
     * @returns {number} Current count after increment
     */
    increment(key) {
        const current = this.activeRequests.get(key) || 0
        this.activeRequests.set(key, current + 1)
        return current + 1
    }

    /**
     * Decrement concurrent request count for a key
     * @param {string} key - User ID or IP address
     */
    decrement(key) {
        const current = this.activeRequests.get(key) || 0
        if (current <= 1) {
            this.activeRequests.delete(key)
        } else {
            this.activeRequests.set(key, current - 1)
        }
    }

    /**
     * Get current count for a key
     * @param {string} key - User ID or IP address
     * @returns {number} Current active request count
     */
    getCount(key) {
        return this.activeRequests.get(key) || 0
    }

    /**
     * Get total active requests across all keys
     * @returns {number} Total active requests
     */
    getTotalCount() {
        let total = 0
        for (const count of this.activeRequests.values()) {
            total += count
        }
        return total
    }
}

const tracker = new ConcurrentLimitTracker()

/**
 * Middleware to limit concurrent requests per user/IP
 * @param {number} maxConcurrent - Maximum concurrent requests allowed
 * @param {string} type - 'advisor' or 'tutor' for logging
 */
export function concurrentLimit(maxConcurrent = 5, type = 'generic') {
    return async (req, res, next) => {
        // Generate key: use userId for authenticated, IP for public
        const key = req.user?.id
            ? `user-${req.user.id}`
            : `ip-${req.ip || req.connection.remoteAddress}`

        const currentCount = tracker.getCount(key)
        const totalCount = tracker.getTotalCount()

        // Check if limit exceeded
        if (currentCount >= maxConcurrent) {
            logger.warn({
                message: `[Giới hạn đồng thời] ${type} - Đã vượt quá giới hạn`,
                key,
                currentCount,
                maxConcurrent,
                totalActive: totalCount,
                endpoint: req.originalUrl,
            })

            return res.status(429).json({
                success: false,
                message: `Bạn đang có ${currentCount} yêu cầu AI đang xử lý. Vui lòng đợi một trong số chúng hoàn thành trước khi gửi yêu cầu mới.`,
                error: 'TOO_MANY_CONCURRENT_REQUESTS',
                data: {
                    currentConcurrent: currentCount,
                    maxConcurrent,
                },
            })
        }

        // Increment counter
        tracker.increment(key)

        // Log for monitoring
        logger.info({
            message: `[Giới hạn đồng thời] ${type} - Yêu cầu đã bắt đầu`,
            key,
            concurrent: currentCount + 1,
            totalActive: totalCount + 1,
            endpoint: req.originalUrl,
        })

        // Ensure decrement on response finish
        const cleanup = () => {
            tracker.decrement(key)
            logger.info({
                message: `[Giới hạn đồng thời] ${type} - Yêu cầu đã hoàn tất`,
                key,
                concurrent: tracker.getCount(key),
                totalActive: tracker.getTotalCount(),
                endpoint: req.originalUrl,
            })
        }

        res.on('finish', cleanup)
        res.on('close', cleanup)
        res.on('error', cleanup)

        next()
    }
}

/**
 * Get current tracker stats (for monitoring/debugging)
 */
export function getConcurrentStats() {
    return {
        totalActive: tracker.getTotalCount(),
        activeRequests: Array.from(tracker.activeRequests.entries()).map(
            ([key, count]) => ({
                key,
                count,
            })
        ),
    }
}
