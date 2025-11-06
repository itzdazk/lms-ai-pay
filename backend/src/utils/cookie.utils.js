// src/utils/cookie.util.js
import config from '../config/app.config.js'

class CookieUtil {
    /**
     * Get common cookie options
     */
    static getCookieOptions(maxAge) {
        return {
            httpOnly: true,
            secure: config.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: maxAge || undefined,
        }
    }

    /**
     * Set access token cookie
     */
    static setAccessToken(res, token) {
        res.cookie(
            'accessToken',
            token,
            this.getCookieOptions(7 * 24 * 60 * 60 * 1000) // 7 days
        )
    }

    /**
     * Set refresh token cookie
     */
    static setRefreshToken(res, token) {
        res.cookie(
            'refreshToken',
            token,
            this.getCookieOptions(30 * 24 * 60 * 60 * 1000) // 30 days
        )
    }

    /**
     * Set both tokens
     */
    static setAuthTokens(res, tokens) {
        this.setAccessToken(res, tokens.accessToken)
        this.setRefreshToken(res, tokens.refreshToken)
    }

    /**
     * Clear access token cookie
     */
    static clearAccessToken(res) {
        res.clearCookie('accessToken', this.getCookieOptions())
    }

    /**
     * Clear refresh token cookie
     */
    static clearRefreshToken(res) {
        res.clearCookie('refreshToken', this.getCookieOptions())
    }

    /**
     * Clear both tokens
     */
    static clearAuthTokens(res) {
        this.clearAccessToken(res)
        this.clearRefreshToken(res)
    }
}

export default CookieUtil
