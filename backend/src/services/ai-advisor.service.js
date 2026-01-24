import llmService from './llm.service.js'
import logger from '../config/logger.config.js'

class AIAdvisorService {
    /**
     * Response cho advisor mode - sử dụng LLM để hiểu context nhưng chỉ gợi ý khóa học thực
     * Chỉ hiển thị khóa học khi user thực sự muốn xem, không ép buộc mỗi câu trả lời
     */
    async generateAdvisorResponse(courses, query, conversationHistory = []) {
        // Check if query is greeting or learning-related
        const isGreeting = this._isGreeting(query)

        if (isGreeting) {
            // For greetings, return welcome message
            const text = `👋 Xin chào! Tôi là Trợ lý AI, sẵn sàng giúp bạn tìm khóa học lập trình phù hợp.

🎯 Hãy cho tôi biết:
➡️ Lĩnh vực bạn muốn học: Web, Mobile, Data, AI, Game,v.v. hoặc lĩnh vực khác?
➡️ Trình độ hiện tại của bạn: Cơ bản, Trung cấp, hay Nâng cao?
   💠Cơ bản (BEGINNER): Bạn mới bắt đầu, chưa có kinh nghiệm lập trình hoặc muốn học từ đầu
   💠Trung cấp (INTERMEDIATE): Bạn đã có kiến thức nền tảng, muốn nâng cao kỹ năng và học các công nghệ mới
   💠Nâng cao (ADVANCED): Bạn đã có kinh nghiệm, muốn học chuyên sâu và các kỹ thuật cao cấp

Dựa trên thông tin của bạn, tôi sẽ gợi ý những khóa học tốt nhất! 💡`
            return {
                text,
                sources: [],
                suggestedActions: [],
            }
        }

        // Phân tích intent của user - có muốn xem khóa học không?
        const userIntent = this._analyzeUserIntent(query, conversationHistory)

        // For learning-related queries, use LLM to understand context
        // Then show real courses with intelligent explanation
        try {
            const availableCourses =
                courses && courses.length > 0 ? courses : []

            // Courses đã được filter bởi searchCoursesByQuery (với keywords),
            // nên không cần filter lại. Sử dụng trực tiếp courses từ search.
            const relevantCourses = availableCourses

            // Xác định số lượng khóa học cần hiển thị dựa trên intent và số lượng có sẵn
            const shouldShowCourses = userIntent.wantsToSeeCourses && relevantCourses.length > 0
            const courseCount = this._determineCourseCount(relevantCourses.length, userIntent)

            // Build a prompt that prevents hallucination and only uses relevant courses
            // Chỉ đưa khóa học vào prompt nếu user thực sự muốn xem
            // QUAN TRỌNG: Chỉ đưa đúng số lượng khóa học mà chúng ta sẽ hiển thị
            const coursesForPrompt = shouldShowCourses && courseCount > 0 
                ? relevantCourses.slice(0, courseCount) 
                : []
            
            const coursesList = coursesForPrompt
                .map((c, i) => {
                    const durationLabel = this._formatDuration(c.durationHours)
                    return `${i + 1}. ${c.title} (${durationLabel}, ${c.totalLessons} bài học)`
                })
                .join('\n')

            let prompt = `Bạn là trợ lý tư vấn khóa học lập trình thân thiện và súc tích. Người dùng nói: "${query}"\n\n`

            if (shouldShowCourses && coursesList) {
                prompt += `Khóa học có sẵn (${courseCount} khóa học liên quan):\n${coursesList}\n\n`
                
                // Template chung cho tất cả cases
                prompt += `Hãy trả lời NGẮN GỌN và CÓ CẤU TRÚC RÕ RÀNG:\n`
                prompt += `1. Xác nhận yêu cầu của người dùng\n`
                prompt += `2. Giới thiệu khóa học phù hợp NHẤT (xuống dòng tự nhiên để tách các phần):`
                prompt += `   - "${coursesForPrompt[0].title}"\n`
                prompt += `   - Lý do ngắn gọn tại sao phù hợp (2-3 câu)\n`
                
                // Chỉ thêm phần khóa học khác nếu có nhiều hơn 1
                if (courseCount > 1) {
                    if (courseCount === 2) {
                        prompt += `3. Nếu có khóa học thứ 2 cũng phù hợp, xuống dòng tự nhiên và nhắc đến:\n`
                        prompt += `   - "${coursesForPrompt[1].title}"\n`
                        prompt += `   - Lý do ngắn gọn (2-3 câu)\n`
                    } else {
                        // courseCount >= 3
                        prompt += `3. Nhắc đến ${courseCount === 3 ? 'đầy đủ 2 khóa học còn lại' : '1-2 khóa học khác cũng phù hợp'}:\n`
                        for (let i = 1; i < Math.min(courseCount, 4); i++) {
                            prompt += `   - "${coursesForPrompt[i].title}"\n`
                            prompt += `   - Lý do ngắn gọn (2-3 câu)\n`
                        }
                        if (courseCount === 3) {
                            prompt += `   (BẮT BUỘC phải nhắc đến đầy đủ cả 3 khóa học)\n`
                        }
                    }
                    prompt += `4. Hỏi thêm nếu cần (tùy chọn)\n\n`
                } else {
                    prompt += `3. Hỏi thêm nếu cần (tùy chọn)\n\n`
                }
                
                prompt += `QUAN TRỌNG:\n`
                prompt += `- Sử dụng xuống dòng tự nhiên để chia rõ các ý, KHÔNG viết thành một đoạn văn dài. Format response với line breaks để dễ đọc.\n`
                prompt += `- Trả lời NGẮN GỌN, SÚC TÍCH, KHÔNG lặp lại thông tin\n`
                prompt += `- Chỉ nhắc đến khóa học có trong danh sách trên. KHÔNG tạo ra khóa học mới.\n`
                prompt += `- KHÔNG nhắc đến số lượng khóa học trong câu trả lời (ví dụ: "2 khóa học", "3 khóa học")\n`
                prompt += `- Hệ thống sẽ tự động hiển thị danh sách khóa học bên dưới, bạn chỉ cần giới thiệu ngắn gọn.`
            } else if (userIntent.wantsToSeeCourses && relevantCourses.length === 0) {
                prompt += `Hiện không có khóa học phù hợp với yêu cầu của người dùng.\n\n`
                prompt += `Hãy:\n`
                prompt += `1. Thông báo lịch sự rằng chưa có khóa học phù hợp\n`
                prompt += `2. Hỏi thêm thông tin để tìm khóa học gần nhất (lĩnh vực, level, mục tiêu)\n`
                prompt += `3. Gợi ý các lĩnh vực lập trình liên quan`
            } else {
                // User không muốn xem khóa học ngay, chỉ đang hỏi thông tin
                prompt += `Người dùng đang hỏi thông tin hoặc trò chuyện, chưa yêu cầu xem khóa học cụ thể.\n\n`
                prompt += `Hãy:\n`
                prompt += `1. Trả lời câu hỏi một cách thân thiện và hữu ích\n`
                prompt += `2. Nếu phù hợp, có thể gợi ý nhẹ nhàng về việc tìm khóa học (KHÔNG ép buộc)\n`
                prompt += `3. KHÔNG liệt kê khóa học trừ khi người dùng yêu cầu cụ thể`
            }

            // Use LLM to understand context and generate explanation
            const contextResponse = await llmService.generateResponse(prompt)
            
            // TODO: Test xem có cần post-processing không
            // Tạm thời bỏ post-processing, tin tưởng model tự xử lý
            // Nếu test thấy cần, uncomment _postProcessResponse() và các hàm liên quan
            let advisorMessage = contextResponse
            // let advisorMessage = this._postProcessResponse(contextResponse, coursesForPrompt)

            // Validation: Xác định khóa học nào thực sự được LLM nhắc đến
            // Đơn giản hóa logic: Ưu tiên mentioned courses, fallback về top courses nếu cần
            let coursesToShow = []
            if (shouldShowCourses && courseCount > 0 && coursesForPrompt.length > 0) {
                const mentionedCourses = this._extractMentionedCourses(advisorMessage, coursesForPrompt)
                
                // Sử dụng mentioned courses nếu:
                // 1. Có mentioned courses VÀ
                // 2. (Đủ số lượng HOẶC không phải strong intent - không ép buộc)
                const shouldUseMentioned = mentionedCourses.length > 0 && 
                    (mentionedCourses.length >= courseCount || userIntent.intentStrength !== 'strong')
                
                if (shouldUseMentioned) {
                    coursesToShow = mentionedCourses
                    logger.debug(
                        `[AI Advisor] Using ${mentionedCourses.length} mentioned courses. Query: "${query}"`
                    )
                } else {
                    // Fallback: Hiển thị top courses theo courseCount
                    coursesToShow = coursesForPrompt.slice(0, courseCount)
                    if (mentionedCourses.length > 0) {
                        logger.warn(
                            `[AI Advisor] LLM mentioned ${mentionedCourses.length} courses but expected ${courseCount}. ` +
                            `Strong intent detected, showing top ${courseCount} courses instead. Query: "${query}"`
                        )
                    } else {
                        logger.debug(
                            `[AI Advisor] No courses explicitly mentioned, showing top ${courseCount} courses. Query: "${query}"`
                        )
                    }
                }
            }

            // Build sources from courses - tái sử dụng helper method
            const sources = this._buildSourcesFromCourses(coursesToShow)

            // If no relevant courses and user wants to see courses, add a follow-up prompt
            if (userIntent.wantsToSeeCourses && relevantCourses.length === 0) {
                advisorMessage += `\n\nHiện chưa có khóa học khớp với yêu cầu của bạn. Hãy cho tôi biết thêm: bạn muốn học ngôn ngữ nào (Python, JavaScript, v.v.) và mục tiêu cụ thể (AI, Data, Web, Game)?`
            }

            return { text: advisorMessage, sources }
        } catch (error) {
            // Smarter fallback when Ollama unavailable
            // Sử dụng cùng logic phân tích intent
            const availableCourses =
                courses && courses.length > 0 ? courses : []
            
            // Phân tích intent
            const userIntent = this._analyzeUserIntent(query, conversationHistory)
            const shouldShowCourses = userIntent.wantsToSeeCourses && availableCourses.length > 0
            const courseCount = this._determineCourseCount(availableCourses.length, userIntent)

            let text = ''
            const queryLower = query.toLowerCase()

            // Detect user intent với fallback logic
            if (
                queryLower.includes('khác') ||
                queryLower.includes('nào khác')
            ) {
                // User asking for other/different courses
                if (availableCourses.length === 1) {
                    text = `📚 Hiện tại chúng tôi chỉ có **1 khóa học**: JavaScript cơ bản.\n\n`
                    text += `🎯 Bạn có thể:\n`
                    text += `1. Đăng ký khóa học này để bắt đầu\n`
                    text += `2. Cho tôi biết lĩnh vực bạn quan tâm (Web, Mobile, AI, Game, Data...)\n`
                    text += `3. Chúng tôi sẽ thêm khóa học phù hợp sớm\n\n`
                    text += `Bạn muốn học gì? 😊`
                } else if (shouldShowCourses) {
                    text = `✨ Dưới đây là các khóa học có sẵn:\n\n`
                } else {
                    text = `👋 Bạn muốn tìm khóa học khác? Hãy cho tôi biết lĩnh vực bạn quan tâm! 😊`
                }
            } else if (
                queryLower.includes('tư vấn') ||
                queryLower.includes('gợi ý') ||
                queryLower.includes('nên học gì')
            ) {
                // User asking for consultation/advice
                text = `👨‍💼 Tôi sẵn sàng tư vấn! Để giúp bạn tốt hơn, hãy cho tôi biết:\n\n`
                text += `🎯 **Câu hỏi để tôi hiểu rõ hơn:**\n`
                text += `1. Bạn muốn học về lĩnh vực gì? (Web, Mobile, Backend, Data, AI, Game, v.v.)\n`
                text += `2. Level hiện tại của bạn? (Beginner, Intermediate, Advanced)\n`
                text += `3. Bạn có bao nhiêu thời gian để học mỗi tuần?\n`
                text += `4. Mục tiêu học tập của bạn là gì? (Tìm việc, nâng cao kỹ năng, hobby...)\n\n`
                text += `Sau đó tôi sẽ gợi ý khóa học phù hợp nhất! 💡`
            } else if (
                queryLower.length < 5 ||
                /^(ok|được|gì|vâng|okela|okie|cảm ơn|cam on|thanks|thank you)$/i.test(queryLower)
            ) {
                // Too short or acknowledgment - không hiển thị khóa học
                text = `👋 Bạn muốn biết gì thêm? Tôi có thể giúp bạn:\n\n`
                text += `- 🔍 Tìm khóa học theo lĩnh vực\n`
                text += `- 📚 Gợi ý khóa học phù hợp với level của bạn\n`
                text += `- ❓ Trả lời các câu hỏi về khóa học\n\n`
                text += `Hãy nói cho tôi biết bạn muốn học gì! 😊`
            } else {
                // General learning-related query
                text = `✨ Bạn quan tâm đến: **${query}**\n\n`
                // KHÔNG thêm message về số lượng khóa học để tránh bất đồng bộ
                if (userIntent.wantsToSeeCourses && availableCourses.length === 0) {
                    text += `Hiện chưa có khóa học phù hợp với yêu cầu này. Hãy cho tôi biết lĩnh vực/ngôn ngữ bạn muốn học (AI, Python, Web, v.v.) để tôi gợi ý chính xác hơn!`
                }
            }

            // Lọc khóa học liên quan dựa trên intent
            const relevantCourses = shouldShowCourses
                ? availableCourses.filter((course) =>
                      this._isCourseRelevant(query, course)
                  )
                : []

            // Xác định số lượng thực tế cần hiển thị
            const finalCourseCount = shouldShowCourses 
                ? this._determineCourseCount(relevantCourses.length, userIntent)
                : 0

            // Build sources - tái sử dụng helper method
            const coursesToShow = shouldShowCourses && finalCourseCount > 0
                ? relevantCourses.slice(0, finalCourseCount)
                : []
            const sources = this._buildSourcesFromCourses(coursesToShow, 'fallback')

            return { text, sources }
        }
    }

    /**
     * Phân tích intent của user - có muốn xem khóa học không?
     * @param {string} query - User query
     * @param {Array} conversationHistory - Lịch sử hội thoại
     * @returns {Object} Intent analysis { wantsToSeeCourses: boolean, intentStrength: 'strong'|'medium'|'weak' }
     */
    _analyzeUserIntent(query, conversationHistory = []) {
        if (!query || query.trim().length === 0) {
            return { wantsToSeeCourses: false, intentStrength: 'weak' }
        }

        const queryLower = query.toLowerCase().trim()

        // Strong intent: User rõ ràng muốn xem/tìm khóa học
        const strongIntentPatterns = [
            /(tìm|tìm kiếm|search|show|hiển thị|cho xem|cho tôi xem|gợi ý|đề xuất|recommend|suggest).*(khóa học|course|khoa hoc)/i,
            /(khóa học|course|khoa hoc).*(nào|gì|what|which|phù hợp|phu hop|tốt nhất|tot nhat)/i,
            /(nên học|nên chọn|should learn|should take|nên đăng ký).*(khóa học|course|khoa hoc|gì|what)/i,
            /(muốn học|want to learn|muốn tìm|want to find).*(khóa học|course|khoa hoc)/i,
            /(có khóa học nào|có course nào|any course|any khoa hoc)/i,
            /(list|danh sách|danh sach).*(khóa học|course|khoa hoc)/i,
            /(xem|show|see|view).*(khóa học|course|khoa hoc)/i,
        ]

        // Medium intent: User đang hỏi về lĩnh vực/technology cụ thể (có thể muốn xem khóa học)
        const mediumIntentPatterns = [
            /(học|learn|study|muốn học|want to learn).*(python|javascript|java|react|vue|angular|node|web|mobile|ai|data|game|backend|frontend)/i,
            /(tư vấn|advice|consult|gợi ý|suggest).*(lộ trình|roadmap|path|học gì|what to learn)/i,
            /(bắt đầu|start|begin).*(với|with|từ|from)/i,
            /(level|trình độ|trinh do|beginner|intermediate|advanced|nâng cao|nang cao)/i,
        ]

        // Weak/No intent: User chỉ đang trò chuyện, hỏi thông tin chung, không muốn xem khóa học
        const noIntentPatterns = [
            /^(ok|được|gì|vâng|okela|okie|cảm ơn|cam on|thanks|thank you)$/i,
            /(là gì|what is|what's|giải thích|explain|tại sao|why|như thế nào|how)/i,
            /(hỏi|ask|question|câu hỏi|cau hoi)/i,
        ]

        // Check strong intent first
        if (strongIntentPatterns.some(pattern => pattern.test(queryLower))) {
            return { wantsToSeeCourses: true, intentStrength: 'strong' }
        }

        // Check no intent (trò chuyện chung, không liên quan khóa học)
        if (noIntentPatterns.some(pattern => pattern.test(queryLower))) {
            return { wantsToSeeCourses: false, intentStrength: 'weak' }
        }

        // Check medium intent
        if (mediumIntentPatterns.some(pattern => pattern.test(queryLower))) {
            // Nếu có từ khóa về lĩnh vực/technology, có thể user muốn xem khóa học
            // Nhưng không ép buộc, để LLM quyết định trong response
            return { wantsToSeeCourses: true, intentStrength: 'medium' }
        }

        // Default: Nếu query dài và có từ khóa liên quan, có thể muốn xem
        // Nhưng ưu tiên không ép buộc
        if (queryLower.length > 10) {
            // Có thể user đang mô tả nhu cầu, có thể muốn xem khóa học
            return { wantsToSeeCourses: true, intentStrength: 'medium' }
        }

        // Query ngắn hoặc không rõ ràng - không ép buộc hiển thị khóa học
        return { wantsToSeeCourses: false, intentStrength: 'weak' }
    }

    /**
     * Build sources array từ danh sách courses
     * @param {Array} courses - Danh sách courses cần build sources
     * @param {string} context - Context để log (optional, default: 'main')
     * @returns {Array} Sources array (max 3 courses)
     */
    _buildSourcesFromCourses(courses, context = 'main') {
        if (!courses || courses.length === 0) {
            return []
        }

        let sources = courses.map((course) => ({
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
            durationLabel: this._formatDuration(course.durationHours),
            lessons: course.totalLessons,
            description: course.shortDescription,
            thumbnail: course.thumbnailUrl,
            instructor: course.instructor,
        }))

        // Final validation: Đảm bảo sources không vượt quá 3
        if (sources.length > 3) {
            logger.warn(
                `[AI Advisor ${context}] Sources count (${sources.length}) exceeds maximum (3). Truncating to 3.`
            )
            sources = sources.slice(0, 3)
        }

        return sources
    }

    /**
     * Trích xuất các khóa học thực sự được LLM nhắc đến trong response
     * @param {string} llmResponse - LLM response text
     * @param {Array} coursesInPrompt - Danh sách khóa học đã đưa vào prompt
     * @returns {Array} Mảng các khóa học được nhắc đến (theo thứ tự xuất hiện)
     */
    _extractMentionedCourses(llmResponse, coursesInPrompt) {
        if (!llmResponse || !coursesInPrompt || coursesInPrompt.length === 0) {
            return []
        }

        const mentionedCourses = []
        const responseLower = llmResponse.toLowerCase() // Cache lowercase response

        // Tìm các khóa học được nhắc đến bằng cách so khớp tên khóa học
        // Ưu tiên khóa học xuất hiện sớm hơn trong response
        for (const course of coursesInPrompt) {
            const courseTitle = course.title || ''
            if (!courseTitle) continue

            const courseTitleLower = courseTitle.toLowerCase() // Cache lowercase title

            // Tìm tên khóa học trong response (có thể là tên đầy đủ hoặc một phần)
            // Sử dụng các từ khóa quan trọng trong tên khóa học để tìm
            const titleWords = courseTitleLower
                .split(/[:\-–—]/) // Tách theo dấu hai chấm, gạch ngang
                .map(w => w.trim())
                .filter(w => w.length > 5) // Chỉ lấy các từ dài (từ khóa quan trọng)

            // Kiểm tra xem có từ khóa nào của tên khóa học xuất hiện trong response không
            let found = false
            for (const keyword of titleWords) {
                if (responseLower.includes(keyword)) {
                    found = true
                    break
                }
            }

            // Nếu không tìm thấy bằng từ khóa, thử tìm tên đầy đủ (nếu tên ngắn)
            if (!found && courseTitle.length < 50) {
                // Tìm tên đầy đủ trong response (cho phép một số ký tự khác nhau)
                const titlePattern = courseTitle
                    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
                    .replace(/\s+/g, '\\s*') // Cho phép khoảng trắng linh động
                const regex = new RegExp(titlePattern, 'i')
                if (regex.test(llmResponse)) {
                    found = true
                }
            }

            if (found) {
                mentionedCourses.push(course)
            }
        }

        // Sắp xếp theo thứ tự xuất hiện trong response (cache strings để tối ưu)
        mentionedCourses.sort((a, b) => {
            const titleALower = (a.title || '').toLowerCase()
            const titleBLower = (b.title || '').toLowerCase()
            const indexA = responseLower.indexOf(titleALower)
            const indexB = responseLower.indexOf(titleBLower)
            if (indexA === -1) return 1
            if (indexB === -1) return -1
            return indexA - indexB
        })

        return mentionedCourses
    }

    /**
     * Xác định số lượng khóa học cần hiển thị dựa trên intent và số lượng có sẵn
     * Logic linh động: chỉ hiển thị khi thực sự cần thiết, không ép buộc
     * @param {number} availableCount - Số lượng khóa học có sẵn
     * @param {Object} intent - Intent analysis từ _analyzeUserIntent
     * @returns {number} Số lượng khóa học nên hiển thị (0-3)
     */
    _determineCourseCount(availableCount, intent) {
        if (availableCount === 0) return 0
        if (!intent.wantsToSeeCourses) return 0

        // Strong intent: User rõ ràng muốn xem khóa học
        // Hiển thị 1-3 khóa học tùy theo số lượng có sẵn
        if (intent.intentStrength === 'strong') {
            if (availableCount === 1) return 1
            if (availableCount === 2) return 2
            // Nếu có 3+ khóa học, hiển thị 3 khóa học tốt nhất
            return Math.min(3, availableCount)
        }

        // Medium intent: User có thể muốn xem, nhưng không ép buộc
        // Chỉ hiển thị 1-2 khóa học phù hợp nhất
        if (intent.intentStrength === 'medium') {
            if (availableCount === 1) return 1
            // Với medium intent, chỉ hiển thị 1-2 khóa học tốt nhất
            return Math.min(2, availableCount)
        }

        // Weak intent: User chỉ đang hỏi thông tin, không rõ ràng muốn xem khóa học
        // Không hiển thị hoặc chỉ 1 khóa học nếu có ít
        if (availableCount === 1) return 1
        // Với weak intent, thường không hiển thị khóa học
        return 0
    }

    /**
     * Check if query is a greeting
     */
    _isGreeting(query) {
        if (!query || query.trim().length === 0) return true
        const greetings =
            /^(xin chào|chào|hello|hi|halo|hey|xin chào bạn|chào bạn|chào em|xin kính chào|tình hình|sao|sao rồi|thế nào|khỏe không|bạn khỏe không|alo|ê|ơi)$/i
        return greetings.test(query.trim())
    }

    /**
     * Check if a course is relevant to the query
     */
    _isCourseRelevant(query, course) {
        if (!query || query.trim().length === 0) return false

        const haystack =
            `${course.title || ''} ${course.shortDescription || ''} ${course.description || ''} ${course.whatYouLearn || ''}`.toLowerCase()

        // Filter out generic Vietnamese stopwords so we only match on meaningful tech keywords
        const stopwords = new Set([
            'hoc',
            'học',
            'muon',
            'muốn',
            'toi',
            'tôi',
            'ban',
            'bạn',
            'lam',
            'làm',
            'viec',
            'việc',
            'can',
            'cần',
            'gi',
            'gì',
            'the',
            'thế',
            'nào',
            'phu',
            'phù',
            'hop',
            'hợp',
            'de',
            'để',
            've',
            'về',
            'khoa',
            'khóa',
            'lop',
            'lớp',
            'co',
            'có',
            'trinh',
            'trình',
            'lap',
            'lập',
            'co',
            'có',
            'coi',
            'xem',
            'camon',
            'cảm',
            'cảm ơn',
            'on',
            'ơn',
        ])

        const allowShortKeywords = new Set([
            'ai',
            'js',
            'go',
            'c',
            'c++',
            'c#',
            'ui',
            'ux',
            'sql',
        ])

        const keywords = query
            .toLowerCase()
            .split(/[^\p{L}\p{N}+#.]+/u)
            .filter((w) => w.length > 0)
            .filter(
                (w) =>
                    (w.length >= 3 || allowShortKeywords.has(w)) &&
                    !stopwords.has(w)
            )

        if (keywords.length === 0) return false

        return keywords.some((kw) => haystack.includes(kw))
    }

    /**
     * Định dạng thời lượng (durationMinutes tính bằng phút) thành chuỗi thân thiện
     * - < 60 phút: "X phút"
     * - >= 60 phút: "X giờ Y phút" (ẩn phút nếu 0)
     * @param {number} durationMinutes - Thời lượng tính bằng phút
     * @returns {string} Chuỗi thân thiện (ví dụ: "2 giờ 30 phút", "45 phút")
     */
    _formatDuration(durationMinutes) {
        if (!durationMinutes || Number.isNaN(Number(durationMinutes))) {
            return 'N/A'
        }
        const totalMinutes = Math.max(0, Number(durationMinutes))
        const hours = Math.floor(totalMinutes / 60)
        const minutes = totalMinutes % 60

        // Hiển thị tiếng Việt: giờ/phút
        if (hours === 0) return `${minutes} phút`
        if (minutes === 0) return `${hours} giờ`
        return `${hours} giờ ${minutes} phút`
    }
}

// Export singleton instance
export default new AIAdvisorService()
