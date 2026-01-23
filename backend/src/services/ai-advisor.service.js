import ollamaService from './ollama.service.js'
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

            // OPTIMIZED: If courses were already filtered by searchCoursesByQuery (with keywords),
            // we don't need to filter again. Only filter if query is empty or very generic.
            // The searchCoursesByQuery now extracts keywords and searches properly, so courses
            // returned are already relevant.
            let relevantCourses = availableCourses
            
            // Only apply additional filtering if:
            // 1. Query is empty/generic (no keywords extracted)
            // 2. We want to further refine results
            // For most cases, courses from searchCoursesByQuery are already relevant
            if (query && query.trim() && availableCourses.length > 0) {
                // Optional: Can still filter if we want stricter matching
                // But usually not needed since searchCoursesByQuery already filters by keywords
                // relevantCourses = availableCourses.filter((course) =>
                //     this._isCourseRelevant(query, course)
                // )
                // For now, use all courses returned from search (already filtered by keywords)
                relevantCourses = availableCourses
            }

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

            // Xây dựng prompt linh động dựa trên intent
            // QUAN TRỌNG: Prompt phải chỉ định rõ số lượng khóa học cần nhắc đến
            let prompt = `Bạn là trợ lý tư vấn khóa học lập trình thân thiện và súc tích. Người dùng nói: "${query}"\n\n`

            if (shouldShowCourses && coursesList) {
                prompt += `Khóa học có sẵn (${courseCount} khóa học liên quan):\n${coursesList}\n\n`
                
                // Prompt linh động dựa trên số lượng khóa học
                if (courseCount === 1) {
                    prompt += `Hãy trả lời NGẮN GỌN và CÓ CẤU TRÚC RÕ RÀNG:\n`
                    prompt += `1. Xác nhận yêu cầu của người dùng (1 câu)\n`
                    prompt += `2. Xuống dòng, giới thiệu khóa học: "${coursesForPrompt[0].title}"\n`
                    prompt += `   - Giải thích ngắn gọn tại sao phù hợp (1-2 câu)\n`
                    prompt += `3. Hỏi thêm nếu cần (tùy chọn)\n\n`
                } else if (courseCount === 2) {
                    prompt += `Hãy trả lời NGẮN GỌN và CÓ CẤU TRÚC RÕ RÀNG:\n`
                    prompt += `1. Xác nhận yêu cầu của người dùng (1 câu)\n`
                    prompt += `2. Xuống dòng, giới thiệu khóa học phù hợp NHẤT:\n`
                    prompt += `   - "${coursesForPrompt[0].title}"\n`
                    prompt += `   - Lý do ngắn gọn tại sao phù hợp (1-2 câu)\n`
                    prompt += `3. Nếu có khóa học thứ 2 cũng phù hợp, xuống dòng và nhắc đến:\n`
                    prompt += `   - "${coursesForPrompt[1].title}"\n`
                    prompt += `   - Lý do ngắn gọn (1 câu)\n`
                    prompt += `4. Hỏi thêm nếu cần (tùy chọn)\n\n`
                } else {
                    prompt += `Hãy trả lời NGẮN GỌN và CÓ CẤU TRÚC RÕ RÀNG:\n`
                    prompt += `1. Xác nhận yêu cầu của người dùng (1 câu)\n`
                    prompt += `2. Xuống dòng, giới thiệu khóa học phù hợp NHẤT:\n`
                    prompt += `   - "${coursesForPrompt[0].title}"\n`
                    prompt += `   - Lý do ngắn gọn tại sao phù hợp (1-2 câu)\n`
                    prompt += `3. Nếu có khóa học khác cũng phù hợp, xuống dòng và nhắc đến 1-2 khóa học nữa:\n`
                    prompt += `   - Tên khóa học\n`
                    prompt += `   - Lý do ngắn gọn (1 câu mỗi khóa học)\n`
                    prompt += `4. Hỏi thêm nếu cần (tùy chọn)\n\n`
                }
                
                prompt += `QUAN TRỌNG VỀ FORMAT:\n`
                prompt += `- BẮT BUỘC: Sử dụng xuống dòng (\\n) để chia rõ các ý, KHÔNG viết thành một đoạn văn dài\n`
                prompt += `- Mỗi khóa học nên được giới thiệu trên một dòng riêng hoặc có khoảng trắng rõ ràng\n`
                prompt += `- Format ví dụ:\n`
                prompt += `  "Tôi hiểu bạn muốn...\n\n`
                prompt += `  Khóa học phù hợp nhất: [Tên khóa học]\n`
                prompt += `  [Lý do ngắn gọn]\n\n`
                prompt += `  Ngoài ra, bạn cũng có thể xem: [Tên khóa học khác]\n`
                prompt += `  [Lý do ngắn gọn]"\n\n`
                prompt += `- Trả lời NGẮN GỌN, SÚC TÍCH, KHÔNG lặp lại thông tin\n`
                prompt += `- Chỉ nhắc đến khóa học có trong danh sách trên. KHÔNG tạo ra khóa học mới.\n`
                prompt += `- TUYỆT ĐỐI KHÔNG được nhắc đến số lượng khóa học trong câu trả lời.\n`
                prompt += `- KHÔNG lặp lại tên khóa học nhiều lần. Chỉ nhắc đến tên khóa học 1 lần khi giới thiệu.\n`
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

            // Use Ollama to understand context and generate explanation
            const contextResponse = await ollamaService.generateResponse(prompt)
            let advisorMessage = contextResponse

            // Post-process: Remove các câu mention số lượng khóa học
            advisorMessage = this._removeCourseCountMentions(advisorMessage)
            
            // // Post-process: Làm sạch response - loại bỏ phần lặp lại và dính lẹo
            // advisorMessage = this._cleanResponse(advisorMessage, coursesForPrompt)
            
            // // Post-process: Format response để có cấu trúc rõ ràng, dễ đọc
            // advisorMessage = this._formatResponse(advisorMessage, coursesForPrompt)

            // Validation: Xác định khóa học nào thực sự được LLM nhắc đến
            // Để đảm bảo đồng bộ giữa số lượng LLM nói và số lượng hiển thị
            let coursesToShow = []
            if (shouldShowCourses && courseCount > 0 && coursesForPrompt.length > 0) {
                // Tìm các khóa học được LLM thực sự nhắc đến trong response
                const mentionedCourses = this._extractMentionedCourses(advisorMessage, coursesForPrompt)
                
                if (mentionedCourses.length > 0) {
                    // Nếu LLM đã nhắc đến khóa học cụ thể, chỉ hiển thị những khóa học đó
                    coursesToShow = mentionedCourses
                    logger.debug(
                        `[AI Advisor] LLM mentioned ${mentionedCourses.length} courses. ` +
                        `Query: "${query}", Showing: ${mentionedCourses.length}`
                    )
                } else {
                    // Nếu không tìm thấy khóa học nào được nhắc đến rõ ràng,
                    // hiển thị các khóa học tốt nhất theo courseCount
                    coursesToShow = coursesForPrompt.slice(0, courseCount)
                    logger.debug(
                        `[AI Advisor] No courses explicitly mentioned, showing top ${courseCount} courses. ` +
                        `Query: "${query}"`
                    )
                }
            }

            // Build sources from courses - chỉ hiển thị khóa học đã được xác định
            let sources = shouldShowCourses && coursesToShow.length > 0
                ? coursesToShow.map((course) => ({
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
                : []

            // Final validation: Đảm bảo sources không vượt quá 3
            if (sources.length > 3) {
                logger.warn(
                    `[AI Advisor] Sources count (${sources.length}) exceeds maximum (3). Truncating to 3.`
                )
                sources = sources.slice(0, 3)
            }

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

            // Build sources - chỉ khi cần hiển thị
            let sources = shouldShowCourses && finalCourseCount > 0
                ? relevantCourses.slice(0, finalCourseCount).map((course) => ({
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
                : []

            // Final validation: Đảm bảo sources không vượt quá 3
            if (sources.length > 3) {
                logger.warn(
                    `[AI Advisor Fallback] Sources count (${sources.length}) exceeds maximum (3). Truncating to 3.`
                )
                sources = sources.slice(0, 3)
            }

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
        const responseLower = llmResponse.toLowerCase()

        // Tìm các khóa học được nhắc đến bằng cách so khớp tên khóa học
        // Ưu tiên khóa học xuất hiện sớm hơn trong response
        for (const course of coursesInPrompt) {
            const courseTitle = course.title || ''
            if (!courseTitle) continue

            // Tìm tên khóa học trong response (có thể là tên đầy đủ hoặc một phần)
            // Sử dụng các từ khóa quan trọng trong tên khóa học để tìm
            const titleWords = courseTitle
                .toLowerCase()
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

        // Sắp xếp theo thứ tự xuất hiện trong response
        mentionedCourses.sort((a, b) => {
            const indexA = llmResponse.toLowerCase().indexOf((a.title || '').toLowerCase())
            const indexB = llmResponse.toLowerCase().indexOf((b.title || '').toLowerCase())
            if (indexA === -1) return 1
            if (indexB === -1) return -1
            return indexA - indexB
        })

        return mentionedCourses
    }

    /**
     * Parse LLM response để xác định số lượng khóa học LLM thực sự nhắc đến
     * @param {string} llmResponse - LLM response text
     * @param {Array} coursesInPrompt - Danh sách khóa học đã đưa vào prompt
     * @returns {number} Số lượng khóa học được nhắc đến (0 nếu không parse được)
     */
    _extractMentionedCourseCount(llmResponse, coursesInPrompt) {
        if (!llmResponse || !coursesInPrompt || coursesInPrompt.length === 0) {
            return 0
        }

        // Tìm các pattern về số lượng khóa học trong response
        // Ví dụ: "2 khóa học", "hai khóa học", "1. ...", "2. ..."
        const numberPatterns = [
            /(\d+)\s*(khóa học|course|khoa hoc)/i,
            /(một|hai|ba|bốn|năm|sáu|one|two|three|four|five|six)\s*(khóa học|course|khoa hoc)/i,
        ]

        let mentionedCount = 0

        // Tìm số lượng từ pattern
        for (const pattern of numberPatterns) {
            const match = llmResponse.match(pattern)
            if (match) {
                const numberText = match[1].toLowerCase()
                const numberMap = {
                    'một': 1, 'one': 1,
                    'hai': 2, 'two': 2,
                    'ba': 3, 'three': 3,
                    'bốn': 4, 'four': 4,
                    'năm': 5, 'five': 5,
                    'sáu': 6, 'six': 6,
                }
                mentionedCount = numberMap[numberText] || parseInt(numberText, 10) || 0
                break
            }
        }

        // Nếu không tìm thấy từ pattern, đếm số lượng khóa học được liệt kê (1., 2., 3., ...)
        if (mentionedCount === 0) {
            const numberedListPattern = /^\d+\.\s+\*\*/gm
            const matches = llmResponse.match(numberedListPattern)
            if (matches) {
                mentionedCount = matches.length
            }
        }

        // Nếu vẫn không tìm thấy, đếm số lần xuất hiện tên khóa học trong response
        if (mentionedCount === 0 && coursesInPrompt.length > 0) {
            let foundCount = 0
            for (const course of coursesInPrompt) {
                // Kiểm tra xem tên khóa học có xuất hiện trong response không
                const courseTitle = course.title || ''
                if (courseTitle && llmResponse.includes(courseTitle)) {
                    foundCount++
                }
            }
            mentionedCount = foundCount
        }

        // Đảm bảo số lượng không vượt quá số lượng có trong prompt
        return Math.min(mentionedCount, coursesInPrompt.length)
    }

    /**
     * Remove các câu mention số lượng khóa học từ response
     * @param {string} response - LLM response text
     * @returns {string} Response đã được clean
     */
    _removeCourseCountMentions(response) {
        if (!response) return response

        // Các pattern cần remove - mở rộng để catch nhiều cách mention hơn
        const patternsToRemove = [
            // "Dưới đây là X khóa học"
            /(Dưới đây|dưới đây|Đây là|đây là|Sau đây|sau đây)\s+(là\s+)?(\d+|một|hai|ba|bốn|năm|sáu)\s+(khóa học|course|khoa hoc)[:.]?\s*/gi,
            // "Tôi sẽ gợi ý X khóa học"
            /(Tôi|tôi)\s+(sẽ|sẽ|gợi ý|đề xuất|giới thiệu)\s+(cho bạn\s+)?(\d+|một|hai|ba|bốn|năm|sáu)\s+(khóa học|course|khoa hoc)[:.]?\s*/gi,
            // "Có X khóa học phù hợp"
            /(Có|có)\s+(\d+|một|hai|ba|bốn|năm|sáu)\s+(khóa học|course|khoa hoc)\s+(phù hợp|tốt nhất|liên quan|sau đây)[:.]?\s*/gi,
            // "Dựa trên danh sách, tôi sẽ gợi ý X khóa học"
            /(Dựa trên|dựa trên)\s+(danh sách|danh sách trên),\s+(tôi|Tôi)\s+(sẽ|sẽ)\s+(gợi ý|đề xuất)\s+(cho bạn\s+)?(\d+|một|hai|ba|bốn|năm|sáu)\s+(khóa học|course|khoa hoc)[:.]?\s*/gi,
            // "X khóa học phù hợp nhất"
            /^(\d+|một|hai|ba|bốn|năm|sáu)\s+(khóa học|course|khoa hoc)\s+(phù hợp|tốt nhất|liên quan|sau đây)[:.]?\s*/gim,
            // "Tôi gợi ý X khóa học" (không có "sẽ")
            /(Tôi|tôi)\s+(gợi ý|đề xuất|giới thiệu)\s+(cho bạn\s+)?(\d+|một|hai|ba|bốn|năm|sáu)\s+(khóa học|course|khoa hoc)[:.]?\s*/gi,
            // "X khóa học sau đây"
            /(\d+|một|hai|ba|bốn|năm|sáu)\s+(khóa học|course|khoa hoc)\s+(sau đây|dưới đây|phù hợp|tốt nhất)[:.]?\s*/gi,
            // "Bạn có thể xem X khóa học"
            /(Bạn|bạn)\s+(có thể|có)\s+(xem|tham khảo)\s+(\d+|một|hai|ba|bốn|năm|sáu)\s+(khóa học|course|khoa hoc)[:.]?\s*/gi,
        ]

        let cleanedResponse = response

        // Remove từng pattern
        for (const pattern of patternsToRemove) {
            cleanedResponse = cleanedResponse.replace(pattern, '')
        }

        // Remove các câu chỉ chứa số lượng (ví dụ: "2 khóa học:" hoặc "3 khóa học phù hợp:")
        cleanedResponse = cleanedResponse.replace(/^(\d+|một|hai|ba|bốn|năm|sáu)\s+(khóa học|course|khoa hoc)[:.]?\s*$/gim, '')

        // Clean up multiple spaces và newlines
        cleanedResponse = cleanedResponse
            .replace(/\n\s*\n\s*\n/g, '\n\n') // Multiple newlines -> double newline
            .replace(/^\s+|\s+$/gm, '') // Trim each line
            .replace(/\s{2,}/g, ' ') // Multiple spaces -> single space
            .trim()

        return cleanedResponse
    }

    /**
     * Làm sạch response - loại bỏ phần lặp lại, dính lẹo, và các câu không cần thiết
     * @param {string} response - LLM response text
     * @param {Array} coursesInPrompt - Danh sách khóa học đã đưa vào prompt
     * @returns {string} Response đã được làm sạch
     */
    _cleanResponse(response, coursesInPrompt = []) {
        if (!response) return response

        let cleaned = response

        // Loại bỏ các câu lặp lại về khóa học không liên quan
        // Ví dụ: "Tuy nhiên, nếu bạn muốn tìm hiểu thêm về X, cũng có thể tham khảo khóa học Y"
        // khi Y không phù hợp với query
        const unrelatedPatterns = [
            /Tuy nhiên,?\s+nếu\s+bạn\s+muốn\s+tìm\s+hiểu\s+thêm\s+về\s+[^,]+,\s+cũng\s+có\s+thể\s+tham\s+khảo\s+khóa\s+học\s+"[^"]+"[^.]*\./gi,
            /Tuy nhiên,?\s+nếu\s+bạn\s+muốn\s+[^,]+,\s+cũng\s+có\s+thể\s+xem\s+xét\s+khóa\s+học\s+"[^"]+"[^.]*\./gi,
            /Và\s+cuối\s+cùng,?\s+nếu\s+bạn\s+muốn\s+[^,]+,\s+cũng\s+có\s+thể\s+[^.]*\./gi,
        ]

        for (const pattern of unrelatedPatterns) {
            cleaned = cleaned.replace(pattern, '')
        }

        // Loại bỏ các câu dài dòng, lặp lại thông tin
        // Ví dụ: "Khóa học này sẽ cung cấp cho bạn kiến thức và kỹ năng cần thiết để..."
        const verbosePatterns = [
            /Khóa\s+học\s+này\s+sẽ\s+cung\s+cấp\s+cho\s+bạn\s+kiến\s+thức\s+và\s+kỹ\s+năng\s+cần\s+thiết\s+để[^.]*\./gi,
            /Khóa\s+học\s+này\s+giúp\s+bạn\s+có\s+thể\s+tạo\s+ra[^.]*\./gi,
        ]

        for (const pattern of verbosePatterns) {
            cleaned = cleaned.replace(pattern, '')
        }

        // Loại bỏ các câu hỏi lặp lại không cần thiết ở cuối
        // Ví dụ: "Để hiểu rõ hơn về nhu cầu của bạn, có thể hỏi thêm câu hỏi: ..."
        const redundantQuestionPatterns = [
            /Để\s+hiểu\s+rõ\s+hơn\s+về\s+nhu\s+cầu\s+của\s+bạn,?\s+có\s+thể\s+hỏi\s+thêm\s+câu\s+hỏi[^.]*\./gi,
            /Để\s+hiểu\s+rõ\s+hơn,?\s+có\s+thể\s+hỏi\s+thêm\s+câu\s+hỏi[^.]*\./gi,
        ]

        for (const pattern of redundantQuestionPatterns) {
            cleaned = cleaned.replace(pattern, '')
        }

        // Loại bỏ các đoạn văn dài dòng, lặp lại cùng một ý
        // Tách response thành các câu và loại bỏ câu lặp lại
        const sentences = cleaned.split(/[.!?]\s+/).filter(s => s.trim().length > 0)
        const uniqueSentences = []
        const seenPhrases = new Set()

        for (const sentence of sentences) {
            const normalized = sentence.toLowerCase().trim()
            // Kiểm tra xem câu này có quá giống với câu trước không
            let isDuplicate = false
            for (const seen of seenPhrases) {
                // Nếu câu mới chứa > 70% nội dung của câu đã thấy, coi là duplicate
                const similarity = this._calculateSimilarity(normalized, seen)
                if (similarity > 0.7) {
                    isDuplicate = true
                    break
                }
            }

            if (!isDuplicate && normalized.length > 10) {
                uniqueSentences.push(sentence.trim())
                seenPhrases.add(normalized)
            }
        }

        cleaned = uniqueSentences.join('. ').trim()
        if (cleaned && !cleaned.endsWith('.') && !cleaned.endsWith('!') && !cleaned.endsWith('?')) {
            cleaned += '.'
        }

        // Clean up multiple spaces và newlines
        cleaned = cleaned
            .replace(/\n\s*\n\s*\n/g, '\n\n') // Multiple newlines -> double newline
            .replace(/^\s+|\s+$/gm, '') // Trim each line
            .replace(/\s{2,}/g, ' ') // Multiple spaces -> single space
            .replace(/\.\s*\./g, '.') // Multiple dots -> single dot
            .trim()

        return cleaned
    }

    /**
     * Format response để có cấu trúc rõ ràng, dễ đọc với line breaks
     * @param {string} response - LLM response text
     * @param {Array} coursesInPrompt - Danh sách khóa học đã đưa vào prompt
     * @returns {string} Response đã được format
     */
    _formatResponse(response, coursesInPrompt = []) {
        if (!response) return response

        let formatted = response.trim()

        // Nếu response đã có line breaks rõ ràng (nhiều hơn 2 line breaks), giữ nguyên
        const lineBreakCount = (formatted.match(/\n\n/g) || []).length
        if (lineBreakCount >= 2) {
            // Đã có format tốt, chỉ cần clean up
            return formatted
                .replace(/\n{3,}/g, '\n\n') // Max 2 line breaks
                .trim()
        }

        // Pattern 1: Tìm tên khóa học và thêm line break trước nó
        for (const course of coursesInPrompt) {
            const courseTitle = course.title || ''
            if (!courseTitle) continue

            // Tìm tên khóa học trong dấu ngoặc kép
            const escapedTitle = this._escapeRegex(courseTitle)
            const titlePattern = new RegExp(`(["'"])${escapedTitle}\\1`, 'gi')
            
            formatted = formatted.replace(titlePattern, (match, quote) => {
                const matchIndex = formatted.indexOf(match)
                const beforeMatch = formatted.substring(0, matchIndex).trim()
                
                // Nếu đã có line break trước đó, không thêm nữa
                if (beforeMatch.endsWith('\n\n')) {
                    return match
                }
                
                // Tìm vị trí bắt đầu của câu chứa tên khóa học
                // Thêm line break trước câu đó nếu câu trước đó đã kết thúc
                const sentenceStart = beforeMatch.lastIndexOf('. ')
                if (sentenceStart > 0 && beforeMatch.length - sentenceStart > 10) {
                    // Có câu trước đó, thêm line break sau câu đó
                    return `\n\n${match}`
                } else if (beforeMatch.length > 30) {
                    // Không có câu trước rõ ràng nhưng có đủ text, thêm line break
                    return `\n\n${match}`
                }
                
                return match
            })
        }

        // Pattern 2: Thêm line break trước các từ khóa báo hiệu phần mới
        const breakKeywords = [
            { pattern: /\s+(Khóa học|khóa học)\s+(phù hợp|tốt nhất|liên quan|khác)/gi, replace: '\n\n$1 $2' },
            { pattern: /\s+(Ngoài ra|Bên cạnh đó|Ngoài ra,|Bên cạnh đó,)/gi, replace: '\n\n$1' },
            { pattern: /\s+(Tuy nhiên|Tuy nhiên,|Tuy vậy|Tuy vậy,)/gi, replace: '\n\n$1' },
            { pattern: /\s+(Khóa học khác|khóa học khác)/gi, replace: '\n\n$1' },
        ]

        for (const { pattern, replace } of breakKeywords) {
            formatted = formatted.replace(pattern, (match) => {
                const matchIndex = formatted.indexOf(match)
                const beforeMatch = formatted.substring(0, matchIndex).trim()
                
                // Chỉ thêm line break nếu chưa có và có đủ text trước đó
                if (!beforeMatch.endsWith('\n\n') && beforeMatch.length > 20) {
                    return replace
                }
                return match
            })
        }

        // Pattern 3: Thêm line break sau câu đầu tiên (xác nhận yêu cầu) nếu response dài
        if (!formatted.includes('\n\n') && formatted.length > 100) {
            // Tìm câu đầu tiên (kết thúc bằng dấu chấm, chấm hỏi, chấm than)
            const firstSentenceMatch = formatted.match(/^([^.!?]+[.!?])\s*/)
            if (firstSentenceMatch) {
                const firstSentence = firstSentenceMatch[1]
                const rest = formatted.substring(firstSentence.length).trim()
                if (rest.length > 30) {
                    formatted = `${firstSentence}\n\n${rest}`
                }
            }
        }

        // Pattern 4: Format các câu có tên khóa học - thêm line break sau tên khóa học nếu có giải thích dài
        for (const course of coursesInPrompt) {
            const courseTitle = course.title || ''
            if (!courseTitle) continue

            const escapedTitle = this._escapeRegex(courseTitle)
            // Tìm pattern: "Tên khóa học" + giải thích (không có line break giữa)
            const pattern = new RegExp(`(["'"])${escapedTitle}\\1\\s+([^\\n]{30,})`, 'gi')
            
            formatted = formatted.replace(pattern, (match, quote, explanation) => {
                // Nếu giải thích dài và không có line break, thêm line break
                if (explanation.length > 30 && !explanation.includes('\n')) {
                    return `${quote}${courseTitle}${quote}\n\n${explanation.trim()}`
                }
                return match
            })
        }

        // Pattern 5: Thêm line break trước "Khóa học khác" hoặc các từ tương tự
        formatted = formatted.replace(/\s+(Khóa học khác|khóa học khác|Ngoài ra|Bên cạnh đó)/gi, '\n\n$1')

        // Pattern 6: Thêm line break sau dấu chấm nếu câu sau đó bắt đầu bằng tên khóa học hoặc từ khóa đặc biệt
        // Ví dụ: "...thú vị.Khóa học khác..." -> "...thú vị.\n\nKhóa học khác..."
        formatted = formatted.replace(/\.([^.!?\n]{0,5})(Khóa học|khóa học|Ngoài ra|Bên cạnh đó)/gi, '.\n\n$2')

        // Clean up: Đảm bảo không có quá 2 line breaks liên tiếp
        formatted = formatted
            .replace(/\n{3,}/g, '\n\n') // Max 2 line breaks
            .replace(/^\n+|\n+$/g, '') // Remove leading/trailing line breaks
            .trim()

        return formatted
    }

    /**
     * Escape special regex characters
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    _escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }

    /**
     * Tính độ tương đồng giữa hai câu (đơn giản)
     * @param {string} str1 - Câu 1
     * @param {string} str2 - Câu 2
     * @returns {number} Độ tương đồng (0-1)
     */
    _calculateSimilarity(str1, str2) {
        if (!str1 || !str2) return 0
        if (str1 === str2) return 1

        // Đếm số từ chung
        const words1 = new Set(str1.split(/\s+/))
        const words2 = new Set(str2.split(/\s+/))
        
        let commonWords = 0
        for (const word of words1) {
            if (words2.has(word) && word.length > 2) {
                commonWords++
            }
        }

        const totalWords = Math.max(words1.size, words2.size)
        return totalWords > 0 ? commonWords / totalWords : 0
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
            // Nếu có nhiều, chỉ hiển thị 2-3 khóa học tốt nhất (ưu tiên 2)
            return availableCount >= 3 ? 2 : availableCount
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
     * Định dạng thời lượng (durationHours lưu phút) thành chuỗi thân thiện
     * - < 60 phút: "Xm"
     * - >= 60 phút: "Xh Ym" (ẩn phút nếu 0)
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
