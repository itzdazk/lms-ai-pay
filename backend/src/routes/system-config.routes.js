// backend/src/routes/system-config.routes.js
import express from 'express'
import systemConfigController from '../controllers/system-config.controller.js'
import { authenticate } from '../middlewares/authenticate.middleware.js'
import { USER_ROLES } from '../config/constants.js'
import { authorize } from '../middlewares/role.middleware.js'

const router = express.Router()

// Public routes (no auth required)
/**
 * @route   GET /api/v1/system-config/public
 * @desc    Get public system settings (Contact info, system name, logo)
 * @access  Public
 */
router.get('/public', systemConfigController.getPublicConfig)

/**
 * @route   GET /api/v1/system-config/registration-enabled
 * @desc    Check if user registration is enabled
 * @access  Public
 */
router.get('/registration-enabled', systemConfigController.checkRegistrationEnabled)

export default router
