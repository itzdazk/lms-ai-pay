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
     * Generate response with streaming (improved version)
     */
    async *generateResponseStream(prompt, context = [], systemPrompt = null) {
        if (!this.enabled) {
            throw new Error('Ollama is disabled')
        }

        const startTime = Date.now()
        let totalChunks = 0
        let buffer = ''

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

            logger.debug(`Starting Ollama streaming: ${this.baseUrl}/api/chat with model: ${this.model}`)

            // Add timeout for streaming (longer than non-streaming)
            const controller = new AbortController()
            const timeoutId = setTimeout(() => {
                controller.abort()
                logger.warn('Ollama streaming timeout after 180s')
            }, 180000) // 180s timeout for streaming

            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: controller.signal,
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

            clearTimeout(timeoutId)

            if (!response.ok) {
                const errorText = await response.text()
                logger.error(`Ollama streaming API error: ${response.status} - ${errorText}`)
                throw new Error(`Ollama API error: ${response.status} - ${errorText}`)
            }

            const reader = response.body.getReader()
            const decoder = new TextDecoder()

            try {
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    // Decode chunk and add to buffer (handle partial JSON)
                    buffer += decoder.decode(value, { stream: true })
                    
                    // Process complete lines
                    const lines = buffer.split('\n')
                    buffer = lines.pop() || '' // Keep incomplete line in buffer

                    for (const line of lines) {
                        const trimmedLine = line.trim()
                        if (!trimmedLine) continue

                        try {
                            // Ollama streaming format: JSON per line
                            const data = JSON.parse(trimmedLine)
                            
                            if (data.message && data.message.content) {
                                const content = data.message.content
                                totalChunks++
                                yield content
                            }
                            
                            // Check if done
                            if (data.done === true) {
                                const duration = Date.now() - startTime
                                logger.info(
                                    `Ollama streaming completed: ${totalChunks} chunks in ${duration}ms`
                                )
                                return
                            }
                        } catch (parseError) {
                            // Skip invalid JSON lines (common in streaming)
                            logger.debug(`Skipping invalid JSON line in stream: ${trimmedLine.substring(0, 50)}`)
                        }
                    }
                }

                // Process remaining buffer
                if (buffer.trim()) {
                    try {
                        const data = JSON.parse(buffer.trim())
                        if (data.message && data.message.content) {
                            yield data.message.content
                        }
                    } catch (e) {
                        // Ignore parse errors for remaining buffer
                    }
                }

                const duration = Date.now() - startTime
                logger.info(
                    `Ollama streaming finished: ${totalChunks} chunks in ${duration}ms`
                )
            } finally {
                reader.releaseLock()
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                const duration = Date.now() - startTime
                logger.error(`Ollama streaming timeout after ${duration}ms`)
                throw new Error(`Ollama streaming timeout - response took too long (${duration}ms)`)
            }
            logger.error('Error in Ollama stream:', error)
            throw error
        }
    }

    /**
     * Build system prompt with knowledge base context
     */
    buildSystemPrompt(context) {
        const { searchResults, userContext, query = '' } = context

        // Detect if query is about specific course content
        const isSpecificCourseQuery = this._isSpecificCourseQuery(query, userContext)
        // Detect if query is unrelated to programming/learning
        const isUnrelatedQuery = this._isUnrelatedToProgramming(query)

        let systemPrompt = `Bạn là AI Tutor thông minh và nhiệt tình, chuyên hỗ trợ học viên trong hệ thống E-Learning. 
Nhiệm vụ của bạn là trả lời câu hỏi dựa trên kiến thức từ các khóa học và bài học mà học viên đã đăng ký.

HƯỚNG DẪN:
- Trả lời bằng tiếng Việt, tự nhiên và dễ hiểu
- Ưu tiên sử dụng thông tin từ knowledge base được cung cấp bên dưới
- Luôn khuyến khích và động viên học viên
- Có thể đưa ra ví dụ cụ thể để giải thích
- Giữ câu trả lời ngắn gọn nhưng đầy đủ thông tin

`

        // Add user context
        if (userContext && userContext.currentCourse) {
            systemPrompt += `NGỮ CẢNH HỌC VIÊN:
- Đang học khóa học: "${userContext.currentCourse.title}"
- Tiến độ: ${userContext.currentCourse.progress}%
- Bài học hiện tại: ${userContext.currentLesson?.title || 'Chưa bắt đầu'}

`
        }

        // Add search results context (optimized limit for better context)
        // Increased from 1500 to 2500 to allow more context while still being reasonable
        const MAX_SYSTEM_PROMPT_LENGTH = 2500
        let currentLength = systemPrompt.length

        if (searchResults && searchResults.totalResults > 0) {
            systemPrompt += `THÔNG TIN TỪ KNOWLEDGE BASE:\n\n`

            // Transcripts (highest priority) - limit to 3 for better context
            if (
                searchResults.transcripts &&
                searchResults.transcripts.length > 0 &&
                currentLength < MAX_SYSTEM_PROMPT_LENGTH
            ) {
                systemPrompt += `=== TRANSCRIPT (Nội dung từ video bài học) ===\n`
                const transcriptsToInclude = searchResults.transcripts.slice(0, 3)
                transcriptsToInclude.forEach((t, idx) => {
                    // Calculate available space
                    const remainingSpace = MAX_SYSTEM_PROMPT_LENGTH - currentLength
                    if (remainingSpace < 100) return // Not enough space

                    // Use full text if available (for full transcript requests), otherwise use excerpt
                    let transcriptContent = ''
                    if (t.isFullTranscript && t.text) {
                        // For full transcript, use up to 1500 chars (increased from 1000)
                        const maxChars = Math.min(1500, remainingSpace - 200) // Reserve space for metadata
                        transcriptContent = t.text.substring(0, maxChars)
                        if (t.text.length > maxChars) {
                            transcriptContent += '...'
                        }
                    } else {
                        // For keyword matches, use contextText (longer context) or excerpt
                        const maxChars = Math.min(800, remainingSpace - 200) // Increased from 500
                        transcriptContent = (t.contextText || t.excerpt || t.text || '').substring(0, maxChars)
                        if ((t.contextText || t.excerpt || t.text || '').length > maxChars) {
                            transcriptContent += '...'
                        }
                    }
                    
                    const transcriptInfo = `${idx + 1}. Bài: "${t.lessonTitle}"\n   Khóa học: "${t.courseTitle}"\n${t.timestamp ? `   Thời điểm: ${t.timestamp}\n` : ''}   Nội dung: "${transcriptContent}"\n\n`
                    if (currentLength + transcriptInfo.length < MAX_SYSTEM_PROMPT_LENGTH) {
                        systemPrompt += transcriptInfo
                        currentLength += transcriptInfo.length
                    }
                })
            }

            // Lessons - limit to 3 (increased from 2)
            if (
                searchResults.lessons &&
                searchResults.lessons.length > 0 &&
                currentLength < MAX_SYSTEM_PROMPT_LENGTH
            ) {
                systemPrompt += `=== BÀI HỌC LIÊN QUAN ===\n`
                const lessonsToInclude = searchResults.lessons.slice(0, 3)
                lessonsToInclude.forEach((l, idx) => {
                    const remainingSpace = MAX_SYSTEM_PROMPT_LENGTH - currentLength
                    if (remainingSpace < 50) return

                    const maxDescLength = Math.min(150, remainingSpace - 100) // Increased from 100
                    const desc = l.description
                        ? l.description.substring(0, maxDescLength)
                        : ''
                    const lessonInfo = `${idx + 1}. "${l.title}"\n   Khóa học: "${l.course?.title || 'N/A'}"\n${desc ? `   Mô tả: "${desc}${desc.length < l.description.length ? '...' : ''}"\n\n` : '\n'}`
                    if (currentLength + lessonInfo.length < MAX_SYSTEM_PROMPT_LENGTH) {
                        systemPrompt += lessonInfo
                        currentLength += lessonInfo.length
                    }
                })
            }

            // Courses - limit to 2 (increased from 1)
            if (
                searchResults.courses &&
                searchResults.courses.length > 0 &&
                currentLength < MAX_SYSTEM_PROMPT_LENGTH
            ) {
                systemPrompt += `=== KHÓA HỌC LIÊN QUAN ===\n`
                const coursesToInclude = searchResults.courses.slice(0, 2)
                coursesToInclude.forEach((course, idx) => {
                    const remainingSpace = MAX_SYSTEM_PROMPT_LENGTH - currentLength
                    if (remainingSpace < 50) return

                    const maxDescLength = Math.min(150, remainingSpace - 100) // Increased from 100
                    const courseDesc = course.shortDescription
                        ? course.shortDescription.substring(0, maxDescLength)
                        : ''
                    const courseInfo = `${idx + 1}. "${course.title}" (${course.level || 'N/A'})\n${courseDesc ? `   Mô tả: "${courseDesc}${courseDesc.length < course.shortDescription.length ? '...' : ''}"\n\n` : '\n'}`
                    if (currentLength + courseInfo.length < MAX_SYSTEM_PROMPT_LENGTH) {
                        systemPrompt += courseInfo
                        currentLength += courseInfo.length
                    }
                })
            }
        } else {
            // Different handling based on query type
            if (isUnrelatedQuery) {
                // Query không liên quan đến lập trình/học tập
                systemPrompt += `QUAN TRỌNG: Câu hỏi này KHÔNG liên quan đến lập trình hoặc nội dung khóa học.
Bạn là AI Tutor chuyên về lập trình và hỗ trợ học tập. Bạn KHÔNG nên trả lời các câu hỏi về:
- Nấu ăn, công thức nấu ăn
- Thời tiết, tin tức
- Giải trí, phim ảnh
- Các chủ đề không liên quan đến lập trình/học tập

Hãy lịch sự từ chối và redirect học viên về chủ đề học tập:
"Xin lỗi, tôi là AI Tutor chuyên hỗ trợ về lập trình và các khóa học trên nền tảng này. Tôi không thể trả lời câu hỏi này vì nó không liên quan đến lập trình hoặc nội dung học tập.

Bạn có muốn hỏi về:
- Các khái niệm lập trình (JavaScript, React, Python, v.v.)
- Các bài học trong khóa học bạn đang học
- Các vấn đề kỹ thuật khi code
- Hoặc các chủ đề khác liên quan đến lập trình không?"

Hãy trả lời ngắn gọn, lịch sự và redirect về chủ đề học tập.\n\n`
            } else if (isSpecificCourseQuery) {
                systemPrompt += `LƯU Ý: Không tìm thấy thông tin liên quan trong knowledge base của hệ thống về nội dung khóa học cụ thể này.
Hãy thành thật nói rằng bạn không tìm thấy thông tin này trong các khóa học mà học viên đã đăng ký.
Gợi ý học viên:
- Xem lại các bài học đã học
- Tìm kiếm trong các khóa học khác
- Hoặc hỏi lại với từ khóa khác\n\n`
            } else {
                // Câu hỏi về lập trình nhưng không có trong knowledge base
                systemPrompt += `LƯU Ý: Không tìm thấy thông tin liên quan trong knowledge base của hệ thống.
Đây có vẻ là câu hỏi về lập trình/kiến thức tổng quát. Bạn có thể trả lời dựa trên kiến thức chung của mình về lập trình và công nghệ.
Hãy trả lời một cách chi tiết, hữu ích và chính xác nhất có thể.
Nếu câu hỏi có thể liên quan đến nội dung khóa học cụ thể, hãy gợi ý học viên enroll vào khóa học để có thông tin chi tiết hơn.\n\n`
            }
        }

        systemPrompt += `Hãy trả lời câu hỏi của học viên một cách chi tiết, nhiệt tình và hữu ích nhất có thể.`

        return systemPrompt
    }

    /**
     * Detect if query is unrelated to programming/learning
     * @param {string} query - User query
     * @returns {boolean} True if query is unrelated to programming/learning
     */
    _isUnrelatedToProgramming(query) {
        if (!query) return false

        const queryLower = query.toLowerCase()
        
        // Keywords indicating unrelated topics
        const unrelatedKeywords = [
            // Cooking/Food
            'nấu', 'nấu ăn', 'công thức', 'món ăn', 'thức ăn', 'đồ ăn',
            'bò kho', 'phở', 'bánh', 'canh', 'cháo', 'cơm', 'mì',
            'cooking', 'recipe', 'food', 'dish',
            
            // Weather
            'thời tiết', 'mưa', 'nắng', 'gió', 'bão',
            'weather', 'rain', 'sunny', 'wind', 'storm',
            
            // News/Entertainment
            'tin tức', 'báo', 'phim', 'phim ảnh', 'ca nhạc', 'nhạc',
            'news', 'movie', 'film', 'music', 'song',
            
            // Sports
            'bóng đá', 'thể thao', 'bơi lội', 'chạy',
            'football', 'soccer', 'sport', 'sports',
            
            // Health/Medical
            'bệnh', 'thuốc', 'sức khỏe', 'đau', 'ốm',
            'disease', 'medicine', 'health', 'sick', 'pain',
            
            // Shopping
            'mua', 'bán', 'giá', 'shop', 'shopping',
            
            // General unrelated
            'làm sao để', 'cách làm', 'hướng dẫn' // But check context
        ]

        // Check if query contains unrelated keywords
        const hasUnrelatedKeyword = unrelatedKeywords.some(keyword => 
            queryLower.includes(keyword)
        )

        // But allow if it's about programming (e.g., "cách làm website")
        const programmingKeywords = [
            'code', 'lập trình', 'programming', 'javascript', 'python', 'react',
            'function', 'variable', 'array', 'object', 'class', 'method',
            'website', 'web', 'app', 'application', 'api', 'database',
            'html', 'css', 'node', 'vue', 'angular', 'framework',
            'algorithm', 'data structure', 'cấu trúc dữ liệu', 'thuật toán'
        ]
        const hasProgrammingKeyword = programmingKeywords.some(keyword =>
            queryLower.includes(keyword)
        )

        // If has unrelated keyword but also has programming keyword, it's related
        if (hasUnrelatedKeyword && hasProgrammingKeyword) {
            return false
        }

        return hasUnrelatedKeyword
    }

    /**
     * Detect if query is about specific course content
     * @param {string} query - User query
     * @param {Object} userContext - User context with current course/lesson
     * @returns {boolean} True if query is about specific course content
     */
    _isSpecificCourseQuery(query, userContext) {
        if (!query) return false

        const queryLower = query.toLowerCase()
        
        // Keywords indicating specific course content queries
        const specificKeywords = [
            'trong bài này', 'trong bài học này', 'trong video này',
            'trong khóa học này', 'bài này có', 'video này có',
            'giảng viên nói', 'thầy/cô nói', 'trong transcript',
            'có nói về', 'có đề cập', 'có giải thích',
            'ở đâu trong bài', 'phần nào', 'đoạn nào'
        ]

        // Check if query contains specific keywords
        const hasSpecificKeyword = specificKeywords.some(keyword => 
            queryLower.includes(keyword)
        )

        // Check if user has current course/lesson context
        const hasCourseContext = userContext?.currentCourse || userContext?.currentLesson

        // If query mentions current course/lesson explicitly
        const mentionsCurrentCourse = userContext?.currentCourse?.title && 
            queryLower.includes(userContext.currentCourse.title.toLowerCase())
        const mentionsCurrentLesson = userContext?.currentLesson?.title && 
            queryLower.includes(userContext.currentLesson.title.toLowerCase())

        return hasSpecificKeyword || (hasCourseContext && (mentionsCurrentCourse || mentionsCurrentLesson))
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

