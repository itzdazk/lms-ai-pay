// backend/src/cron/payment-expiration.cron.js
import cron from 'node-cron'
import logger from '../config/logger.config.js'
import vnpayExpirationHandler from '../services/vnpay-expiration-handler.service.js'

/**
 * INSTALL: npm install node-cron
 * Thêm vào server.js để start cron job
 */

/**
 * Cron job để tự động xử lý các transaction VNPay đã hết hạn
 * Chạy mỗi 5 phút
 */
class PaymentExpirationCron {
    constructor() {
        this.job = null
    }

    /**
     * Start cron job
     * Schedule: Chạy mỗi 5 phút
     */
    start() {
        if (this.job) {
            logger.warn('Payment expiration cron job is already running')
            return
        }

        // Chạy mỗi 5 phút: */5 * * * *
        // Hoặc mỗi 10 phút: */10 * * * *
        this.job = cron.schedule('*/2 * * * *', async () => {
            logger.info('Running VNPay expiration handler cron job...')

            try {
                const result =
                    await vnpayExpirationHandler.handleExpiredTransactions(15) // 15 phút timeout

                logger.info('VNPay expiration handler completed:', {
                    processed: result.processedCount,
                    failed: result.failedCount,
                })
            } catch (error) {
                logger.error(
                    `VNPay expiration handler cron failed: ${error.message}`
                )
            }
        })

        logger.info(
            'Payment expiration cron job started (runs every 5 minutes)'
        )
    }

    /**
     * Stop cron job
     */
    stop() {
        if (this.job) {
            this.job.stop()
            this.job = null
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
