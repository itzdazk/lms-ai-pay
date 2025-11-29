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

        // ƯU TIÊN: Check quiz đã lưu trong database (đã được instructor review)
        // Quiz trong DB là source of truth - chất lượng tốt hơn vì đã được review
        const existingQuiz = await prisma.quiz.findFirst({
            where: {
                lessonId,
                isPublished: true
            },
            orderBy: {
                updatedAt: 'desc' // Lấy quiz mới nhất
            }
        })

        if (existingQuiz && existingQuiz.questions) {
            try {
                // Parse questions from JSONB
                const questions = Array.isArray(existingQuiz.questions) 
                    ? existingQuiz.questions 
                    : typeof existingQuiz.questions === 'object' && existingQuiz.questions.questions
                        ? existingQuiz.questions.questions
                        : []
                
                if (questions.length > 0) {
                    // Format questions từ DB (đã được review, chất lượng tốt)
                    const formattedQuestions = questions
                        .filter(q => {
                            // Filter by explanation requirement
                            if (includeExplanation && !q.explanation) return false
                            return true
                        })
                        .slice(0, numQuestions)
                        .map((q, index) => ({
                            id: index + 1,
                            question: q.question || q.text || '',
                            type: q.type || 'multiple_choice',
                            options: q.options || {},
                            correctAnswer: q.correctAnswer || q.correct_answer || 'A',
                            explanation: q.explanation || '',
                            source: 'database' // Đánh dấu là từ DB (đã được review)
                        }))
                    
                    if (formattedQuestions.length > 0) {
                        logger.info(`✅ Using reviewed quiz from database for lesson ${lessonId} (${formattedQuestions.length} questions)`)
                        
                        // Cache the result
                        if (useCache) {
                            const cacheKey = `quiz:lesson:${lessonId}:${numQuestions}:${difficulty}:${includeExplanation}`
                            this.questionCache.set(cacheKey, {
                                questions: formattedQuestions,
                                timestamp: Date.now()
                            })
                        }
                        
                        return formattedQuestions
                    }
                }
            } catch (error) {
                logger.warn(`Failed to parse existing quiz for lesson ${lessonId}:`, error)
                // Fallback to generation
            }
        }
        
        // Nếu không có quiz trong DB → Generate mới (preview/suggest only)
        // Instructor sẽ review và chọn lưu sau
        logger.info(`📝 No quiz found in database for lesson ${lessonId}, generating new questions...`)

        // 1. Get lesson content (nếu không có quiz trong DB, generate mới)
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
        // Nếu quá dài, lấy phần đầu + phần cuối để giữ được context quan trọng
        const maxContentLength = 5000
        let truncatedContent = content
        if (content.length > maxContentLength) {
            const headLength = Math.floor(maxContentLength * 0.7) // 70% phần đầu
            const tailLength = maxContentLength - headLength - 50 // Phần còn lại cho phần cuối
            truncatedContent = content.substring(0, headLength) + 
                '\n\n[... Nội dung đã được rút gọn ...]\n\n' +
                content.substring(content.length - tailLength)
        }

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
        
        // Đánh dấu là generated (chưa được review)
        validatedQuestions.forEach(q => {
            q.source = 'ai_generated' // Đánh dấu là AI generated (cần review)
        })

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

        logger.info(`✨ Generated ${validatedQuestions.length} new questions for lesson ${lessonId} (preview only - instructor should review before saving)`)
        return validatedQuestions
    }

    /**
     * Extract content from lesson
     */
    async _extractLessonContent(lesson) {
        let content = ''

        // ƯU TIÊN TRANSCRIPT - Nội dung chính thường nằm trong video transcript
        // Transcript là nội dung text được extract từ video (speech-to-text)
        // Đây là nguồn thông tin quan trọng nhất cho quiz generation
        let hasTranscript = false
        if (lesson.transcriptUrl) {
            try {
                // Lấy TOÀN BỘ transcript (không giới hạn số segments)
                // Vì nội dung chính nằm trong video, cần lấy đầy đủ để có quiz chất lượng
                const transcriptText = await knowledgeBaseService.getFullTranscriptText(lesson.transcriptUrl)
                if (transcriptText && transcriptText.trim().length > 0) {
                    content += `Nội dung bài học (từ video transcript):\n${transcriptText}\n\n`
                    hasTranscript = true
                }
            } catch (error) {
                logger.warn('Failed to load transcript:', error)
                // Fallback: Nếu không có transcript, dùng description/content
            }
        }

        // Thêm description và content để có context tốt hơn
        // Description thường có tóm tắt và mục tiêu bài học
        // Content có thể có code examples hoặc notes quan trọng
        if (lesson.description) {
            content += `Mô tả bài học: ${lesson.description}\n\n`
        }

        if (lesson.content) {
            content += `Nội dung bổ sung:\n${lesson.content}\n\n`
        }

        // Add course context (luôn thêm để có context)
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

⚠️ QUAN TRỌNG: Bạn PHẢI tập trung vào các điểm QUAN TRỌNG NHẤT, TRỌNG TÂM của bài học:
- Ưu tiên các khái niệm cốt lõi, kiến thức nền tảng
- Tập trung vào các điểm chính mà học viên cần nắm vững
- Tránh các chi tiết phụ, ví dụ nhỏ không quan trọng
- Mỗi câu hỏi phải kiểm tra kiến thức quan trọng, không phải chi tiết vụn vặt

Yêu cầu:
- Độ khó: ${difficulty === 'easy' ? 'Dễ' : difficulty === 'hard' ? 'Khó' : 'Trung bình'}
- Loại câu hỏi: Multiple Choice (4 lựa chọn A, B, C, D)
- Mỗi câu hỏi phải có đúng 1 đáp án đúng
${includeExplanation ? '- Mỗi câu hỏi phải có giải thích cho đáp án đúng' : ''}
- Câu hỏi phải liên quan trực tiếp đến nội dung bài học
- Câu hỏi phải rõ ràng, dễ hiểu
- Đáp án sai phải hợp lý, không quá dễ đoán
- Ưu tiên các câu hỏi về kiến thức quan trọng, trọng tâm của bài học

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
- TẬP TRUNG vào các điểm QUAN TRỌNG NHẤT, TRỌNG TÂM của bài học
- Ưu tiên các khái niệm cốt lõi, kiến thức nền tảng mà học viên cần nắm vững
- Tránh các chi tiết phụ, ví dụ nhỏ không quan trọng
- Đảm bảo câu hỏi chính xác, rõ ràng, và phù hợp với độ khó yêu cầu
- Tạo đáp án sai hợp lý, không quá dễ đoán
- Cung cấp giải thích chi tiết cho đáp án đúng

Lưu ý:
- Chỉ tạo câu hỏi dựa trên nội dung được cung cấp
- Không tạo câu hỏi về kiến thức ngoài phạm vi bài học
- Mỗi câu hỏi phải kiểm tra kiến thức quan trọng, không phải chi tiết vụn vặt
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
            select: {
                id: true,
                lessonOrder: true,
                title: true
            }
        })

        if (lessons.length === 0) {
            throw new Error('No lessons found in course')
        }

        // CÁCH TIẾP CẬN TỐI ƯU: Chỉ tổng hợp từ quiz ĐÃ LƯU trong DB (đã được instructor review)
        // Nguyên tắc:
        // - Quiz trong DB là source of truth (chất lượng tốt, đã được review)
        // - Không generate mới cho course quiz (tránh chất lượng không đảm bảo)
        // - Nếu lesson chưa có quiz → Skip (instructor cần tạo quiz cho lesson đó trước)
        
        const questionsPerLesson = Math.max(1, Math.floor(numQuestions / lessons.length))
        const allQuestions = []
        const lessonsWithoutQuiz = []
        
        // Lấy quiz từ database của từng lesson
        for (const lesson of lessons) {
            try {
                // Chỉ lấy quiz đã lưu trong DB (đã được review)
                const existingQuiz = await prisma.quiz.findFirst({
                    where: {
                        lessonId: lesson.id,
                        isPublished: true
                    },
                    orderBy: {
                        updatedAt: 'desc'
                    }
                })
                
                if (existingQuiz && existingQuiz.questions) {
                    try {
                        const questions = Array.isArray(existingQuiz.questions) 
                            ? existingQuiz.questions 
                            : typeof existingQuiz.questions === 'object' && existingQuiz.questions.questions
                                ? existingQuiz.questions.questions
                                : []
                        
                        if (questions.length > 0) {
                            // Format và filter questions
                            const formattedQuestions = questions
                                .filter(q => includeExplanation ? q.explanation : true)
                                .slice(0, questionsPerLesson)
                                .map((q, index) => ({
                                    id: allQuestions.length + index + 1,
                                    question: q.question || q.text || '',
                                    type: q.type || 'multiple_choice',
                                    options: q.options || {},
                                    correctAnswer: q.correctAnswer || q.correct_answer || 'A',
                                    explanation: q.explanation || '',
                                    lessonId: lesson.id,
                                    lessonOrder: lesson.lessonOrder,
                                    lessonTitle: lesson.title,
                                    source: 'database' // Đánh dấu là từ DB (đã được review)
                                }))
                            
                            allQuestions.push(...formattedQuestions)
                            logger.debug(
                                `✅ Added ${formattedQuestions.length} questions from lesson ${lesson.id} (${lesson.title}) - reviewed quiz`
                            )
                        } else {
                            lessonsWithoutQuiz.push(lesson.title)
                        }
                    } catch (error) {
                        logger.warn(`Failed to parse quiz for lesson ${lesson.id}:`, error)
                        lessonsWithoutQuiz.push(lesson.title)
                    }
                } else {
                    lessonsWithoutQuiz.push(lesson.title)
                }
            } catch (error) {
                logger.warn(`Failed to get quiz for lesson ${lesson.id}:`, error)
                lessonsWithoutQuiz.push(lesson.title)
            }
        }
        
        // Nếu không đủ câu hỏi, thông báo
        if (allQuestions.length < numQuestions) {
            logger.warn(
                `⚠️ Only found ${allQuestions.length}/${numQuestions} questions. ` +
                `Lessons without quiz: ${lessonsWithoutQuiz.join(', ')}`
            )
        }
        
        // Re-index IDs
        const validatedQuestions = allQuestions.slice(0, numQuestions).map((q, index) => ({
            ...q,
            id: index + 1
        }))
        
        // Thêm metadata về lessons thiếu quiz (để frontend có thể hiển thị)
        if (lessonsWithoutQuiz.length > 0) {
            validatedQuestions.metadata = {
                totalRequested: numQuestions,
                totalFound: validatedQuestions.length,
                lessonsWithoutQuiz: lessonsWithoutQuiz,
                message: lessonsWithoutQuiz.length > 0 
                    ? `Một số lessons chưa có quiz: ${lessonsWithoutQuiz.join(', ')}. Vui lòng tạo quiz cho các lessons này trước.`
                    : null
            }
        }

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


