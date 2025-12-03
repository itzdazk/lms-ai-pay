// backend/src/cron/payment-expiration.cron.js
import logger from '../config/logger.config.js'
import vnpayExpirationHandler from '../services/vnpay-expiration-handler.service.js'

class PaymentExpirationCron {
    constructor() {
        this.intervalId = null
        this.isRunning = false
    }

    start() {
        if (this.intervalId) {
            logger.warn('Payment expiration cron job is already running')
            return
        }

        // Chạy mỗi 30 giây
        this.intervalId = setInterval(async () => {
            if (this.isRunning) {
                logger.warn('Previous cron job still running, skipping...')
                return
            }

            this.isRunning = true

            try {
                logger.info(' Running VNPay expiration handler cron job...')

                const result =
                    await vnpayExpirationHandler.handleExpiredTransactions(15)

                logger.info(' VNPay expiration handler completed:', {
                    processed: result.processedCount,
                    failed: result.failedCount,
                })
            } catch (error) {
                logger.error(
                    ` VNPay expiration handler cron failed: ${error.message}`
                )
            } finally {
                this.isRunning = false
            }
        }, 30000) // 30 seconds

        logger.info(
            ' Payment expiration cron job started (runs every 30 seconds)'
        )
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId)
            this.intervalId = null
            this.isRunning = false
            logger.info(' Payment expiration cron job stopped')
        }
    }

    async runNow() {
        logger.info(' Running VNPay expiration handler manually...')
        try {
            const result =
                await vnpayExpirationHandler.handleExpiredTransactions(15)
            logger.info(' Manual run completed:', result)
            return result
        } catch (error) {
            logger.error(` Manual run failed: ${error.message}`)
            throw error
        }
    }
}

export default new PaymentExpirationCron()
