// backend/src/services/vnpay-expiration-handler.service.js
import { prisma } from '../config/database.config.js'
import logger from '../config/logger.config.js'
import {
    PAYMENT_GATEWAY,
    TRANSACTION_STATUS,
    PAYMENT_STATUS,
} from '../config/constants.js'
import { parseDate } from '../config/vnpay.config.js'
import notificationsService from './notifications.service.js'

/**
 * Service để xử lý tự động hủy transaction VNPay đã hết hạn
 * VNPay không gửi IPN khi link hết hạn, nên cần cron job để check
 */
class VNPayExpirationHandlerService {
    /**
     * Tìm và hủy tất cả transaction VNPay đã hết hạn
     */
    async handleExpiredTransactions(expirationMinutes = 15) {
        try {
            const expirationTime = new Date(
                Date.now() - expirationMinutes * 60 * 1000
            )

            // Tìm tất cả transaction VNPay PENDING đã quá hạn
            const expiredTransactions =
                await prisma.paymentTransaction.findMany({
                    where: {
                        paymentGateway: PAYMENT_GATEWAY.VNPAY,
                        status: TRANSACTION_STATUS.PENDING,
                        createdAt: {
                            lt: expirationTime,
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
                            },
                        },
                    },
                })

            if (expiredTransactions.length === 0) {
                logger.info('No expired VNPay transactions found')
                return {
                    processedCount: 0,
                    failedCount: 0,
                    transactions: [],
                }
            }

            logger.info(
                `Found ${expiredTransactions.length} expired VNPay transactions to process`
            )

            const results = {
                processedCount: 0,
                failedCount: 0,
                transactions: [],
            }

            // Process từng transaction
            for (const transaction of expiredTransactions) {
                try {
                    await this.#handleSingleExpiredTransaction(transaction)
                    results.processedCount++
                    results.transactions.push({
                        transactionId: transaction.transactionId,
                        orderCode: transaction.order.orderCode,
                        status: 'processed',
                    })
                } catch (error) {
                    results.failedCount++
                    results.transactions.push({
                        transactionId: transaction.transactionId,
                        orderCode: transaction.order.orderCode,
                        status: 'failed',
                        error: error.message,
                    })
                    logger.error(
                        `Failed to process expired transaction ${transaction.transactionId}: ${error.message}`
                    )
                }
            }

            logger.info(
                `Processed ${results.processedCount} expired VNPay transactions, ${results.failedCount} failed`
            )

            return results
        } catch (error) {
            logger.error(
                `Error handling expired VNPay transactions: ${error.message}`
            )
            throw error
        }
    }

    /**
     * Xử lý một transaction đã hết hạn
     */
    async #handleSingleExpiredTransaction(transaction) {
        return await prisma.$transaction(async (tx) => {
            const order = transaction.order
            // 1. Update transaction status to FAILED
            await tx.paymentTransaction.update({
                where: { id: transaction.id },
                data: {
                    status: TRANSACTION_STATUS.FAILED,
                    errorMessage:
                        'Payment link expired - no payment was made within the time limit',
                    gatewayResponse: {
                        ...(transaction.gatewayResponse || {}),
                        expiredAt: new Date().toISOString(),
                        expiredReason: 'AUTO_EXPIRED_BY_SYSTEM',
                    },
                },
            })

            if (order.paymentStatus === PAYMENT_STATUS.PENDING) {
                await tx.order.update({
                    where: { id: order.id },
                    data: {
                        paymentStatus: PAYMENT_STATUS.FAILED,
                    },
                })

                logger.info(
                    `Order ${order.orderCode} marked as FAILED - payment link expired`
                )
                // Send notification for expired payment (giống MoMo)
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

                if (fullOrder && fullOrder.course) {
                    await notificationsService.notifyPaymentFailed(
                        order.userId,
                        order.id,
                        order.courseId,
                        fullOrder.course.title,
                        'Link thanh toán đã hết hạn'
                    )
                }
            } else {
                logger.info(
                    `Skipping order ${order.orderCode} - already ${order.paymentStatus}`
                )
            }

            logger.info(
                `Marked VNPay transaction ${transaction.transactionId} as FAILED due to expiration`
            )
        })
    }

    /**
     * Kiểm tra xem một transaction có hết hạn không (dựa vào vnp_CreateDate)
     * @param {Object} gatewayResponse - Response từ VNPay
     * @param {number} expirationMinutes - Số phút timeout
     * @returns {boolean}
     */
    isTransactionExpired(gatewayResponse, expirationMinutes = 15) {
        if (!gatewayResponse?.vnp_CreateDate) {
            return false
        }

        try {
            const createDate = parseDate(gatewayResponse.vnp_CreateDate)
            if (!createDate) return false

            const expirationTime = new Date(
                createDate.getTime() + expirationMinutes * 60 * 1000
            )
            return new Date() > expirationTime
        } catch (error) {
            logger.error(
                `Error checking transaction expiration: ${error.message}`
            )
            return false
        }
    }

    /**
     * Manual check một order cụ thể
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

            // Chỉ có tối đa 1 transaction
            const transaction = order.paymentTransactions[0]

            if (!transaction) {
                return {
                    orderCode: order.orderCode,
                    paymentStatus: order.paymentStatus,
                    message: 'No pending transaction found',
                    changed: false,
                }
            }

            const expirationTime = new Date(
                Date.now() - expirationMinutes * 60 * 1000
            )

            if (transaction.createdAt >= expirationTime) {
                return {
                    orderCode: order.orderCode,
                    paymentStatus: order.paymentStatus,
                    message: 'Transaction not yet expired',
                    changed: false,
                }
            }

            // implified - không cần array
            await this.#handleSingleExpiredTransaction(transaction)

            return {
                orderCode: order.orderCode,
                transactionId: transaction.transactionId,
                message: 'Order marked as FAILED',
                changed: true,
            }
        } catch (error) {
            logger.error(`Error checking order ${orderCode}: ${error.message}`)
            throw error
        }
    }
}

export default new VNPayExpirationHandlerService()
