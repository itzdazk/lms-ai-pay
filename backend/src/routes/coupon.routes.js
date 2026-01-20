// backend/src/routes/coupon.routes.js
import express from 'express'
import couponController from '../controllers/coupon.controller.js'
import { authenticate } from '../middlewares/authenticate.middleware.js'
import { applyCouponValidator } from '../validators/coupon.validator.js'

const router = express.Router()

/**
 * @route   POST /api/v1/coupons/apply
 * @desc    Apply coupon code to check validity and calculate discount
 * @access  Private (Authenticated users)
 */
router.post(
    '/apply',
    authenticate,
    applyCouponValidator,
    couponController.applyCoupon,
)

export default router
