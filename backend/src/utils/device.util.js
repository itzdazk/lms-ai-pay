// src/utils/device.util.js
import crypto from 'crypto'

/**
 * Extract device information from request
 */
class DeviceUtil {
    /**
     * Get IP address from request
     */
    static getIpAddress(req) {
        return (
            req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.headers['x-real-ip'] ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress ||
            req.ip ||
            'unknown'
        )
    }

    /**
     * Get user agent from request
     */
    static getUserAgent(req) {
        return req.headers['user-agent'] || 'unknown'
    }

    /**
     * Generate device ID from IP and user agent
     */
    static generateDeviceId(req) {
        const ip = this.getIpAddress(req)
        const userAgent = this.getUserAgent(req)
        const combined = `${ip}-${userAgent}`
        return crypto.createHash('sha256').update(combined).digest('hex').substring(0, 32)
    }

    /**
     * Parse device name from user agent
     */
    static getDeviceName(userAgent) {
        if (!userAgent || userAgent === 'unknown') {
            return 'Unknown Device'
        }

        // Simple device name parsing
        if (userAgent.includes('Mobile')) {
            if (userAgent.includes('iPhone')) {
                return 'iPhone'
            }
            if (userAgent.includes('Android')) {
                return 'Android Device'
            }
            return 'Mobile Device'
        }

        if (userAgent.includes('Windows')) {
            return 'Windows PC'
        }
        if (userAgent.includes('Mac')) {
            return 'Mac'
        }
        if (userAgent.includes('Linux')) {
            return 'Linux PC'
        }

        return 'Desktop'
    }

    /**
     * Get all device info from request
     */
    static getDeviceInfo(req) {
        const ipAddress = this.getIpAddress(req)
        const userAgent = this.getUserAgent(req)
        const deviceId = this.generateDeviceId(req)
        const deviceName = this.getDeviceName(userAgent)

        return {
            deviceId,
            deviceName,
            ipAddress,
            userAgent,
        }
    }
}

export default DeviceUtil
