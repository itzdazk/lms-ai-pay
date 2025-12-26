// src/routes/ai.routes.js
import express from 'express'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import aiController from '../controllers/ai.controller.js'
import { authenticate } from '../middlewares/authenticate.middleware.js'
import { validatePagination } from '../middlewares/validate.middleware.js'
import { concurrentLimit } from '../middlewares/concurrent-limit.middleware.js'
import {
    createConversationValidator,
    sendMessageValidatorAdvisor,
    sendMessageValidatorTutor,
    feedbackMessageValidator,
    conversationIdValidator,
    messageIdValidator,
    searchValidator,
    messagesQueryValidator,
} from '../validators/ai.validator.js'
import aiRecommendationRoutes from './ai-recommendation.routes.js'

const router = express.Router()

router.use('/', aiRecommendationRoutes)

// Rate limiter for Advisor (public) routes - 100 requests per hour per IP
const advisorLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Quá nhiều yêu cầu từ địa chỉ IP này, vui lòng thử lại sau 1 giờ.',
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    skip: (req) => {
        // Security: Skip rate limiting for authenticated users only on specific endpoints
        // Keep public advisor endpoints strict
        return false
    },
})

// Rate limiter for authenticated users (more lenient) - 500 requests per hour
const authenticatedLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 500, // limit each user to 500 requests per hour
    message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use userId for authenticated users, IP for others using ipKeyGenerator helper
        return req.user?.id ? `user-${req.user.id}` : ipKeyGenerator(req)
    },
    skip: (req) => {
        // Don't apply rate limit on health checks or OPTIONS requests
        return req.method === 'OPTIONS'
    },
})

// Concurrent request limiter to prevent Ollama overload
const advisorConcurrentLimit = concurrentLimit(3, 'advisor') // Max 3 concurrent requests per IP
const tutorConcurrentLimit = concurrentLimit(5, 'tutor') // Max 5 concurrent requests per user

/**
 * ========== ADVISOR ROUTES (Public - No Authentication) ==========
 * For AI Advisor feature - accessible to all users including non-authenticated
 */

/**
 * @route   POST /api/v1/ai/advisor/conversations
 * @desc    Create new advisor conversation (public)
 * @access  Public
 * @body    { title?, mode: 'advisor' }
 */
router.post(
    '/advisor/conversations',
    advisorLimiter,
    createConversationValidator,
    aiController.createConversation
)

/**
 * @route   POST /api/v1/ai/advisor/conversations/:id/messages
 * @desc    Send message in advisor conversation (public, max 2000 chars)
 * @access  Public
 * @body    { message, mode: 'advisor' }
 */
router.post(
    '/advisor/conversations/:id/messages',
    advisorLimiter,
    advisorConcurrentLimit,
    sendMessageValidatorAdvisor,
    aiController.sendMessage
)

/**
 * ========== TUTOR ROUTES (Private - Authentication Required) ==========
 * For AI Tutor feature - requires user authentication
 */

// All tutor routes require authentication + rate limiting
router.use(authenticate)
router.use(authenticatedLimiter)

/**
 * @route   GET /api/v1/ai/conversations
 * @desc    Get user's tutor conversations
 * @access  Private
 * @query   page, limit, isArchived, mode
 */
router.get('/conversations', validatePagination, aiController.getConversations)

/**
 * @route   POST /api/v1/ai/conversations
 * @desc    Create new tutor conversation
 * @access  Private
 * @body    { courseId?, lessonId?, title?, mode: 'general' }
 */
router.post(
    '/conversations',
    createConversationValidator,
    aiController.createConversation
)

/**
 * @route   POST /api/v1/ai/conversations/:id/messages
 * @desc    Send message in tutor conversation (authenticated, max 5000 chars)
 * @access  Private
 * @body    { message, mode: 'general' }
 */
router.post(
    '/conversations/:id/messages',
    conversationIdValidator,
    tutorConcurrentLimit,
    sendMessageValidatorTutor,
    aiController.sendMessage
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
