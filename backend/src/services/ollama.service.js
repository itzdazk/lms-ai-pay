// src/services/ollama.service.js
import config from '../config/app.config.js'
import logger from '../config/logger.config.js'

class OllamaService {

    /**
     * Check if Ollama is available (with timeout and caching)
     */
    constructor() {
        this.enabled = config.OLLAMA_ENABLED !== false
        this.baseUrl = config.OLLAMA_BASE_URL || 'http://localhost:11434'
        this.model = config.OLLAMA_MODEL || 'llama3.1:latest'
        this.temperature = config.OLLAMA_TEMPERATURE || 0.7
        this.maxTokens = config.OLLAMA_MAX_TOKENS || 2000
        this.healthCheckCache = { isHealthy: null, lastCheck: 0 }
        this.healthCheckCacheTTL = 30000 // 30 seconds
        
        if (this.enabled) {
            logger.info(`Ollama service initialized: ${this.baseUrl}, model: ${this.model}`)
        }
    }

    async checkHealth() {
        try {
            // Cache health check for 30 seconds
            const now = Date.now()
            if (
                this.healthCheckCache.isHealthy !== null &&
                now - this.healthCheckCache.lastCheck < this.healthCheckCacheTTL
            ) {
                return this.healthCheckCache.isHealthy
            }

            // Add timeout to prevent hanging
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 3000) // 3s timeout

            const response = await fetch(`${this.baseUrl}/api/tags`, {
                signal: controller.signal,
            })

            clearTimeout(timeoutId)

            const isHealthy = response.ok
            this.healthCheckCache = {
                isHealthy,
                lastCheck: now,
            }

            return isHealthy
        } catch (error) {
            if (error.name === 'AbortError') {
                logger.warn('Ollama health check timeout')
            } else {
                logger.warn('Ollama health check failed:', error.message)
            }
            this.healthCheckCache = {
                isHealthy: false,
                lastCheck: Date.now(),
            }
            return false
        }
    }

    /**
     * Generate response using Ollama chat API
     * @param {string} prompt - User message
     * @param {Array} context - Conversation context (messages history)
     * @param {Object} systemPrompt - System prompt with knowledge base context
     * @returns {Promise<string>} AI response
     */
    async generateResponse(prompt, context = [], systemPrompt = null) {
        if (!this.enabled) {
            throw new Error('Ollama is disabled')
        }

        try {
            // Build messages array
            const messages = []

            // Add system prompt if provided
            if (systemPrompt) {
                messages.push({
                    role: 'system',
                    content: systemPrompt,
                })
            }

            // Add conversation history
            context.forEach((msg) => {
                messages.push({
                    role: msg.senderType === 'user' ? 'user' : 'assistant',
                    content: msg.message,
                })
            })

            // Add current user message
            messages.push({
                role: 'user',
                content: prompt,
            })

            // Call Ollama API with timeout
            logger.debug(`Calling Ollama API: ${this.baseUrl}/api/chat with model: ${this.model}`)
            const startTime = Date.now()
            
            const controller = new AbortController()
            // Increase timeout to 120s for complex queries (llama3.1 can be slow)
            const timeoutId = setTimeout(() => controller.abort(), 120000) // 120s timeout for generation
            
            try {
                const response = await fetch(`${this.baseUrl}/api/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    signal: controller.signal,
                    body: JSON.stringify({
                        model: this.model,
                        messages: messages,
                        stream: false,
                        options: {
                            temperature: this.temperature,
                            num_predict: this.maxTokens,
                        },
                    }),
                })
                
                clearTimeout(timeoutId)
                
                const duration = Date.now() - startTime
                logger.info(`Ollama API call completed in ${duration}ms`)

                if (!response.ok) {
                    const errorText = await response.text()
                    logger.error(`Ollama API error: ${response.status} - ${errorText}`)
                    throw new Error(
                        `Ollama API error: ${response.status} - ${errorText}`
                    )
                }

                const data = await response.json()

                if (!data.message || !data.message.content) {
                    throw new Error('Invalid response from Ollama API')
                }

                const totalDuration = Date.now() - startTime
                logger.info(
                    `Ollama response generated (${data.message.content.length} chars) in ${totalDuration}ms`
                )

                return data.message.content.trim()
            } catch (error) {
                clearTimeout(timeoutId)
                const errorDuration = Date.now() - startTime
                if (error.name === 'AbortError') {
                    logger.error(`Ollama API timeout after ${errorDuration}ms (60s limit)`)
                    throw new Error(`Ollama API timeout - response took too long (${errorDuration}ms)`)
                }
                logger.error(`Error generating Ollama response after ${errorDuration}ms:`, error.message, error.stack)
                throw error
            }
        } catch (error) {
            logger.error('Error generating Ollama response:', error)
            throw error
        }
    }

    /**
     * Generate response with streaming (for future use)
     */
    async *generateResponseStream(prompt, context = [], systemPrompt = null) {
        if (!this.enabled) {
            throw new Error('Ollama is disabled')
        }

        try {
            const messages = []

            if (systemPrompt) {
                messages.push({
                    role: 'system',
                    content: systemPrompt,
                })
            }

            context.forEach((msg) => {
                messages.push({
                    role: msg.senderType === 'user' ? 'user' : 'assistant',
                    content: msg.message,
                })
            })

            messages.push({
                role: 'user',
                content: prompt,
            })

            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    stream: true,
                    options: {
                        temperature: this.temperature,
                        num_predict: this.maxTokens,
                    },
                }),
            })

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status}`)
            }

            const reader = response.body.getReader()
            const decoder = new TextDecoder()

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value)
                const lines = chunk.split('\n').filter((line) => line.trim())

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line)
                        if (data.message && data.message.content) {
                            yield data.message.content
                        }
                    } catch (e) {
                        // Skip invalid JSON lines
                    }
                }
            }
        } catch (error) {
            logger.error('Error in Ollama stream:', error)
            throw error
        }
    }

    /**
     * Build system prompt with knowledge base context
     */
    buildSystemPrompt(context) {
        const { searchResults, userContext } = context

        let systemPrompt = `Bạn là AI Tutor thông minh và nhiệt tình, chuyên hỗ trợ học viên trong hệ thống E-Learning. 
Nhiệm vụ của bạn là trả lời câu hỏi dựa trên kiến thức từ các khóa học và bài học mà học viên đã đăng ký.

HƯỚNG DẪN:
- Trả lời bằng tiếng Việt, tự nhiên và dễ hiểu
- Sử dụng thông tin từ knowledge base được cung cấp bên dưới
- Nếu không tìm thấy thông tin, hãy thành thật nói không biết và gợi ý học viên tìm kiếm khác
- Luôn khuyến khích và động viên học viên
- Có thể đưa ra ví dụ cụ thể để giải thích

`

        // Add user context
        if (userContext && userContext.currentCourse) {
            systemPrompt += `NGỮ CẢNH HỌC VIÊN:
- Đang học khóa học: "${userContext.currentCourse.title}"
- Tiến độ: ${userContext.currentCourse.progress}%
- Bài học hiện tại: ${userContext.currentLesson?.title || 'Chưa bắt đầu'}

`
        }

        // Add search results context (limit to avoid token overflow and slow response)
        const MAX_SYSTEM_PROMPT_LENGTH = 1500 // Reduced to speed up generation (faster response)
        let currentLength = systemPrompt.length

        if (searchResults && searchResults.totalResults > 0) {
            systemPrompt += `THÔNG TIN TỪ KNOWLEDGE BASE:\n\n`

            // Transcripts (highest priority) - limit to 2 to save tokens
            if (
                searchResults.transcripts &&
                searchResults.transcripts.length > 0 &&
                currentLength < MAX_SYSTEM_PROMPT_LENGTH
            ) {
                systemPrompt += `=== TRANSCRIPT (Nội dung từ video bài học) ===\n`
                const transcriptsToInclude = searchResults.transcripts.slice(0, 2)
                transcriptsToInclude.forEach((t, idx) => {
                    const excerpt = (t.excerpt || t.text || '').substring(0, 200)
                    const transcriptInfo = `${idx + 1}. Bài: "${t.lessonTitle}"\n   Khóa học: "${t.courseTitle}"\n${t.timestamp ? `   Thời điểm: ${t.timestamp}\n` : ''}   Nội dung: "${excerpt}"\n\n`
                    if (currentLength + transcriptInfo.length < MAX_SYSTEM_PROMPT_LENGTH) {
                        systemPrompt += transcriptInfo
                        currentLength += transcriptInfo.length
                    }
                })
            }

            // Lessons - limit to 2
            if (
                searchResults.lessons &&
                searchResults.lessons.length > 0 &&
                currentLength < MAX_SYSTEM_PROMPT_LENGTH
            ) {
                systemPrompt += `=== BÀI HỌC LIÊN QUAN ===\n`
                const lessonsToInclude = searchResults.lessons.slice(0, 2)
                lessonsToInclude.forEach((l, idx) => {
                    const desc = l.description
                        ? l.description.substring(0, 100)
                        : ''
                    const lessonInfo = `${idx + 1}. "${l.title}"\n   Khóa học: "${l.course?.title || 'N/A'}"\n${desc ? `   Mô tả: "${desc}..."\n\n` : '\n'}`
                    if (currentLength + lessonInfo.length < MAX_SYSTEM_PROMPT_LENGTH) {
                        systemPrompt += lessonInfo
                        currentLength += lessonInfo.length
                    }
                })
            }

            // Courses - limit to 1
            if (
                searchResults.courses &&
                searchResults.courses.length > 0 &&
                currentLength < MAX_SYSTEM_PROMPT_LENGTH
            ) {
                systemPrompt += `=== KHÓA HỌC LIÊN QUAN ===\n`
                const course = searchResults.courses[0]
                const courseDesc = course.shortDescription
                    ? course.shortDescription.substring(0, 100)
                    : ''
                const courseInfo = `1. "${course.title}" (${course.level || 'N/A'})\n${courseDesc ? `   Mô tả: "${courseDesc}..."\n\n` : '\n'}`
                if (currentLength + courseInfo.length < MAX_SYSTEM_PROMPT_LENGTH) {
                    systemPrompt += courseInfo
                }
            }
        } else {
            systemPrompt += `LƯU Ý: Không tìm thấy thông tin liên quan trong knowledge base của hệ thống.
Bạn vẫn có thể trả lời câu hỏi dựa trên kiến thức chung của mình về chủ đề này.
Hãy trả lời một cách chi tiết, hữu ích và chính xác nhất có thể.
Nếu câu hỏi liên quan đến nội dung khóa học cụ thể, hãy gợi ý học viên enroll vào khóa học để có thông tin chi tiết hơn.\n\n`
        }

        systemPrompt += `Hãy trả lời câu hỏi của học viên một cách chi tiết, nhiệt tình và hữu ích nhất có thể.`

        return systemPrompt
    }

    /**
     * Get list of available models from Ollama
     * @returns {Promise<Array>} List of models
     */
    async getAvailableModels() {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`)
            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status}`)
            }
            const data = await response.json()
            return data.models || []
        } catch (error) {
            logger.error('Error fetching Ollama models:', error)
            throw error
        }
    }

    /**
     * Get Ollama service status and info
     * @returns {Promise<Object>} Service status
     */
    async getStatus() {
        try {
            const isHealthy = await this.checkHealth()
            const models = isHealthy ? await this.getAvailableModels() : []
            
            return {
                enabled: this.enabled,
                available: isHealthy,
                baseUrl: this.baseUrl,
                model: this.model,
                temperature: this.temperature,
                maxTokens: this.maxTokens,
                models: models.map(m => ({
                    name: m.name || m.model,
                    size: m.size,
                    modifiedAt: m.modified_at,
                })),
            }
        } catch (error) {
            logger.error('Error getting Ollama status:', error)
            return {
                enabled: this.enabled,
                available: false,
                baseUrl: this.baseUrl,
                model: this.model,
                error: error.message,
            }
        }
    }
}

export default new OllamaService()

