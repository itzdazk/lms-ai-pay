// backend/src/routes/refund-request.routes.js
import express from 'express'
import refundRequestController from '../controllers/refund-request.controller.js'
import { authenticate } from '../middlewares/authenticate.middleware.js'
import {
    createRefundRequestValidator,
    getRefundRequestByIdValidator,
    getRefundRequestByOrderIdValidator,
    getStudentRefundRequestsValidator,
} from '../validators/refund-request.validator.js'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

/**
 * @route   POST /api/v1/refund-requests
 * @desc    Create a refund request
 * @access  Private (Student)
 */
router.post(
    '/',
    createRefundRequestValidator,
    refundRequestController.createRefundRequest
)

/**
 * @route   GET /api/v1/refund-requests
 * @desc    Get student's refund requests
 * @access  Private (Student)
 */
router.get(
    '/',
    getStudentRefundRequestsValidator,
    refundRequestController.getStudentRefundRequests
)

/**
 * @route   GET /api/v1/refund-requests/order/:orderId
 * @desc    Get refund request for an order
 * @access  Private (Student)
 * @note    Must be defined BEFORE /:id to avoid route conflict
 */
router.get(
    '/order/:orderId',
    getRefundRequestByOrderIdValidator,
    refundRequestController.getRefundRequestByOrderId
)

/**
 * @route   GET /api/v1/refund-requests/:id
 * @desc    Get refund request by ID
 * @access  Private (Student, Admin)
 */
router.get(
    '/:id',
    getRefundRequestByIdValidator,
    refundRequestController.getRefundRequestById
)

export default router

