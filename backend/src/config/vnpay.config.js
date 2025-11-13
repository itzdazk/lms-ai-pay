// backend/src/config/vnpay.config.js
import crypto from 'crypto'
import config from './app.config.js'
import qs from 'qs'

const vnpayConfig = {
    tmnCode: config.VNPAY_TMN_CODE,
    hashSecret: config.VNPAY_HASH_SECRET,
    apiUrl:
        config.VNPAY_URL ||
        'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    returnUrl: config.VNPAY_RETURN_URL,
    version: '2.1.0',
    command: 'pay',
    currCode: 'VND',
    locale: 'vn',
}

/**
 * Sort object by key (ascending)
 * @param {Object} obj - Object to sort
 * @returns {Object} Sorted object
 */
function sortObject(obj) {
    let sorted = {}
    let str = []
    let key
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key))
        }
    }
    str.sort()
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(
            /%20/g,
            '+'
        )
    }
    return sorted
}
/**
 * Create VNPay signature (HMAC SHA512)
 * Theo tài liệu VNPay: dùng querystring.stringify với { encode: false }
 * @param {Object} params - Payment parameters
 * @param {string} secretKey - Hash secret key
 * @returns {string} Signature
 */
const createSignature = (params, secretKey) => {
    const vnpParams = sortObject(params)
    const signData = qs.stringify(vnpParams, { encode: false })
    const hmac = crypto.createHmac('sha512', secretKey)
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex')
    return signed
}

/**
 * Verify VNPay signature
 * @param {Object} params - Callback parameters
 * @param {string} secureHash - Signature from VNPay
 * @param {string} secretKey - Hash secret key
 * @returns {boolean} Is valid
 */
const verifySignature = (params, secureHash, secretKey) => {
    const vnpParams = sortObject(params)
    const signData = qs.stringify(vnpParams, { encode: false })
    const hmac = crypto.createHmac('sha512', secretKey)
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex')
    return signed === secureHash
}

/**
 * Format date for VNPay (yyyyMMddHHmmss)
 * @param {Date} date - Date object
 * @returns {string} Formatted date
 */
const formatDate = (date) => {
    const d = date || new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')

    return `${year}${month}${day}${hours}${minutes}${seconds}`
}

/**
 * Parse VNPay date format (yyyyMMddHHmmss)
 * @param {string} dateString - Date string
 * @returns {Date} Date object
 */
const parseDate = (dateString) => {
    if (!dateString || dateString.length !== 14) {
        return null
    }

    const year = parseInt(dateString.substring(0, 4))
    const month = parseInt(dateString.substring(4, 6)) - 1
    const day = parseInt(dateString.substring(6, 8))
    const hours = parseInt(dateString.substring(8, 10))
    const minutes = parseInt(dateString.substring(10, 12))
    const seconds = parseInt(dateString.substring(12, 14))

    return new Date(year, month, day, hours, minutes, seconds)
}

/**
 * Get VNPay response message by code
 * @param {string} responseCode - Response code
 * @returns {string} Response message
 */
const getResponseMessage = (responseCode) => {
    const messages = {
        '00': 'Giao dịch thành công',
        '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
        '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
        10: 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
        11: 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
        12: 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
        13: 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.',
        24: 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
        51: 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
        65: 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
        75: 'Ngân hàng thanh toán đang bảo trì.',
        79: 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch',
        99: 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)',
    }

    return messages[responseCode] || 'Lỗi không xác định'
}

/**
 * Normalize amount to integer (VNPay requires integer amount)
 * @param {number|string|Decimal} value - Amount value
 * @returns {number} Integer amount
 */
const normalizeAmount = (value) => {
    if (value === null || value === undefined) {
        return 0
    }
    const numeric =
        typeof value === 'object' && value !== null ? value.toString() : value
    return Math.round(parseFloat(numeric) || 0)
}

export {
    vnpayConfig,
    createSignature,
    verifySignature,
    sortObject,
    formatDate,
    parseDate,
    getResponseMessage,
    normalizeAmount,
}
