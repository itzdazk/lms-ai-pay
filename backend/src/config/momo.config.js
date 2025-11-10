import crypto from 'crypto'
import config from './app.config.js'

const DEFAULT_CAPTURE_REQUEST_TYPE = 'captureWallet'
const DEFAULT_REFUND_REQUEST_TYPE = 'refundMoMoWallet'

const momoConfig = {
    partnerCode: config.MOMO_PARTNER_CODE,
    accessKey: config.MOMO_ACCESS_KEY,
    secretKey: config.MOMO_SECRET_KEY,
    endpoint: config.MOMO_ENDPOINT,
    refundEndpoint: config.MOMO_REFUND_ENDPOINT,
    returnUrl: config.MOMO_RETURN_URL,
    notifyUrl: config.MOMO_NOTIFY_URL,
    captureRequestType: DEFAULT_CAPTURE_REQUEST_TYPE,
    refundRequestType: DEFAULT_REFUND_REQUEST_TYPE,
    allowedIps: config.MOMO_IP_WHITELIST
        ? config.MOMO_IP_WHITELIST.split(',').map((ip) => ip.trim()).filter(Boolean)
        : [],
}

const CREATE_SIGNATURE_KEYS = [
    'accessKey',
    'amount',
    'extraData',
    'ipnUrl',
    'orderId',
    'orderInfo',
    'partnerCode',
    'redirectUrl',
    'requestId',
    'requestType',
]

const CALLBACK_SIGNATURE_KEYS = [
    'accessKey',
    'amount',
    'extraData',
    'message',
    'orderId',
    'orderInfo',
    'orderType',
    'partnerCode',
    'payType',
    'requestId',
    'responseTime',
    'resultCode',
    'transId',
]

const WEBHOOK_SIGNATURE_KEYS = [
    'accessKey',
    'amount',
    'extraData',
    'message',
    'orderId',
    'orderInfo',
    'orderType',
    'partnerCode',
    'responseTime',
    'resultCode',
    'transId',
]

const REFUND_SIGNATURE_KEYS = [
    'accessKey',
    'amount',
    'description',
    'orderId',
    'partnerCode',
    'requestId',
    'transId',
]

const buildRawSignature = (payload, keys) =>
    keys
        .map((key) => `${key}=${payload[key] !== undefined ? payload[key] : ''}`)
        .join('&')

const sign = (payload, keys) => {
    const rawSignature = buildRawSignature(payload, keys)
    return crypto
        .createHmac('sha256', momoConfig.secretKey || '')
        .update(rawSignature)
        .digest('hex')
}

const verifySignature = (payload, signature, keys) => {
    if (!signature) {
        return false
    }
    const expectedSignature = sign(payload, keys)
    return expectedSignature === signature
}

const isIpAllowed = (ipAddress) => {
    if (!momoConfig.allowedIps.length) {
        return true
    }

    if (!ipAddress) {
        return false
    }

    const normalizedIp = ipAddress.startsWith('::ffff:')
        ? ipAddress.replace('::ffff:', '')
        : ipAddress

    return momoConfig.allowedIps.includes(normalizedIp)
}

export {
    momoConfig,
    CREATE_SIGNATURE_KEYS,
    CALLBACK_SIGNATURE_KEYS,
    WEBHOOK_SIGNATURE_KEYS,
    REFUND_SIGNATURE_KEYS,
    buildRawSignature,
    sign,
    verifySignature,
    isIpAllowed,
}


