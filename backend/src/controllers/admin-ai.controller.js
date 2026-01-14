// src/controllers/admin-ai.controller.js
import { prisma } from '../config/database.config.js'
import aiChatService from '../services/ai-chat.service.js'
import ApiResponse from '../utils/response.util.js'
import { asyncHandler } from '../middlewares/error.middleware.js'
import logger from '../config/logger.config.js'

class AdminAIController {
    /**
     * @route   GET /api/v1/admin/ai/conversations
     * @desc    Get all AI conversations (Admin only)
     * @access  Private (Admin)
     */
    getAllConversations = asyncHandler(async (req, res) => {
        const {
            page = 1,
            limit = 20,
            mode,
            search,
            userId,
            startDate,
            endDate,
        } = req.query

        const result = await aiChatService.getAllConversations({
            page: parseInt(page),
            limit: parseInt(limit),
            mode: mode || undefined,
            search: search || undefined,
            userId: userId ? parseInt(userId) : undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
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
     * @route   GET /api/v1/admin/ai/conversations/:id
     * @desc    Get conversation details (Admin only)
     * @access  Private (Admin)
     */
    getConversation = asyncHandler(async (req, res) => {
        const { id } = req.params

        const conversation = await prisma.conversation.findUnique({
            where: {
                id: parseInt(id),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        avatarUrl: true,
                    },
                },
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
            return ApiResponse.error(res, 'Không tìm thấy cuộc hội thoại', 404)
        }

        return ApiResponse.success(
            res,
            conversation,
            'Truy xuất chi tiết cuộc hội thoại thành công'
        )
    })

    /**
     * @route   GET /api/v1/admin/ai/conversations/:id/messages
     * @desc    Get messages for a conversation (Admin only)
     * @access  Private (Admin)
     */
    getMessages = asyncHandler(async (req, res) => {
        const { id } = req.params
        const { page = 1, limit = 100 } = req.query

        // Verify conversation exists
        const conversation = await prisma.conversation.findUnique({
            where: { id: parseInt(id) },
        })

        if (!conversation) {
            return ApiResponse.error(res, 'Không tìm thấy cuộc hội thoại', 404)
        }

        const messages = await prisma.chatMessage.findMany({
            where: {
                conversationId: parseInt(id),
            },
            orderBy: { createdAt: 'asc' },
            skip: (parseInt(page) - 1) * parseInt(limit),
            take: parseInt(limit),
            select: {
                id: true,
                message: true,
                senderType: true,
                messageType: true,
                metadata: true,
                isHelpful: true,
                feedbackText: true,
                createdAt: true,
            },
        })

        const total = await prisma.chatMessage.count({
            where: {
                conversationId: parseInt(id),
            },
        })

        return ApiResponse.success(
            res,
            messages,
            'Truy xuất danh sách tin nhắn thành công',
            200,
            {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit)),
            }
        )
    })

    /**
     * @route   GET /api/v1/admin/ai/conversations/:id/stats
     * @desc    Get detailed statistics for a conversation (Admin only)
     * @access  Private (Admin)
     */
    getConversationStats = asyncHandler(async (req, res) => {
        const { id } = req.params

        // Verify conversation exists
        const conversation = await prisma.conversation.findUnique({
            where: { id: parseInt(id) },
        })

        if (!conversation) {
            return ApiResponse.error(res, 'Không tìm thấy cuộc hội thoại', 404)
        }

        // Get all messages for this conversation
        const messages = await prisma.chatMessage.findMany({
            where: {
                conversationId: parseInt(id),
            },
            select: {
                id: true,
                senderType: true,
                metadata: true,
                isHelpful: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
        })

        // Calculate statistics
        const totalMessages = messages.length
        const userMessages = messages.filter(
            (m) => m.senderType === 'user'
        ).length
        const aiMessages = messages.filter((m) => m.senderType === 'ai').length

        // Metadata statistics
        const aiMessagesWithMeta = messages.filter(
            (m) => m.senderType === 'ai' && m.metadata
        )

        let totalResponseTime = 0
        let responseTimeCount = 0
        let ollamaUsageCount = 0
        let fallbackCount = 0
        let totalSources = 0
        const helpfulCount = messages.filter((m) => m.isHelpful === true).length
        const notHelpfulCount = messages.filter(
            (m) => m.isHelpful === false
        ).length

        aiMessagesWithMeta.forEach((msg) => {
            const meta = msg.metadata
            if (meta && typeof meta === 'object') {
                if (meta.responseTime) {
                    totalResponseTime += meta.responseTime
                    responseTimeCount++
                }
                if (meta.usedOllama === true) {
                    ollamaUsageCount++
                }
                if (meta.fallbackReason) {
                    fallbackCount++
                }
                if (meta.sources && Array.isArray(meta.sources)) {
                    totalSources += meta.sources.length
                }
            }
        })

        const avgResponseTime =
            responseTimeCount > 0
                ? Math.round(totalResponseTime / responseTimeCount)
                : 0
        const ollamaUsageRate =
            aiMessages > 0
                ? Math.round((ollamaUsageCount / aiMessages) * 100 * 100) / 100
                : 0

        // Calculate conversation duration
        const firstMessage = messages[0]
        const lastMessage = messages[messages.length - 1]
        const duration =
            firstMessage && lastMessage
                ? lastMessage.createdAt.getTime() -
                  firstMessage.createdAt.getTime()
                : 0

        // Messages per day/hour
        const messagesByHour = {}
        messages.forEach((msg) => {
            const hour =
                new Date(msg.createdAt).toISOString().slice(0, 13) + ':00'
            messagesByHour[hour] = (messagesByHour[hour] || 0) + 1
        })

        const stats = {
            conversationId: parseInt(id),
            totalMessages,
            userMessages,
            aiMessages,
            avgResponseTime,
            ollamaUsageRate,
            fallbackCount,
            totalSources,
            helpfulCount,
            notHelpfulCount,
            feedbackRate:
                totalMessages > 0
                    ? Math.round(
                          ((helpfulCount + notHelpfulCount) / totalMessages) *
                              100 *
                              100
                      ) / 100
                    : 0,
            duration,
            messagesByHour,
            firstMessageAt: firstMessage?.createdAt || null,
            lastMessageAt: lastMessage?.createdAt || null,
        }

        return ApiResponse.success(
            res,
            stats,
            'Truy xuất thống kê chi tiết cuộc hội thoại thành công'
        )
    })

    /**
     * @route   GET /api/v1/admin/ai/stats
     * @desc    Get AI usage statistics (Admin only)
     * @access  Private (Admin)
     */
    getAIStats = asyncHandler(async (req, res) => {
        const { startDate, endDate } = req.query

        const where = {}
        if (startDate || endDate) {
            where.createdAt = {}
            if (startDate) {
                where.createdAt.gte = new Date(startDate)
            }
            if (endDate) {
                where.createdAt.lte = new Date(endDate)
            }
        }

        // Get total conversations
        const totalConversations = await prisma.conversation.count({ where })

        // Get conversations by mode
        const conversationsByMode = await prisma.conversation.groupBy({
            by: ['mode'],
            where,
            _count: true,
        })

        // Get total messages
        const messageWhere = {}
        if (startDate || endDate) {
            messageWhere.createdAt = {}
            if (startDate) {
                messageWhere.createdAt.gte = new Date(startDate)
            }
            if (endDate) {
                messageWhere.createdAt.lte = new Date(endDate)
            }
        }
        const totalMessages = await prisma.chatMessage.count({
            where: messageWhere,
        })

        // Get unique users who used AI
        const uniqueUsers = await prisma.conversation.findMany({
            where: {
                ...where,
                userId: { not: null },
            },
            select: {
                userId: true,
            },
            distinct: ['userId'],
        })

        // Get recent activity (last 7 days)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const recentConversations = await prisma.conversation.count({
            where: {
                ...where,
                createdAt: {
                    ...where.createdAt,
                    gte: sevenDaysAgo,
                },
            },
        })

        // Get AI messages with metadata for statistics
        const aiMessages = await prisma.chatMessage.findMany({
            where: {
                ...messageWhere,
                senderType: 'ai',
                metadata: { not: null },
            },
            select: {
                metadata: true,
            },
            take: 1000, // Sample for performance
        })

        // Calculate average response time and other metrics from metadata
        let totalResponseTime = 0
        let responseTimeCount = 0
        let ollamaUsageCount = 0
        let fallbackCount = 0
        let totalSources = 0

        aiMessages.forEach((msg) => {
            const meta = msg.metadata
            if (meta && typeof meta === 'object') {
                if (meta.responseTime) {
                    totalResponseTime += meta.responseTime
                    responseTimeCount++
                }
                if (meta.usedOllama === true) {
                    ollamaUsageCount++
                }
                if (meta.fallbackReason) {
                    fallbackCount++
                }
                if (meta.sources && Array.isArray(meta.sources)) {
                    totalSources += meta.sources.length
                }
            }
        })

        const avgResponseTime =
            responseTimeCount > 0
                ? Math.round(totalResponseTime / responseTimeCount)
                : 0
        const ollamaUsageRate =
            aiMessages.length > 0
                ? (ollamaUsageCount / aiMessages.length) * 100
                : 0

        const stats = {
            totalConversations,
            totalMessages,
            uniqueUsers: uniqueUsers.length,
            recentConversations,
            avgResponseTime,
            ollamaUsageRate: Math.round(ollamaUsageRate * 100) / 100,
            fallbackCount,
            totalSources,
            byMode: conversationsByMode.reduce((acc, item) => {
                acc[item.mode] = item._count
                return acc
            }, {}),
        }

        return ApiResponse.success(
            res,
            stats,
            'Truy xuất thống kê AI thành công'
        )
    })
}

export default new AdminAIController()
