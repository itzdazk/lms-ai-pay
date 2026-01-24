// backend/src/services/ai-recommendation.service.js
import { prisma } from '../config/database.config.js'
import llmService from './llm.service.js'
import { COURSE_STATUS, ENROLLMENT_STATUS } from '../config/constants.js'

class AIRecommendationService {
    /**
     * Generate course recommendations for user using AI
     * @param {number} userId - User ID
     * @param {Object} options - Options (limit, forceRefresh)
     * @returns {Promise<Array>} Recommended courses with scores and reasons
     */
    async getRecommendationsForUser(userId, options = {}) {
        const { limit = 10, forceRefresh = false } = options

        try {
            // 1. Check if user has recent recommendations (within 24 hours)
            if (!forceRefresh) {
                const recentRecommendations =
                    await this._getRecentRecommendations(userId, limit)
                if (recentRecommendations.length > 0) {
                    return recentRecommendations
                }
            }

            // 2. Build user profile from enrollment history and progress
            const userProfile = await this._buildUserProfile(userId)

            // 3. Get candidate courses (not enrolled, published)
            const candidateCourses = await this._getCandidateCourses(userId)

            if (candidateCourses.length === 0) {
                return []
            }

            // 4. Generate recommendations using AI (LLM)
            let recommendations = []

            // Try using LLM first
            try {
                const isLLMAvailable = await llmService.checkHealth()
                if (isLLMAvailable) {
                    recommendations = await this._generateAIRecommendations(
                        userProfile,
                        candidateCourses,
                        limit
                    )
                } else {
                    recommendations =
                        await this._generateRuleBasedRecommendations(
                            userProfile,
                            candidateCourses,
                            limit
                        )
                }
            } catch (error) {
                recommendations =
                    await this._generateRuleBasedRecommendations(
                        userProfile,
                        candidateCourses,
                        limit
                    )
            }

            // 5. Save recommendations to database
            await this._saveRecommendations(userId, recommendations)

            return recommendations
        } catch (error) {
            throw error
        }
    }

    /**
     * Get similar courses for a given course using AI
     * @param {number} courseId - Course ID
     * @param {number} limit - Number of similar courses
     * @returns {Promise<Array>} Similar courses with similarity scores
     */
    async getSimilarCourses(courseId, limit = 5) {
        try {
            // 1. Get target course details
            const targetCourse = await prisma.course.findUnique({
                where: { id: courseId },
                include: {
                    category: true,
                    courseTags: {
                        include: {
                            tag: true,
                        },
                    },
                    instructor: {
                        select: {
                            id: true,
                            fullName: true,
                        },
                    },
                },
            })

            if (!targetCourse) {
                throw new Error('Khóa học không tồn tại')
            }

            // 2. Get candidate courses (same category, similar tags)
            const candidateCourses = await prisma.course.findMany({
                where: {
                    id: { not: courseId },
                    status: COURSE_STATUS.PUBLISHED,
                    OR: [
                        { categoryId: targetCourse.categoryId },
                        {
                            courseTags: {
                                some: {
                                    tagId: {
                                        in: targetCourse.courseTags.map(
                                            (ct) => ct.tagId
                                        ),
                                    },
                                },
                            },
                        },
                    ],
                },
                include: {
                    category: true,
                    courseTags: {
                        include: {
                            tag: true,
                        },
                    },
                    instructor: {
                        select: {
                            id: true,
                            fullName: true,
                        },
                    },
                },
                take: 20, // Get more candidates for AI ranking
            })

            if (candidateCourses.length === 0) {
                return []
            }

            // 3. Calculate similarity using AI or rule-based
            let similarCourses = []

            try {
                const isLLMAvailable = await llmService.checkHealth()
                if (isLLMAvailable) {
                    similarCourses = await this._calculateAISimilarity(
                        targetCourse,
                        candidateCourses,
                            limit
                        )
                    } else {
                        similarCourses = this._calculateRuleBasedSimilarity(
                            targetCourse,
                            candidateCourses,
                            limit
                        )
                    }
                } catch (error) {
                    similarCourses = this._calculateRuleBasedSimilarity(
                        targetCourse,
                        candidateCourses,
                        limit
                    )
                }
            return similarCourses
        } catch (error) {
            throw error
        }
    }

    /**
     * Mark recommendation as viewed
     * @param {number} recommendationId - Recommendation ID
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Updated recommendation
     */
    async markRecommendationAsViewed(recommendationId, userId) {
        try {
            // Verify recommendation belongs to user
            const recommendation = await prisma.aiRecommendation.findFirst({
                where: {
                    id: recommendationId,
                    userId,
                },
            })

            if (!recommendation) {
                throw new Error(
                    'Không tìm thấy đề xuất hoặc truy cập bị từ chối'
                )
            }

            // Update viewed status
            const updated = await prisma.aiRecommendation.update({
                where: { id: recommendationId },
                data: { isViewed: true },
            })

            return updated
        } catch (error) {
            throw error
        }
    }

    /**
     * Get recent recommendations from database (cached)
     * @private
     */
    async _getRecentRecommendations(userId, limit) {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

        const recommendations = await prisma.aiRecommendation.findMany({
            where: {
                userId,
                createdAt: { gte: oneDayAgo },
            },
            orderBy: { score: 'desc' },
            take: limit,
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        shortDescription: true,
                        thumbnailUrl: true,
                        price: true,
                        discountPrice: true,
                        level: true,
                        durationHours: true,
                        totalLessons: true,
                        ratingAvg: true,
                        ratingCount: true,
                        enrolledCount: true,
                        instructor: {
                            select: {
                                id: true,
                                fullName: true,
                                avatarUrl: true,
                            },
                        },
                        category: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                            },
                        },
                    },
                },
            },
        })

        return recommendations.map((rec) => ({
            ...rec.course,
            recommendationScore: rec.score,
            recommendationReason: rec.reason,
            recommendationType: rec.recommendationType,
            isViewed: rec.isViewed,
            recommendationId: rec.id,
        }))
    }

    /**
     * Build user profile from enrollment and progress
     * @private
     */
    async _buildUserProfile(userId) {
        // Get user's enrollments with progress
        const enrollments = await prisma.enrollment.findMany({
            where: { userId },
            include: {
                course: {
                    include: {
                        category: true,
                        courseTags: {
                            include: { tag: true },
                        },
                    },
                },
            },
            orderBy: { enrolledAt: 'desc' },
            take: 10, // Recent 10 enrollments
        })

        // Extract categories and tags
        const categoryFrequency = {}
        const tagFrequency = {}
        const levelFrequency = {}
        let totalProgress = 0
        let completedCourses = 0

        enrollments.forEach((enrollment) => {
            const course = enrollment.course

            // Categories
            if (course.category) {
                categoryFrequency[course.category.name] =
                    (categoryFrequency[course.category.name] || 0) + 1
            }

            // Tags
            course.courseTags.forEach((ct) => {
                tagFrequency[ct.tag.name] = (tagFrequency[ct.tag.name] || 0) + 1
            })

            // Level
            if (course.level) {
                levelFrequency[course.level] =
                    (levelFrequency[course.level] || 0) + 1
            }

            // Progress
            totalProgress += parseFloat(enrollment.progressPercentage || 0)
            if (enrollment.status === ENROLLMENT_STATUS.COMPLETED) {
                completedCourses++
            }
        })

        // Get top interests
        const topCategories = Object.entries(categoryFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name]) => name)

        const topTags = Object.entries(tagFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name]) => name)

        const preferredLevel =
            Object.entries(levelFrequency).sort(
                (a, b) => b[1] - a[1]
            )[0]?.[0] || 'BEGINNER'

        const avgProgress =
            enrollments.length > 0 ? totalProgress / enrollments.length : 0

        return {
            userId,
            totalEnrollments: enrollments.length,
            completedCourses,
            avgProgress: avgProgress.toFixed(2),
            topCategories,
            topTags,
            preferredLevel,
            recentCourses: enrollments.slice(0, 3).map((e) => ({
                id: e.course.id,
                title: e.course.title,
                category: e.course.category?.name,
                level: e.course.level,
            })),
        }
    }

    /**
     * Get candidate courses for recommendation
     * @private
     */
    async _getCandidateCourses(userId) {
        // Get courses user hasn't enrolled in
        const enrolledCourseIds = await prisma.enrollment.findMany({
            where: { userId },
            select: { courseId: true },
        })

        const excludedIds = enrolledCourseIds.map((e) => e.courseId)

        const courses = await prisma.course.findMany({
            where: {
                status: COURSE_STATUS.PUBLISHED,
                id: { notIn: excludedIds },
            },
            include: {
                category: true,
                courseTags: {
                    include: { tag: true },
                },
                instructor: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
            take: 50, // Limit for performance
        })

        return courses
    }

    /**
     * Generate AI-powered recommendations using Ollama
     * @private
     */
    async _generateAIRecommendations(userProfile, candidateCourses, limit) {
        try {
            // Build prompt for AI
            const prompt = this._buildRecommendationPrompt(
                userProfile,
                candidateCourses
            )

            // Generate recommendations using LLM
            const response = await llmService.generateResponse(
                prompt,
                [],
                null
            )

            // Parse AI response (expecting JSON format)
            const recommendations = this._parseAIRecommendations(
                response,
                candidateCourses
            )

            // Return top recommendations
            return recommendations.slice(0, limit)
        } catch (error) {
            throw error
        }
    }

    /**
     * Build prompt for AI recommendation
     * @private
     */
    _buildRecommendationPrompt(userProfile, candidateCourses) {
        const coursesInfo = candidateCourses.map((course) => ({
            id: course.id,
            title: course.title,
            category: course.category?.name || 'Unknown',
            level: course.level || 'BEGINNER',
            tags: course.courseTags.map((ct) => ct.tag.name).join(', '),
            description: course.shortDescription || '',
            rating: parseFloat(course.ratingAvg || 0),
            enrolled: course.enrolledCount || 0,
        }))

        const prompt = `Bạn là AI Recommendation Expert. Nhiệm vụ của bạn là gợi ý khóa học phù hợp cho học viên.

THÔNG TIN HỌC VIÊN:
- Tổng số khóa học đã học: ${userProfile.totalEnrollments}
- Khóa học đã hoàn thành: ${userProfile.completedCourses}
- Tiến độ trung bình: ${userProfile.avgProgress}%
- Danh mục quan tâm: ${userProfile.topCategories.join(', ') || 'Chưa có'}
- Tags quan tâm: ${userProfile.topTags.join(', ') || 'Chưa có'}
- Level ưa thích: ${userProfile.preferredLevel}
- Khóa học gần đây: ${userProfile.recentCourses.map((c) => c.title).join(', ') || 'Chưa có'}

CÁC KHÓA HỌC CẦN ĐÁNH GIÁ:
${JSON.stringify(coursesInfo, null, 2)}

YÊU CẦU:
1. Phân tích sở thích và trình độ của học viên
2. Đánh giá độ phù hợp của từng khóa học (score từ 0-100)
3. Đưa ra lý do gợi ý ngắn gọn (1-2 câu)
4. Ưu tiên khóa học phù hợp với level hiện tại hoặc cao hơn 1 bậc
5. Xem xét các yếu tố: category, tags, level, rating, popularity

TRẢ LỜI DƯỚI DẠNG JSON (chỉ JSON, không có text khác):
{
  "recommendations": [
    {
      "courseId": 123,
      "score": 95,
      "reason": "Lý do gợi ý",
      "type": "CATEGORY_MATCH | SKILL_PROGRESSION | POPULAR | SIMILAR_INTEREST"
    }
  ]
}

Hãy gợi ý ít nhất 10 khóa học, sắp xếp theo score giảm dần.`

        return prompt
    }

    /**
     * Parse AI recommendations from response
     * @private
     */
    _parseAIRecommendations(aiResponse, candidateCourses) {
        try {
            // Remove markdown code blocks if present
            let cleanResponse = aiResponse.trim()
            if (cleanResponse.startsWith('```json')) {
                cleanResponse = cleanResponse
                    .replace(/```json\n?/g, '')
                    .replace(/```\n?/g, '')
            } else if (cleanResponse.startsWith('```')) {
                cleanResponse = cleanResponse.replace(/```\n?/g, '')
            }

            // Parse JSON
            const parsed = JSON.parse(cleanResponse)

            if (
                !parsed.recommendations ||
                !Array.isArray(parsed.recommendations)
            ) {
                throw new Error('Định dạng phản hồi của AI không hợp lệ')
            }

            // Map to course objects
            const recommendations = parsed.recommendations
                .map((rec) => {
                    const course = candidateCourses.find(
                        (c) => c.id === rec.courseId
                    )
                    if (!course) return null

                    return {
                        ...course,
                        recommendationScore: rec.score || 0,
                        recommendationReason: rec.reason || 'Phù hợp với bạn',
                        recommendationType: rec.type || 'AI_SUGGESTED',
                    }
                })
                .filter(Boolean)
                .sort((a, b) => b.recommendationScore - a.recommendationScore)

            return recommendations
        } catch (error) {
            // Return empty array if parsing fails
            return []
        }
    }

    /**
     * Generate rule-based recommendations (fallback)
     * @private
     */
    async _generateRuleBasedRecommendations(
        userProfile,
        candidateCourses,
        limit
    ) {
        const scoredCourses = candidateCourses.map((course) => {
            let score = 0
            let reasons = []
            let type = 'GENERAL'

            // Category match (40 points)
            if (
                course.category &&
                userProfile.topCategories.includes(course.category.name)
            ) {
                score += 40
                reasons.push(
                    `Thuộc danh mục bạn quan tâm: ${course.category.name}`
                )
                type = 'CATEGORY_MATCH'
            }

            // Tag match (30 points)
            const courseTags = course.courseTags.map((ct) => ct.tag.name)
            const matchingTags = courseTags.filter((tag) =>
                userProfile.topTags.includes(tag)
            )
            if (matchingTags.length > 0) {
                score +=
                    30 *
                    (matchingTags.length /
                        Math.max(userProfile.topTags.length, 1))
                reasons.push(`Có tags liên quan: ${matchingTags.join(', ')}`)
                if (type === 'GENERAL') type = 'SIMILAR_INTEREST'
            }

            // Level progression (20 points)
            const levelProgression = {
                BEGINNER: ['BEGINNER', 'INTERMEDIATE'],
                INTERMEDIATE: ['INTERMEDIATE', 'ADVANCED'],
                ADVANCED: ['ADVANCED', 'INTERMEDIATE'],
            }
            if (
                levelProgression[userProfile.preferredLevel]?.includes(
                    course.level
                )
            ) {
                score += 20
                reasons.push(`Phù hợp với trình độ của bạn`)
                if (type === 'GENERAL') type = 'SKILL_PROGRESSION'
            }

            // Popularity (10 points)
            const popularityScore = Math.min(
                10,
                (course.enrolledCount || 0) / 100
            )
            score += popularityScore
            if (popularityScore > 5) {
                reasons.push(
                    `Khóa học phổ biến với ${course.enrolledCount} học viên`
                )
                if (type === 'GENERAL') type = 'POPULAR'
            }

            // Rating (bonus)
            const ratingScore = parseFloat(course.ratingAvg || 0) * 2
            score += ratingScore

            return {
                ...course,
                recommendationScore: Math.round(score),
                recommendationReason:
                    reasons.length > 0
                        ? reasons.join('. ') + '.'
                        : 'Khóa học chất lượng phù hợp với bạn',
                recommendationType: type,
            }
        })

        // Sort by score and return top N
        return scoredCourses
            .sort((a, b) => b.recommendationScore - a.recommendationScore)
            .slice(0, limit)
    }

    /**
     * Calculate AI-based similarity between courses
     * @private
     */
    async _calculateAISimilarity(targetCourse, candidateCourses, limit) {
        try {
            const prompt = this._buildSimilarityPrompt(
                targetCourse,
                candidateCourses
            )
            const response = await llmService.generateResponse(
                prompt,
                [],
                null
            )
            const similarCourses = this._parseAISimilarity(
                response,
                candidateCourses
            )
            return similarCourses.slice(0, limit)
        } catch (error) {
            throw error
        }
    }

    /**
     * Build prompt for similarity calculation
     * @private
     */
    _buildSimilarityPrompt(targetCourse, candidateCourses) {
        const targetInfo = {
            title: targetCourse.title,
            category: targetCourse.category?.name || 'Unknown',
            level: targetCourse.level || 'BEGINNER',
            tags: targetCourse.courseTags.map((ct) => ct.tag.name).join(', '),
            description: targetCourse.shortDescription || '',
        }

        const coursesInfo = candidateCourses.map((course) => ({
            id: course.id,
            title: course.title,
            category: course.category?.name || 'Unknown',
            level: course.level || 'BEGINNER',
            tags: course.courseTags.map((ct) => ct.tag.name).join(', '),
            description: course.shortDescription || '',
        }))

        const prompt = `Bạn là AI Expert về phân tích độ tương đồng giữa các khóa học.

KHÓA HỌC GỐC:
${JSON.stringify(targetInfo, null, 2)}

CÁC KHÓA HỌC CẦN SO SÁNH:
${JSON.stringify(coursesInfo, null, 2)}

YÊU CẦU:
1. Phân tích độ tương đồng về nội dung, chủ đề, level
2. Đánh giá similarity score từ 0-100
3. Đưa ra lý do tương đồng

TRẢ LỜI DƯỚI DẠNG JSON (chỉ JSON, không có text khác):
{
  "similarCourses": [
    {
      "courseId": 123,
      "similarityScore": 95,
      "reason": "Lý do tương đồng"
    }
  ]
}

Hãy gợi ý ít nhất 5 khóa học tương đồng nhất.`

        return prompt
    }

    /**
     * Parse AI similarity response
     * @private
     */
    _parseAISimilarity(aiResponse, candidateCourses) {
        try {
            let cleanResponse = aiResponse.trim()
            if (cleanResponse.startsWith('```json')) {
                cleanResponse = cleanResponse
                    .replace(/```json\n?/g, '')
                    .replace(/```\n?/g, '')
            } else if (cleanResponse.startsWith('```')) {
                cleanResponse = cleanResponse.replace(/```\n?/g, '')
            }

            const parsed = JSON.parse(cleanResponse)

            if (
                !parsed.similarCourses ||
                !Array.isArray(parsed.similarCourses)
            ) {
                throw new Error('Định dạng phản hồi của AI không hợp lệ')
            }

            const similarCourses = parsed.similarCourses
                .map((sim) => {
                    const course = candidateCourses.find(
                        (c) => c.id === sim.courseId
                    )
                    if (!course) return null

                    return {
                        ...course,
                        similarityScore: sim.similarityScore || 0,
                        similarityReason: sim.reason || 'Tương tự về nội dung',
                    }
                })
                .filter(Boolean)
                .sort((a, b) => b.similarityScore - a.similarityScore)

            return similarCourses
        } catch (error) {
            return []
        }
    }

    /**
     * Calculate rule-based similarity (fallback)
     * @private
     */
    _calculateRuleBasedSimilarity(targetCourse, candidateCourses, limit) {
        const targetTags = targetCourse.courseTags.map((ct) => ct.tag.name)

        const scoredCourses = candidateCourses.map((course) => {
            let score = 0
            let reasons = []

            // Same category (40 points)
            if (course.categoryId === targetCourse.categoryId) {
                score += 40
                reasons.push(`Cùng danh mục: ${course.category?.name}`)
            }

            // Tag overlap (40 points)
            const courseTags = course.courseTags.map((ct) => ct.tag.name)
            const matchingTags = courseTags.filter((tag) =>
                targetTags.includes(tag)
            )
            if (matchingTags.length > 0) {
                const tagScore =
                    40 *
                    (matchingTags.length /
                        Math.max(targetTags.length, courseTags.length))
                score += tagScore
                reasons.push(`Tags chung: ${matchingTags.join(', ')}`)
            }

            // Same level (10 points)
            if (course.level === targetCourse.level) {
                score += 10
                reasons.push(`Cùng level: ${course.level}`)
            }

            // Same instructor (10 points)
            if (course.instructorId === targetCourse.instructorId) {
                score += 10
                reasons.push(`Cùng giảng viên`)
            }

            return {
                ...course,
                similarityScore: Math.round(score),
                similarityReason:
                    reasons.length > 0
                        ? reasons.join('. ') + '.'
                        : 'Có nội dung tương tự',
            }
        })

        return scoredCourses
            .sort((a, b) => b.similarityScore - a.similarityScore)
            .slice(0, limit)
    }

    /**
     * Save recommendations to database
     * @private
     */
    async _saveRecommendations(userId, recommendations) {
        try {
            // Delete old recommendations (older than 7 days)
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            await prisma.aiRecommendation.deleteMany({
                where: {
                    userId,
                    createdAt: { lt: sevenDaysAgo },
                },
            })

            // Save new recommendations
            const data = recommendations.map((rec) => ({
                userId,
                courseId: rec.id,
                recommendationType: rec.recommendationType || 'AI_SUGGESTED',
                score: rec.recommendationScore || 0,
                reason: rec.recommendationReason || 'Phù hợp với bạn',
                isViewed: false,
                isEnrolled: false,
            }))

            await prisma.aiRecommendation.createMany({
                data,
                skipDuplicates: true,
            })
        } catch (error) {
            // Don't throw, just log - this is not critical
        }
    }
}

export default new AIRecommendationService()
