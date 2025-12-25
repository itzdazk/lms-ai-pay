// src/controllers/ai.controller.js
import { prisma } from '../config/database.config.js'
import aiChatService from '../services/ai-chat.service.js'
import knowledgeBaseService from '../services/knowledge-base.service.js'
import ApiResponse from '../utils/response.util.js'
import { asyncHandler } from '../middlewares/error.middleware.js'

class AIController {
    /**
     * @route   GET /api/v1/ai/conversations
     * @desc    Get user's conversations
     * @access  Private
     */
    getConversations = asyncHandler(async (req, res) => {
        const { page = 1, limit = 20, isArchived = false } = req.query

        const result = await aiChatService.getConversations(req.user.id, {
            isArchived: isArchived === 'true',
            page: parseInt(page),
            limit: parseInt(limit),
        })

        return ApiResponse.success(
            res,
            result.conversations,
            'Conversations retrieved successfully',
            200,
            result.pagination
        )
    })

    /**
     * @route   GET /api/v1/ai/conversations/:id
     * @desc    Get conversation details
     * @access  Private
     */
    getConversation = asyncHandler(async (req, res) => {
        const { id } = req.params

        const conversation = await prisma.conversation.findFirst({
            where: {
                id: parseInt(id),
                userId: req.user.id,
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        thumbnailUrl: true,
                    },
                },
                lesson: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                    },
                },
                _count: {
                    select: { messages: true },
                },
            },
        })

        if (!conversation) {
            return ApiResponse.notFound(res, 'Conversation not found')
        }

        return ApiResponse.success(res, conversation)
    })

    /**
     * @route   POST /api/v1/ai/conversations
     * @desc    Create new conversation
     * @access  Private
     */
    createConversation = asyncHandler(async (req, res) => {
        const { courseId, lessonId, title } = req.body

        const conversation = await aiChatService.createConversation(
            req.user.id,
            { courseId, lessonId, title }
        )

        return ApiResponse.created(
            res,
            conversation,
            'Conversation created successfully'
        )
    })

    /**
     * @route   DELETE /api/v1/ai/conversations/:id
     * @desc    Delete conversation
     * @access  Private
     */
    deleteConversation = asyncHandler(async (req, res) => {
        const { id } = req.params

        await aiChatService.deleteConversation(parseInt(id), req.user.id)

        return ApiResponse.success(
            res,
            null,
            'Conversation deleted successfully'
        )
    })

    /**
     * @route   PATCH /api/v1/ai/conversations/:id/archive
     * @desc    Archive conversation
     * @access  Private
     */
    archiveConversation = asyncHandler(async (req, res) => {
        const { id } = req.params

        await aiChatService.archiveConversation(parseInt(id), req.user.id)

        return ApiResponse.success(
            res,
            null,
            'Conversation archived successfully'
        )
    })

    /**
     * @route   PATCH /api/v1/ai/conversations/:id/activate
     * @desc    Activate (unarchive) conversation
     * @access  Private
     */
    activateConversation = asyncHandler(async (req, res) => {
        const { id } = req.params

        await prisma.conversation.update({
            where: {
                id: parseInt(id),
                userId: req.user.id,
            },
            data: {
                isArchived: false,
                isActive: true,
            },
        })

        return ApiResponse.success(
            res,
            null,
            'Conversation activated successfully'
        )
    })

    /**
     * @route   GET /api/v1/ai/conversations/:id/messages
     * @desc    Get messages in conversation
     * @access  Private
     */
    getMessages = asyncHandler(async (req, res) => {
        const { id } = req.params
        const { page = 1, limit = 50 } = req.query

        const result = await aiChatService.getMessages(
            parseInt(id),
            req.user.id,
            parseInt(page),
            parseInt(limit)
        )

        return ApiResponse.success(
            res,
            result.messages,
            'Messages retrieved successfully',
            200,
            result.pagination
        )
    })

    /**
     * @route   POST /api/v1/ai/conversations/:id/messages
     * @desc    Send message to chatbot
     * @access  Private
     */
    sendMessage = asyncHandler(async (req, res) => {
        const { id } = req.params
        const { message, mode = 'course' } = req.body
        const { stream } = req.query // Check if client wants streaming

        // If streaming requested, use streaming endpoint
        if (stream === 'true') {
            return this.sendMessageStream(req, res)
        }

        const result = await aiChatService.sendMessage(
            req.user.id,
            parseInt(id),
            message,
            mode
        )

        return ApiResponse.success(res, result, 'Message sent successfully')
    })

    /**
     * Send message with streaming response
     */
    sendMessageStream = asyncHandler(async (req, res) => {
        const { id } = req.params
        const { message, mode = 'course' } = req.body

        // Set headers for SSE (Server-Sent Events)
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')
        res.setHeader('X-Accel-Buffering', 'no') // Disable nginx buffering

        try {
            await aiChatService.sendMessageStream(
                req.user.id,
                parseInt(id),
                message,
                mode,
                (chunk) => {
                    // Send chunk to client
                    res.write(`data: ${JSON.stringify({ chunk, done: false })}\n\n`)
                }
            )

            // Send completion signal
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
            res.end()
        } catch (error) {
            res.write(`data: ${JSON.stringify({ error: error.message, done: true })}\n\n`)
            res.end()
        }
    })

    /**
     * @route   POST /api/v1/ai/messages/:id/feedback
     * @desc    Submit feedback for message
     * @access  Private
     */
    feedbackMessage = asyncHandler(async (req, res) => {
        const { id } = req.params
        const { isHelpful, feedbackText } = req.body

        await aiChatService.feedbackMessage(
            parseInt(id),
            req.user.id,
            isHelpful,
            feedbackText
        )

        return ApiResponse.success(res, null, 'Feedback submitted successfully')
    })

    /**
     * @route   GET /api/v1/ai/search
     * @desc    Search in knowledge base (for testing/debugging)
     * @access  Private
     */
    searchKnowledgeBase = asyncHandler(async (req, res) => {
        const { q, courseId, lessonId } = req.query

        if (!q || q.trim().length < 2) {
            return ApiResponse.badRequest(
                res,
                'Query must be at least 2 characters'
            )
        }

        const context = await knowledgeBaseService.buildContext(
            req.user.id,
            q.trim(),
            null
        )

        return ApiResponse.success(res, context, 'Search completed')
    })

    /**
     * @route   GET /api/v1/ai/ollama/status
     * @desc    Get Ollama service status and available models
     * @access  Private
     */
    getOllamaStatus = asyncHandler(async (req, res) => {
        const ollamaService = (await import('../services/ollama.service.js')).default
        const status = await ollamaService.getStatus()
        return ApiResponse.success(res, status, 'Ollama status retrieved')
    })
}

export default new AIController()
