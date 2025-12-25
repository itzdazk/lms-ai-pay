// src/routes/ai.routes.js
import express from 'express'
import aiController from '../controllers/ai.controller.js'
import { authenticate } from '../middlewares/authenticate.middleware.js'
import { validatePagination } from '../middlewares/validate.middleware.js'
import {
    createConversationValidator,
    sendMessageValidator,
    feedbackMessageValidator,
    conversationIdValidator,
    messageIdValidator,
    searchValidator,
    messagesQueryValidator,
} from '../validators/ai.validator.js'
import aiRecommendationRoutes from './ai-recommendation.routes.js'

const router = express.Router()

router.use('/', aiRecommendationRoutes)

// All routes require authentication
router.use(authenticate)

/**
 * CONVERSATIONS ROUTES
 */

/**
 * @route   GET /api/v1/ai/conversations
 * @desc    Get user's conversations
 * @access  Private
 * @query   page, limit, isArchived
 */
router.get('/conversations', validatePagination, aiController.getConversations)

/**
 * @route   POST /api/v1/ai/conversations
 * @desc    Create new conversation
 * @access  Private
 * @body    { courseId?, lessonId?, title? }
 */
router.post(
    '/conversations',
    createConversationValidator,
    aiController.createConversation
)

/**
 * @route   GET /api/v1/ai/conversations/:id
 * @desc    Get conversation details
 * @access  Private
 */
router.get(
    '/conversations/:id',
    conversationIdValidator,
    aiController.getConversation
)

/**
 * @route   PATCH /api/v1/ai/conversations/:id
 * @desc    Update conversation
 * @access  Private
 */
router.patch(
    '/conversations/:id',
    conversationIdValidator,
    aiController.updateConversation
)

/**
 * @route   DELETE /api/v1/ai/conversations/:id
 * @desc    Delete conversation
 * @access  Private
 */
router.delete(
    '/conversations/:id',
    conversationIdValidator,
    aiController.deleteConversation
)

/**
 * @route   PATCH /api/v1/ai/conversations/:id/archive
 * @desc    Archive conversation
 * @access  Private
 */
router.patch(
    '/conversations/:id/archive',
    conversationIdValidator,
    aiController.archiveConversation
)

/**
 * @route   PATCH /api/v1/ai/conversations/:id/activate
 * @desc    Activate (unarchive) conversation
 * @access  Private
 */
router.patch(
    '/conversations/:id/activate',
    conversationIdValidator,
    aiController.activateConversation
)

/**
 * MESSAGES ROUTES
 */

/**
 * @route   GET /api/v1/ai/conversations/:id/messages
 * @desc    Get messages in conversation
 * @access  Private
 * @query   page, limit, order (asc|desc)
 */
router.get(
    '/conversations/:id/messages',
    conversationIdValidator,
    messagesQueryValidator,
    validatePagination,
    aiController.getMessages
)

/**
 * @route   POST /api/v1/ai/conversations/:id/messages
 * @desc    Send message to chatbot
 * @access  Private
 * @body    { message: string }
 */
router.post(
    '/conversations/:id/messages',
    conversationIdValidator,
    sendMessageValidator,
    aiController.sendMessage
)

/**
 * @route   POST /api/v1/ai/messages/:id/feedback
 * @desc    Submit feedback for message
 * @access  Private
 * @body    { isHelpful: boolean, feedbackText?: string }
 */
router.post(
    '/messages/:id/feedback',
    messageIdValidator,
    feedbackMessageValidator,
    aiController.feedbackMessage
)

/**
 * KNOWLEDGE BASE ROUTES (Optional - for testing)
 */

/**
 * @route   GET /api/v1/ai/search
 * @desc    Search in knowledge base
 * @access  Private
 * @query   q (required), courseId?, lessonId?
 */
router.get('/search', searchValidator, aiController.searchKnowledgeBase)

/**
 * @route   GET /api/v1/ai/ollama/status
 * @desc    Get Ollama service status and available models
 * @access  Private
 */
router.get('/ollama/status', aiController.getOllamaStatus)

export default router
