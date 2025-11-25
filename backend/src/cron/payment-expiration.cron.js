// backend/src/cron/payment-expiration.cron.js
import logger from '../config/logger.config.js'
import vnpayExpirationHandler from '../services/vnpay-expiration-handler.service.js'

/**
 * Thêm vào server.js để start cron job
 * Sử dụng setInterval để chạy mỗi 30 giây
 */

/**
 * Cron job để tự động xử lý các transaction VNPay đã hết hạn
 * Chạy mỗi 30 giây
 */
class PaymentExpirationCron {
    constructor() {
        this.intervalId = null
    }

    /**
     * Start cron job
     * Schedule: Chạy mỗi 30 giây
     */
    start() {
        if (this.intervalId) {
            logger.warn('Payment expiration cron job is already running')
            return
        }

        // Chạy mỗi 30 giây (30000 milliseconds)
        this.intervalId = setInterval(async () => {
            logger.info('Running VNPay expiration handler cron job...')

            try {
                const result =
                    await vnpayExpirationHandler.handleExpiredTransactions(1) // 15 phút timeout

                logger.info('VNPay expiration handler completed:', {
                    processed: result.processedCount,
                    failed: result.failedCount,
                })
            } catch (error) {
                logger.error(
                    `VNPay expiration handler cron failed: ${error.message}`
                )
            }
        }, 30000) // 30 giây = 30000 milliseconds

        logger.info(
            'Payment expiration cron job started (runs every 30 seconds)'
        )
    }

    /**
     * Stop cron job
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId)
            this.intervalId = null
            logger.info('Payment expiration cron job stopped')
        }
    }

    /**
     * Run immediately (for testing)
     */
    async runNow() {
        logger.info('Running VNPay expiration handler manually...')
        try {
            const result =
                await vnpayExpirationHandler.handleExpiredTransactions(15)
            logger.info('Manual run completed:', result)
            return result
        } catch (error) {
            logger.error(`Manual run failed: ${error.message}`)
            throw error
        }
    }
}

export default new PaymentExpirationCron()
