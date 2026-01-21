// backend/src/routes/student-coupon.routes.js
import express from 'express'
import studentCouponController from '../controllers/student-coupon.controller.js'
import { authenticate } from '../middlewares/authenticate.middleware.js'
import { getAvailableCouponsValidator } from '../validators/student-coupon.validator.js'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

/**
 * @route   GET /api/v1/coupons/available
 * @desc    Get all available coupons for student
 * @access  Private (Student)
 * @query   page, limit, type
 */
router.get(
    '/available',
    getAvailableCouponsValidator,
    studentCouponController.getAvailableCoupons,
)

export default router
