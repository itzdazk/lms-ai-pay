// src/services/ai-quiz-generation.service.js
import ollamaService from './ollama.service.js'
import knowledgeBaseService from './knowledge-base.service.js'
import { prisma } from '../config/database.config.js'
import logger from '../config/logger.config.js'

class AIQuizGenerationService {
    constructor() {
        // Cache for generated questions (in-memory, optional: use Redis)
        this.questionCache = new Map()
        this.cacheMaxAge = 60 * 60 * 1000 // 1 hour
    }

    /**
     * Generate quiz questions from lesson content
     * @param {number} lessonId - Lesson ID
     * @param {Object} options - Generation options
     * @returns {Promise<Array>} Generated questions
     */
    async generateQuizFromLesson(lessonId, options = {}) {
        const {
            numQuestions = 5,
            difficulty = 'medium', // 'easy', 'medium', 'hard'
            questionTypes = ['multiple_choice'], // 'multiple_choice', 'true_false', 'short_answer'
            includeExplanation = true,
            useCache = true // Allow disabling cache for fresh generation
        } = options

        // Check cache first (if enabled)
        if (useCache) {
            const cacheKey = `quiz:lesson:${lessonId}:${numQuestions}:${difficulty}:${includeExplanation}`
            const cached = this.questionCache.get(cacheKey)
            if (cached && Date.now() - cached.timestamp < this.cacheMaxAge) {
                logger.info(`Using cached questions for lesson ${lessonId}`)
                return cached.questions
            }
        }

        // 1. Get lesson content
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        description: true
                    }
                }
            }
        })

        if (!lesson) {
            throw new Error('Lesson not found')
        }

        // 2. Extract content
        const content = await this._extractLessonContent(lesson)

        // Limit content length to prevent timeout (max 5000 chars)
        const maxContentLength = 5000
        const truncatedContent = content.length > maxContentLength
            ? content.substring(0, maxContentLength) + '\n\n[... Nội dung đã được rút gọn ...]'
            : content

        // 3. Build prompt for AI
        const prompt = this._buildQuizGenerationPrompt(truncatedContent, {
            numQuestions,
            difficulty,
            questionTypes,
            includeExplanation
        })

        // 4. Generate questions using Ollama with retry mechanism
        const generatedText = await this._generateWithRetry(
            prompt,
            [],
            this._buildSystemPrompt()
        )

        // 5. Parse AI response to JSON
        const questions = this._parseAIResponse(generatedText)

        // 6. Validate and format questions
        const validatedQuestions = this._validateAndFormatQuestions(questions, numQuestions)

        // Cache the result (if enabled)
        if (useCache && validatedQuestions.length > 0) {
            const cacheKey = `quiz:lesson:${lessonId}:${numQuestions}:${difficulty}:${includeExplanation}`
            this.questionCache.set(cacheKey, {
                questions: validatedQuestions,
                timestamp: Date.now()
            })
            
            // Clean old cache entries
            this._cleanCache()
        }

        return validatedQuestions
    }

    /**
     * Extract content from lesson
     */
    async _extractLessonContent(lesson) {
        let content = ''

        // Add lesson description
        if (lesson.description) {
            content += `Mô tả bài học: ${lesson.description}\n\n`
        }

        // Add lesson text content
        if (lesson.content) {
            content += `Nội dung bài học:\n${lesson.content}\n\n`
        }

        // Add transcript if available
        if (lesson.transcriptUrl) {
            try {
                // Use public method from KnowledgeBaseService
                const transcriptText = await knowledgeBaseService.getTranscriptText(
                    lesson.transcriptUrl,
                    20 // First 20 segments
                )
                if (transcriptText) {
                    content += `Transcript bài học:\n${transcriptText}\n\n`
                }
            } catch (error) {
                logger.warn('Failed to load transcript:', error)
            }
        }

        // Add course context
        if (lesson.course) {
            content += `Khóa học: ${lesson.course.title}\n`
            if (lesson.course.description) {
                content += `Mô tả khóa học: ${lesson.course.description}\n\n`
            }
        }

        return content
    }

    /**
     * Build prompt for quiz generation
     */
    _buildQuizGenerationPrompt(content, options) {
        const { numQuestions, difficulty, questionTypes, includeExplanation } = options

        return `Dựa trên nội dung bài học sau đây, hãy tạo ${numQuestions} câu hỏi quiz dạng Multiple Choice.

Yêu cầu:
- Độ khó: ${difficulty === 'easy' ? 'Dễ' : difficulty === 'hard' ? 'Khó' : 'Trung bình'}
- Loại câu hỏi: Multiple Choice (4 lựa chọn A, B, C, D)
- Mỗi câu hỏi phải có đúng 1 đáp án đúng
${includeExplanation ? '- Mỗi câu hỏi phải có giải thích cho đáp án đúng' : ''}
- Câu hỏi phải liên quan trực tiếp đến nội dung bài học
- Câu hỏi phải rõ ràng, dễ hiểu
- Đáp án sai phải hợp lý, không quá dễ đoán

Nội dung bài học:
${content}

⚠️ QUAN TRỌNG: Bạn PHẢI trả về ĐÚNG format JSON sau, không có text thừa, không có markdown code block (không có \`\`\`json), chỉ JSON thuần túy:
{
  "questions": [
    {
      "id": 1,
      "question": "Câu hỏi 1?",
      "options": {
        "A": "Đáp án A",
        "B": "Đáp án B",
        "C": "Đáp án C",
        "D": "Đáp án D"
      },
      "correctAnswer": "A",
      "explanation": "Giải thích tại sao đáp án A đúng"
    }
  ]
}

Nếu bạn không trả về đúng format này, hệ thống sẽ không thể parse được.`
    }

    /**
     * Build system prompt for quiz generation
     */
    _buildSystemPrompt() {
        return `Bạn là một chuyên gia giáo dục, chuyên tạo câu hỏi quiz chất lượng cao cho các khóa học lập trình và công nghệ.

Nhiệm vụ của bạn:
- Tạo câu hỏi quiz Multiple Choice dựa trên nội dung bài học
- Đảm bảo câu hỏi chính xác, rõ ràng, và phù hợp với độ khó yêu cầu
- Tạo đáp án sai hợp lý, không quá dễ đoán
- Cung cấp giải thích chi tiết cho đáp án đúng

Lưu ý:
- Chỉ tạo câu hỏi dựa trên nội dung được cung cấp
- Không tạo câu hỏi về kiến thức ngoài phạm vi bài học
- Đảm bảo format JSON chính xác, không có markdown code blocks
- Trả về chỉ JSON thuần túy, không có text giải thích thêm`
    }

    /**
     * Generate with retry mechanism (exponential backoff)
     */
    async _generateWithRetry(prompt, context = [], systemPrompt = null, maxRetries = 3) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await ollamaService.generateResponse(prompt, context, systemPrompt)
            } catch (error) {
                if (attempt === maxRetries - 1) {
                    logger.error(`Failed to generate after ${maxRetries} attempts:`, error)
                    throw error
                }
                
                // Exponential backoff: 1s, 2s, 4s
                const delay = Math.pow(2, attempt) * 1000
                logger.warn(`Generation attempt ${attempt + 1} failed, retrying in ${delay}ms...`)
                await new Promise(resolve => setTimeout(resolve, delay))
            }
        }
    }

    /**
     * Parse AI response to extract questions
     */
    _parseAIResponse(aiResponse) {
        try {
            // Remove markdown code blocks if present
            let cleanedResponse = aiResponse.trim()
            
            // Remove ```json or ``` markers
            cleanedResponse = cleanedResponse.replace(/^```json\s*/i, '')
            cleanedResponse = cleanedResponse.replace(/^```\s*/i, '')
            cleanedResponse = cleanedResponse.replace(/\s*```$/i, '')
            cleanedResponse = cleanedResponse.trim()
            
            // Try to extract JSON from response
            const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                const jsonStr = jsonMatch[0]
                const parsed = JSON.parse(jsonStr)
                return parsed.questions || []
            }
            
            // Fallback: Try to parse entire response as JSON
            const parsed = JSON.parse(cleanedResponse)
            return parsed.questions || []
        } catch (error) {
            logger.error('Failed to parse AI response:', error)
            logger.error('AI Response (first 500 chars):', aiResponse.substring(0, 500))
            throw new Error('Failed to parse AI-generated questions. Please try again.')
        }
    }

    /**
     * Validate and format questions
     */
    _validateAndFormatQuestions(questions, expectedCount) {
        if (!Array.isArray(questions)) {
            throw new Error('Questions must be an array')
        }

        return questions
            .slice(0, expectedCount) // Limit to expected count
            .map((q, index) => {
                // Validate required fields
                if (!q.question || !q.options || !q.correctAnswer) {
                    logger.warn(`Question ${index + 1} missing required fields`)
                    return null
                }

                // Validate correct answer exists in options
                if (!q.options[q.correctAnswer]) {
                    logger.warn(`Question ${index + 1} has invalid correct answer`)
                    return null
                }

                // Ensure 4 options
                const options = ['A', 'B', 'C', 'D']
                const formattedOptions = {}
                options.forEach(opt => {
                    formattedOptions[opt] = q.options[opt] || `Option ${opt}`
                })

                return {
                    id: index + 1,
                    question: q.question.trim(),
                    options: formattedOptions,
                    correctAnswer: q.correctAnswer.toUpperCase(),
                    explanation: q.explanation || ''
                }
            })
            .filter(q => q !== null) // Remove invalid questions
    }

    /**
     * Generate quiz from course (all lessons)
     */
    async generateQuizFromCourse(courseId, options = {}) {
        const {
            numQuestions = 10,
            difficulty = 'medium',
            includeExplanation = true,
            useCache = true
        } = options

        // Check cache first (if enabled)
        if (useCache) {
            const cacheKey = `quiz:course:${courseId}:${numQuestions}:${difficulty}:${includeExplanation}`
            const cached = this.questionCache.get(cacheKey)
            if (cached && Date.now() - cached.timestamp < this.cacheMaxAge) {
                logger.info(`Using cached questions for course ${courseId}`)
                return cached.questions
            }
        }

        // Get all lessons in course
        const lessons = await prisma.lesson.findMany({
            where: {
                courseId,
                isPublished: true
            },
            orderBy: {
                lessonOrder: 'asc'
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        description: true
                    }
                }
            }
        })

        if (lessons.length === 0) {
            throw new Error('No lessons found in course')
        }

        // Extract content from all lessons
        let allContent = ''
        for (const lesson of lessons) {
            const lessonContent = await this._extractLessonContent(lesson)
            allContent += `\n\n=== Bài ${lesson.lessonOrder}: ${lesson.title} ===\n\n${lessonContent}`
        }

        // Limit content length
        const maxContentLength = 5000
        const truncatedContent = allContent.length > maxContentLength
            ? allContent.substring(0, maxContentLength) + '\n\n[... Nội dung đã được rút gọn ...]'
            : allContent

        // Generate questions
        const prompt = this._buildQuizGenerationPrompt(truncatedContent, {
            numQuestions,
            difficulty,
            questionTypes: ['multiple_choice'],
            includeExplanation
        })

        const generatedText = await this._generateWithRetry(
            prompt,
            [],
            this._buildSystemPrompt()
        )

        const questions = this._parseAIResponse(generatedText)
        const validatedQuestions = this._validateAndFormatQuestions(questions, numQuestions)

        // Cache the result (if enabled)
        if (useCache && validatedQuestions.length > 0) {
            const cacheKey = `quiz:course:${courseId}:${numQuestions}:${difficulty}:${includeExplanation}`
            this.questionCache.set(cacheKey, {
                questions: validatedQuestions,
                timestamp: Date.now()
            })
            
            // Clean old cache entries
            this._cleanCache()
        }

        return validatedQuestions
    }

    /**
     * Clean old cache entries
     */
    _cleanCache() {
        const now = Date.now()
        const maxCacheSize = 100 // Max 100 cached entries
        
        if (this.questionCache.size > maxCacheSize) {
            // Remove oldest entries
            const entries = Array.from(this.questionCache.entries())
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
            
            const toRemove = entries.slice(0, entries.length - maxCacheSize)
            toRemove.forEach(([key]) => this.questionCache.delete(key))
            
            logger.debug(`Cleaned ${toRemove.length} old cache entries`)
        }
    }
}

export default new AIQuizGenerationService()

