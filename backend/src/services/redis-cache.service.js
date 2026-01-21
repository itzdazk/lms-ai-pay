// src/services/redis-cache.service.js
import Redis from 'ioredis'
import config from '../config/app.config.js'
import logger from '../config/logger.config.js'

class RedisCacheService {
    constructor() {
        // Initialize Redis client with connection pooling
        this.client = new Redis({
            host: config.REDIS_HOST,
            port: config.REDIS_PORT,
            password: config.REDIS_PASSWORD || undefined,
            tls: config.REDIS_TLS ? {} : undefined,
            retryStrategy: (times) => {
                // Exponential backoff: 50ms, 100ms, 200ms, 400ms, max 3000ms
                const delay = Math.min(times * 50, 3000)
                return delay
            },
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            lazyConnect: true,
        })

        // Handle connection events
        this.client.on('connect', () => {
            logger.info('Redis: Connected to Redis server')
        })

        this.client.on('ready', () => {
            logger.info('Redis: Ready to accept commands')
        })

        this.client.on('error', (error) => {
            logger.error('Redis: Connection error', error)
            // Don't throw - allow fallback to in-memory cache
        })

        this.client.on('close', () => {
            logger.warn('Redis: Connection closed')
        })

        // Try to connect (non-blocking)
        this.client.connect().catch((error) => {
            logger.warn('Redis: Failed to connect, will use in-memory cache fallback', error.message)
        })

        // Cache key prefixes for namespacing
        this.PREFIXES = {
            ADVISOR_SEARCH: 'advisor:search:',
            ADVISOR_TOP_COURSES: 'advisor:top:',
            ADVISOR_KEYWORDS: 'advisor:keywords:',
        }

        // Default TTL (Time To Live) in seconds
        this.DEFAULT_TTL = {
            ADVISOR_SEARCH: 5 * 60, // 5 minutes
            ADVISOR_TOP_COURSES: 15 * 60, // 15 minutes
            ADVISOR_KEYWORDS: 30 * 60, // 30 minutes
        }
    }

    /**
     * Check if Redis is available
     * @returns {Promise<boolean>}
     */
    async isAvailable() {
        try {
            if (this.client.status !== 'ready') {
                return false
            }
            await this.client.ping()
            return true
        } catch (error) {
            return false
        }
    }

    /**
     * Generate cache key with prefix
     * @param {string} prefix - Key prefix
     * @param {string} key - Cache key
     * @returns {string}
     */
    _getKey(prefix, key) {
        return `${prefix}${key}`
    }

    /**
     * Hash query/keywords to create consistent cache key
     * @param {string} query - User query or keywords
     * @returns {string}
     */
    _hashQuery(query) {
        // Simple hash for cache key (not cryptographic)
        let hash = 0
        const str = query.toLowerCase().trim()
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i)
            hash = (hash << 5) - hash + char
            hash = hash & hash // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36)
    }

    /**
     * Cache advisor search results
     * @param {string} query - User query
     * @param {Array} courses - Course results
     * @param {number} ttl - Time to live in seconds (optional)
     * @returns {Promise<void>}
     */
    async cacheAdvisorSearch(query, courses, ttl = null) {
        if (!(await this.isAvailable())) {
            return // Silently fail, fallback to in-memory cache
        }

        try {
            const key = this._getKey(
                this.PREFIXES.ADVISOR_SEARCH,
                this._hashQuery(query)
            )
            const value = JSON.stringify(courses)
            const expireTime = ttl || this.DEFAULT_TTL.ADVISOR_SEARCH

            await this.client.setex(key, expireTime, value)
            logger.debug(`Redis: Cached advisor search for query: ${query.substring(0, 50)}`)
        } catch (error) {
            logger.warn('Redis: Failed to cache advisor search', error.message)
            // Don't throw - allow fallback
        }
    }

    /**
     * Get cached advisor search results
     * @param {string} query - User query
     * @returns {Promise<Array|null>} Cached courses or null if not found
     */
    async getCachedAdvisorSearch(query) {
        if (!(await this.isAvailable())) {
            return null
        }

        try {
            const key = this._getKey(
                this.PREFIXES.ADVISOR_SEARCH,
                this._hashQuery(query)
            )
            const value = await this.client.get(key)

            if (value) {
                const courses = JSON.parse(value)
                logger.debug(`Redis: Cache hit for advisor search: ${query.substring(0, 50)}`)
                return courses
            }

            return null
        } catch (error) {
            logger.warn('Redis: Failed to get cached advisor search', error.message)
            return null
        }
    }

    /**
     * Cache top courses by category/topic
     * @param {string} topic - Topic/category (e.g., 'web', 'mobile', 'python')
     * @param {Array} courses - Top courses
     * @param {number} ttl - Time to live in seconds (optional)
     * @returns {Promise<void>}
     */
    async cacheTopCourses(topic, courses, ttl = null) {
        if (!(await this.isAvailable())) {
            return
        }

        try {
            const key = this._getKey(
                this.PREFIXES.ADVISOR_TOP_COURSES,
                topic.toLowerCase()
            )
            const value = JSON.stringify(courses)
            const expireTime = ttl || this.DEFAULT_TTL.ADVISOR_TOP_COURSES

            await this.client.setex(key, expireTime, value)
            logger.debug(`Redis: Cached top courses for topic: ${topic}`)
        } catch (error) {
            logger.warn('Redis: Failed to cache top courses', error.message)
        }
    }

    /**
     * Get cached top courses by topic
     * @param {string} topic - Topic/category
     * @returns {Promise<Array|null>} Cached courses or null
     */
    async getCachedTopCourses(topic) {
        if (!(await this.isAvailable())) {
            return null
        }

        try {
            const key = this._getKey(
                this.PREFIXES.ADVISOR_TOP_COURSES,
                topic.toLowerCase()
            )
            const value = await this.client.get(key)

            if (value) {
                const courses = JSON.parse(value)
                logger.debug(`Redis: Cache hit for top courses: ${topic}`)
                return courses
            }

            return null
        } catch (error) {
            logger.warn('Redis: Failed to get cached top courses', error.message)
            return null
        }
    }

    /**
     * Invalidate cache for a specific query/topic
     * @param {string} type - Cache type ('search' or 'top')
     * @param {string} key - Cache key
     * @returns {Promise<void>}
     */
    async invalidateCache(type, key) {
        if (!(await this.isAvailable())) {
            return
        }

        try {
            const prefix =
                type === 'search'
                    ? this.PREFIXES.ADVISOR_SEARCH
                    : this.PREFIXES.ADVISOR_TOP_COURSES
            const fullKey = this._getKey(prefix, key)
            await this.client.del(fullKey)
            logger.debug(`Redis: Invalidated cache for ${type}: ${key}`)
        } catch (error) {
            logger.warn('Redis: Failed to invalidate cache', error.message)
        }
    }

    /**
     * Clear all advisor-related cache
     * @returns {Promise<void>}
     */
    async clearAdvisorCache() {
        if (!(await this.isAvailable())) {
            return
        }

        try {
            const patterns = [
                `${this.PREFIXES.ADVISOR_SEARCH}*`,
                `${this.PREFIXES.ADVISOR_TOP_COURSES}*`,
                `${this.PREFIXES.ADVISOR_KEYWORDS}*`,
            ]

            for (const pattern of patterns) {
                const keys = await this.client.keys(pattern)
                if (keys.length > 0) {
                    await this.client.del(...keys)
                }
            }

            logger.info('Redis: Cleared all advisor cache')
        } catch (error) {
            logger.warn('Redis: Failed to clear advisor cache', error.message)
        }
    }

    /**
     * Get cache statistics
     * @returns {Promise<Object>} Cache stats
     */
    async getStats() {
        if (!(await this.isAvailable())) {
            return { available: false }
        }

        try {
            const info = await this.client.info('stats')
            const memory = await this.client.info('memory')

            // Parse Redis INFO output (simplified)
            const stats = {
                available: true,
                connected: this.client.status === 'ready',
                // Add more stats parsing if needed
            }

            return stats
        } catch (error) {
            return { available: false, error: error.message }
        }
    }

    /**
     * Gracefully close Redis connection
     * @returns {Promise<void>}
     */
    async close() {
        try {
            await this.client.quit()
            logger.info('Redis: Connection closed gracefully')
        } catch (error) {
            logger.warn('Redis: Error closing connection', error.message)
        }
    }
}

// Export singleton instance
export default new RedisCacheService()
