// src/services/llm.service.js
import config from '../config/app.config.js'
import logger from '../config/logger.config.js'
import { OllamaProvider } from './providers/ollama.provider.js'
import { OpenAIProvider } from './providers/openai.provider.js'
import { GeminiProvider } from './providers/gemini.provider.js'
import { ClaudeProvider } from './providers/claude.provider.js'

/**
 * LLM Service - Unified interface for multiple LLM providers
 * Uses Factory Pattern to create and route to appropriate provider
 */
class LLMService {
    constructor() {
        // Get provider name from config (default: 'ollama')
        this.providerName = (config.AI_PROVIDER || 'ollama').toLowerCase()
        this.provider = null
        this._initializeProvider()
    }

    /**
     * Initialize the provider based on config
     */
    _initializeProvider() {
        try {
            switch (this.providerName) {
                case 'ollama':
                    this.provider = new OllamaProvider({
                        enabled: config.OLLAMA_ENABLED !== false,
                        baseUrl: config.OLLAMA_BASE_URL || 'http://localhost:11434',
                        model: config.OLLAMA_MODEL || 'llama3.1:latest',
                        temperature: config.OLLAMA_TEMPERATURE || 0.7,
                        maxTokens: config.OLLAMA_MAX_TOKENS || 2000,
                    })
                    break

                case 'openai':
                    this.provider = new OpenAIProvider({
                        enabled: true, // OpenAI is enabled if API key is provided
                        apiKey: config.OPENAI_API_KEY,
                        baseUrl: 'https://api.openai.com/v1',
                        model: config.OPENAI_MODEL || 'gpt-4o-mini',
                        temperature: config.OPENAI_TEMPERATURE || 0.7,
                        maxTokens: config.OPENAI_MAX_TOKENS || 2000,
                    })
                    break

                case 'gemini':
                    this.provider = new GeminiProvider({
                        enabled: true, // Gemini is enabled if API key is provided
                        apiKey: config.GEMINI_API_KEY,
                        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
                        model: config.GEMINI_MODEL || 'gemini-1.5-flash',
                        temperature: config.GEMINI_TEMPERATURE || 0.7,
                        maxTokens: config.GEMINI_MAX_TOKENS || 2000,
                    })
                    break

                case 'claude':
                    this.provider = new ClaudeProvider({
                        enabled: true, // Claude is enabled if API key is provided
                        apiKey: config.ANTHROPIC_API_KEY,
                        baseUrl: 'https://api.anthropic.com/v1',
                        model: config.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022',
                        temperature: config.ANTHROPIC_TEMPERATURE || 0.7,
                        maxTokens: config.ANTHROPIC_MAX_TOKENS || 2000,
                    })
                    break

                default:
                    logger.warn(
                        `Unknown provider: ${this.providerName}, falling back to ollama`
                    )
                    this.providerName = 'ollama'
                    this.provider = new OllamaProvider({
                        enabled: config.OLLAMA_ENABLED !== false,
                        baseUrl: config.OLLAMA_BASE_URL || 'http://localhost:11434',
                        model: config.OLLAMA_MODEL || 'llama3.1:latest',
                        temperature: config.OLLAMA_TEMPERATURE || 0.7,
                        maxTokens: config.OLLAMA_MAX_TOKENS || 2000,
                    })
            }

            logger.info(
                `LLM Service initialized with provider: ${this.providerName}`
            )
        } catch (error) {
            logger.error('Error initializing LLM provider:', error)
            throw error
        }
    }

    /**
     * Get current provider instance
     * @returns {BaseProvider} Current provider
     */
    getProvider() {
        return this.provider
    }

    /**
     * Get current provider name
     * @returns {string} Provider name
     */
    getProviderName() {
        return this.providerName
    }

    /**
     * Check if LLM service is available
     * @returns {Promise<boolean>}
     */
    async checkHealth() {
        if (!this.provider) {
            return false
        }
        return await this.provider.checkHealth()
    }

    /**
     * Generate response using current provider
     * @param {string} prompt - User message
     * @param {Array} context - Conversation context (messages history)
     * @param {string|null} systemPrompt - System prompt with knowledge base context
     * @returns {Promise<string>} AI response
     */
    async generateResponse(prompt, context = [], systemPrompt = null) {
        if (!this.provider) {
            throw new Error('LLM provider chưa được khởi tạo')
        }
        return await this.provider.generateResponse(prompt, context, systemPrompt)
    }

    /**
     * Generate response with streaming
     * @param {string} prompt - User message
     * @param {Array} context - Conversation context (messages history)
     * @param {string|null} systemPrompt - System prompt with knowledge base context
     * @returns {AsyncGenerator<string>} Streaming response chunks
     */
    async *generateResponseStream(prompt, context = [], systemPrompt = null) {
        if (!this.provider) {
            throw new Error('LLM provider chưa được khởi tạo')
        }
        yield* this.provider.generateResponseStream(prompt, context, systemPrompt)
    }

    /**
     * Build system prompt with knowledge base context
     * This is shared across all providers (not provider-specific)
     * @param {Object} context - Knowledge base context
     * @param {string} mode - Mode: 'course' | 'general'
     * @returns {string} System prompt
     */
    buildSystemPrompt(context, mode = 'course') {
        if (mode === 'general') {
            return `Bạn là Gia sư AI chuyên về lập trình và công nghệ. Trả lời ngắn gọn, chính xác, và hữu ích bằng tiếng Việt.\n\nPHẠM VI HỖ TRỢ:\n- Các câu hỏi về lập trình, công nghệ phần mềm, AI/LLM, công cụ phát triển, hạ tầng hệ thống (ví dụ: Ollama, mô hình AI, API, cách hệ thống hoạt động).\n- Các câu hỏi chung về học tập trên nền tảng.\n\nHÀNH VI TRẢ LỜI:\n- Nếu câu hỏi THỰC SỰ không liên quan (không thuộc phạm vi trên), trả lời lịch sự: "Xin lỗi, tôi chỉ hỗ trợ các câu hỏi liên quan đến lập trình, công nghệ và nội dung học tập trên nền tảng này."\n- Nếu câu hỏi là về công cụ/hệ thống (ví dụ: "Ollama là gì?"), hãy giải thích ngắn gọn và nêu cách hệ thống đang sử dụng công cụ đó.\n- Giữ câu trả lời ngắn gọn, ưu tiên ví dụ/giải pháp thực tế khi cần.`
        }
        const { searchResults, userContext, query = '' } = context

        // Detect if query is about specific course content
        const isSpecificCourseQuery = this._isSpecificCourseQuery(
            query,
            userContext
        )
        // Detect if query is unrelated to programming/learning
        const isUnrelatedQuery = this._isUnrelatedToProgramming(query)

        let systemPrompt = `Bạn là Gia sư AI thông minh và nhiệt tình, chuyên hỗ trợ học viên trong hệ thống E-Learning. 
Nhiệm vụ của bạn là trả lời câu hỏi dựa trên kiến thức từ các khóa học và bài học mà học viên đã đăng ký.

HƯỚNG DẪN:
- Trả lời bằng tiếng Việt, tự nhiên và dễ hiểu
- Ưu tiên sử dụng thông tin từ knowledge base được cung cấp bên dưới
- CHỈ trả lời dựa trên thông tin từ KNOWLEDGE BASE, KHÔNG trộn lẫn với khóa học khác của học viên
- Luôn khuyến khích và động viên học viên
- Có thể đưa ra ví dụ cụ thể để giải thích
- Giữ câu trả lời ngắn gọn nhưng đầy đủ thông tin

`

        // In lesson mode, skip user current course context to avoid mixing
        // Only use knowledge base results (which contain the actual lesson being asked about)
        if (mode !== 'course' && userContext && userContext.currentCourse) {
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
                const transcriptsToInclude = searchResults.transcripts.slice(
                    0,
                    3
                )
                transcriptsToInclude.forEach((t, idx) => {
                    // Calculate available space
                    const remainingSpace =
                        MAX_SYSTEM_PROMPT_LENGTH - currentLength
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
                        transcriptContent = (
                            t.contextText ||
                            t.excerpt ||
                            t.text ||
                            ''
                        ).substring(0, maxChars)
                        if (
                            (t.contextText || t.excerpt || t.text || '')
                                .length > maxChars
                        ) {
                            transcriptContent += '...'
                        }
                    }

                    const transcriptInfo = `${idx + 1}. Bài: "${t.lessonTitle}"\n   Khóa học: "${t.courseTitle}"\n${t.timestamp ? `   Thời điểm: ${t.timestamp}\n` : ''}   Nội dung: "${transcriptContent}"\n\n`
                    if (
                        currentLength + transcriptInfo.length <
                        MAX_SYSTEM_PROMPT_LENGTH
                    ) {
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
                    const remainingSpace =
                        MAX_SYSTEM_PROMPT_LENGTH - currentLength
                    if (remainingSpace < 50) return

                    const maxDescLength = Math.min(150, remainingSpace - 100) // Increased from 100
                    const desc = l.description
                        ? l.description.substring(0, maxDescLength)
                        : ''
                    const lessonInfo = `${idx + 1}. "${l.title}"\n   Khóa học: "${l.course?.title || 'N/A'}"\n${desc ? `   Mô tả: "${desc}${desc.length < l.description.length ? '...' : ''}"\n\n` : '\n'}`
                    if (
                        currentLength + lessonInfo.length <
                        MAX_SYSTEM_PROMPT_LENGTH
                    ) {
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
                    const remainingSpace =
                        MAX_SYSTEM_PROMPT_LENGTH - currentLength
                    if (remainingSpace < 50) return

                    const maxDescLength = Math.min(150, remainingSpace - 100) // Increased from 100
                    const courseDesc = course.shortDescription
                        ? course.shortDescription.substring(0, maxDescLength)
                        : ''
                    const courseInfo = `${idx + 1}. "${course.title}" (${course.level || 'N/A'})\n${courseDesc ? `   Mô tả: "${courseDesc}${courseDesc.length < course.shortDescription.length ? '...' : ''}"\n\n` : '\n'}`
                    if (
                        currentLength + courseInfo.length <
                        MAX_SYSTEM_PROMPT_LENGTH
                    ) {
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
Bạn là Gia sư AI chuyên về lập trình và hỗ trợ học tập. Bạn KHÔNG nên trả lời các câu hỏi về:
- Nấu ăn, công thức nấu ăn
- Thời tiết, tin tức
- Giải trí, phim ảnh
- Các chủ đề không liên quan đến lập trình/học tập

Hãy lịch sự từ chối và redirect học viên về chủ đề học tập:
"Xin lỗi, tôi là Gia sư AI chuyên hỗ trợ về lập trình và các khóa học trên nền tảng này. Tôi không thể trả lời câu hỏi này vì nó không liên quan đến lập trình hoặc nội dung học tập.

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
            'nấu',
            'nấu ăn',
            'công thức',
            'món ăn',
            'thức ăn',
            'đồ ăn',
            'bò kho',
            'phở',
            'bánh',
            'canh',
            'cháo',
            'cơm',
            'mì',
            'cooking',
            'recipe',
            'food',
            'dish',

            // Weather
            'thời tiết',
            'mưa',
            'nắng',
            'gió',
            'bão',
            'weather',
            'rain',
            'sunny',
            'wind',
            'storm',

            // News/Entertainment
            'tin tức',
            'báo',
            'phim',
            'phim ảnh',
            'ca nhạc',
            'nhạc',
            'news',
            'movie',
            'film',
            'music',
            'song',

            // Sports
            'bóng đá',
            'thể thao',
            'bơi lội',
            'chạy',
            'football',
            'soccer',
            'sport',
            'sports',

            // Health/Medical
            'bệnh',
            'thuốc',
            'sức khỏe',
            'đau',
            'ốm',
            'disease',
            'medicine',
            'health',
            'sick',
            'pain',

            // Shopping
            'mua',
            'bán',
            'giá',
            'shop',
            'shopping',

            // General unrelated
            'làm sao để',
            'cách làm',
            'hướng dẫn', // But check context
        ]

        // Check if query contains unrelated keywords
        const hasUnrelatedKeyword = unrelatedKeywords.some((keyword) =>
            queryLower.includes(keyword)
        )

        // But allow if it's about programming (e.g., "cách làm website")
        const programmingKeywords = [
            'code',
            'lập trình',
            'programming',
            'javascript',
            'python',
            'react',
            'function',
            'variable',
            'array',
            'object',
            'class',
            'method',
            'website',
            'web',
            'app',
            'application',
            'api',
            'database',
            'html',
            'css',
            'node',
            'vue',
            'angular',
            'framework',
            'algorithm',
            'data structure',
            'cấu trúc dữ liệu',
            'thuật toán',
        ]
        const hasProgrammingKeyword = programmingKeywords.some((keyword) =>
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
            'trong bài này',
            'trong bài học này',
            'trong video này',
            'trong khóa học này',
            'bài này có',
            'video này có',
            'giảng viên nói',
            'thầy/cô nói',
            'trong transcript',
            'có nói về',
            'có đề cập',
            'có giải thích',
            'ở đâu trong bài',
            'phần nào',
            'đoạn nào',
        ]

        // Check if query contains specific keywords
        const hasSpecificKeyword = specificKeywords.some((keyword) =>
            queryLower.includes(keyword)
        )

        // Check if user has current course/lesson context
        const hasCourseContext =
            userContext?.currentCourse || userContext?.currentLesson

        // If query mentions current course/lesson explicitly
        const mentionsCurrentCourse =
            userContext?.currentCourse?.title &&
            queryLower.includes(userContext.currentCourse.title.toLowerCase())
        const mentionsCurrentLesson =
            userContext?.currentLesson?.title &&
            queryLower.includes(userContext.currentLesson.title.toLowerCase())

        return (
            hasSpecificKeyword ||
            (hasCourseContext &&
                (mentionsCurrentCourse || mentionsCurrentLesson))
        )
    }

    /**
     * Get LLM service status
     * @returns {Promise<Object>} Service status
     */
    async getStatus() {
        if (!this.provider) {
            return {
                provider: this.providerName,
                enabled: false,
                available: false,
                error: 'Provider chưa được khởi tạo',
            }
        }

        return await this.provider.getStatus()
    }
}

// Export singleton instance
export default new LLMService()
