import express from 'express'
import paymentsController from '../controllers/payments.controller.js'
import { authenticate } from '../middlewares/authenticate.middleware.js'
import { isAdmin, isStudent } from '../middlewares/role.middleware.js'
import {
    createMoMoPaymentValidator,
    momoCallbackValidator,
    momoWebhookValidator,
    refundOrderValidator,
    createVNPayPaymentValidator,
    vnpayCallbackValidator,
    vnpayWebhookValidator,
} from '../validators/payments.validator.js'

const router = express.Router()

// ==================== MoMo Routes ====================

/**
 * @route   POST /api/v1/payments/momo/create
 * @desc    Generate MoMo payment URL for pending order
 * @access  Private (Student/Instructor/Admin)
 * @body    orderId
 */
router.post(
    '/momo/create',
    authenticate,
    isStudent,
    createMoMoPaymentValidator,
    paymentsController.createMoMoPayment
)

/**
 * @route   POST /api/v1/payments/momo/callback
 * @desc    Handle user redirect callback from MoMo (browser)
 * @access  Public (MoMo redirect)
 */
router
    .route('/momo/callback')
    .get(momoCallbackValidator, paymentsController.momoCallback)
    .post(momoCallbackValidator, paymentsController.momoCallback)

/**
 * @route   POST /api/v1/payments/momo/webhook
 * @desc    Handle MoMo IPN webhook (server-to-server)
 * @access  Public (MoMo server)
 */
router.post(
    '/momo/webhook',
    momoWebhookValidator,
    paymentsController.momoWebhook
)

// ==================== VNPay Routes ====================

/**
 * @route   POST /api/v1/payments/vnpay/create
 * @desc    Generate VNPay payment URL for pending order
 * @access  Private (Student/Instructor/Admin)
 * @body    orderId
 */
router.post(
    '/vnpay/create',
    authenticate,
    isStudent,
    createVNPayPaymentValidator,
    paymentsController.createVNPayPayment
)

/**
 * @route   GET /api/v1/payments/vnpay/callback
 * @desc    Handle user redirect callback from VNPay (browser)
 * @access  Public (VNPay redirect)
 */
router.get(
    '/vnpay/callback',
    vnpayCallbackValidator,
    paymentsController.vnpayCallback
)

/**
 * @route   GET /api/v1/payments/vnpay/webhook
 * @desc    Handle VNPay IPN webhook (server-to-server)
 * @access  Public (VNPay server)
 */
router.get(
    '/vnpay/webhook',
    vnpayWebhookValidator,
    paymentsController.vnpayWebhook
)

// ==================== Refund Route ====================

/**
 * @route   POST /api/v1/payments/refund/:orderId
 * @desc    Process refund for a paid order (MoMo or VNPay)
 * @access  Private (Admin)
 * @body    amount (optional), reason (optional)
 */
router.post(
    '/refund/:orderId',
    authenticate,
    isAdmin,
    refundOrderValidator,
    paymentsController.refundOrder
)

export default router
