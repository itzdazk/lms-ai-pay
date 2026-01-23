import ollamaService from './ollama.service.js'
import logger from '../config/logger.config.js'

class AIAdvisorService {
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
                suggestedActions: [],
            }
        }

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

            // Build a prompt that prevents hallucination and only uses relevant courses
            const coursesForPrompt =
                relevantCourses.length > 0 ? relevantCourses : []
            const coursesList = coursesForPrompt
                .map((c, i) => {
                    const durationLabel = this._formatDuration(c.durationHours)
                    return `${i + 1}. ${c.title} (${durationLabel}, ${c.totalLessons} bài học)`
                })
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

            // Include relevant courses only when we found matches
            const displayedCount = Math.min(relevantCourses.length, 4)
            if (displayedCount > 0) {
                advisorMessage += `\n\nTìm thấy ${displayedCount} khóa học phù hợp. Xem danh sách bên dưới 👇`
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
                durationLabel: this._formatDuration(course.durationHours),
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
            // Smarter fallback when Ollama unavailable
            const availableCourses =
                courses && courses.length > 0 ? courses : []
            const queryLower = query.toLowerCase()

            let text = ''
            let shouldShowCourses = true

            // Detect user intent
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
                } else {
                    text = `✨ Dưới đây là tất cả các khóa học có sẵn:\n\n`
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
                shouldShowCourses = false
            } else if (
                queryLower.length < 5 ||
                /^(ok|được|gì|vâng|okela|okie)$/i.test(queryLower)
            ) {
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
                ? availableCourses.filter((course) =>
                      this._isCourseRelevant(query, course)
                  )
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
