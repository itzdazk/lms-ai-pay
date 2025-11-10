import { Prisma } from '@prisma/client'
import dayjs from 'dayjs'
import {
    PAYMENT_GATEWAY,
    PAYMENT_STATUS,
    TRANSACTION_STATUS,
    USER_ROLES,
    PAGINATION,
} from '../config/constants.js'
import { prisma } from '../config/database.config.js'
import logger from '../config/logger.config.js'
import {
    momoConfig,
    CREATE_SIGNATURE_KEYS,
    CALLBACK_SIGNATURE_KEYS,
    WEBHOOK_SIGNATURE_KEYS,
    REFUND_SIGNATURE_KEYS,
    sign,
    verifySignature,
    isIpAllowed,
} from '../config/momo.config.js'
import ordersService from './orders.service.js'

const ensureMoMoConfig = () => {
    if (!momoConfig.partnerCode || !momoConfig.accessKey || !momoConfig.secretKey) {
        throw new Error(
            'MoMo configuration is missing. Please set MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, and MOMO_SECRET_KEY.'
        )
    }
    if (!momoConfig.returnUrl || !momoConfig.notifyUrl) {
        throw new Error(
            'MoMo return or notify URL is not configured. Please set MOMO_RETURN_URL and MOMO_NOTIFY_URL.'
        )
    }
}

const normalizeAmount = (value) => {
    if (value === null || value === undefined) {
        return 0
    }
    const numeric = typeof value === 'object' && value !== null ? value.toString() : value
    return Math.round(parseFloat(numeric) || 0)
}

const toDecimal = (value) => new Prisma.Decimal(value)

const decodeExtraData = (extraData) => {
    if (!extraData) {
        return null
    }
    try {
        const json = Buffer.from(extraData, 'base64').toString('utf8')
        return JSON.parse(json)
    } catch (error) {
        logger.warn(`Failed to decode MoMo extraData: ${error.message}`)
        return null
    }
}

class PaymentService {
    async createMoMoPayment(userId, orderId, clientIp = null) {
        ensureMoMoConfig()

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                course: { select: { title: true } },
            },
        })

        if (!order) {
            throw new Error('Order not found')
        }

        if (order.userId !== userId) {
            throw new Error('You are not authorized to pay for this order')
        }

        if (order.paymentGateway !== PAYMENT_GATEWAY.MOMO) {
            throw new Error('Order is not assigned to MoMo payment gateway')
        }

        if (order.paymentStatus === PAYMENT_STATUS.PAID) {
            throw new Error('Order has already been paid')
        }

        if (order.paymentStatus === PAYMENT_STATUS.REFUNDED) {
            throw new Error('Order has already been refunded')
        }

        if (order.paymentStatus !== PAYMENT_STATUS.PENDING) {
            throw new Error(`Order cannot be paid in status ${order.paymentStatus}`)
        }

        const amount = normalizeAmount(order.finalPrice)

        if (amount <= 0) {
            throw new Error('Order amount must be greater than 0 to process payment')
        }

        const requestId = `${order.orderCode}-${Date.now()}`
        const extraData = Buffer.from(
            JSON.stringify({
                orderId: order.id,
                orderCode: order.orderCode,
                userId,
            })
        ).toString('base64')

        const payload = {
            partnerCode: momoConfig.partnerCode,
            partnerName: 'LMS AI Pay',
            storeId: momoConfig.partnerCode,
            requestId,
            amount: amount.toString(),
            orderId: order.orderCode,
            orderInfo: `Thanh toán khóa học ${order.course?.title || order.orderCode}`,
            redirectUrl: momoConfig.returnUrl,
            ipnUrl: momoConfig.notifyUrl,
            lang: 'vi',
            extraData,
            requestType: momoConfig.captureRequestType,
            orderGroupId: '',
            autoCapture: true,
            accessKey: momoConfig.accessKey,
        }

        payload.signature = sign(
            {
                accessKey: momoConfig.accessKey,
                amount: payload.amount,
                extraData: payload.extraData,
                ipnUrl: payload.ipnUrl,
                orderId: payload.orderId,
                orderInfo: payload.orderInfo,
                partnerCode: payload.partnerCode,
                redirectUrl: payload.redirectUrl,
                requestId: payload.requestId,
                requestType: payload.requestType,
            },
            CREATE_SIGNATURE_KEYS
        )

        // Mark previous pending MoMo transactions as failed to avoid duplicates
        await prisma.paymentTransaction.updateMany({
            where: {
                orderId: order.id,
                paymentGateway: PAYMENT_GATEWAY.MOMO,
                status: TRANSACTION_STATUS.PENDING,
            },
            data: {
                status: TRANSACTION_STATUS.FAILED,
                errorMessage: 'Superseded by new MoMo payment request',
            },
        })

        let responseBody = null
        try {
            const response = await fetch(momoConfig.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            responseBody = await response.json()

            if (!response.ok || responseBody.resultCode !== 0) {
                await prisma.paymentTransaction.create({
                    data: {
                        orderId: order.id,
                        paymentGateway: PAYMENT_GATEWAY.MOMO,
                        amount: toDecimal(amount),
                        currency: 'VND',
                        status: TRANSACTION_STATUS.FAILED,
                        gatewayResponse: responseBody,
                        errorMessage:
                            responseBody?.message ||
                            `Failed to create MoMo payment (resultCode: ${responseBody?.resultCode})`,
                        ipAddress: clientIp || null,
                    },
                })

                throw new Error(
                    responseBody?.message || 'Failed to create MoMo payment URL'
                )
            }
        } catch (error) {
            logger.error(
                `MoMo payment creation failed for order ${order.orderCode}: ${error.message}`
            )
            throw error
        }

        const transaction = await prisma.paymentTransaction.create({
            data: {
                orderId: order.id,
                paymentGateway: PAYMENT_GATEWAY.MOMO,
                amount: toDecimal(amount),
                currency: 'VND',
                status: TRANSACTION_STATUS.PENDING,
                gatewayResponse: responseBody,
                ipAddress: clientIp || null,
            },
        })

        logger.info(
            `MoMo payment created for order ${order.orderCode}. Pay URL: ${responseBody?.payUrl}`
        )

        return {
            payUrl: responseBody?.payUrl,
            deeplink: responseBody?.deeplink,
            qrCodeUrl: responseBody?.qrCodeUrl,
            message: responseBody?.message,
            resultCode: responseBody?.resultCode,
            order: {
                id: order.id,
                orderCode: order.orderCode,
                finalPrice: amount,
                paymentStatus: order.paymentStatus,
            },
            transaction,
        }
    }

    async handleMoMoCallback(payload) {
        return this.#processMoMoResult(payload, 'callback')
    }

    async handleMoMoWebhook(payload, ipAddress) {
        ensureMoMoConfig()

        if (!isIpAllowed(ipAddress)) {
            throw new Error('Unauthorized IP address for MoMo webhook')
        }

        return this.#processMoMoResult(payload, 'webhook', ipAddress)
    }

    async refundOrder(orderId, adminUser, amountInput = null, reason = null) {
        ensureMoMoConfig()

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                paymentTransactions: {
                    where: {
                        paymentGateway: PAYMENT_GATEWAY.MOMO,
                        status: TRANSACTION_STATUS.SUCCESS,
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        })

        if (!order) {
            throw new Error('Order not found')
        }

        if (order.paymentGateway !== PAYMENT_GATEWAY.MOMO) {
            throw new Error('Refund is only available for MoMo payments')
        }

        if (order.paymentStatus !== PAYMENT_STATUS.PAID) {
            throw new Error('Only paid orders can be refunded')
        }

        const successfulTransaction = order.paymentTransactions[0]

        if (!successfulTransaction || !successfulTransaction.transactionId) {
            throw new Error(
                'No successful MoMo transaction found for this order to refund'
            )
        }

        const orderAmount = normalizeAmount(order.finalPrice)
        const existingRefundAmount = normalizeAmount(order.refundAmount)
        const requestedAmount =
            amountInput !== null && amountInput !== undefined
                ? Math.round(parseFloat(amountInput))
                : orderAmount

        if (requestedAmount <= 0) {
            throw new Error('Refund amount must be greater than 0')
        }

        if (requestedAmount > orderAmount - existingRefundAmount) {
            throw new Error('Refund amount exceeds remaining paid amount')
        }

        const requestId = `refund-${order.orderCode}-${Date.now()}`
        const description =
            reason || `Refund for order ${order.orderCode} by admin ${adminUser.id}`

        const signaturePayload = {
            accessKey: momoConfig.accessKey,
            amount: requestedAmount.toString(),
            description,
            orderId: order.orderCode,
            partnerCode: momoConfig.partnerCode,
            requestId,
            transId: successfulTransaction.transactionId,
        }

        const payload = {
            partnerCode: momoConfig.partnerCode,
            partnerName: 'LMS AI Pay',
            storeId: momoConfig.partnerCode,
            accessKey: momoConfig.accessKey,
            requestId,
            orderId: order.orderCode,
            amount: requestedAmount.toString(),
            transId: successfulTransaction.transactionId,
            lang: 'vi',
            description,
            signature: sign(signaturePayload, REFUND_SIGNATURE_KEYS),
        }

        let responseBody = null
        try {
            const response = await fetch(momoConfig.refundEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            responseBody = await response.json()

            if (!response.ok || responseBody.resultCode !== 0) {
                await prisma.paymentTransaction.create({
                    data: {
                        orderId: order.id,
                        paymentGateway: PAYMENT_GATEWAY.MOMO,
                        transactionId: responseBody?.transId || null,
                        amount: toDecimal(requestedAmount),
                        currency: 'VND',
                        status: TRANSACTION_STATUS.FAILED,
                        gatewayResponse: responseBody,
                        errorMessage:
                            responseBody?.message ||
                            `MoMo refund failed (resultCode: ${responseBody?.resultCode})`,
                    },
                })

                throw new Error(
                    responseBody?.message || 'Failed to process MoMo refund'
                )
            }
        } catch (error) {
            logger.error(
                `MoMo refund failed for order ${order.orderCode}: ${error.message}`
            )
            throw error
        }

        const newRefundTotal = existingRefundAmount + requestedAmount
        const isFullRefund = newRefundTotal >= orderAmount
        const newStatus = isFullRefund
            ? PAYMENT_STATUS.REFUNDED
            : PAYMENT_STATUS.PARTIALLY_REFUNDED

        const result = await prisma.$transaction(async (tx) => {
            const transactionRecord = await tx.paymentTransaction.create({
                data: {
                    orderId: order.id,
                    paymentGateway: PAYMENT_GATEWAY.MOMO,
                    transactionId: responseBody?.transId || null,
                    amount: toDecimal(requestedAmount),
                    currency: 'VND',
                    status: TRANSACTION_STATUS.REFUNDED,
                    gatewayResponse: responseBody,
                    errorMessage: null,
                },
            })

            const updatedOrder = await tx.order.update({
                where: { id: order.id },
                data: {
                    paymentStatus: newStatus,
                    refundAmount: toDecimal(newRefundTotal),
                    refundedAt: new Date(),
                },
            })

            return { transactionRecord, updatedOrder }
        })

        logger.info(
            `MoMo refund processed for order ${order.orderCode}. Amount: ${requestedAmount}, status: ${newStatus}`
        )

        return {
            order: result.updatedOrder,
            refundTransaction: result.transactionRecord,
            gatewayResponse: responseBody,
        }
    }

    async getTransactions(currentUser, filters = {}) {
        const page = parseInt(filters.page, 10) || PAGINATION.DEFAULT_PAGE
        const limit =
            Math.min(parseInt(filters.limit, 10) || PAGINATION.DEFAULT_LIMIT, 100)
        const skip = (page - 1) * limit

        const whereClause = {
            paymentGateway: filters.paymentGateway || undefined,
            status: filters.status || undefined,
            createdAt: filters.startDate || filters.endDate ? {} : undefined,
        }

        if (filters.startDate) {
            whereClause.createdAt = {
                ...(whereClause.createdAt || {}),
                gte: dayjs(filters.startDate).toDate(),
            }
        }

        if (filters.endDate) {
            whereClause.createdAt = {
                ...(whereClause.createdAt || {}),
                lte: dayjs(filters.endDate).endOf('day').toDate(),
            }
        }

        // Restrict to current user unless admin
        if (currentUser.role !== USER_ROLES.ADMIN) {
            whereClause.order = {
                userId: currentUser.id,
            }
        } else if (filters.userId) {
            whereClause.order = {
                userId: parseInt(filters.userId, 10),
            }
        }

        const [transactions, total] = await prisma.$transaction([
            prisma.paymentTransaction.findMany({
                where: whereClause,
                select: {
                    id: true,
                    orderId: true,
                    transactionId: true,
                    paymentGateway: true,
                    amount: true,
                    currency: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                    ipAddress: true,
                    order: {
                        select: {
                            id: true,
                            orderCode: true,
                            userId: true,
                            paymentStatus: true,
                            finalPrice: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.paymentTransaction.count({ where: whereClause }),
        ])

        return {
            data: transactions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        }
    }

    async getTransactionById(currentUser, transactionId) {
        const transaction = await prisma.paymentTransaction.findUnique({
            where: { id: transactionId },
            include: {
                order: {
                    select: {
                        id: true,
                        orderCode: true,
                        userId: true,
                        paymentStatus: true,
                        finalPrice: true,
                        courseId: true,
                    },
                },
            },
        })

        if (!transaction) {
            throw new Error('Transaction not found')
        }

        if (
            currentUser.role !== USER_ROLES.ADMIN &&
            transaction.order.userId !== currentUser.id
        ) {
            throw new Error('You do not have permission to view this transaction')
        }

        return transaction
    }

    async #processMoMoResult(payloadSource, source, ipAddress = null) {
        ensureMoMoConfig()

        const payload =
            payloadSource && typeof payloadSource === 'object'
                ? { ...payloadSource }
                : {}

        // Support both JSON body and query string inputs
        if (!Object.keys(payload).length && Array.isArray(payloadSource)) {
            payloadSource.forEach((entry) => {
                payload[entry.name] = entry.value
            })
        }

        const signature = payload.signature || payload.Signature

        const signaturePayload = { ...payload }
        delete signaturePayload.signature
        delete signaturePayload.Signature
        if (!signaturePayload.accessKey) {
            signaturePayload.accessKey = momoConfig.accessKey
        }

        const signatureKeys =
            source === 'callback' ? CALLBACK_SIGNATURE_KEYS : WEBHOOK_SIGNATURE_KEYS

        if (!verifySignature(signaturePayload, signature, signatureKeys)) {
            throw new Error('Invalid MoMo signature')
        }

        if (signaturePayload.partnerCode !== momoConfig.partnerCode) {
            throw new Error('Partner code does not match configured MoMo partner')
        }

        const orderCode = signaturePayload.orderId
        const amount = normalizeAmount(signaturePayload.amount)
        const resultCode = parseInt(signaturePayload.resultCode, 10)
        const transactionId = signaturePayload.transId
            ? String(signaturePayload.transId)
            : null

        const order = await prisma.order.findUnique({
            where: { orderCode },
            include: {
                paymentTransactions: {
                    where: { paymentGateway: PAYMENT_GATEWAY.MOMO },
                    orderBy: { createdAt: 'desc' },
                },
            },
        })

        if (!order) {
            throw new Error('Order not found for the provided MoMo callback')
        }

        const expectedAmount = normalizeAmount(order.finalPrice)

        if (amount !== expectedAmount) {
            throw new Error(
                `Payment amount mismatch. Expected ${expectedAmount}, received ${amount}`
            )
        }

        const success = resultCode === 0

        let transactionRecord = null

        await prisma.$transaction(async (tx) => {
            if (transactionId) {
                transactionRecord = await tx.paymentTransaction.findUnique({
                    where: { transactionId },
                })
            }

            if (transactionRecord) {
                transactionRecord = await tx.paymentTransaction.update({
                    where: { id: transactionRecord.id },
                    data: {
                        status: success
                            ? TRANSACTION_STATUS.SUCCESS
                            : TRANSACTION_STATUS.FAILED,
                        gatewayResponse: signaturePayload,
                        errorMessage: success ? null : signaturePayload.message || null,
                        ipAddress: ipAddress || transactionRecord.ipAddress,
                        amount: toDecimal(amount),
                    },
                })
            } else {
                transactionRecord = await tx.paymentTransaction.create({
                    data: {
                        orderId: order.id,
                        transactionId,
                        paymentGateway: PAYMENT_GATEWAY.MOMO,
                        amount: toDecimal(amount),
                        currency: 'VND',
                        status: success
                            ? TRANSACTION_STATUS.SUCCESS
                            : TRANSACTION_STATUS.FAILED,
                        gatewayResponse: signaturePayload,
                        errorMessage: success ? null : signaturePayload.message || null,
                        ipAddress,
                    },
                })
            }

            if (success) {
                await tx.paymentTransaction.updateMany({
                    where: {
                        orderId: order.id,
                        status: TRANSACTION_STATUS.PENDING,
                        id: { not: transactionRecord.id },
                    },
                    data: {
                        status: TRANSACTION_STATUS.FAILED,
                        errorMessage: 'Superseded by successful MoMo payment',
                    },
                })
            }
        })

        if (success) {
            const paymentData = {
                gateway: PAYMENT_GATEWAY.MOMO,
                source,
                transId: transactionId,
                extraData: decodeExtraData(signaturePayload.extraData),
                raw: signaturePayload,
            }

            const updateResult = await ordersService.updateOrderToPaid(
                order.id,
                transactionId,
                paymentData
            )

            logger.info(
                `MoMo payment success processed for order ${order.orderCode} (source: ${source})`
            )

            return {
                order: updateResult.order,
                enrollment: updateResult.enrollment,
                paymentTransaction: transactionRecord,
                alreadyPaid: updateResult.alreadyPaid || false,
            }
        }

        if (order.paymentStatus === PAYMENT_STATUS.PENDING) {
            await prisma.order.update({
                where: { id: order.id },
                data: { paymentStatus: PAYMENT_STATUS.FAILED },
            })
        }

        logger.warn(
            `MoMo payment failed for order ${order.orderCode}. resultCode=${resultCode}, message=${signaturePayload.message}`
        )

        return {
            order: {
                id: order.id,
                orderCode: order.orderCode,
                paymentStatus: PAYMENT_STATUS.FAILED,
            },
            paymentTransaction: transactionRecord,
            resultCode,
            message: signaturePayload.message,
        }
    }
}

export default new PaymentService()


