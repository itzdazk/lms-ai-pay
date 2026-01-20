// backend/src/routes/coupon.routes.js
import express from 'express'
import couponController from '../controllers/coupon.controller.js'
import { authenticate } from '../middlewares/authenticate.middleware.js'
import { applyCouponValidator } from '../validators/coupon.validator.js'

const router = express.Router()

/**
 * @route   GET /api/v1/coupons/:code/check
 * @desc    Quick check if coupon exists and is active
 * @access  Public
 */
router.get('/:code/check', couponController.checkCoupon)

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
