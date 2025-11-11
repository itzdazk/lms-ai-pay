import paymentService from '../services/payment.service.js'
import ApiResponse from '../utils/response.util.js'
import { asyncHandler } from '../middlewares/error.middleware.js'

class PaymentsController {
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
