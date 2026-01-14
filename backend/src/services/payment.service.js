import { Prisma } from '@prisma/client'
import dayjs from 'dayjs'
import {
    PAYMENT_GATEWAY,
    PAYMENT_STATUS,
    TRANSACTION_STATUS,
    USER_ROLES,
    PAGINATION,
    HTTP_STATUS,
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
    formatExpireDate,
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
import notificationsService from './notifications.service.js'

const ensureMoMoConfig = () => {
    if (
        !momoConfig.partnerCode ||
        !momoConfig.accessKey ||
        !momoConfig.secretKey
    ) {
        throw new Error(
            'Thiếu cấu hình MoMo. Vui lòng thiết lập MOMO_PARTNER_CODE, MOMO_ACCESS_KEY và MOMO_SECRET_KEY'
        )
    }
    if (!momoConfig.returnUrl || !momoConfig.notifyUrl) {
        throw new Error(
            'Thiếu cấu hình MoMo return hoặc notify URL. Vui lòng thiết lập MOMO_RETURN_URL và MOMO_NOTIFY_URL'
        )
    }
}

const ensureVNPayConfig = () => {
    if (!vnpayConfig.tmnCode || !vnpayConfig.hashSecret) {
        throw new Error(
            'Thiếu cấu hình VNPay. Vui lòng thiết lập VNPAY_TMN_CODE và VNPAY_HASH_SECRET'
        )
    }
    if (!vnpayConfig.returnUrl) {
        throw new Error(
            'Thiếu cấu hình VNPay return URL. Vui lòng thiết lập VNPAY_RETURN_URL'
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

const extractRawQueryString = (rawUrlOrQuery) => {
    if (!rawUrlOrQuery || typeof rawUrlOrQuery !== 'string') {
        return ''
    }

    const questionMarkIndex = rawUrlOrQuery.indexOf('?')
    if (questionMarkIndex === -1) {
        return rawUrlOrQuery.includes('=') ? rawUrlOrQuery : ''
    }

    return rawUrlOrQuery.slice(questionMarkIndex + 1)
}

const parseVNPayRawQuery = (rawUrlOrQuery) => {
    const rawQueryString = extractRawQueryString(rawUrlOrQuery)
    if (!rawQueryString) {
        return null
    }

    const entries = rawQueryString.split('&')
    if (!entries.length) {
        return null
    }

    return entries.reduce((acc, entry) => {
        if (!entry) {
            return acc
        }

        const [rawKey, ...rawValueParts] = entry.split('=')
        if (!rawKey) {
            return acc
        }

        const key = decodeURIComponent(rawKey)
        const rawValue = rawValueParts.length > 0 ? rawValueParts.join('=') : ''
        acc[key] = rawValue
        return acc
    }, {})
}

const buildRefundUnenrollmentReason = (orderCode, gateway) =>
    `Refund processed via ${gateway} for order ${orderCode}`

// MoMo result code to error message mapping
const MOMO_REFUND_ERROR_MESSAGES = {
    40: 'RequestId bị trùng. Vui lòng thử lại sau vài giây.',
    41: 'OrderId bị trùng. Vui lòng thử lại sau vài giây.',
    42: 'OrderId không hợp lệ hoặc không được tìm thấy.',
    43: 'Yêu cầu bị từ chối vì xung đột trong quá trình xử lý giao dịch. Vui lòng thử lại sau.',
    99: 'Giao dịch đang được xử lý bởi MoMo. Vui lòng đợi và thử lại sau vài giây.',
    1080: 'Giao dịch hoàn tiền đang được xử lý. Vui lòng thử lại sau một giờ.',
    1081: 'Giao dịch hoàn tiền bị từ chối. Giao dịch thanh toán ban đầu có thể đã được hoàn.',
    1088: 'Giao dịch hoàn tiền bị từ chối. Giao dịch thanh toán ban đầu không được hỗ trợ hoàn tiền.',
    7000: 'Giao dịch đang được xử lý. Vui lòng đợi và thử lại sau.',
    7002: 'Giao dịch đang được xử lý bởi nhà cung cấp. Vui lòng đợi và thử lại sau.',
}

// Result codes that can be retried (transient errors)
const RETRYABLE_RESULT_CODES = ['99', '7000', '7002', '1080']

const isRetryableError = (resultCode) => {
    if (resultCode === undefined || resultCode === null) {
        return false
    }
    return RETRYABLE_RESULT_CODES.includes(String(resultCode))
}

const getMoMoRefundErrorMessage = (resultCode) => {
    if (resultCode === undefined || resultCode === null) {
        return 'Lỗi không xác định. Vui lòng liên hệ MoMo để biết thêm chi tiết.'
    }
    const code = String(resultCode)
    return (
        MOMO_REFUND_ERROR_MESSAGES[code] ||
        `Lỗi không xác định (mã ${code}). Vui lòng liên hệ MoMo để biết thêm chi tiết.`
    )
}

// Sleep utility for delays
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const ERROR_MESSAGES = {
    supersededByNewRequest: (gateway) =>
        `${gateway} yêu cầu thanh toán đã bị thay thế bởi một yêu cầu mới hơn`,
    supersededBySuccess: (gateway) =>
        `${gateway} yêu cầu thanh toán đã bị thay thế bởi một thanh toán thành công`,
    paymentCreationFailed: (gateway, resultCode) =>
        `${gateway} thanh toán thất bại${
            resultCode !== undefined && resultCode !== null
                ? ` (resultCode: ${resultCode})`
                : ''
        }`,
    refundFailed: (gateway, resultCode) => {
        if (gateway === PAYMENT_GATEWAY.MOMO) {
            return getMoMoRefundErrorMessage(resultCode)
        }
        return `${gateway} hoàn tiền thất bại${
            resultCode !== undefined && resultCode !== null
                ? ` (resultCode: ${resultCode})`
                : ''
        }`
    },
}

const buildSignatureInput = (payload, keys) => {
    const toString = (value) =>
        value === undefined || value === null ? '' : String(value)

    return keys.reduce((acc, key) => {
        acc[key] = toString(payload[key])
        return acc
    }, {})
}

const generateTransactionId = (orderCode, gateway) =>
    `${orderCode}-${gateway}-${Date.now()}`

const parseTransactionId = (transactionId) => {
    if (!transactionId) {
        return { orderCode: null, gateway: null, timestamp: null }
    }

    const parts = transactionId.split('-')
    if (parts.length < 3) {
        return {
            orderCode: transactionId,
            gateway: null,
            timestamp: null,
        }
    }

    const timestamp = parts.pop()
    const gateway = parts.pop()
    const orderCode = parts.join('-')

    return { orderCode, gateway, timestamp }
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
            const error = new Error('Không tìm thấy đơn hàng')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }
        if (order.userId !== userId) {
            const error = new Error(
                'Bạn không được phép thanh toán cho đơn hàng này'
            )
            error.statusCode = HTTP_STATUS.FORBIDDEN
            throw error
        }
        if (order.paymentGateway !== PAYMENT_GATEWAY.VNPAY) {
            const error = new Error('Đơn hàng không được gán cho VNPay')
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }
        if (order.paymentStatus === PAYMENT_STATUS.PAID) {
            const error = new Error('Đơn hàng đã được thanh toán')
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }
        if (order.paymentStatus === PAYMENT_STATUS.REFUNDED) {
            const error = new Error('Đơn hàng đã được hoàn tiền')
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }
        if (order.paymentStatus !== PAYMENT_STATUS.PENDING) {
            const error = new Error(
                `Không thể thanh toán đơn hàng trong trạng thái ${order.paymentStatus}`
            )
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }

        const amount = normalizeAmount(order.finalPrice)
        if (amount <= 0) {
            const error = new Error('Giá trị thanh toán phải lớn hơn 0')
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }

        const existingTxn = order.paymentTransactions[0]
        if (existingTxn) {
            const savedParams = existingTxn.gatewayResponse || {}

            // Return existing transaction
            if (savedParams.vnp_SecureHash) {
                const payUrl =
                    vnpayConfig.apiUrl +
                    '?' +
                    qs.stringify(savedParams, { encode: false })

                logger.info(
                    `Reusing existing VNPay payment URL for order ${order.orderCode}`
                )

                return {
                    payUrl,
                    txnRef: existingTxn.transactionId,
                    message: 'URL thanh toán đã tồn tại',
                    order: {
                        id: order.id,
                        orderCode: order.orderCode,
                        finalPrice: amount,
                        paymentStatus: order.paymentStatus,
                    },
                    transaction: existingTxn,
                }
            }
        }

        const txnRef = generateTransactionId(
            order.orderCode,
            PAYMENT_GATEWAY.VNPAY
        )
        const createDate = new Date()
        const formattedCreateDate = formatDate(createDate)
        const formattedExpireDate = formatExpireDate(
            //*
            createDate,
            vnpayConfig.expirationMinutes
        )
        const rawTitle = (
            order.course?.title ||
            order.orderCode ||
            'Khoa hoc'
        ).trim()

        const orderInfo = `Thanh toan khoa hoc ${rawTitle}`
        const ipAddr = clientIp || '127.0.0.1'

        let vnpParams = {
            vnp_Version: vnpayConfig.version || '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: vnpayConfig.tmnCode,
            vnp_Amount: amount * 100,
            vnp_CurrCode: 'VND',
            vnp_TxnRef: txnRef,
            vnp_OrderInfo: orderInfo,
            vnp_OrderType: 'other',
            vnp_Locale: 'vn',
            vnp_ReturnUrl: vnpayConfig.returnUrl,
            vnp_IpAddr: ipAddr,
            vnp_CreateDate: formattedCreateDate,
            vnp_ExpireDate: formattedExpireDate,
        }

        const signed = createSignature(vnpParams, vnpayConfig.hashSecret)
        vnpParams = sortObject(vnpParams)
        vnpParams.vnp_SecureHash = signed

        const payUrl =
            vnpayConfig.apiUrl +
            '?' +
            qs.stringify(vnpParams, { encode: false })

        const transaction = await prisma.paymentTransaction.create({
            data: {
                orderId: order.id,
                transactionId: txnRef,
                paymentGateway: PAYMENT_GATEWAY.VNPAY,
                amount: toDecimal(amount),
                currency: 'VND',
                status: TRANSACTION_STATUS.PENDING,
                gatewayResponse: vnpParams, // Lưu toàn bộ params để tái sử dụng
                ipAddress: clientIp || null,
            },
        })

        logger.info(
            `New VNPay payment URL created for order ${order.orderCode}`
        )

        return {
            payUrl,
            txnRef,
            message: 'Tạo URL thanh toán VNPay mới thành công',
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
    async handleVNPayCallback(query, rawQueryString = '') {
        return this.#processVNPayResult(query, 'callback', rawQueryString)
    }

    /**
     * Handle VNPay IPN (webhook)
     */
    async handleVNPayWebhook(query, rawQueryString = '') {
        return this.#processVNPayResult(query, 'ipn', rawQueryString)
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
            const error = new Error('Không tìm thấy đơn hàng')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        if (order.userId !== userId) {
            const error = new Error(
                'Bạn không được phép thanh toán cho đơn hàng này'
            )
            error.statusCode = HTTP_STATUS.FORBIDDEN
            throw error
        }

        if (order.paymentGateway !== PAYMENT_GATEWAY.MOMO) {
            const error = new Error('Đơn hàng không được gán cho MoMo')
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }

        if (order.paymentStatus === PAYMENT_STATUS.PAID) {
            const error = new Error('Đơn hàng đã được thanh toán')
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }

        if (order.paymentStatus === PAYMENT_STATUS.REFUNDED) {
            const error = new Error('Đơn hàng đã được hoàn tiền')
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }

        if (order.paymentStatus !== PAYMENT_STATUS.PENDING) {
            const error = new Error(
                `Không thể thanh toán đơn hàng trong trạng thái ${order.paymentStatus}`
            )
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }

        const amount = normalizeAmount(order.finalPrice)

        if (amount <= 0) {
            throw new Error(
                'Giá trị thanh toán phải lớn hơn 0 để xử lý thanh toán'
            )
        }

        // Check if there's already a pending MoMo transaction for this order
        const existingPendingTransaction =
            await prisma.paymentTransaction.findFirst({
                where: {
                    orderId: order.id,
                    paymentGateway: PAYMENT_GATEWAY.MOMO,
                    status: TRANSACTION_STATUS.PENDING,
                },
                orderBy: { createdAt: 'desc' },
            })

        // If exists and still pending, return existing transaction
        if (existingPendingTransaction) {
            const gatewayResponse =
                existingPendingTransaction.gatewayResponse || {}
            logger.info(
                `Returning existing pending MoMo transaction for order ${order.orderCode}`
            )

            return {
                payUrl: gatewayResponse.payUrl || null,
                deeplink: gatewayResponse.deeplink || null,
                qrCodeUrl: gatewayResponse.qrCodeUrl || null,
                message: 'URL thanh toán đã tồn tại',
                resultCode: gatewayResponse.resultCode || 0,
                order: {
                    id: order.id,
                    orderCode: order.orderCode,
                    finalPrice: amount,
                    paymentStatus: order.paymentStatus,
                },
                transaction: existingPendingTransaction,
            }
        }

        const transactionId = generateTransactionId(
            order.orderCode,
            PAYMENT_GATEWAY.MOMO
        )
        const requestId = transactionId
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
                        transactionId,
                        paymentGateway: PAYMENT_GATEWAY.MOMO,
                        amount: toDecimal(amount),
                        currency: 'VND',
                        status: TRANSACTION_STATUS.FAILED,
                        gatewayResponse: responseBody,
                        errorMessage:
                            responseBody?.message ||
                            ERROR_MESSAGES.paymentCreationFailed(
                                PAYMENT_GATEWAY.MOMO,
                                responseBody?.resultCode
                            ),
                        ipAddress: clientIp || null,
                    },
                })

                throw new Error(
                    responseBody?.message || 'Không thể tạo URL thanh toán MoMo'
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
                transactionId,
                paymentGateway: PAYMENT_GATEWAY.MOMO,
                amount: toDecimal(amount),
                currency: 'VND',
                status: TRANSACTION_STATUS.PENDING,
                gatewayResponse: responseBody,
                ipAddress: clientIp || null,
            },
        })

        // Mark previous pending MoMo transactions as failed (exclude the new one)
        await prisma.paymentTransaction.updateMany({
            where: {
                orderId: order.id,
                paymentGateway: PAYMENT_GATEWAY.MOMO,
                status: TRANSACTION_STATUS.PENDING,
                id: { not: transaction.id },
            },
            data: {
                status: TRANSACTION_STATUS.FAILED,
                errorMessage: ERROR_MESSAGES.supersededByNewRequest(
                    PAYMENT_GATEWAY.MOMO
                ),
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
            throw new Error('IP không được phép cho webhook MoMo')
        }

        return this.#processMoMoResult(payload, 'webhook', ipAddress)
    }

    // ==================== Refund Methods ====================
    async refundOrder(orderId, adminUser, amountInput = null, reason = null) {
        if (adminUser.role !== USER_ROLES.ADMIN) {
            const error = new Error('Chỉ có quản trị viên mới có thể hoàn tiền')
            error.statusCode = HTTP_STATUS.FORBIDDEN
            throw error
        }

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
            const error = new Error('Không tìm thấy đơn hàng')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Allow refund for PAID, REFUND_PENDING, or REFUND_FAILED orders
        // REFUND_FAILED allows retry of failed refund attempts (especially for MoMo)
        if (
            order.paymentStatus !== PAYMENT_STATUS.PAID &&
            order.paymentStatus !== PAYMENT_STATUS.REFUND_PENDING &&
            order.paymentStatus !== PAYMENT_STATUS.REFUND_FAILED
        ) {
            const error = new Error(
                `Chỉ có thể hoàn tiền cho các đơn hàng ở trạng thái đã thanh toán, đang chờ hoàn tiền hoặc hoàn tiền thất bại. Trạng thái hiện tại: ${order.paymentStatus}`
            )
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }

        const successfulTransaction = order.paymentTransactions[0]

        if (!successfulTransaction || !successfulTransaction.transactionId) {
            const error = new Error(
                'Không tìm thấy giao dịch thành công để hoàn tiền cho đơn hàng này'
            )
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
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
            `Không hỗ trợ hoàn tiền cho phương thức thanh toán: ${order.paymentGateway}`
        )
    }

    async #unenrollUserFromCourse(order, reason = '') {
        if (!order?.userId || !order?.courseId) {
            logger.warn(
                `Cannot unenroll user – missing userId/courseId on order ${order?.id}`
            )
            return null
        }

        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: order.userId,
                    courseId: order.courseId,
                },
            },
        })

        if (!enrollment) {
            logger.warn(
                `No enrollment found to drop for user ${order.userId} and course ${order.courseId}`
            )
            return null
        }

        const [deletedEnrollment] = await prisma
            .$transaction([
                prisma.enrollment.delete({
                    where: { id: enrollment.id },
                }),
                prisma.course.update({
                    where: { id: order.courseId },
                    data: {
                        enrolledCount: {
                            decrement: 1,
                        },
                    },
                }),
            ])
            .catch((error) => {
                logger.warn(
                    `Failed to delete enrollment or adjust count for course ${order.courseId}: ${error.message}`
                )
                throw error
            })

        logger.info(
            `Enrollment for user ${order.userId} in course ${order.courseId} removed due to refund. ${
                reason || ''
            }`
        )

        return deletedEnrollment
    }

    async #refundMoMoOrder(
        order,
        successfulTransaction,
        adminUser,
        amountInput,
        reason,
        retryCount = 0,
        maxRetries = 2
    ) {
        ensureMoMoConfig()

        // Add small delay before refund to ensure transaction is fully processed by MoMo
        // This helps prevent resultCode 99 (unknown error) which often occurs when
        // refund is attempted too quickly after payment
        if (retryCount === 0) {
            const timeSincePayment = order.paidAt
                ? Date.now() - new Date(order.paidAt).getTime()
                : Infinity

            // If payment was made less than 5 seconds ago, wait a bit
            if (timeSincePayment < 5000) {
                await sleep(2000)
            }
        }

        const orderAmount = normalizeAmount(order.finalPrice)
        const existingRefundAmount = normalizeAmount(order.refundAmount)
        const remainingAmount = orderAmount - existingRefundAmount

        // Calculate requested amount - ensure it's a positive integer
        // Same logic as VNPay for consistency
        let requestedAmount = 0
        if (amountInput !== null && amountInput !== undefined) {
            const parsed = parseFloat(amountInput)
            if (isNaN(parsed) || parsed <= 0) {
                throw new Error('Giá trị hoàn tiền phải là một số nguyên dương')
            }
            requestedAmount = Math.round(parsed)
        } else {
            // Full refund - use remaining amount
            requestedAmount = Math.round(remainingAmount)
        }

        if (requestedAmount <= 0) {
            throw new Error('Giá trị hoàn tiền phải lớn hơn 0')
        }

        if (requestedAmount > remainingAmount) {
            throw new Error(
                `Giá trị hoàn tiền (${requestedAmount}) vượt quá giá trị thanh toán còn lại (${remainingAmount})`
            )
        }

        // MoMo requires amount to be a positive integer (no decimals)
        if (!Number.isInteger(requestedAmount) || requestedAmount < 1) {
            throw new Error(
                'Giá trị hoàn tiền phải là một số nguyên dương (yêu cầu của MoMo)'
            )
        }

        const timestamp = Date.now()
        // Add random component to ensure unique requestId even with rapid clicks
        const randomSuffix = Math.random().toString(36).substring(2, 9)
        const requestId = `refund-${order.orderCode}-${timestamp}-${randomSuffix}`
        const refundOrderId = `${order.orderCode}-refund-${timestamp}-${randomSuffix}`
        const refundTransactionId = generateTransactionId(
            order.orderCode,
            PAYMENT_GATEWAY.MOMO,
            `refund-${timestamp}`
        )
        const description =
            reason ||
            `Refund for order ${order.orderCode} by admin ${adminUser.id}`

        const gatewayTransId =
            successfulTransaction.gatewayResponse?.gatewayTransactionId ||
            successfulTransaction.gatewayResponse?.transId ||
            null

        if (!gatewayTransId) {
            throw new Error(
                'Thiếu ID giao dịch MoMo cho đơn hàng này. Không thể xử lý hoàn tiền.'
            )
        }

        // Ensure amount is a string representation of integer (MoMo requirement)
        const amountString = String(Math.floor(requestedAmount))

        const signaturePayload = {
            accessKey: momoConfig.accessKey,
            amount: amountString,
            description,
            orderId: refundOrderId,
            partnerCode: momoConfig.partnerCode,
            requestId,
            transId: gatewayTransId,
        }

        const payload = {
            partnerCode: momoConfig.partnerCode,
            partnerName: 'LMS AI Pay',
            storeId: momoConfig.partnerCode,
            accessKey: momoConfig.accessKey,
            requestId,
            orderId: refundOrderId,
            amount: amountString, // Must be integer string for MoMo
            transId: gatewayTransId,
            lang: 'vi',
            description,
            signature: sign(signaturePayload, REFUND_SIGNATURE_KEYS),
        }

        let responseBody = null
        try {
            // Add timeout to prevent hanging requests
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 seconds timeout

            const response = await fetch(momoConfig.refundEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal,
            })

            clearTimeout(timeoutId)

            // Parse response body with error handling
            try {
                const responseText = await response.text()
                responseBody = responseText ? JSON.parse(responseText) : null
            } catch (parseError) {
                logger.error(
                    'Failed to parse MoMo response as JSON:',
                    parseError
                )
                throw new Error(
                    'API MoMo trả về kết quả không hợp lệ. Vui lòng thử lại.'
                )
            }

            // Check resultCode (can be number 0 or string "0" for success)
            const resultCode = responseBody?.resultCode
            const isSuccess =
                resultCode === 0 ||
                resultCode === '0' ||
                resultCode === '00' ||
                resultCode === null ||
                resultCode === undefined

            if (!response.ok || (responseBody && !isSuccess)) {
                await prisma.$transaction(async (tx) => {
                    // Convert transId to string if it exists (Prisma requirement)
                    const failedTransactionId = responseBody?.transId
                        ? String(responseBody.transId)
                        : requestId

                    await tx.paymentTransaction.create({
                        data: {
                            orderId: order.id,
                            paymentGateway: PAYMENT_GATEWAY.MOMO,
                            transactionId: failedTransactionId,
                            amount: toDecimal(requestedAmount),
                            currency: 'VND',
                            status: TRANSACTION_STATUS.FAILED,
                            gatewayResponse: responseBody,
                            errorMessage:
                                responseBody?.message ||
                                ERROR_MESSAGES.refundFailed(
                                    PAYMENT_GATEWAY.MOMO,
                                    responseBody?.resultCode
                                ),
                        },
                    })

                    // Update order status to REFUND_FAILED
                    await tx.order.update({
                        where: { id: order.id },
                        data: {
                            paymentStatus: PAYMENT_STATUS.REFUND_FAILED,
                        },
                    })
                })

                // Check if error is retryable (resultCode 99, 7000, 7002, 1080)
                const resultCode = responseBody?.resultCode
                if (retryCount < maxRetries && isRetryableError(resultCode)) {
                    const retryDelay = Math.min(
                        1000 * Math.pow(2, retryCount),
                        5000
                    ) // Exponential backoff, max 5s
                    logger.warn(
                        `MoMo refund failed with retryable error (resultCode: ${resultCode}). Retrying in ${retryDelay}ms... (Attempt ${retryCount + 1}/${maxRetries})`
                    )
                    await sleep(retryDelay)

                    // Retry with new requestId to avoid duplicate
                    return this.#refundMoMoOrder(
                        order,
                        successfulTransaction,
                        adminUser,
                        amountInput,
                        reason,
                        retryCount + 1,
                        maxRetries
                    )
                }

                // Use mapped error message based on resultCode (prioritize resultCode mapping)
                // Only use responseBody.message if resultCode mapping doesn't exist
                let errorMessage = getMoMoRefundErrorMessage(resultCode)
                // If the mapped message is generic and we have a specific message from MoMo, use it
                if (
                    errorMessage.includes('Lỗi không xác định') &&
                    responseBody?.message &&
                    !responseBody.message.includes('Lỗi không xác định')
                ) {
                    errorMessage = responseBody.message
                }
                throw new Error(errorMessage)
            }
        } catch (error) {
            // Check if it's a timeout or network error
            if (error.name === 'AbortError') {
                logger.error('MoMo refund request timed out after 30 seconds')
            } else if (error.message?.includes('fetch')) {
                logger.error('Network error when calling MoMo API')
            }

            // Only update order status to REFUND_FAILED if it's still REFUND_PENDING
            // This prevents overwriting status if another request already updated it
            try {
                const currentOrder = await prisma.order.findUnique({
                    where: { id: order.id },
                    select: { paymentStatus: true },
                })

                if (
                    currentOrder?.paymentStatus ===
                    PAYMENT_STATUS.REFUND_PENDING
                ) {
                    await prisma.order.update({
                        where: { id: order.id },
                        data: {
                            paymentStatus: PAYMENT_STATUS.REFUND_FAILED,
                        },
                    })
                }
            } catch (updateError) {
                logger.error(
                    `Failed to update order status to REFUND_FAILED: ${updateError.message}`
                )
            }

            // Provide more specific error message
            let errorMessage = 'Failed to process MoMo refund'
            if (error.name === 'AbortError') {
                errorMessage =
                    'Yêu cầu hoàn tiền MoMo đã hết thời gian sau 30 giây. Vui lòng thử lại. Yêu cầu có thể đang được xử lý trên phía MoMo.'
            } else if (responseBody?.resultCode !== undefined) {
                // Prioritize resultCode mapping
                errorMessage = getMoMoRefundErrorMessage(
                    responseBody.resultCode
                )
                // If the mapped message is generic and we have a specific message from MoMo, use it
                if (
                    errorMessage.includes('Lỗi không xác định') &&
                    responseBody?.message &&
                    !responseBody.message.includes('Lỗi không xác định')
                ) {
                    errorMessage = responseBody.message
                }
            } else if (responseBody?.message) {
                errorMessage = responseBody.message
            } else if (error.message) {
                errorMessage = error.message
            }

            const refundError = new Error(errorMessage)
            refundError.statusCode = HTTP_STATUS.BAD_REQUEST
            throw refundError
        }

        const newRefundTotal = existingRefundAmount + requestedAmount
        const isFullRefund = newRefundTotal >= orderAmount
        const newStatus = isFullRefund
            ? PAYMENT_STATUS.REFUNDED
            : PAYMENT_STATUS.PARTIALLY_REFUNDED

        const result = await prisma.$transaction(async (tx) => {
            const gatewayRefundTransId =
                responseBody?.transId?.toString() || null
            const transactionRecord = await tx.paymentTransaction.create({
                data: {
                    orderId: order.id,
                    paymentGateway: PAYMENT_GATEWAY.MOMO,
                    transactionId: refundTransactionId,
                    amount: toDecimal(requestedAmount),
                    currency: 'VND',
                    status: TRANSACTION_STATUS.REFUNDED,
                    gatewayResponse: {
                        ...responseBody,
                        gatewayTransactionId:
                            gatewayRefundTransId || gatewayTransId,
                        adminId: adminUser.id,
                        adminEmail: adminUser.email || null,
                        reason: description,
                    },
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

        let unenrollment = null
        if (isFullRefund) {
            unenrollment = await this.#unenrollUserFromCourse(
                order,
                buildRefundUnenrollmentReason(
                    order.orderCode,
                    PAYMENT_GATEWAY.MOMO
                )
            )
        }

        return {
            order: result.updatedOrder,
            refundTransaction: result.transactionRecord,
            gatewayResponse: responseBody,
            message: isFullRefund
                ? 'Hoàn tiền MoMo toàn phần thành công'
                : 'Hoàn tiền MoMo một phần thành công',
            requiresManualAction: false,
            unenrollment,
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
            throw new Error('Giá trị hoàn tiền phải lớn hơn 0')
        }

        if (requestedAmount > orderAmount - existingRefundAmount) {
            throw new Error(
                'Giá trị hoàn tiền vượt quá giá trị thanh toán còn lại'
            )
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
                        adminEmail: adminUser.email || null,
                        refundDate: new Date().toISOString(),
                        requiresManualProcessing: true,
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

        let unenrollment = null
        if (isFullRefund) {
            unenrollment = await this.#unenrollUserFromCourse(
                order,
                buildRefundUnenrollmentReason(
                    order.orderCode,
                    PAYMENT_GATEWAY.VNPAY
                )
            )
        }

        return {
            order: result.updatedOrder,
            refundTransaction: result.transactionRecord,
            message:
                'Hoàn tiền VNPay đã được ghi nhận. Vui lòng xử lý hoàn tiền bằng cách thủ công trên cổng VNPay.',
            requiresManualAction: true,
            unenrollment,
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

        // Search by transactionId (partial match)
        if (filters.transactionId) {
            whereClause.transactionId = {
                contains: filters.transactionId,
                mode: 'insensitive',
            }
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
            throw new Error('Không tìm thấy giao dịch')
        }

        if (
            currentUser.role !== USER_ROLES.ADMIN &&
            transaction.order.userId !== currentUser.id
        ) {
            throw new Error('Bạn không có quyền xem giao dịch này')
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
            throw new Error('Chữ ký MoMo không hợp lệ')
        }

        if (signatureInput.partnerCode !== momoConfig.partnerCode) {
            throw new Error(
                'Mã đối tác không khớp với đối tác MoMo được cấu hình'
            )
        }

        const orderCode = normalizedSignaturePayload.orderId
        const amount = normalizeAmount(normalizedSignaturePayload.amount)
        const resultCode = parseInt(signatureInput.resultCode, 10)
        const gatewayTransactionId = normalizedSignaturePayload.transId
            ? String(normalizedSignaturePayload.transId)
            : null
        const requestId = normalizedSignaturePayload.requestId
            ? String(normalizedSignaturePayload.requestId)
            : null

        const resolvedTransactionId =
            requestId || gatewayTransactionId || `momo-${orderCode}`

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
            throw new Error('Không tìm thấy đơn hàng cho callback MoMo')
        }

        const expectedAmount = normalizeAmount(order.finalPrice)

        if (amount !== expectedAmount) {
            throw new Error(
                `Giá trị thanh toán không khớp. Dự kiến ${expectedAmount}, nhận được ${amount}`
            )
        }

        const success = resultCode === 0

        let transactionRecord = null

        await prisma.$transaction(async (tx) => {
            if (resolvedTransactionId) {
                transactionRecord = await tx.paymentTransaction.findUnique({
                    where: { transactionId: resolvedTransactionId },
                })
            }
            if (
                !transactionRecord &&
                gatewayTransactionId &&
                gatewayTransactionId !== resolvedTransactionId
            ) {
                transactionRecord = await tx.paymentTransaction.findUnique({
                    where: { transactionId: gatewayTransactionId },
                })
            }
            if (!transactionRecord) {
                transactionRecord = await tx.paymentTransaction.findFirst({
                    where: {
                        orderId: order.id,
                        paymentGateway: PAYMENT_GATEWAY.MOMO,
                        status: TRANSACTION_STATUS.PENDING,
                    },
                    orderBy: { createdAt: 'desc' },
                })
            }

            const transactionData = {
                transactionId: resolvedTransactionId,
                status: success
                    ? TRANSACTION_STATUS.SUCCESS
                    : TRANSACTION_STATUS.FAILED,
                gatewayResponse: {
                    ...normalizedSignaturePayload,
                    gatewayTransactionId,
                },
                errorMessage: success
                    ? null
                    : normalizedSignaturePayload.message || null,
                ipAddress: ipAddress || transactionRecord?.ipAddress || null,
                amount: toDecimal(amount),
                paymentGateway: PAYMENT_GATEWAY.MOMO,
                currency: 'VND',
                orderId: order.id,
            }

            if (transactionRecord) {
                transactionRecord = await tx.paymentTransaction.update({
                    where: { id: transactionRecord.id },
                    data: transactionData,
                })
            } else {
                transactionRecord = await tx.paymentTransaction.create({
                    data: transactionData,
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
                        errorMessage: ERROR_MESSAGES.supersededBySuccess(
                            PAYMENT_GATEWAY.MOMO
                        ),
                    },
                })
            }
        })

        if (success) {
            const processedTransId =
                gatewayTransactionId || transactionRecord.transactionId
            const paymentData = {
                gateway: PAYMENT_GATEWAY.MOMO,
                source,
                transId: processedTransId,
                extraData: decodeExtraData(
                    normalizedSignaturePayload.extraData
                ),
                raw: normalizedSignaturePayload,
            }

            const updateResult = await ordersService.updateOrderToPaid(
                order.id,
                processedTransId,
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
    async #processVNPayResult(query, source, rawQuerySource = '') {
        // Ensure VNPay config is loaded (tmnCode, hashSecret, returnUrl, etc.)
        ensureVNPayConfig()

        // Clone query params to avoid mutating original object
        const vnpParams = { ...query }
        const rawQueryParams = parseVNPayRawQuery(rawQuerySource)
        const secureHash = vnpParams.vnp_SecureHash

        // Remove signature fields before verification (they are not part of signed data)
        delete vnpParams.vnp_SecureHash
        delete vnpParams.vnp_SecureHashType
        if (rawQueryParams) {
            delete rawQueryParams.vnp_SecureHash
            delete rawQueryParams.vnp_SecureHashType
        }

        // Verify HMAC SHA512 signature using sorted params and secret key
        const isValid = verifyVNPaySignature(
            vnpParams,
            secureHash,
            vnpayConfig.hashSecret,
            rawQueryParams
        )

        // If signature is invalid → reject immediately (security check)
        if (!isValid) {
            logger.error(`VNPay signature verification failed for ${source}`, {
                receivedHash: secureHash,
                params: vnpParams,
            })
            throw new Error('Chữ ký VNPay không hợp lệ')
        }

        // Extract key transaction details from VNPay response
        const txnRef = vnpParams.vnp_TxnRef // Merchant's transaction reference
        const responseCode = vnpParams.vnp_ResponseCode // VNPay response code (00 = success)
        const transactionNo = vnpParams.vnp_TransactionNo // VNPay's internal transaction ID
        const transactionId = txnRef
        const amount = parseInt(vnpParams.vnp_Amount) / 100 // Convert from "cents" (x100) back to VND

        const { orderCode: parsedOrderCode } = parseTransactionId(txnRef)
        const orderCode = parsedOrderCode || txnRef

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
                    take: 1,
                },
            },
        })

        // If order not found → invalid request
        if (!order) {
            throw new Error('Không tìm thấy đơn hàng cho callback VNPay')
        }

        // Validate payment amount matches expected order price
        const expectedAmount = normalizeAmount(order.finalPrice)
        if (amount !== expectedAmount) {
            throw new Error(
                `Giá trị thanh toán không khớp. Dự kiến ${expectedAmount}, nhận được ${amount}`
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

        let transactionRecord = null

        await prisma.$transaction(async (tx) => {
            transactionRecord = await tx.paymentTransaction.findUnique({
                where: { transactionId },
            })

            if (!transactionRecord) {
                throw new Error(`Không tìm thấy giao dịch ${transactionId}`)
            }

            const transactionData = {
                status: success
                    ? TRANSACTION_STATUS.SUCCESS
                    : TRANSACTION_STATUS.FAILED,
                gatewayResponse: {
                    ...vnpParams,
                    vnp_TransactionNo: transactionNo,
                },
                errorMessage: success ? null : getResponseMessage(responseCode),
            }

            transactionRecord = await tx.paymentTransaction.update({
                where: { id: transactionRecord.id },
                data: transactionData,
            })
        })

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
        if (order.paymentStatus === PAYMENT_STATUS.PENDING) {
            await prisma.order.update({
                where: { id: order.id },
                data: { paymentStatus: PAYMENT_STATUS.FAILED },
            })

            logger.info(
                `VNPay payment failed for order ${order.orderCode}. ResponseCode=${responseCode} - Order marked as FAILED`
            )
        }

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
                getResponseMessage(responseCode)
            )
        }

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
