// backend/src/routes/coupon.routes.js
import express from 'express'
import couponController from '../controllers/coupon.controller.js'
import studentCouponController from '../controllers/student-coupon.controller.js'
import { authenticate } from '../middlewares/authenticate.middleware.js'
import { applyCouponValidator } from '../validators/coupon.validator.js'
import { getAvailableCouponsValidator } from '../validators/student-coupon.validator.js'

const router = express.Router()

/**
 * @route   GET /api/v1/coupons/available
 * @desc    Get all available coupons for student
 * @access  Private (Authenticated users)
 */
router.get(
    '/available',
    authenticate,
    getAvailableCouponsValidator,
    studentCouponController.getAvailableCoupons,
)

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
