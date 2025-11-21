import paymentService from '../services/payment.service.js'
import ApiResponse from '../utils/response.util.js'
import { asyncHandler } from '../middlewares/error.middleware.js'
import logger from '../config/logger.config.js'

class PaymentsController {
    // ==================== MoMo Methods ====================
    createMoMoPayment = asyncHandler(async (req, res) => {
        const { orderId } = req.body
        const result = await paymentService.createMoMoPayment(
            req.user.id,
            parseInt(orderId, 10),
            req.ip
        )

        return ApiResponse.created(
            res,
            result,
            'MoMo payment URL created successfully'
        )
    })

    momoCallback = asyncHandler(async (req, res) => {
        const payload = Object.keys(req.body || {}).length
            ? req.body
            : req.query

        const result = await paymentService.handleMoMoCallback(payload)

        return ApiResponse.success(
            res,
            {
                order: result.order,
                enrollment: result.enrollment,
                paymentTransaction: result.paymentTransaction,
                alreadyPaid: result.alreadyPaid,
            },
            result.alreadyPaid
                ? 'Payment already processed previously'
                : 'MoMo payment callback processed successfully'
        )
    })

    momoWebhook = async (req, res, next) => {
        try {
            const result = await paymentService.handleMoMoWebhook(
                req.body,
                req.ip
            )
            return res.status(200).json({
                resultCode: 0,
                message: 'Success',
                data: result,
            })
        } catch (error) {
            return res.status(400).json({
                resultCode: -1,
                message: error.message || 'Webhook processing failed',
            })
        }
    }

    // ==================== VNPay Methods ====================

    /**
     * @route   POST /api/v1/payments/vnpay/create
     * @desc    Generate VNPay payment URL for pending order
     * @access  Private (Student/Instructor/Admin)
     */
    createVNPayPayment = asyncHandler(async (req, res) => {
        const { orderId } = req.body
        const result = await paymentService.createVNPayPayment(
            req.user.id,
            parseInt(orderId, 10),
            req.ip
        )

        return ApiResponse.created(
            res,
            result,
            'VNPay payment URL created successfully'
        )
    })

    /**
     * @route   GET /api/v1/payments/vnpay/callback
     * @desc    Handle user redirect callback from VNPay (browser)
     * @access  Public (VNPay redirect)
     */
    vnpayCallback = asyncHandler(async (req, res) => {
        const rawQueryString = req.originalUrl?.split('?')[1] || ''
        const result = await paymentService.handleVNPayCallback(
            req.query,
            rawQueryString
        )

        return ApiResponse.success(
            res,
            {
                order: result.order,
                enrollment: result.enrollment,
                paymentTransaction: result.paymentTransaction,
                alreadyPaid: result.alreadyPaid,
                responseCode: result.responseCode,
                message: result.message,
            },
            result.alreadyPaid
                ? 'Payment already processed previously'
                : result.responseCode === '00'
                  ? 'VNPay payment callback processed successfully'
                  : 'VNPay payment failed'
        )
    })

    /**
     * @route   POST /api/v1/payments/vnpay/webhook
     * @desc    Handle VNPay IPN webhook (server-to-server)
     * @access  Public (VNPay server)
     */
    vnpayWebhook = async (req, res, next) => {
        try {
            const rawQueryString = req.originalUrl?.split('?')[1] || ''
            const result = await paymentService.handleVNPayWebhook(
                req.query,
                rawQueryString
            )

            // VNPay expects specific response format
            return res.status(200).json({
                RspCode: result.RspCode || '00',
                Message: result.Message || 'Confirm Success',
            })
        } catch (error) {
            return res.status(200).json({
                RspCode: '99',
                Message: error.message || 'Webhook processing failed',
            })
        }
    }

    // ==================== Refund Method ====================

    /**
     * @route   POST /api/v1/payments/refund/:orderId
     * @desc    Process refund for a paid order (supports both MoMo and VNPay)
     * @access  Private (Admin)
     */
    refundOrder = asyncHandler(async (req, res) => {
        const { orderId } = req.params
        const { amount, reason } = req.body || {}

        const result = await paymentService.refundOrder(
            parseInt(orderId, 10),
            req.user,
            amount,
            reason
        )

        return ApiResponse.success(res, result, 'Refund processed successfully')
    })
}

export default new PaymentsController()
