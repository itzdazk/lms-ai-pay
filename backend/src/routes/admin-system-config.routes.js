// backend/src/routes/admin-system-config.routes.js
import express from 'express'
import systemConfigController from '../controllers/system-config.controller.js'
import { authenticate } from '../middlewares/authenticate.middleware.js'
import { USER_ROLES } from '../config/constants.js'
import { authorize } from '../middlewares/role.middleware.js'

const router = express.Router()

// Apply authentication and admin authorization to all routes
router.use(authenticate)
router.use(authorize(USER_ROLES.ADMIN))

/**
 * @route   GET /api/v1/admin/system-config
 * @desc    Get all system settings (Admin only)
 * @access  Private (Admin)
 */
router.get('/', systemConfigController.getConfig)

/**
 * @route   PUT /api/v1/admin/system-config
 * @desc    Update system settings (Admin only)
 * @access  Private (Admin)
 */
router.put('/', systemConfigController.updateConfig)

export default router
