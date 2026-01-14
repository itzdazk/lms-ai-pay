// backend/src/services/vnpay-expiration-handler.service.js
import { prisma } from '../config/database.config.js'
import logger from '../config/logger.config.js'
import {
    PAYMENT_GATEWAY,
    TRANSACTION_STATUS,
    PAYMENT_STATUS,
} from '../config/constants.js'
import notificationsService from './notifications.service.js'

/**
 * Service để xử lý tự động hủy transaction VNPay đã hết hạn
 * VNPay không gửi IPN khi link hết hạn, nên cần cron job để check
 */
class VNPayExpirationHandlerService {
    /**
     * Tìm và hủy tất cả transaction VNPay đã hết hạn
     * @param {number} expirationMinutes - Số phút timeout (default: 15)
     * @returns {Promise<Object>} Kết quả xử lý
     */
    async handleExpiredTransactions(expirationMinutes = 15) {
        try {
            const now = new Date() // JS Date tự động là local time
            const expirationTime = new Date(
                now.getTime() - expirationMinutes * 60 * 1000
            )

            // Query transactions (PostgreSQL tự động so sánh theo UTC)
            const expiredTransactions =
                await prisma.paymentTransaction.findMany({
                    where: {
                        paymentGateway: PAYMENT_GATEWAY.VNPAY,
                        status: TRANSACTION_STATUS.PENDING,
                        createdAt: {
                            lt: expirationTime, // PostgreSQL tự động convert sang UTC
                        },
                    },
                    include: {
                        order: {
                            select: {
                                id: true,
                                orderCode: true,
                                paymentStatus: true,
                                courseId: true,
                                userId: true,
                                createdAt: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'asc', // Xử lý cũ nhất trước
                    },
                })

            if (expiredTransactions.length === 0) {
                // logger.info('No expired VNPay transactions found')
                return {
                    processedCount: 0,
                    failedCount: 0,
                    transactions: [],
                }
            }

            // logger.info(
            //     `Found ${expiredTransactions.length} expired VNPay transactions`
            // )

            const results = {
                processedCount: 0,
                failedCount: 0,
                transactions: [],
            }

            // Process từng transaction
            for (const transaction of expiredTransactions) {
                try {
                    const age = now - new Date(transaction.createdAt)
                    const ageMinutes = Math.floor(age / 60000)

                    // logger.info(
                    //     `   Processing transaction ${transaction.transactionId}`
                    // )
                    // logger.info(`      Order: ${transaction.order.orderCode}`)
                    // logger.info(
                    //     `      Created: ${new Date(transaction.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`
                    // )
                    // logger.info(`      Age: ${ageMinutes} minutes`)

                    await this.#handleSingleExpiredTransaction(transaction)

                    results.processedCount++
                    results.transactions.push({
                        transactionId: transaction.transactionId,
                        orderCode: transaction.order.orderCode,
                        ageMinutes,
                        status: 'processed',
                    })

                    // logger.info(`    Processed successfully`)
                } catch (error) {
                    results.failedCount++
                    results.transactions.push({
                        transactionId: transaction.transactionId,
                        orderCode: transaction.order.orderCode,
                        status: 'failed',
                        error: error.message,
                    })
                    // logger.error(`    Failed: ${error.message}`)
                }
            }

            // logger.info(' VNPay Expiration Check Completed')
            // logger.info(`    Processed: ${results.processedCount}`)
            // logger.info(`    Failed: ${results.failedCount}`)

            return results
        } catch (error) {
            // logger.error(
            //     ` Error handling expired VNPay transactions: ${error.message}`
            // )
            throw error
        }
    }

    /**
     * Xử lý một transaction đã hết hạn
     * @private
     */
    async #handleSingleExpiredTransaction(transaction) {
        return await prisma.$transaction(async (tx) => {
            const order = transaction.order

            const currentOrder = await tx.order.findUnique({
                where: { id: order.id },
                select: { paymentStatus: true },
            })

            if (currentOrder.paymentStatus !== PAYMENT_STATUS.PENDING) {
                // logger.info(
                //     `      Order ${order.orderCode} already ${currentOrder.paymentStatus} - skipping expiration`
                // )

                // Vẫn update transaction nếu nó PENDING
                await tx.paymentTransaction.update({
                    where: { id: transaction.id },
                    data: {
                        status: TRANSACTION_STATUS.FAILED,
                        errorMessage: 'Đơn hàng đã được hủy hoặc đã được xử lý',
                        gatewayResponse: {
                            ...(transaction.gatewayResponse || {}),
                            skippedAt: new Date().toISOString(),
                            skipReason: `ORDER_ALREADY_${currentOrder.paymentStatus}`,
                        },
                    },
                })

                return
            }

            // 1. Update transaction status to FAILED
            await tx.paymentTransaction.update({
                where: { id: transaction.id },
                data: {
                    status: TRANSACTION_STATUS.FAILED,
                    errorMessage:
                        'Link thanh toán đã hết hạn - không có thanh toán nào được thực hiện trong thời gian cho phép',
                    gatewayResponse: {
                        ...(transaction.gatewayResponse || {}),
                        expiredAt: new Date().toISOString(),
                        expiredReason: 'AUTO_EXPIRED_BY_CRONJOB',
                        expirationMinutes: 15,
                    },
                },
            })

            // 2. Update order status nếu vẫn PENDING
            if (order.paymentStatus === PAYMENT_STATUS.PENDING) {
                await tx.order.update({
                    where: { id: order.id },
                    data: {
                        paymentStatus: PAYMENT_STATUS.FAILED,
                        notes: 'Thanh toán thất bại - link hết hạn sau 15 phút',
                    },
                })

                // logger.info(`      Order ${order.orderCode} → FAILED (expired)`)

                // 3. Send notification
                const fullOrder = await tx.order.findUnique({
                    where: { id: order.id },
                    include: {
                        course: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                })

                if (fullOrder?.course) {
                    // Fire-and-forget notification (không block transaction)
                    setImmediate(() => {
                        notificationsService
                            .notifyPaymentFailed(
                                order.userId,
                                order.id,
                                order.courseId,
                                fullOrder.course.title,
                                'Link thanh toán đã hết hạn (15 phút)'
                            )
                            .catch((err) => {
                                // logger.error(
                                //     `Failed to send notification: ${err.message}`
                                // )
                            })
                    })
                }
            } else {
                // logger.info(
                //     `      Order ${order.orderCode} already ${order.paymentStatus} - skipped`
                // )
            }
        })
    }

    /**
     * Manual check một order cụ thể (for testing)
     */
    async checkAndFailOrderIfExpired(orderCode, expirationMinutes = 15) {
        try {
            const order = await prisma.order.findUnique({
                where: { orderCode },
                include: {
                    paymentTransactions: {
                        where: {
                            paymentGateway: PAYMENT_GATEWAY.VNPAY,
                            status: TRANSACTION_STATUS.PENDING,
                        },
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                    },
                },
            })

            if (!order) {
                throw new Error(`Order ${orderCode} not found`)
            }

            if (order.paymentStatus !== PAYMENT_STATUS.PENDING) {
                return {
                    orderCode: order.orderCode,
                    paymentStatus: order.paymentStatus,
                    message: `Order is already ${order.paymentStatus}`,
                    changed: false,
                }
            }

            const transaction = order.paymentTransactions[0]

            if (!transaction) {
                return {
                    orderCode: order.orderCode,
                    paymentStatus: order.paymentStatus,
                    message: 'No pending transaction found',
                    changed: false,
                }
            }

            const now = new Date()
            const expirationTime = new Date(
                now.getTime() - expirationMinutes * 60 * 1000
            )

            if (new Date(transaction.createdAt) >= expirationTime) {
                const age = now - new Date(transaction.createdAt)
                const ageMinutes = Math.floor(age / 60000)

                return {
                    orderCode: order.orderCode,
                    paymentStatus: order.paymentStatus,
                    message: `Giao dịch chưa hết hạn (thời gian đã trôi qua: ${ageMinutes} phút)`,
                    changed: false,
                }
            }

            await this.#handleSingleExpiredTransaction({
                ...transaction,
                order: {
                    id: order.id,
                    orderCode: order.orderCode,
                    paymentStatus: order.paymentStatus,
                    courseId: order.courseId,
                    userId: order.userId,
                },
            })

            return {
                orderCode: order.orderCode,
                transactionId: transaction.transactionId,
                message: 'Đơn hàng đã được đánh dấu là FAILED do hết hạn',
                changed: true,
            }
        } catch (error) {
            throw error
        }
    }

    /**
     * Get expiration statistics (for monitoring)
     */
    async getExpirationStats() {
        const stats = await prisma.paymentTransaction.groupBy({
            by: ['status'],
            where: {
                paymentGateway: PAYMENT_GATEWAY.VNPAY,
                createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24h
                },
            },
            _count: true,
        })

        return {
            last24Hours: stats.reduce((acc, item) => {
                acc[item.status] = item._count
                return acc
            }, {}),
            timestamp: new Date().toISOString(),
        }
    }
}

export default new VNPayExpirationHandlerService()
