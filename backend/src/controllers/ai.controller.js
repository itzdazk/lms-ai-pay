// src/controllers/ai.controller.js
import { prisma } from '../config/database.config.js'
import aiChatService from '../services/ai-chat.service.js'
import knowledgeBaseService from '../services/knowledge-base.service.js'
import aiAdvisorService from '../services/ai-advisor.service.js'
import ApiResponse from '../utils/response.util.js'
import { asyncHandler } from '../middlewares/error.middleware.js'
import logger from '../config/logger.config.js'

class AIController {
    /**
     * @route   GET /api/v1/ai/conversations
     * @desc    Get user's conversations
     * @access  Private
     */
    getConversations = asyncHandler(async (req, res) => {
        const { page = 1, limit = 20, isArchived = false, mode } = req.query

        const result = await aiChatService.getConversations(req.user.id, {
            isArchived: isArchived === 'true',
            page: parseInt(page),
            limit: parseInt(limit),
            mode: mode || undefined, // Pass mode if provided
        })

        return ApiResponse.success(
            res,
            result.conversations,
            'Truy xuất danh sách cuộc hội thoại thành công',
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
            return ApiResponse.notFound(res, 'Không tìm thấy cuộc hội thoại')
        }

        return ApiResponse.success(res, conversation)
    })

    /**
     * @route   POST /api/v1/ai/conversations
     * @route   POST /api/v1/ai/advisor/conversations
     * @desc    Create new conversation (tutor or advisor)
     * @access  Private (tutor) or Public (advisor)
     */
    createConversation = asyncHandler(async (req, res) => {
        const { courseId, lessonId, title, mode } = req.body
        const userId = req.user?.id // Optional - undefined for advisor

        const conversation = await aiChatService.createConversation(userId, {
            courseId,
            lessonId,
            title,
            mode,
        })

        // For advisor mode, include greeting message in response (without creating a message in DB)
        if (mode === 'advisor') {
            const greetingResponse = await aiAdvisorService.generateAdvisorResponse(
                [], // No courses yet
                '', // Empty query triggers greeting
                [] // No conversation history
            )
            
            return ApiResponse.created(
                res,
                {
                    ...conversation,
                    greetingMessage: greetingResponse,
                },
                'Tạo cuộc hội thoại thành công'
            )
        }

        return ApiResponse.created(
            res,
            conversation,
            'Tạo cuộc hội thoại thành công'
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

        return ApiResponse.success(res, null, 'Xóa cuộc hội thoại thành công')
    })

    /**
     * @route   PATCH /api/v1/ai/conversations/:id
     * @desc    Update conversation title
     * @access  Private
     */
    updateConversation = asyncHandler(async (req, res) => {
        const { id } = req.params
        const { title } = req.body

        const conversation = await aiChatService.updateConversation(
            parseInt(id),
            req.user.id,
            { title }
        )

        return ApiResponse.success(
            res,
            conversation,
            'Cập nhật cuộc hội thoại thành công'
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
            'Lưu trữ cuộc hội thoại thành công'
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
            'Kích hoạt cuộc hội thoại thành công'
        )
    })

    /**
     * @route   GET /api/v1/ai/conversations/:id/messages
     * @desc    Get messages in conversation
     * @access  Private
     */
    getMessages = asyncHandler(async (req, res) => {
        const { id } = req.params
        const { page = 1, limit = 50, order = 'asc' } = req.query

        const result = await aiChatService.getMessages(
            parseInt(id),
            req.user.id,
            parseInt(page),
            parseInt(limit),
            order === 'desc' ? 'desc' : 'asc'
        )

        return ApiResponse.success(
            res,
            result.messages,
            'Truy xuất danh sách tin nhắn thành công',
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
        const { message, mode = 'general', lessonId } = req.body
        const { stream } = req.query // Check if client wants streaming
        const userId = req.user?.id // Optional - undefined for advisor

        // Usage monitoring - Log request details
        const requestMetrics = {
            userId: userId || 'anonymous',
            conversationId: id,
            messageLength: message.length,
            mode,
            hasLessonContext: !!lessonId,
            timestamp: new Date().toISOString(),
            endpoint: req.originalUrl,
            ip: req.ip,
        }

        logger.info({
            message: '[AI Usage] Message request received',
            ...requestMetrics,
        })

        const startTime = Date.now()

        // If streaming requested, use streaming endpoint
        if (stream === 'true') {
            return this.sendMessageStream(req, res)
        }

        const result = await aiChatService.sendMessage(
            userId,
            parseInt(id),
            message,
            mode,
            lessonId ? parseInt(lessonId) : null
        )

        // Log response metrics
        const responseTime = Date.now() - startTime
        logger.info({
            message: '[AI Usage] Message processed successfully',
            ...requestMetrics,
            responseTime,
            responseLength: result?.aiMessage?.message?.length || 0,
        })

        return ApiResponse.success(res, result, 'Đã gửi tin nhắn thành công')
    })

    /**
     * Send message with streaming response
     */
    sendMessageStream = asyncHandler(async (req, res) => {
        const { id } = req.params
        const { message, mode = 'general', lessonId } = req.body
        const userId = req.user?.id // Optional - undefined for advisor

        // Set headers for SSE (Server-Sent Events)
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')
        res.setHeader('X-Accel-Buffering', 'no') // Disable nginx buffering

        try {
            await aiChatService.sendMessageStream(
                userId,
                parseInt(id),
                message,
                mode,
                (chunk) => {
                    // Send chunk to client
                    res.write(
                        `data: ${JSON.stringify({ chunk, done: false })}\n\n`
                    )
                },
                lessonId ? parseInt(lessonId) : null
            )

            // Send completion signal
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
            res.end()
        } catch (error) {
            res.write(
                `data: ${JSON.stringify({ error: error.message, done: true })}\n\n`
            )
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

        return ApiResponse.success(res, null, 'Đã gửi phản hồi thành công')
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
                'Truy vấn phải có ít nhất 2 ký tự'
            )
        }

        const context = await knowledgeBaseService.buildContext(
            req.user.id,
            q.trim(),
            null
        )

        return ApiResponse.success(res, context, 'Hoàn thành tìm kiếm')
    })

    /**
     * @route   GET /api/v1/ai/ollama/status
     * @desc    Get LLM service status and available models (backward compatible endpoint)
     * @access  Private
     */
    getOllamaStatus = asyncHandler(async (req, res) => {
        const llmService = (await import('../services/llm.service.js'))
            .default
        const status = await llmService.getStatus()
        return ApiResponse.success(
            res,
            status,
            'Truy xuất trạng thái LLM thành công'
        )
    })
}

export default new AIController()
