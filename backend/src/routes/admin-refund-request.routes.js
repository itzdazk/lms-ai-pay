// backend/src/routes/admin-refund-request.routes.js
import express from 'express'
import refundRequestController from '../controllers/refund-request.controller.js'
import { authenticate } from '../middlewares/authenticate.middleware.js'
import { isAdmin } from '../middlewares/role.middleware.js'

const router = express.Router()

// All routes require authentication and admin role
router.use(authenticate)
router.use(isAdmin)

/**
 * @route   GET /api/v1/admin/refund-requests
 * @desc    Get all refund requests (Admin only)
 * @access  Private (Admin)
 * @query   page, limit, status, search, sort
 */
router.get('/', refundRequestController.getAllRefundRequests)

export default router

