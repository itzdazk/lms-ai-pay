// src/routes/dashboard.routes.js
import express from 'express'
import progressController from '../controllers/progress.controller.js'
import { authenticate } from '../middlewares/authenticate.middleware.js'

const router = express.Router()

/**
 * @route   GET /api/v1/dashboard/progress
 * @desc    Get dashboard progress overview
 * @access  Private
 */
router.get('/progress', authenticate, progressController.getDashboardProgress)

/**
 * @route   GET /api/v1/dashboard/continue-watching
 * @desc    Get continue watching lessons
 * @access  Private
 */
router.get(
    '/continue-watching',
    authenticate,
    progressController.getContinueWatching
)

/**
 * @route   GET /api/v1/dashboard/recent-activities
 * @desc    Get recent activities
 * @access  Private
 */
router.get(
    '/recent-activities',
    authenticate,
    progressController.getRecentActivities
)

export default router
