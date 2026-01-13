// src/routes/admin-ai.routes.js
import express from 'express'
import adminAIController from '../controllers/admin-ai.controller.js'
import { authenticate } from '../middlewares/authenticate.middleware.js'
import { isAdmin } from '../middlewares/role.middleware.js'
import { validatePagination } from '../middlewares/validate.middleware.js'

const router = express.Router()

// All routes require authentication and admin role
router.use(authenticate)
router.use(isAdmin)

/**
 * @route   GET /api/v1/admin/ai/conversations
 * @desc    Get all AI conversations (Admin only)
 * @access  Private (Admin)
 * @query   page, limit, mode, search, userId
 */
router.get('/conversations', validatePagination, adminAIController.getAllConversations)

/**
 * @route   GET /api/v1/admin/ai/conversations/:id
 * @desc    Get conversation details (Admin only)
 * @access  Private (Admin)
 */
router.get('/conversations/:id', adminAIController.getConversation)

/**
 * @route   GET /api/v1/admin/ai/conversations/:id/messages
 * @desc    Get messages for a conversation (Admin only)
 * @access  Private (Admin)
 */
router.get('/conversations/:id/messages', adminAIController.getMessages)

/**
 * @route   GET /api/v1/admin/ai/conversations/:id/stats
 * @desc    Get detailed statistics for a conversation (Admin only)
 * @access  Private (Admin)
 */
router.get('/conversations/:id/stats', adminAIController.getConversationStats)

/**
 * @route   GET /api/v1/admin/ai/stats
 * @desc    Get AI usage statistics (Admin only)
 * @access  Private (Admin)
 */
router.get('/stats', adminAIController.getAIStats)

export default router
