// src/services/ai-chat.service.js
import { prisma } from '../config/database.config.js'
import knowledgeBaseService from './knowledge-base.service.js'
import ollamaService from './ollama.service.js'
import logger from '../config/logger.config.js'
import config from '../config/app.config.js'
import { HTTP_STATUS, AI_INTERACTION_TYPES } from '../config/constants.js'

class AIChatService {
    /**
     * Helper: Verify conversation access
     * - If conversation.userId is null: public advisor conversation, allow access
     * - If conversation.userId is set: must match current userId
     * @returns {Promise<Object>} conversation object
     * @throws Error if conversation not found or access denied
     */
    async verifyConversationAccess(conversationId, userId) {
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId }
        })

        if (!conversation) {
            const error = new Error('Conversation not found')
            error.statusCode = 404
            throw error
        }

        // Public advisor conversation (userId = null) - allow access
        if (conversation.userId === null) {
            return conversation
        }

        // Private conversation - must match current user
        if (conversation.userId !== userId) {
            const error = new Error('Access denied: This conversation belongs to another user')
            error.statusCode = 403
            throw error
        }

        return conversation
    }
    /**
     * Tạo conversation mới
     */
    async createConversation(userId, data = {}) {
        try {
            const { courseId, lessonId, title, mode = 'general' } = data

            // Validate courseId and lessonId exist (if provided)
            let validCourseId = null
            let validLessonId = null
            let course = null
            let lesson = null

            if (courseId) {
                course = await prisma.course.findUnique({
                    where: { id: courseId },
                    select: { id: true, title: true },
                })
                if (course) {
                    validCourseId = courseId
                } else {
                    const error = new Error('Course not found')
                    error.statusCode = HTTP_STATUS.NOT_FOUND
                    throw error
                }
            }

            if (lessonId) {
                lesson = await prisma.lesson.findUnique({
                    where: { id: lessonId },
                    select: { id: true, title: true, courseId: true },
                })
                if (lesson) {
                    validLessonId = lessonId
                    // If lesson exists but courseId doesn't match, use lesson's courseId
                    if (!validCourseId && lesson.courseId) {
                        const lessonCourse = await prisma.course.findUnique({
                            where: { id: lesson.courseId },
                            select: { id: true, title: true },
                        })
                        if (lessonCourse) {
                            validCourseId = lesson.courseId
                            course = lessonCourse
                        }
                    }
                } else {
                    const error = new Error('Lesson not found')
                    error.statusCode = HTTP_STATUS.NOT_FOUND
                    throw error
                }
            }

            // Auto-generate title nếu không có
            let conversationTitle = title

            if (!conversationTitle) {
                if (course) {
                    conversationTitle = `Chat về ${course.title}`
                } else if (lesson) {
                    conversationTitle = `Chat về ${lesson.title}`
                } else {
                    conversationTitle = 'Trò chuyện chung'
                }
            }

            // Determine context type
            let contextType = AI_INTERACTION_TYPES.GENERAL_CHAT
            if (validLessonId) {
                contextType = AI_INTERACTION_TYPES.LESSON_HELP
            } else if (validCourseId) {
                contextType = AI_INTERACTION_TYPES.COURSE_OVERVIEW
            }

            const conversation = await prisma.conversation.create({
                data: {
                    userId,
                    courseId: validCourseId,
                    lessonId: validLessonId,
                    title: conversationTitle,
                    contextType,
                    mode, // Add mode from data or default to 'general'
                    aiModel: config.OLLAMA_MODEL || 'llama3.1:latest', // Use Ollama model name
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

            // Create an initial assistant greeting message so AI is the first sender
            try {
                const greetingText = (() => {
                    if (lesson) {
                        return `Xin chào! Tôi là Gia sư AI. Tôi có thể giúp bạn giải đáp về bài học "${lesson.title}" và hỗ trợ học tập. Bạn cần hỗ trợ gì không?`
                    }
                    if (course) {
                        return `Xin chào! Tôi là Gia sư AI. Tôi có thể giúp bạn giải đáp về khóa học "${course.title}" và hỗ trợ học tập. Bạn cần hỗ trợ gì không?`
                    }
                    return 'Xin chào! Tôi là Gia sư AI. Tôi có thể giúp bạn giải đáp thắc mắc, hỗ trợ học tập và tư vấn lộ trình. Bạn cần hỗ trợ gì không?'
                })()

                await prisma.chatMessage.create({
                    data: {
                        conversationId: conversation.id,
                        senderType: 'ai',
                        message: greetingText,
                        messageType: 'text',
                    },
                })

                // Update lastMessageAt to the greeting timestamp
                await prisma.conversation.update({
                    where: { id: conversation.id },
                    data: { lastMessageAt: new Date() },
                })
            } catch (greetErr) {
                logger.warn('Failed to create initial AI greeting message:', greetErr)
            }

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
    async sendMessage(userId, conversationId, messageText, mode = 'course', lessonId = null) {
        try {
            // 1. Verify conversation access (handles both public advisor and private conversations)
            const conversation = await this.verifyConversationAccess(conversationId, userId)

            // 2. Lưu message của user
            const userMessage = await prisma.chatMessage.create({
                data: {
                    conversationId,
                    senderType: 'user',
                    message: messageText,
                    messageType: 'text',
                },
            })

            // 3. Build context từ knowledge base (with timing)
            const contextStartTime = Date.now()
            // Pass mode and lessonId so knowledgeBaseService can use dynamic lessonId
            const context = await knowledgeBaseService.buildContext(
                userId,
                messageText,
                conversationId,
                { mode, dynamicLessonId: lessonId }
            )
            const contextDuration = Date.now() - contextStartTime
            logger.debug(`Knowledge base context built in ${contextDuration}ms`)

            // 4. Get conversation history for context (use knowledge base service)
            const conversationHistory =
                await knowledgeBaseService.getConversationHistory(
                    conversationId,
                    10
                )

            // 5. Generate response using Ollama (with improved fallback to template)
            let responseData
            let usedOllama = false
            let fallbackReason = null
            const responseStartTime = Date.now()

            try {
                // Check if Ollama is available (for all modes including advisor)
                const healthCheckStart = Date.now()
                const isOllamaAvailable = ollamaService.enabled && await ollamaService.checkHealth()
                const healthCheckDuration = Date.now() - healthCheckStart

                if (isOllamaAvailable) {
                    try {
                        // Set timeout for Ollama generation
                        const generationTimeout = 120000 // 120s
                        const timeoutPromise = new Promise((_, reject) => {
                            setTimeout(
                                () =>
                                    reject(
                                        new Error(
                                            'Ollama generation timeout'
                                        )
                                    ),
                                generationTimeout
                            )
                        })

                        // For advisor mode, use specialized generation
                        let generationPromise
                        if (mode === 'advisor') {
                            // Advisor mode: fetch courses first, then use Ollama to generate smart response
                            const availableCourses = context.searchResults?.courses || []
                            generationPromise = this.generateAdvisorResponse(
                                availableCourses,
                                messageText
                            )
                        } else {
                            // Other modes: use standard Ollama generation
                            generationPromise = this.generateOllamaResponse(
                                messageText,
                                conversationHistory,
                                context,
                                mode
                            )
                        }

                        responseData = await Promise.race([
                            generationPromise,
                            timeoutPromise,
                        ])
                        usedOllama = true
                        const responseDuration =
                            Date.now() - responseStartTime
                        logger.info(
                            `Response generated in ${responseDuration}ms (mode: ${mode}) ` +
                                `(health check: ${healthCheckDuration}ms, ` +
                                `hasKnowledgeBase: ${context.searchResults.totalResults > 0})`
                        )
                    } catch (ollamaError) {
                        const errorDuration = Date.now() - responseStartTime
                        fallbackReason =
                            ollamaError.message || 'Unknown error'

                        // Log error with context
                        if (ollamaError.message?.includes('timeout')) {
                            logger.warn(
                                `Ollama generation timeout after ${errorDuration}ms, falling back to template`
                            )
                        } else {
                            logger.error(
                                `Ollama generation failed after ${errorDuration}ms, falling back to template:`,
                                ollamaError.message,
                                ollamaError.stack
                            )
                        }

                        // Fallback to template with error context
                        responseData = this.generateTemplateResponse(
                            context,
                            messageText,
                            { error: fallbackReason }
                        )
                    }
                } else {
                    const checkDuration = Date.now() - responseStartTime
                    fallbackReason = 'Ollama service unavailable'
                    logger.warn(
                        `Ollama not available (checked in ${checkDuration}ms), falling back to template response`
                    )
                    responseData = this.generateTemplateResponse(
                        context,
                        messageText,
                        { reason: fallbackReason }
                    )
                }
            } catch (error) {
                // Catch-all error handler
                fallbackReason = error.message || 'Unexpected error'
                logger.error(
                    `Error generating response (${fallbackReason}), using template fallback:`,
                    error.message,
                    error.stack
                )
                // Fallback to template response
                responseData = this.generateTemplateResponse(
                    context,
                    messageText,
                    { error: fallbackReason }
                )
            }

            // 6. Lưu AI response
            const aiMessage = await prisma.chatMessage.create({
                data: {
                    conversationId,
                    senderType: 'ai',
                    message: responseData.text,
                    messageType: 'text',
                    metadata: {
                        sources: responseData.sources,
                        suggestedActions: responseData.suggestedActions,
                        usedOllama,
                        fallbackReason: fallbackReason || null,
                        responseTime: Date.now() - responseStartTime,
                        mode,
                    },
                },
            })

            // 7. Update conversation last message time
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
     * Send message with streaming response (for better UX)
     */
    async sendMessageStream(userId, conversationId, messageText, mode = 'course', onChunk, lessonId = null) {
        try {
            // 1. Verify conversation access (handles both public advisor and private conversations)
            const conversation = await this.verifyConversationAccess(conversationId, userId)

            // 2. Lưu message của user
            const userMessage = await prisma.chatMessage.create({
                data: {
                    conversationId,
                    senderType: 'user',
                    message: messageText,
                    messageType: 'text',
                },
            })

            // Send user message chunk
            onChunk({
                type: 'user_message',
                data: userMessage,
            })

            // 3. Build context từ knowledge base (fast, with cache)
            const context = await knowledgeBaseService.buildContext(
                userId,
                messageText,
                conversationId,
                { mode, dynamicLessonId: lessonId }
            )

            // 4. Get conversation history
            const conversationHistory =
                await knowledgeBaseService.getConversationHistory(
                    conversationId,
                    5 // Reduced from 10 to speed up
                )

            // 5. Generate streaming response using Ollama
            let fullResponse = ''
            let sources = []
            let suggestedActions = []
            let streamingError = null
            let usedOllama = false

            try {
                if (ollamaService.enabled) {
                    const isOllamaAvailable = await ollamaService.checkHealth()
                    if (isOllamaAvailable) {
                        // Build system prompt
                        const systemPrompt =
                            ollamaService.buildSystemPrompt(context, mode)

                        // Stream response from Ollama
                        try {
                            for await (const chunk of ollamaService.generateResponseStream(
                                messageText,
                                conversationHistory,
                                systemPrompt
                            )) {
                                fullResponse += chunk
                                onChunk({
                                    type: 'ai_chunk',
                                    chunk: chunk,
                                    accumulated: fullResponse,
                                })
                            }

                            usedOllama = true

                            // Extract sources and actions from context
                            if (context.searchResults.transcripts.length > 0) {
                                sources.push(
                                    ...context.searchResults.transcripts
                                        .slice(0, 3)
                                        .map((t) => ({
                                            type: 'transcript',
                                            lessonId: t.lessonId,
                                            lessonTitle: t.lessonTitle,
                                            courseId: t.courseId,
                                            courseTitle: t.courseTitle,
                                            timestamp: t.timestamp,
                                            videoUrl: t.videoUrl,
                                            excerpt: t.excerpt,
                                        }))
                                )
                            }
                            if (context.searchResults.lessons.length > 0) {
                                sources.push(
                                    ...context.searchResults.lessons
                                        .slice(0, 2)
                                        .map((l) => ({
                                            type: 'lesson',
                                            lessonId: l.id,
                                            lessonTitle: l.title,
                                            courseId: l.courseId,
                                            courseTitle: l.course?.title,
                                        }))
                                )
                            }

                            // Build suggested actions
                            if (context.searchResults.transcripts.length > 0) {
                                const topTranscript =
                                    context.searchResults.transcripts[0]
                                suggestedActions.push({
                                    type: 'watch_video',
                                    label: 'Xem video',
                                    url: topTranscript.videoUrl,
                                    timestamp: topTranscript.startTime,
                                })
                            }
                            if (context.searchResults.lessons.length > 0) {
                                suggestedActions.push({
                                    type: 'view_lesson',
                                    label: 'Xem bài học',
                                    lessonId:
                                        context.searchResults.lessons[0].id,
                                })
                            }
                        } catch (streamError) {
                            streamingError = streamError
                            logger.error(
                                'Error during Ollama streaming:',
                                streamError
                            )
                            // Continue to fallback
                        }
                    }

                    // Fallback to template if Ollama not available or streaming failed
                    if (
                        !isOllamaAvailable ||
                        streamingError ||
                        !fullResponse.trim()
                    ) {
                        logger.warn(
                            'Falling back to template response (Ollama unavailable or streaming failed)'
                        )
                        const templateResponse = this.generateTemplateResponse(
                            context,
                            messageText
                        )
                        fullResponse = templateResponse.text
                        sources = templateResponse.sources || []
                        suggestedActions =
                            templateResponse.suggestedActions || []

                        // Send as single chunk if not already streaming
                        if (
                            !fullResponse.includes('\n') ||
                            fullResponse.length < 100
                        ) {
                            onChunk({
                                type: 'ai_chunk',
                                chunk: fullResponse,
                                accumulated: fullResponse,
                            })
                        }
                    }
                } else {
                    // Ollama disabled, use template
                    const templateResponse = this.generateTemplateResponse(
                        context,
                        messageText
                    )
                    fullResponse = templateResponse.text
                    sources = templateResponse.sources || []
                    suggestedActions = templateResponse.suggestedActions || []
                    onChunk({
                        type: 'ai_chunk',
                        chunk: fullResponse,
                        accumulated: fullResponse,
                    })
                }
            } catch (error) {
                logger.error('Error in streaming response:', error)
                // Fallback to template
                const templateResponse = this.generateTemplateResponse(
                    context,
                    messageText
                )
                fullResponse = templateResponse.text
                sources = templateResponse.sources || []
                suggestedActions = templateResponse.suggestedActions || []
                onChunk({
                    type: 'ai_chunk',
                    chunk: fullResponse,
                    accumulated: fullResponse,
                })
            }

            // 6. Lưu AI response
            const aiMessage = await prisma.chatMessage.create({
                data: {
                    conversationId,
                    senderType: 'ai',
                    message: fullResponse,
                    messageType: 'text',
                    metadata: {
                        sources,
                        suggestedActions,
                        usedOllama,
                        fallbackReason: streamingError ? (streamingError.message || String(streamingError)) : null,
                        responseTime: Date.now() - responseStartTime,
                        mode,
                    },
                },
            })

            // 7. Update conversation
            await prisma.conversation.update({
                where: { id: conversationId },
                data: { lastMessageAt: new Date() },
            })

            // Send final message
            onChunk({
                type: 'ai_message',
                data: aiMessage,
            })

            logger.info(`Streamed message in conversation ${conversationId}`)
        } catch (error) {
            logger.error('Error streaming message:', error)
            throw error
        }
    }

    /**
     * Generate response using Ollama with knowledge base context
     */
    async generateOllamaResponse(messageText, conversationHistory, context, mode = 'course') {
        try {
            // Build system prompt with knowledge base
            const systemPrompt = ollamaService.buildSystemPrompt(context, mode)

            // Generate response from Ollama
            const aiResponse = await ollamaService.generateResponse(
                messageText,
                conversationHistory,
                systemPrompt
            )

            // Extract sources from context
            const sources = []
            if (context.searchResults.transcripts.length > 0) {
                sources.push(
                    ...context.searchResults.transcripts
                        .slice(0, 3)
                        .map((t) => ({
                            type: 'transcript',
                            lessonId: t.lessonId,
                            lessonTitle: t.lessonTitle,
                            courseId: t.courseId,
                            courseTitle: t.courseTitle,
                            timestamp: t.timestamp,
                            videoUrl: t.videoUrl,
                            excerpt: t.excerpt,
                        }))
                )
            }
            if (context.searchResults.lessons.length > 0) {
                sources.push(
                    ...context.searchResults.lessons.slice(0, 2).map((l) => ({
                        type: 'lesson',
                        lessonId: l.id,
                        lessonTitle: l.title,
                        courseId: l.courseId,
                        courseTitle: l.course.title,
                    }))
                )
            }

            // Build suggested actions based on search results
            const suggestedActions = []
            if (context.searchResults.transcripts.length > 0) {
                const topTranscript = context.searchResults.transcripts[0]
                suggestedActions.push({
                    type: 'watch_video',
                    label: 'Xem video',
                    url: topTranscript.videoUrl,
                    timestamp: topTranscript.startTime,
                })
            }
            if (context.searchResults.lessons.length > 0) {
                suggestedActions.push({
                    type: 'view_lesson',
                    label: 'Xem bài học',
                    lessonId: context.searchResults.lessons[0].id,
                })
            }

            // Prefix clarity for lesson mode: always state which lesson/course
            let prefix = ''
            if (mode === 'course') {
                const lessonTitle =
                    context?.searchResults?.transcripts?.[0]?.lessonTitle ||
                    context?.userContext?.currentLesson?.title ||
                    null
                const courseTitle =
                    context?.searchResults?.transcripts?.[0]?.courseTitle ||
                    context?.userContext?.currentCourse?.title ||
                    null

                if (lessonTitle || courseTitle) {
                    prefix += `🔎 Ngữ cảnh: Bài học${lessonTitle ? ` "${lessonTitle}"` : ''}${courseTitle ? ` trong khóa "${courseTitle}"` : ''}.\n\n`
                }
                // If nothing found in this lesson, state it clearly and suggest options
                const hasResults = (context?.searchResults?.totalResults || 0) > 0
                if (!hasResults && lessonTitle) {
                    prefix += `⚠️ Không tìm thấy nội dung liên quan trong bài học này. Bạn có thể:\n- Chuyển sang tùy chọn "Tổng quan" để hỏi chung\n- Hoặc mô tả chi tiết hơn câu hỏi\n\n`
                }
            }

            return {
                text: prefix + aiResponse,
                sources: sources.slice(0, 5), // Limit to 5 sources
                suggestedActions,
            }
        } catch (error) {
            logger.error('Error in generateOllamaResponse:', error)
            throw error
        }
    }

    // getConversationHistory moved to knowledgeBaseService to avoid duplication

    /**
     * Generate template response (fallback method)
     * @param {Object} context - Knowledge base context
     * @param {string} query - User query
     * @param {Object} options - Additional options (error, reason)
     */
    async generateTemplateResponse(context, query, options = {}) {
        const { searchResults, userContext, mode } = context

        // ADVISOR MODE: Recommend courses based on search results
        if (mode === 'advisor') {
            return await this.generateAdvisorResponse(searchResults.courses, query)
        }

        // If in general mode, return a friendly conversational fallback
        if (mode === 'general') {
            return this.generateGeneralFallbackResponse(query)
        }

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

        // CASE 4: Không tìm thấy gì - nhưng nếu đang hỏi về nội dung bài học và có currentLesson,
        // thì trả về thông tin từ lesson content/description
        const isAskingAboutContent =
            /nội dung|content|bài học này|lesson/i.test(query)
        if (isAskingAboutContent && userContext.currentLesson) {
            return this.generateLessonContentResponse(
                userContext.currentLesson,
                query
            )
        }

        // CASE 5: Không tìm thấy gì
        return this.generateNoResultResponse(query, userContext)
    }

    /**
     * Response cho advisor mode - sử dụng LLM để hiểu context nhưng chỉ gợi ý khóa học thực
     */
    async generateAdvisorResponse(courses, query, conversationHistory = []) {
        // Check if query is greeting or learning-related
        const isGreeting = this._isGreeting(query)
        
        if (isGreeting) {
            // For greetings, return welcome message
            const text = `👋 Xin chào! Tôi là Trợ lý AI, sẵn sàng giúp bạn tìm khóa học lập trình phù hợp.

🎯 Hãy cho tôi biết:
- Bạn muốn học về lĩnh vực gì trong lập trình? (Web, Mobile, Data, AI, Game, v.v.)
- Level hiện tại của bạn ra sao? (Cơ bản/Trung cấp/Nâng cao)
- Bạn có bao nhiêu thời gian để học?

Dựa trên thông tin của bạn, tôi sẽ gợi ý những khóa học tốt nhất! 💡`
            return {
                text,
                sources: [],
                suggestedActions: []
            }
        }

        // For learning-related queries, use LLM to understand context
        // Then show real courses with intelligent explanation
        try {
            const availableCourses = courses && courses.length > 0 ? courses : []

            // Filter courses that are relevant to the user's intent
            const relevantCourses = availableCourses.filter((course) =>
                this._isCourseRelevant(query, course)
            )

            // Build a prompt that prevents hallucination and only uses relevant courses
            const coursesForPrompt = relevantCourses.length > 0 ? relevantCourses : []
            const coursesList = coursesForPrompt
                .map((c, i) => `${i + 1}. ${c.title} (${c.durationHours}h, ${c.totalLessons} bài học)`)
                .join('\n')

            const prompt = `Bạn là trợ lý tư vấn khóa học lập trình. Người dùng nói: "${query}"

Khóa học có sẵn (chỉ các khóa liên quan):
${coursesList || 'Không có khóa học nào phù hợp'}

Hãy:
1. Xác nhận/hiểu yêu cầu của họ (ví dụ: "Bạn muốn học về game development")
2. Giải thích khóa học nào phù hợp NHẤT với nhu cầu (hoặc tại sao không có khóa học phù hợp)
3. Nếu không có khóa học đúng, hãy gợi ý khóa học có liên quan làm nền tảng
4. Hỏi câu hỏi tiếp theo để hiểu rõ hơn

Chỉ nhắc đến khóa học có trong danh sách. KHÔNG tạo ra khóa học mới.`

            // Use Ollama to understand context and generate explanation
            const contextResponse = await ollamaService.generateResponse(prompt)
            let advisorMessage = contextResponse

            logger.info(`✅ Ollama used for advisor response generation`)

            // Include relevant courses only when we found matches
            if (relevantCourses.length > 0) {
                advisorMessage += `\n\nTìm thấy ${relevantCourses.length} khóa học phù hợp. Xem danh sách bên dưới 👇`
            }

            // Build sources from courses
            const sources = relevantCourses.slice(0, 4).map((course) => ({
                type: 'course',
                courseId: course.id,
                courseTitle: course.title,
                courseSlug: course.slug,
                level: course.level,
                price: course.price,
                discountPrice: course.discountPrice,
                rating: course.ratingAvg,
                ratingCount: course.ratingCount,
                enrolledCount: course.enrolledCount,
                duration: course.durationHours,
                lessons: course.totalLessons,
                description: course.shortDescription,
                thumbnail: course.thumbnailUrl,
                instructor: course.instructor,
            }))

            // If no relevant courses, add a follow-up prompt instead of empty list
            if (relevantCourses.length === 0) {
                advisorMessage += `\n\nHiện chưa có khóa học khớp với yêu cầu của bạn. Hãy cho tôi biết thêm: bạn muốn học ngôn ngữ nào (Python, JavaScript, v.v.) và mục tiêu cụ thể (AI, Data, Web, Game)?`
            }

            return { text: advisorMessage, sources }
        } catch (error) {
            logger.error('Error in generateAdvisorResponse:', error)
            
            // Smarter fallback when Ollama unavailable
            const availableCourses = courses && courses.length > 0 ? courses : []
            const queryLower = query.toLowerCase()
            
            let text = ''
            let shouldShowCourses = true
            
            // Detect user intent
            if (queryLower.includes('khác') || queryLower.includes('nào khác')) {
                // User asking for other/different courses
                if (availableCourses.length === 1) {
                    text = `📚 Hiện tại chúng tôi chỉ có **1 khóa học**: JavaScript cơ bản.\n\n`
                    text += `🎯 Bạn có thể:\n`
                    text += `1. Đăng ký khóa học này để bắt đầu\n`
                    text += `2. Cho tôi biết lĩnh vực bạn quan tâm (Web, Mobile, AI, Game, Data...)\n`
                    text += `3. Chúng tôi sẽ thêm khóa học phù hợp sớm\n\n`
                    text += `Bạn muốn học gì? 😊`
                } else {
                    text = `✨ Dưới đây là tất cả các khóa học có sẵn:\n\n`
                }
            } else if (queryLower.includes('tư vấn') || queryLower.includes('gợi ý') || queryLower.includes('nên học gì')) {
                // User asking for consultation/advice
                text = `👨‍💼 Tôi sẵn sàng tư vấn! Để giúp bạn tốt hơn, hãy cho tôi biết:\n\n`
                text += `🎯 **Câu hỏi để tôi hiểu rõ hơn:**\n`
                text += `1. Bạn muốn học về lĩnh vực gì? (Web, Mobile, Backend, Data, AI, Game, v.v.)\n`
                text += `2. Level hiện tại của bạn? (Beginner, Intermediate, Advanced)\n`
                text += `3. Bạn có bao nhiêu thời gian để học mỗi tuần?\n`
                text += `4. Mục tiêu học tập của bạn là gì? (Tìm việc, nâng cao kỹ năng, hobby...)\n\n`
                text += `Sau đó tôi sẽ gợi ý khóa học phù hợp nhất! 💡`
                shouldShowCourses = false
            } else if (queryLower.length < 5 || /^(ok|được|gì|vâng|okela|okie)$/i.test(queryLower)) {
                // Too short or acknowledgment
                text = `👋 Bạn muốn biết gì thêm? Tôi có thể giúp bạn:\n\n`
                text += `- 🔍 Tìm khóa học theo lĩnh vực\n`
                text += `- 📚 Gợi ý khóa học phù hợp với level của bạn\n`
                text += `- ❓ Trả lời các câu hỏi về khóa học\n\n`
                text += `Hãy nói cho tôi biết bạn muốn học gì! 😊`
                shouldShowCourses = false
            } else {
                // General learning-related query
                text = `✨ Bạn quan tâm đến: **${query}**\n\n`
            }
            
            // Lọc khóa học liên quan dựa trên intent
            const relevantCourses = shouldShowCourses
                ? availableCourses.filter((course) => this._isCourseRelevant(query, course))
                : []

            // Nếu không có khóa liên quan, đừng hiển thị danh sách
            if (shouldShowCourses && relevantCourses.length === 0) {
                text += `Hiện chưa có khóa học phù hợp với yêu cầu này. Hãy cho tôi biết lĩnh vực/ngôn ngữ bạn muốn học (AI, Python, Web, v.v.) để tôi gợi ý chính xác hơn!`
            }

            // Show courses if relevant
            if (shouldShowCourses && relevantCourses.length > 0) {
                text += `Tìm thấy ${relevantCourses.length} khóa học phù hợp. Xem danh sách bên dưới 👇`
            }
            
            if (shouldShowCourses) {
                const sources = relevantCourses.slice(0, 4).map((course) => ({
                    type: 'course',
                    courseId: course.id,
                    courseTitle: course.title,
                    courseSlug: course.slug,
                    level: course.level,
                    price: course.price,
                    discountPrice: course.discountPrice,
                    rating: course.ratingAvg,
                    ratingCount: course.ratingCount,
                    enrolledCount: course.enrolledCount,
                    duration: course.durationHours,
                    lessons: course.totalLessons,
                    description: course.shortDescription,
                    thumbnail: course.thumbnailUrl,
                    instructor: course.instructor,
                }))

                return { text, sources }
            } else {
                return { text, sources: [] }
            }
        }
    }

    /**
     * Check if query is a greeting
     */
    _isGreeting(query) {
        if (!query || query.trim().length === 0) return true
        const greetings = /^(xin chào|chào|hello|hi|halo|hey|xin chào bạn|chào bạn|chào em|xin kính chào|tình hình|sao|sao rồi|thế nào|khỏe không|bạn khỏe không|alo|ê|ơi)$/i
        return greetings.test(query.trim())
    }

    /**
     * Check if a course is relevant to the query
     */
    _isCourseRelevant(query, course) {
        if (!query || query.trim().length === 0) return false

        const haystack = `${course.title || ''} ${course.shortDescription || ''} ${course.description || ''} ${course.whatYouLearn || ''}`.toLowerCase()

        // Filter out generic Vietnamese stopwords so we only match on meaningful tech keywords
        const stopwords = new Set([
            'hoc', 'học', 'muon', 'muốn', 'toi', 'tôi', 'ban', 'bạn', 'lam', 'làm', 'viec', 'việc',
            'can', 'cần', 'gi', 'gì', 'the', 'thế', 'nào', 'phu', 'phù', 'hop', 'hợp', 'de', 'để',
            've', 'về', 'khoa', 'khóa', 'lop', 'lớp', 'co', 'có', 'trinh', 'trình', 'lap', 'lập',
            'co', 'có', 'coi', 'xem', 'camon', 'cảm', 'cảm ơn', 'on', 'ơn'
        ])

        const allowShortKeywords = new Set(['ai', 'js', 'go', 'c', 'c++', 'c#', 'ui', 'ux', 'sql'])

        const keywords = query
            .toLowerCase()
            .split(/[^\p{L}\p{N}+#.]+/u)
            .filter((w) => w.length > 0)
            .filter((w) => (w.length >= 3 || allowShortKeywords.has(w)) && !stopwords.has(w))

        if (keywords.length === 0) return false

        return keywords.some((kw) => haystack.includes(kw))
    }
    generateTranscriptResponse(transcripts, query) {
        const topResult = transcripts[0]

        // Check if this is a full transcript request
        const isFullTranscript = topResult.isFullTranscript || false

        let text = `📚 **${isFullTranscript ? 'Nội dung transcript của bài học' : 'Tìm thấy thông tin trong bài học'}!**\n\n`
        text += `**Bài:** ${topResult.lessonTitle}\n`
        text += `**Khóa học:** ${topResult.courseTitle}\n`

        if (topResult.timestamp && !isFullTranscript) {
            text += `**Thời điểm:** ${topResult.timestamp}\n\n`
        }

        if (isFullTranscript) {
            // Show full transcript content
            text += `**Nội dung transcript (${topResult.totalSegments || 0} đoạn):**\n\n`
            text += `${topResult.excerpt}\n\n`
            if (topResult.text.length > 2000) {
                text += `\n*Đây là phần đầu của transcript. Để xem đầy đủ, vui lòng xem video bài học.*\n\n`
            }
        } else {
            text += `**Nội dung:**\n> ${topResult.excerpt}\n\n`
        }

        if (topResult.videoUrl && topResult.startTime) {
            text += `🎥 **[Xem video tại đây](${topResult.videoUrl}?t=${Math.floor(topResult.startTime)})**\n\n`
        }

        // Nếu có nhiều kết quả
        if (transcripts.length > 1 && !isFullTranscript) {
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
     * Response khi hỏi về nội dung bài học nhưng không có transcript
     */
    generateLessonContentResponse(currentLesson, query) {
        let text = `📖 **Thông tin về bài học:**\n\n`
        text += `**Bài:** ${currentLesson.title || 'N/A'}\n\n`

        if (currentLesson.description) {
            text += `**Mô tả:**\n${currentLesson.description}\n\n`
        }

        if (currentLesson.content) {
            const contentPreview =
                currentLesson.content.length > 500
                    ? currentLesson.content.substring(0, 500) + '...'
                    : currentLesson.content
            text += `**Nội dung:**\n${contentPreview}\n\n`
        }

        text += `💡 *Để xem đầy đủ nội dung, vui lòng xem video bài học hoặc mô tả chi tiết trong trang bài học.*`

        return {
            text,
            sources: [
                {
                    type: 'lesson',
                    lessonId: currentLesson.id,
                    lessonTitle: currentLesson.title,
                },
            ],
            suggestedActions: [
                {
                    type: 'view_lesson',
                    label: 'Xem bài học',
                    lessonId: currentLesson.id,
                },
            ],
        }
    }

    /**
     * Response khi không tìm thấy gì
     */
    generateNoResultResponse(query, userContext) {
        let text = `😔 **Xin lỗi, tôi không tìm thấy thông tin về "${query}"**\n\n`

        // Check if query is asking about lesson content
        const isAskingAboutContent = /nội dung|content|bài học|lesson/i.test(
            query
        )

        if (isAskingAboutContent && userContext.currentLesson) {
            text += `Trong bài học: **${userContext.currentLesson.title}**, tôi không tìm thấy nội dung liên quan. `
            text += `Bạn có thể xem lại video bài học hoặc mô tả bài học để biết thêm chi tiết.\n\n`
            text += `**Gợi ý chuyển tùy chọn:**\n`
            text += `- Chuyển sang "Khóa học" để tìm trong toàn bộ khóa\n`
            text += `- Chuyển sang "Tổng quan" để đặt câu hỏi chung\n\n`
        }

        if (userContext.currentCourse) {
            text += `Bạn đang học khóa: **${userContext.currentCourse.title}**\n\n`
            text += `**Gợi ý:**\n`
            text += `- Kiểm tra lại từ khóa tìm kiếm\n`
            text += `- Xem lại các bài học trong khóa học\n`
            if (isAskingAboutContent) {
                text += `- Xem video bài học để hiểu rõ hơn về nội dung\n`
            }
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
     * General fallback for non-course mode (friendly conversational replies)
     */
    generateGeneralFallbackResponse(query) {
        const greetingRegex = /(xin chào|chào|hello|hi|hey|có ở đó|are you there)/i
        if (greetingRegex.test(query)) {
            const text = `Chào bạn! Mình là Gia sư AI — mình có thể giúp bạn những gì về lập trình hoặc học tập hôm nay?`
            return { text, sources: [], suggestedActions: [] }
        }

        const text = `Mình có thể giúp trả lời các câu hỏi về lập trình, khóa học và học tập. Bạn muốn hỏi điều gì cụ thể?`
        return { text, sources: [], suggestedActions: [] }
    }

    /**
     * Get messages trong conversation (optimized: combine verification with count)
     */
    async getMessages(conversationId, userId, page = 1, limit = 50, order = 'asc') {
        try {
            // Verify conversation access (allows both public advisor and private conversations)
            const conversation = await this.verifyConversationAccess(conversationId, userId)

            const [messages, total] = await Promise.all([
                prisma.chatMessage.findMany({
                    where: { conversationId },
                    orderBy: { createdAt: order === 'desc' ? 'desc' : 'asc' },
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
                }),
                prisma.chatMessage.count({
                    where: { conversationId },
                }),
            ])

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
                const error = new Error('Message not found or access denied')
                error.statusCode = 404
                throw error
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
            const { isArchived = false, page = 1, limit = 20, mode } = options

            const where = {
                userId,
                isArchived,
            }

            // Add mode filter if provided
            if (mode) {
                where.mode = mode
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
                    messages: {
                        take: 1,
                        orderBy: { createdAt: 'desc' },
                        select: {
                            message: true,
                            senderType: true,
                        },
                    },
                },
            })

            // Map to include lastMessage in a cleaner format
            const conversationsWithLastMessage = conversations.map(conv => ({
                ...conv,
                lastMessage: conv.messages?.[0]?.message || null,
                lastMessageSender: conv.messages?.[0]?.senderType || null,
            }))

            const total = await prisma.conversation.count({ where })

            return {
                conversations: conversationsWithLastMessage,
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
            // Verify conversation access (only allow deletion of conversations owned by user, not public advisor conversations)
            const conversation = await prisma.conversation.findUnique({
                where: { id: conversationId }
            })

            if (!conversation) {
                const error = new Error('Conversation not found')
                error.statusCode = 404
                throw error
            }

            // Only owner can archive their conversation
            if (conversation.userId !== userId) {
                const error = new Error('Access denied: Only conversation owner can archive')
                error.statusCode = 403
                throw error
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
            const conversation = await prisma.conversation.findUnique({
                where: { id: conversationId }
            })

            if (!conversation) {
                const error = new Error('Conversation not found')
                error.statusCode = 404
                throw error
            }

            // Only owner can delete their conversation (advisor conversations are temporary and read-only)
            if (conversation.userId !== userId) {
                const error = new Error('Access denied: Only conversation owner can delete')
                error.statusCode = 403
                throw error
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

    /**
     * Update conversation
     */
    async updateConversation(conversationId, userId, data) {
        try {
            const conversation = await prisma.conversation.findUnique({
                where: { id: conversationId }
            })

            if (!conversation) {
                const error = new Error('Conversation not found')
                error.statusCode = 404
                throw error
            }

            // Only owner can update their conversation (advisor conversations are read-only)
            if (conversation.userId !== userId) {
                const error = new Error('Access denied: Only conversation owner can update')
                error.statusCode = 403
                throw error
            }

            const updated = await prisma.conversation.update({
                where: { id: conversationId },
                data: {
                    title: data.title,
                },
            })

            logger.info(`Updated conversation ${conversationId}`)
            return updated
        } catch (error) {
            logger.error('Error updating conversation:', error)
            throw error
        }
    }
}

export default new AIChatService()
