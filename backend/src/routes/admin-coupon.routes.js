// backend/src/routes/admin-coupon.routes.js
import express from 'express'
import adminCouponController from '../controllers/admin-coupon.controller.js'
import { authenticate } from '../middlewares/authenticate.middleware.js'
import { isAdmin } from '../middlewares/role.middleware.js'
import {
    createCouponValidator,
    updateCouponValidator,
    getCouponsValidator,
    getCouponByIdValidator,
    deleteCouponValidator,
    getCouponUsageHistoryValidator,
    toggleCouponActiveValidator,
} from '../validators/coupon.validator.js'

const router = express.Router()

// All routes require authentication and admin role
router.use(authenticate)
router.use(isAdmin)

/**
 * @route   GET /api/v1/admin/coupons/overview
 * @desc    Get coupon overview metrics for dashboard
 * @access  Private (Admin)
 * @note    Must be defined before /:id route to avoid conflict
 */
router.get('/overview', adminCouponController.getCouponOverview)

/**
 * @route   GET /api/v1/admin/coupons/:id/usages
 * @desc    Get coupon usage history
 * @access  Private (Admin)
 * @note    Must be defined before /:id route to avoid conflict
 */
router.get(
    '/:id/usages',
    getCouponUsageHistoryValidator,
    adminCouponController.getCouponUsageHistory,
)

/**
 * @route   PATCH /api/v1/admin/coupons/:id/toggle-active
 * @desc    Toggle coupon active status
 * @access  Private (Admin)
 * @note    Must be defined before /:id route to avoid conflict
 */
router.patch(
    '/:id/toggle-active',
    toggleCouponActiveValidator,
    adminCouponController.toggleCouponActive,
)

/**
 * @route   GET /api/v1/admin/coupons/:id
 * @desc    Get coupon details by ID
 * @access  Private (Admin)
 */
router.get('/:id', getCouponByIdValidator, adminCouponController.getCouponById)

/**
 * @route   GET /api/v1/admin/coupons
 * @desc    Get all coupons with filters
 * @access  Private (Admin)
 * @query   page, limit, search, active, type, sort
 */
router.get('/', getCouponsValidator, adminCouponController.getCoupons)

/**
 * @route   POST /api/v1/admin/coupons
 * @desc    Create a new coupon
 * @access  Private (Admin)
 */
router.post('/', createCouponValidator, adminCouponController.createCoupon)

/**
 * @route   PUT /api/v1/admin/coupons/:id
 * @desc    Update a coupon
 * @access  Private (Admin)
 */
router.put('/:id', updateCouponValidator, adminCouponController.updateCoupon)

/**
 * @route   DELETE /api/v1/admin/coupons/:id
 * @desc    Delete/Deactivate a coupon
 * @access  Private (Admin)
 */
router.delete('/:id', deleteCouponValidator, adminCouponController.deleteCoupon)

export default router
