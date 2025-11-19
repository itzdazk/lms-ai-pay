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
    vnpayConfig,
    createSignature,
    verifySignature as verifyVNPaySignature,
    formatDate,
    parseDate,
    getResponseMessage,
    normalizeAmount as vnpayNormalizeAmount,
    sortObject,
} from '../config/vnpay.config.js'
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
import qs from 'qs'
import crypto from 'crypto'
import querystring from 'querystring'
import notificationsService from './notifications.service.js'

const ensureMoMoConfig = () => {
    if (
        !momoConfig.partnerCode ||
        !momoConfig.accessKey ||
        !momoConfig.secretKey
    ) {
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

const ensureVNPayConfig = () => {
    if (!vnpayConfig.tmnCode || !vnpayConfig.hashSecret) {
        throw new Error(
            'VNPay configuration is missing. Please set VNPAY_TMN_CODE and VNPAY_HASH_SECRET.'
        )
    }
    if (!vnpayConfig.returnUrl) {
        throw new Error(
            'VNPay return URL is not configured. Please set VNPAY_RETURN_URL.'
        )
    }
}

const normalizeAmount = (value) => {
    if (value === null || value === undefined) {
        return 0
    }
    const numeric =
        typeof value === 'object' && value !== null ? value.toString() : value
    return Math.round(parseFloat(numeric) || 0)
}

const toDecimal = (value) => new Prisma.Decimal(value)

const decodeExtraData = (extraData) => {
    if (!extraData) {
        return null
    }
    try {
        const json =
            typeof extraData === 'string'
                ? Buffer.from(extraData, 'base64').toString('utf8')
                : ''
        return JSON.parse(json)
    } catch (error) {
        logger.warn(`Failed to decode MoMo extraData: ${error.message}`)
        return null
    }
}

const normalizeSignaturePayload = (payload) => ({
    ...payload,
    signature: undefined,
    Signature: undefined,
    partnerCode: payload.partnerCode ?? '',
    orderId: payload.orderId ?? '',
    requestId: payload.requestId ?? '',
    amount: payload.amount ?? '',
    orderInfo: payload.orderInfo ?? '',
    orderType: payload.orderType ?? '',
    transId: payload.transId ?? '',
    resultCode: payload.resultCode ?? '',
    message: payload.message ?? '',
    payType: payload.payType ?? '',
    responseTime: payload.responseTime ?? '',
    extraData: payload.extraData ?? '',
    accessKey: payload.accessKey ?? momoConfig.accessKey,
})

const buildSignatureInput = (payload, keys) => {
    const toString = (value) =>
        value === undefined || value === null ? '' : String(value)

    return keys.reduce((acc, key) => {
        acc[key] = toString(payload[key])
        return acc
    }, {})
}

class PaymentService {
    // ==================== VNPay Methods ====================

    /**
     * Create VNPay payment URL
     */
    async createVNPayPayment(userId, orderId, clientIp = null) {
        ensureVNPayConfig()

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

        if (order.paymentGateway !== PAYMENT_GATEWAY.VNPAY) {
            throw new Error('Order is not assigned to VNPay payment gateway')
        }

        if (order.paymentStatus === PAYMENT_STATUS.PAID) {
            throw new Error('Order has already been paid')
        }

        if (order.paymentStatus === PAYMENT_STATUS.REFUNDED) {
            throw new Error('Order has already been refunded')
        }

        if (order.paymentStatus !== PAYMENT_STATUS.PENDING) {
            throw new Error(
                `Order cannot be paid in status ${order.paymentStatus}`
            )
        }

        const amount = normalizeAmount(order.finalPrice)

        if (amount <= 0) {
            throw new Error(
                'Order amount must be greater than 0 to process payment'
            )
        }

        //* Mark previous pending VNPay transactions as failed
        await prisma.paymentTransaction.updateMany({
            where: {
                orderId: order.id,
                paymentGateway: PAYMENT_GATEWAY.VNPAY,
                status: TRANSACTION_STATUS.PENDING,
            },
            data: {
                status: TRANSACTION_STATUS.FAILED,
                errorMessage: 'Superseded by new VNPay payment request',
            },
        })

        const createDate = formatDate(new Date())
        const txnRef = order.orderCode
        const orderInfo = `Thanh toan khoa hoc ${order.course?.title || order.orderCode}`
        const ipAddr = clientIp || '127.0.0.1'

        // ===== 1. Build VNPay params (KHÔNG bao gồm vnp_SecureHash) =====
        let vnpParams = {
            vnp_Version: vnpayConfig.version,
            vnp_Command: vnpayConfig.command,
            vnp_TmnCode: vnpayConfig.tmnCode,
            vnp_Amount: amount * 100, // VNPay requires amount in smallest currency unit (VND * 100)
            vnp_CurrCode: vnpayConfig.currCode,
            vnp_TxnRef: txnRef,
            vnp_OrderInfo: orderInfo,
            vnp_OrderType: 'other',
            vnp_Locale: vnpayConfig.locale,
            vnp_ReturnUrl: vnpayConfig.returnUrl,
            vnp_IpAddr: ipAddr,
            vnp_CreateDate: createDate,
        }

        // ===== 2. Tạo signature =====
        const signed = createSignature(vnpParams, vnpayConfig.hashSecret)

        // ===== 3. Sort params =====
        vnpParams = sortObject(vnpParams)

        // ===== 4. Thêm signature vào params =====
        vnpParams['vnp_SecureHash'] = signed

        // ===== 5. Build URL =====
        const paymentUrl =
            vnpayConfig.apiUrl +
            '?' +
            qs.stringify(vnpParams, { encode: false })

        // Create transaction record
        const transaction = await prisma.paymentTransaction.create({
            data: {
                orderId: order.id,
                transactionId: txnRef,
                paymentGateway: PAYMENT_GATEWAY.VNPAY,
                amount: toDecimal(amount),
                currency: 'VND',
                status: TRANSACTION_STATUS.PENDING,
                gatewayResponse: vnpParams,
                ipAddress: clientIp || null,
            },
        })

        logger.info(
            `VNPay payment created for order ${order.orderCode}. TxnRef: ${txnRef}`
        )

        return {
            payUrl: paymentUrl,
            txnRef,
            message: 'VNPay payment URL created successfully',
            order: {
                id: order.id,
                orderCode: order.orderCode,
                finalPrice: amount,
                paymentStatus: order.paymentStatus,
            },
            transaction,
        }
    }

    /**
     * Handle VNPay callback (return URL)
     */
    async handleVNPayCallback(query) {
        return this.#processVNPayResult(query, 'callback')
    }

    /**
     * Handle VNPay IPN (webhook)
     */
    async handleVNPayWebhook(query) {
        return this.#processVNPayResult(query, 'ipn')
    }

    // ==================== MoMo Methods ====================
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
            throw new Error(
                `Order cannot be paid in status ${order.paymentStatus}`
            )
        }

        const amount = normalizeAmount(order.finalPrice)

        if (amount <= 0) {
            throw new Error(
                'Order amount must be greater than 0 to process payment'
            )
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

    // ==================== Refund Methods ====================
    async refundOrder(orderId, adminUser, amountInput = null, reason = null) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                paymentTransactions: {
                    where: {
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

        if (order.paymentStatus !== PAYMENT_STATUS.PAID) {
            throw new Error('Only paid orders can be refunded')
        }

        const successfulTransaction = order.paymentTransactions[0]

        if (!successfulTransaction || !successfulTransaction.transactionId) {
            throw new Error(
                'No successful transaction found for this order to refund'
            )
        }

        // Route to appropriate refund handler
        if (order.paymentGateway === PAYMENT_GATEWAY.MOMO) {
            return this.#refundMoMoOrder(
                order,
                successfulTransaction,
                adminUser,
                amountInput,
                reason
            )
        } else if (order.paymentGateway === PAYMENT_GATEWAY.VNPAY) {
            return this.#refundVNPayOrder(
                order,
                successfulTransaction,
                adminUser,
                amountInput,
                reason
            )
        }

        throw new Error(
            `Refund not supported for payment gateway: ${order.paymentGateway}`
        )
    }

    async #refundMoMoOrder(
        order,
        successfulTransaction,
        adminUser,
        amountInput,
        reason
    ) {
        ensureMoMoConfig()

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
            reason ||
            `Refund for order ${order.orderCode} by admin ${adminUser.id}`

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

    async #refundVNPayOrder(
        order,
        successfulTransaction,
        adminUser,
        amountInput,
        reason
    ) {
        // VNPay refund requires manual process or API integration if available
        // For now, we'll mark it as refunded in our system
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

        const newRefundTotal = existingRefundAmount + requestedAmount
        const isFullRefund = newRefundTotal >= orderAmount
        const newStatus = isFullRefund
            ? PAYMENT_STATUS.REFUNDED
            : PAYMENT_STATUS.PARTIALLY_REFUNDED

        const result = await prisma.$transaction(async (tx) => {
            const transactionRecord = await tx.paymentTransaction.create({
                data: {
                    orderId: order.id,
                    paymentGateway: PAYMENT_GATEWAY.VNPAY,
                    transactionId: `refund-${successfulTransaction.transactionId}-${Date.now()}`,
                    amount: toDecimal(requestedAmount),
                    currency: 'VND',
                    status: TRANSACTION_STATUS.REFUNDED,
                    gatewayResponse: {
                        message: reason || 'Manual refund by admin',
                        adminId: adminUser.id,
                        refundDate: new Date().toISOString(),
                    },
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
            `VNPay refund processed for order ${order.orderCode}. Amount: ${requestedAmount}, status: ${newStatus}`
        )

        return {
            order: result.updatedOrder,
            refundTransaction: result.transactionRecord,
            message:
                'VNPay refund recorded. Please process refund manually in VNPay portal.',
        }
    }

    async getTransactions(currentUser, filters = {}) {
        const page = parseInt(filters.page, 10) || PAGINATION.DEFAULT_PAGE
        const limit = Math.min(
            parseInt(filters.limit, 10) || PAGINATION.DEFAULT_LIMIT,
            100
        )
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
            throw new Error(
                'You do not have permission to view this transaction'
            )
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

        const normalizedSignaturePayload =
            normalizeSignaturePayload(signaturePayload)

        const signatureKeys =
            source === 'callback'
                ? CALLBACK_SIGNATURE_KEYS
                : WEBHOOK_SIGNATURE_KEYS
        const signatureInput = buildSignatureInput(
            normalizedSignaturePayload,
            signatureKeys
        )
        signatureInput.accessKey =
            signatureInput.accessKey || String(momoConfig.accessKey || '')

        if (!verifySignature(signatureInput, signature, signatureKeys)) {
            throw new Error('Invalid MoMo signature')
        }

        if (signatureInput.partnerCode !== momoConfig.partnerCode) {
            throw new Error(
                'Partner code does not match configured MoMo partner'
            )
        }

        const orderCode = normalizedSignaturePayload.orderId
        const amount = normalizeAmount(normalizedSignaturePayload.amount)
        const resultCode = parseInt(signatureInput.resultCode, 10)
        const transactionId = normalizedSignaturePayload.transId
            ? String(normalizedSignaturePayload.transId)
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
                        gatewayResponse: normalizedSignaturePayload,
                        errorMessage: success
                            ? null
                            : normalizedSignaturePayload.message || null,
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
                        gatewayResponse: normalizedSignaturePayload,
                        errorMessage: success
                            ? null
                            : normalizedSignaturePayload.message || null,
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
                extraData: decodeExtraData(
                    normalizedSignaturePayload.extraData
                ),
                raw: normalizedSignaturePayload,
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
                include: {
                    course: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                    user: {
                        select: {
                            id: true,
                        },
                    },
                },
            })
        }

        logger.warn(
            `MoMo payment failed for order ${order.orderCode}. resultCode=${resultCode}, message=${normalizedSignaturePayload.message}`
        )

        // Create notification for payment failed
        const failedOrder = await prisma.order.findUnique({
            where: { id: order.id },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                    },
                },
            },
        })

        if (failedOrder && failedOrder.course && failedOrder.user) {
            await notificationsService.notifyPaymentFailed(
                failedOrder.user.id,
                failedOrder.id,
                failedOrder.courseId,
                failedOrder.course.title,
                normalizedSignaturePayload.message ||
                    'Thanh toán không thành công'
            )
        }

        return {
            order: {
                id: order.id,
                orderCode: order.orderCode,
                paymentStatus: PAYMENT_STATUS.FAILED,
            },
            paymentTransaction: transactionRecord,
            resultCode,
            message: normalizedSignaturePayload.message,
        }
    }

    /**
     * Private method to process VNPay payment result (both IPN webhook and Return URL callback)
     * @param {Object} query - Raw query parameters from VNPay (GET request)
     * @param {String} source - 'ipn' (webhook) or 'callback' (return URL)
     * @returns {Object} Response data depending on source and payment status
     */
    async #processVNPayResult(query, source) {
        // Ensure VNPay config is loaded (tmnCode, hashSecret, returnUrl, etc.)
        ensureVNPayConfig()

        // Clone query params to avoid mutating original object
        const vnpParams = { ...query }
        const secureHash = vnpParams.vnp_SecureHash

        // Remove signature fields before verification (they are not part of signed data)
        delete vnpParams.vnp_SecureHash
        delete vnpParams.vnp_SecureHashType

        // Verify HMAC SHA512 signature using sorted params and secret key
        const isValid = verifyVNPaySignature(
            vnpParams,
            secureHash,
            vnpayConfig.hashSecret
        )

        // If signature is invalid → reject immediately (security check)
        if (!isValid) {
            logger.error(`VNPay signature verification failed for ${source}`, {
                receivedHash: secureHash,
                params: vnpParams,
            })
            throw new Error('Invalid VNPay signature')
        }

        // Extract key transaction details from VNPay response
        const txnRef = vnpParams.vnp_TxnRef // Merchant's transaction reference
        const responseCode = vnpParams.vnp_ResponseCode // VNPay response code (00 = success)
        const transactionNo = vnpParams.vnp_TransactionNo // VNPay's internal transaction ID
        const transactionId = txnRef
        const amount = parseInt(vnpParams.vnp_Amount) / 100 // Convert from "cents" (x100) back to VND

        // Extract order code from txnRef (assumed format: ORD-xxx-xxx-timestamp)
        const orderCode = txnRef

        // Fetch order from DB using orderCode, include related VNPay transactions
        const order = await prisma.order.findUnique({
            where: { orderCode },
            include: {
                paymentTransactions: {
                    where: {
                        paymentGateway: PAYMENT_GATEWAY.VNPAY,
                        transactionId: txnRef,
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        })

        // If order not found → invalid request
        if (!order) {
            throw new Error('Order not found for the provided VNPay callback')
        }

        // Validate payment amount matches expected order price
        const expectedAmount = normalizeAmount(order.finalPrice)
        if (amount !== expectedAmount) {
            throw new Error(
                `Payment amount mismatch. Expected ${expectedAmount}, received ${amount}`
            )
        }

        // ===== IDempotency: Prevent duplicate processing (critical for IPN) =====
        if (order.paymentStatus === PAYMENT_STATUS.PAID) {
            logger.info(`VNPay ${source}: Order ${orderCode} already processed`)

            // IPN: Return minimal success response to stop VNPay retries
            if (source === 'ipn') {
                return {
                    RspCode: '00',
                    Message: 'Confirm Success',
                }
            }

            // Callback: Return full details for frontend display
            return {
                order: {
                    id: order.id,
                    orderCode: order.orderCode,
                    paymentStatus: order.paymentStatus,
                },
                paymentTransaction: order.paymentTransactions[0],
                alreadyPaid: true,
                responseCode,
                message: getResponseMessage(responseCode),
            }
        }

        // Determine if payment was successful (responseCode '00')
        const success = responseCode === '00'

        // Find existing transaction record by VNPay transaction ID
        let transactionRecord = await prisma.paymentTransaction.findUnique({
            where: { transactionId: transactionId },
        })

        // Update existing transaction or create new one
        if (transactionRecord) {
            transactionRecord = await prisma.paymentTransaction.update({
                where: { id: transactionRecord.id },
                data: {
                    status: success
                        ? TRANSACTION_STATUS.SUCCESS
                        : TRANSACTION_STATUS.FAILED,
                    gatewayResponse: {
                        vnpParams,
                        vnp_TransactionNo: transactionNo, // Save VNPay's internal ID for reference
                    },
                    errorMessage: success
                        ? null
                        : getResponseMessage(responseCode),
                },
            })
        } else {
            transactionRecord = await prisma.paymentTransaction.create({
                data: {
                    orderId: order.id,
                    transactionId,
                    paymentGateway: PAYMENT_GATEWAY.VNPAY,
                    amount: toDecimal(amount),
                    currency: 'VND',
                    status: success
                        ? TRANSACTION_STATUS.SUCCESS
                        : TRANSACTION_STATUS.FAILED,
                    gatewayResponse: vnpParams,
                    errorMessage: success
                        ? null
                        : getResponseMessage(responseCode),
                },
            })
        }

        // ===== SUCCESS PATH =====
        if (success) {
            // Prepare metadata to pass to order update service
            const paymentData = {
                gateway: PAYMENT_GATEWAY.VNPAY,
                source,
                transactionNo, // VNPay's internal ID (for reference)
                responseCode,
                raw: vnpParams,
            }

            // Update order status to PAID (idempotent - safe to call multiple times)
            // This ensures email is sent even if IPN webhook is not configured
            // updateOrderToPaid has built-in idempotency check (won't process if already PAID)
            let updateResult = { alreadyPaid: true }
            if (order.paymentStatus !== PAYMENT_STATUS.PAID) {
                updateResult = await ordersService.updateOrderToPaid(
                    order.id,
                    transactionNo || txnRef, // Use VNPay's transactionNo for display purposes
                    paymentData
                )
            } else {
                // Order already paid, fetch full order details for response
                const fullOrder = await prisma.order.findUnique({
                    where: { id: order.id },
                    include: {
                        course: {
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                                thumbnailUrl: true,
                                instructor: {
                                    select: {
                                        id: true,
                                        fullName: true,
                                    },
                                },
                            },
                        },
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                            },
                        },
                    },
                })
                updateResult = {
                    order: fullOrder,
                    enrollment: null,
                    alreadyPaid: true,
                }
            }

            logger.info(
                `VNPay payment success processed for order ${order.orderCode} (source: ${source})`
            )

            // IPN: Return minimal JSON to acknowledge receipt and stop retries
            if (source === 'ipn') {
                return {
                    RspCode: '00',
                    Message: 'Confirm Success',
                }
            }

            // Callback: Return full data for frontend (order, enrollment, etc.)
            // Order Successfully
            return {
                order: updateResult.order,
                enrollment: updateResult.enrollment,
                paymentTransaction: transactionRecord,
                alreadyPaid: updateResult.alreadyPaid || false,
                responseCode,
                message: getResponseMessage(responseCode),
            }
        }

        // ===== FAILURE PATH =====
        // Only update order to FAILED if it's still PENDING and this is IPN
        if (
            order.paymentStatus === PAYMENT_STATUS.PENDING &&
            source === 'ipn'
        ) {
            await prisma.order.update({
                where: { id: order.id },
                data: { paymentStatus: PAYMENT_STATUS.FAILED },
            })
        }

        logger.warn(
            `VNPay payment failed for order ${order.orderCode}. ResponseCode=${responseCode} (source: ${source})`
        )

        // IPN: Even on failure, return success code to confirm receipt
        if (source === 'ipn') {
            return {
                RspCode: '00',
                Message: 'Confirm Success',
            }
        }

        // Callback: Return failure details to frontend
        // Cancel Order
        return {
            order: {
                id: order.id,
                orderCode: order.orderCode,
                paymentStatus: PAYMENT_STATUS.FAILED,
            },
            paymentTransaction: transactionRecord,
            responseCode,
            message: getResponseMessage(responseCode),
        }
    }
}

const paymentService = new PaymentService()

export default paymentService
export { normalizeSignaturePayload, buildSignatureInput }
