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
            logger.warn(
                'Tiến trình (cron job) xử lý hết hạn thanh toán hiện đang chạy'
            )
            return
        }

        // Chạy mỗi 30 giây
        this.intervalId = setInterval(async () => {
            if (this.isRunning) {
                logger.warn(
                    'Tiến trình (cron job) trước đó vẫn đang chạy, đang bỏ qua...'
                )
                return
            }

            this.isRunning = true

            try {
                logger.info(
                    ' Đang chạy tiến trình (cron job) xử lý hết hạn thanh toán VNPay...'
                )

                const result =
                    await vnpayExpirationHandler.handleExpiredTransactions(15)

                logger.info(
                    ' Tiến trình (cron job) xử lý hết hạn thanh toán VNPay đã hoàn tất:',
                    {
                        processed: result.processedCount,
                        failed: result.failedCount,
                    }
                )
            } catch (error) {
                logger.error(
                    ` Tiến trình (cron job) xử lý hết hạn thanh toán VNPay đã thất bại: ${error.message}`
                )
            } finally {
                this.isRunning = false
            }
        }, 30000) // 30 seconds

        logger.info(
            ' Tiến trình (cron job) xử lý hết hạn thanh toán đã bắt đầu (chạy mỗi 30 giây)'
        )
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId)
            this.intervalId = null
            this.isRunning = false
            logger.info(
                ' Tiến trình (cron job) xử lý hết hạn thanh toán đã dừng'
            )
        }
    }

    async runNow() {
        logger.info(
            ' Đang chạy tiến trình (cron job) xử lý hết hạn thanh toán VNPay bằng tay...'
        )
        try {
            const result =
                await vnpayExpirationHandler.handleExpiredTransactions(15)
            logger.info(
                ' Tiến trình (cron job) xử lý hết hạn thanh toán VNPay đã hoàn tất:',
                result
            )
            return result
        } catch (error) {
            logger.error(
                ` Tiến trình (cron job) xử lý hết hạn thanh toán VNPay đã thất bại: ${error.message}`
            )
            throw error
        }
    }
}

export default new PaymentExpirationCron()
