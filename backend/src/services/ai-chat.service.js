// src/services/ai-chat.service.js
import { prisma } from '../config/database.config.js'
import knowledgeBaseService from './knowledge-base.service.js'
import logger from '../config/logger.config.js'
import config from '../config/app.config.js'

class AIChatService {
    /**
     * Tạo conversation mới
     */
    async createConversation(userId, data = {}) {
        try {
            const { courseId, lessonId, title } = data

            // Auto-generate title nếu không có
            let conversationTitle = title

            if (!conversationTitle) {
                if (courseId) {
                    const course = await prisma.course.findUnique({
                        where: { id: courseId },
                        select: { title: true },
                    })
                    conversationTitle = `Chat về ${course?.title || 'khóa học'}`
                } else {
                    conversationTitle = 'Trò chuyện chung'
                }
            }

            // Determine context type
            let contextType = 'GENERAL_CHAT'
            if (lessonId) {
                contextType = 'LESSON_HELP'
            } else if (courseId) {
                contextType = 'COURSE_OVERVIEW'
            }

            const conversation = await prisma.conversation.create({
                data: {
                    userId,
                    courseId: courseId || null,
                    lessonId: lessonId || null,
                    title: conversationTitle,
                    contextType,
                    aiModel: config.OPENAI_MODEL || 'gpt-4',
                    isActive: true,
                    isArchived: false,
                    lastMessageAt: new Date(),
                },
                include: {
                    course: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                        },
                    },
                    lesson: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                        },
                    },
                },
            })

            logger.info(
                `Created conversation ${conversation.id} for user ${userId}`
            )
            return conversation
        } catch (error) {
            logger.error('Error creating conversation:', error)
            throw error
        }
    }

    /**
     * Gửi message và nhận response
     */
    async sendMessage(userId, conversationId, messageText) {
        try {
            // 1. Verify conversation belongs to user
            const conversation = await prisma.conversation.findFirst({
                where: {
                    id: conversationId,
                    userId,
                },
            })

            if (!conversation) {
                throw new Error('Conversation not found or access denied')
            }

            // 2. Lưu message của user
            const userMessage = await prisma.chatMessage.create({
                data: {
                    conversationId,
                    senderType: 'user',
                    message: messageText,
                    messageType: 'text',
                },
            })

            // 3. Build context từ knowledge base
            const context = await knowledgeBaseService.buildContext(
                userId,
                messageText,
                conversationId
            )

            // 4. Generate response (NO AI - template based)
            const responseData = this.generateResponse(context, messageText)

            // 5. Lưu AI response
            const aiMessage = await prisma.chatMessage.create({
                data: {
                    conversationId,
                    senderType: 'ai',
                    message: responseData.text,
                    messageType: 'text',
                    metadata: {
                        sources: responseData.sources,
                        suggestedActions: responseData.suggestedActions,
                    },
                },
            })

            // 6. Update conversation last message time
            await prisma.conversation.update({
                where: { id: conversationId },
                data: { lastMessageAt: new Date() },
            })

            logger.info(`Sent message in conversation ${conversationId}`)

            return {
                userMessage,
                aiMessage,
                context: {
                    hasResults: context.searchResults.totalResults > 0,
                    totalResults: context.searchResults.totalResults,
                },
            }
        } catch (error) {
            logger.error('Error sending message:', error)
            throw error
        }
    }

    /**
     * Generate response từ context (NO AI)
     */
    generateResponse(context, query) {
        const { searchResults, userContext } = context

        // CASE 1: Tìm thấy trong TRANSCRIPT (Best case!)
        if (searchResults.transcripts.length > 0) {
            return this.generateTranscriptResponse(
                searchResults.transcripts,
                query
            )
        }

        // CASE 2: Tìm thấy trong LESSONS
        if (searchResults.lessons.length > 0) {
            return this.generateLessonResponse(
                searchResults.lessons,
                query,
                userContext
            )
        }

        // CASE 3: Tìm thấy trong COURSES
        if (searchResults.courses.length > 0) {
            return this.generateCourseResponse(searchResults.courses, query)
        }

        // CASE 4: Không tìm thấy gì
        return this.generateNoResultResponse(query, userContext)
    }

    /**
     * Response khi tìm thấy trong transcript
     */
    generateTranscriptResponse(transcripts, query) {
        const topResult = transcripts[0]

        let text = `📚 **Tìm thấy thông tin trong bài học!**\n\n`
        text += `**Bài:** ${topResult.lessonTitle}\n`
        text += `**Khóa học:** ${topResult.courseTitle}\n`

        if (topResult.timestamp) {
            text += `**Thời điểm:** ${topResult.timestamp}\n\n`
        }

        text += `**Nội dung:**\n> ${topResult.excerpt}\n\n`

        if (topResult.videoUrl && topResult.startTime) {
            text += `🎥 **[Xem video tại đây](${topResult.videoUrl}?t=${Math.floor(topResult.startTime)})**\n\n`
        }

        // Nếu có nhiều kết quả
        if (transcripts.length > 1) {
            text += `\n📝 **Tìm thấy thêm ${transcripts.length - 1} đoạn liên quan khác trong các bài học.**`
        }

        const sources = transcripts.slice(0, 3).map((t) => ({
            type: 'transcript',
            lessonId: t.lessonId,
            lessonTitle: t.lessonTitle,
            courseId: t.courseId,
            courseTitle: t.courseTitle,
            timestamp: t.timestamp,
            videoUrl: t.videoUrl,
            excerpt: t.excerpt,
        }))

        const suggestedActions = [
            {
                type: 'watch_video',
                label: 'Xem video',
                url: topResult.videoUrl,
                timestamp: topResult.startTime,
            },
            {
                type: 'view_lesson',
                label: 'Xem toàn bộ bài học',
                lessonId: topResult.lessonId,
            },
        ]

        return { text, sources, suggestedActions }
    }

    /**
     * Response khi tìm thấy trong lessons
     */
    generateLessonResponse(lessons, query, userContext) {
        const topLesson = lessons[0]

        let text = `📖 **Tìm thấy bài học liên quan!**\n\n`
        text += `**Bài:** ${topLesson.title}\n`
        text += `**Khóa học:** ${topLesson.course.title}\n\n`

        if (topLesson.description) {
            text += `**Mô tả:**\n${topLesson.description}\n\n`
        }

        // Check xem user đã học chưa
        const isCurrentCourse =
            userContext.currentCourse?.id === topLesson.courseId
        if (isCurrentCourse) {
            text += `💡 *Bạn đang học khóa này. Hãy tiếp tục nhé!*\n\n`
        }

        // List thêm lessons nếu có
        if (lessons.length > 1) {
            text += `\n**Các bài học liên quan khác:**\n`
            lessons.slice(1, 4).forEach((lesson, index) => {
                text += `${index + 2}. ${lesson.title}\n`
            })
        }

        const sources = lessons.slice(0, 3).map((l) => ({
            type: 'lesson',
            lessonId: l.id,
            lessonTitle: l.title,
            courseId: l.courseId,
            courseTitle: l.course.title,
            description: l.description,
        }))

        const suggestedActions = [
            {
                type: 'view_lesson',
                label: 'Xem bài học',
                lessonId: topLesson.id,
            },
            {
                type: 'view_course',
                label: 'Xem khóa học',
                courseId: topLesson.courseId,
            },
        ]

        return { text, sources, suggestedActions }
    }

    /**
     * Response khi tìm thấy trong courses
     */
    generateCourseResponse(courses, query) {
        const topCourse = courses[0]

        let text = `🎓 **Tìm thấy khóa học liên quan!**\n\n`
        text += `**Khóa học:** ${topCourse.title}\n`
        text += `**Cấp độ:** ${topCourse.level}\n\n`

        if (topCourse.shortDescription) {
            text += `**Mô tả:**\n${topCourse.shortDescription}\n\n`
        }

        if (topCourse.whatYouLearn) {
            text += `**Bạn sẽ học được:**\n${topCourse.whatYouLearn.substring(0, 200)}...\n\n`
        }

        if (courses.length > 1) {
            text += `\n**Khóa học liên quan khác:**\n`
            courses.slice(1, 3).forEach((course, index) => {
                text += `${index + 2}. ${course.title} (${course.level})\n`
            })
        }

        const sources = courses.slice(0, 3).map((c) => ({
            type: 'course',
            courseId: c.id,
            courseTitle: c.title,
            level: c.level,
            description: c.shortDescription,
        }))

        const suggestedActions = [
            {
                type: 'view_course',
                label: 'Xem chi tiết khóa học',
                courseId: topCourse.id,
            },
        ]

        return { text, sources, suggestedActions }
    }

    /**
     * Response khi không tìm thấy gì
     */
    generateNoResultResponse(query, userContext) {
        let text = `😔 **Xin lỗi, tôi không tìm thấy thông tin về "${query}"**\n\n`

        if (userContext.currentCourse) {
            text += `Bạn đang học khóa: **${userContext.currentCourse.title}**\n\n`
            text += `**Gợi ý:**\n`
            text += `- Kiểm tra lại từ khóa tìm kiếm\n`
            text += `- Xem lại các bài học trong khóa học\n`
            text += `- Liên hệ giảng viên để được hỗ trợ\n`
        } else {
            text += `**Gợi ý:**\n`
            text += `- Hãy enroll vào một khóa học để bắt đầu học\n`
            text += `- Tìm kiếm khóa học phù hợp với bạn\n`
        }

        return {
            text,
            sources: [],
            suggestedActions: [
                {
                    type: 'browse_courses',
                    label: 'Xem các khóa học',
                },
            ],
        }
    }

    /**
     * Get messages trong conversation
     */
    async getMessages(conversationId, userId, page = 1, limit = 50) {
        try {
            // Verify ownership
            const conversation = await prisma.conversation.findFirst({
                where: {
                    id: conversationId,
                    userId,
                },
            })

            if (!conversation) {
                throw new Error('Conversation not found or access denied')
            }

            const messages = await prisma.chatMessage.findMany({
                where: { conversationId },
                orderBy: { createdAt: 'asc' },
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    senderType: true,
                    message: true,
                    messageType: true,
                    metadata: true,
                    isHelpful: true,
                    feedbackText: true,
                    createdAt: true,
                },
            })

            const total = await prisma.chatMessage.count({
                where: { conversationId },
            })

            return {
                messages,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            }
        } catch (error) {
            logger.error('Error getting messages:', error)
            throw error
        }
    }

    /**
     * Feedback message (helpful/not helpful)
     */
    async feedbackMessage(messageId, userId, isHelpful, feedbackText = null) {
        try {
            // Verify message belongs to user's conversation
            const message = await prisma.chatMessage.findFirst({
                where: {
                    id: messageId,
                    conversation: {
                        userId,
                    },
                },
            })

            if (!message) {
                throw new Error('Message not found or access denied')
            }

            const updated = await prisma.chatMessage.update({
                where: { id: messageId },
                data: {
                    isHelpful,
                    feedbackText,
                },
            })

            logger.info(
                `Feedback submitted for message ${messageId}: ${isHelpful ? 'helpful' : 'not helpful'}`
            )

            return updated
        } catch (error) {
            logger.error('Error submitting feedback:', error)
            throw error
        }
    }

    /**
     * Get user's conversations
     */
    async getConversations(userId, options = {}) {
        try {
            const { isArchived = false, page = 1, limit = 20 } = options

            const where = {
                userId,
                isArchived,
            }

            const conversations = await prisma.conversation.findMany({
                where,
                orderBy: { lastMessageAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
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

            const total = await prisma.conversation.count({ where })

            return {
                conversations,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            }
        } catch (error) {
            logger.error('Error getting conversations:', error)
            throw error
        }
    }

    /**
     * Archive conversation
     */
    async archiveConversation(conversationId, userId) {
        try {
            const conversation = await prisma.conversation.findFirst({
                where: {
                    id: conversationId,
                    userId,
                },
            })

            if (!conversation) {
                throw new Error('Conversation not found or access denied')
            }

            await prisma.conversation.update({
                where: { id: conversationId },
                data: { isArchived: true, isActive: false },
            })

            logger.info(`Archived conversation ${conversationId}`)
        } catch (error) {
            logger.error('Error archiving conversation:', error)
            throw error
        }
    }

    /**
     * Delete conversation
     */
    async deleteConversation(conversationId, userId) {
        try {
            const conversation = await prisma.conversation.findFirst({
                where: {
                    id: conversationId,
                    userId,
                },
            })

            if (!conversation) {
                throw new Error('Conversation not found or access denied')
            }

            // Cascade delete messages (handled by Prisma)
            await prisma.conversation.delete({
                where: { id: conversationId },
            })

            logger.info(`Deleted conversation ${conversationId}`)
        } catch (error) {
            logger.error('Error deleting conversation:', error)
            throw error
        }
    }
}

export default new AIChatService()
