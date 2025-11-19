// backend/src/routes/health.routes.js
import express from 'express'
import healthController from '../controllers/health.controller.js'

const router = express.Router()

/**
 * @route   GET /api/v1/health
 * @desc    Basic health check - API status
 * @access  Public
 */
router.get('/', healthController.checkHealth)

/**
 * @route   GET /api/v1/health/db
 * @desc    Database connection health check
 * @access  Public
 */
router.get('/db', healthController.checkDatabase)

/**
 * @route   GET /api/v1/health/storage
 * @desc    Storage (file system) health check
 * @access  Public
 */
router.get('/storage', healthController.checkStorage)

/**
 * @route   GET /api/v1/health/full
 * @desc    Complete health check (all services)
 * @access  Public
 */
router.get('/full', healthController.checkFullHealth)

export default router
