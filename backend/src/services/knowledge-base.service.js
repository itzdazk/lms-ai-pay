// src/services/knowledge-base.service.js
import { prisma } from '../config/database.config.js'
import TranscriptParser from '../utils/transcript-parser.util.js'
import logger from '../config/logger.config.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class KnowledgeBaseService {
    /**
     * Search trong courses mà user đã enroll
     */
    async searchInCourses(query, userId) {
        try {
            const keywords = this.extractKeywords(query)

            // Lấy courses mà user đã enroll
            const enrolledCourses = await prisma.enrollment.findMany({
                where: {
                    userId,
                    status: 'ACTIVE',
                },
                select: { courseId: true },
            })

            const courseIds = enrolledCourses.map((e) => e.courseId)

            if (courseIds.length === 0) {
                return []
            }

            // Search trong courses đó
            const courses = await prisma.course.findMany({
                where: {
                    id: { in: courseIds },
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        {
                            description: {
                                contains: query,
                                mode: 'insensitive',
                            },
                        },
                        {
                            whatYouLearn: {
                                contains: query,
                                mode: 'insensitive',
                            },
                        },
                        {
                            courseObjectives: {
                                contains: query,
                                mode: 'insensitive',
                            },
                        },
                    ],
                },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    description: true,
                    shortDescription: true,
                    whatYouLearn: true,
                    thumbnailUrl: true,
                    level: true,
                },
                take: 5,
            })

            // Calculate relevance score
            return courses
                .map((course) => ({
                    ...course,
                    type: 'course',
                    relevanceScore: this.calculateRelevanceScore(
                        query,
                        [
                            course.title,
                            course.description,
                            course.whatYouLearn,
                        ].join(' ')
                    ),
                }))
                .sort((a, b) => b.relevanceScore - a.relevanceScore)
        } catch (error) {
            logger.error('Error searching in courses:', error)
            return []
        }
    }

    /**
     * Search trong lessons
     */
    async searchInLessons(query, courseId = null, userId = null) {
        try {
            const whereClause = {
                isPublished: true,
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                    { content: { contains: query, mode: 'insensitive' } },
                ],
            }

            // Nếu có courseId, chỉ search trong course đó
            if (courseId) {
                whereClause.courseId = courseId
            }

            // Nếu có userId, chỉ search trong courses mà user đã enroll
            if (userId && !courseId) {
                const enrolledCourses = await prisma.enrollment.findMany({
                    where: { userId, status: 'ACTIVE' },
                    select: { courseId: true },
                })
                whereClause.courseId = {
                    in: enrolledCourses.map((e) => e.courseId),
                }
            }

            const lessons = await prisma.lesson.findMany({
                where: whereClause,
                select: {
                    id: true,
                    courseId: true,
                    title: true,
                    slug: true,
                    description: true,
                    content: true,
                    videoUrl: true,
                    videoDuration: true,
                    transcriptUrl: true,
                    lessonOrder: true,
                    course: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                        },
                    },
                },
                take: 10,
                orderBy: { lessonOrder: 'asc' },
            })

            return lessons
                .map((lesson) => ({
                    ...lesson,
                    type: 'lesson',
                    relevanceScore: this.calculateRelevanceScore(
                        query,
                        [lesson.title, lesson.description, lesson.content].join(
                            ' '
                        )
                    ),
                }))
                .sort((a, b) => b.relevanceScore - a.relevanceScore)
        } catch (error) {
            logger.error('Error searching in lessons:', error)
            return []
        }
    }

    /**
     * Search trong transcript files (QUAN TRỌNG NHẤT!)
     */
    async searchInTranscripts(
        query,
        lessonId = null,
        courseId = null,
        userId = null
    ) {
        try {
            // Lấy lessons có transcript
            const whereClause = {
                transcriptUrl: { not: null },
                isPublished: true,
            }

            if (lessonId) {
                whereClause.id = lessonId
            } else if (courseId) {
                whereClause.courseId = courseId
            } else if (userId) {
                const enrolledCourses = await prisma.enrollment.findMany({
                    where: { userId, status: 'ACTIVE' },
                    select: { courseId: true },
                })
                whereClause.courseId = {
                    in: enrolledCourses.map((e) => e.courseId),
                }
            }

            const lessons = await prisma.lesson.findMany({
                where: whereClause,
                select: {
                    id: true,
                    courseId: true,
                    title: true,
                    slug: true,
                    videoUrl: true,
                    transcriptUrl: true,
                    course: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                        },
                    },
                },
                take: 5,
            })

            const results = []

            // Parse và search trong từng transcript
            for (const lesson of lessons) {
                try {
                    // Construct full path to transcript
                    const uploadsDir = path.join(__dirname, '../../uploads')
                    const transcriptPath = path.join(
                        uploadsDir,
                        lesson.transcriptUrl
                    )

                    // Parse transcript
                    const segments =
                        await TranscriptParser.parse(transcriptPath)

                    // Search keyword trong transcript
                    const matches = TranscriptParser.searchInTranscript(
                        segments,
                        query,
                        1 // context window: lấy 1 segment trước/sau
                    )

                    if (matches.length > 0) {
                        matches.forEach((match) => {
                            results.push({
                                type: 'transcript',
                                lessonId: lesson.id,
                                lessonTitle: lesson.title,
                                lessonSlug: lesson.slug,
                                courseId: lesson.courseId,
                                courseTitle: lesson.course.title,
                                courseSlug: lesson.course.slug,
                                videoUrl: lesson.videoUrl,
                                timestamp: match.timestamp,
                                startTime: match.startTime,
                                text: match.text,
                                contextText: match.contextText,
                                excerpt: TranscriptParser.getExcerpt(
                                    match.contextText,
                                    200
                                ),
                                highlightedText:
                                    TranscriptParser.highlightKeyword(
                                        match.text,
                                        query
                                    ),
                                relevanceScore: this.calculateRelevanceScore(
                                    query,
                                    match.text
                                ),
                            })
                        })
                    }
                } catch (error) {
                    logger.error(
                        `Error parsing transcript for lesson ${lesson.id}:`,
                        error
                    )
                    // Continue với lesson khác
                }
            }

            // Sort by relevance
            return results.sort((a, b) => b.relevanceScore - a.relevanceScore)
        } catch (error) {
            logger.error('Error searching in transcripts:', error)
            return []
        }
    }

    /**
     * Lấy context của user (đang học gì, progress...)
     */
    async getUserContext(userId) {
        try {
            // Lấy enrollment gần nhất (đang học)
            const recentEnrollment = await prisma.enrollment.findFirst({
                where: {
                    userId,
                    status: 'ACTIVE',
                },
                orderBy: { lastAccessedAt: 'desc' },
                include: {
                    course: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            level: true,
                            totalLessons: true,
                        },
                    },
                },
            })

            if (!recentEnrollment) {
                return {
                    currentCourse: null,
                    currentLesson: null,
                    recentLessons: [],
                }
            }

            // Lấy lesson đang học (progress gần nhất)
            const recentProgress = await prisma.progress.findFirst({
                where: {
                    userId,
                    courseId: recentEnrollment.courseId,
                },
                orderBy: { updatedAt: 'desc' },
                include: {
                    lesson: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            lessonOrder: true,
                        },
                    },
                },
            })

            // Lấy các lessons đã hoàn thành gần đây
            const recentLessons = await prisma.progress.findMany({
                where: {
                    userId,
                    courseId: recentEnrollment.courseId,
                    isCompleted: true,
                },
                orderBy: { completedAt: 'desc' },
                take: 5,
                include: {
                    lesson: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            lessonOrder: true,
                        },
                    },
                },
            })

            return {
                currentCourse: {
                    id: recentEnrollment.course.id,
                    title: recentEnrollment.course.title,
                    slug: recentEnrollment.course.slug,
                    level: recentEnrollment.course.level,
                    progress: recentEnrollment.progressPercentage.toNumber(),
                    totalLessons: recentEnrollment.course.totalLessons,
                },
                currentLesson: recentProgress
                    ? {
                          id: recentProgress.lesson.id,
                          title: recentProgress.lesson.title,
                          slug: recentProgress.lesson.slug,
                          lessonOrder: recentProgress.lesson.lessonOrder,
                          lastPosition: recentProgress.lastPosition,
                          isCompleted: recentProgress.isCompleted,
                      }
                    : null,
                recentLessons: recentLessons.map((p) => ({
                    id: p.lesson.id,
                    title: p.lesson.title,
                    slug: p.lesson.slug,
                    lessonOrder: p.lesson.lessonOrder,
                    completedAt: p.completedAt,
                })),
            }
        } catch (error) {
            logger.error('Error getting user context:', error)
            return {
                currentCourse: null,
                currentLesson: null,
                recentLessons: [],
            }
        }
    }

    /**
     * Build complete context cho conversation
     */
    async buildContext(userId, query, conversationId = null) {
        try {
            // 1. Get user context
            const userContext = await this.getUserContext(userId)

            // 2. Search trong courses, lessons, transcripts (parallel)
            const [courses, lessons, transcripts] = await Promise.all([
                this.searchInCourses(query, userId),
                this.searchInLessons(
                    query,
                    userContext.currentCourse?.id,
                    userId
                ),
                this.searchInTranscripts(
                    query,
                    userContext.currentLesson?.id,
                    userContext.currentCourse?.id,
                    userId
                ),
            ])

            // 3. Get conversation history (nếu có)
            let conversationHistory = []
            if (conversationId) {
                conversationHistory =
                    await this.getConversationHistory(conversationId)
            }

            return {
                userContext,
                searchResults: {
                    courses,
                    lessons,
                    transcripts,
                    totalResults:
                        courses.length + lessons.length + transcripts.length,
                },
                conversationHistory,
                query,
            }
        } catch (error) {
            logger.error('Error building context:', error)
            throw error
        }
    }

    /**
     * Get conversation history
     */
    async getConversationHistory(conversationId, limit = 10) {
        try {
            const messages = await prisma.chatMessage.findMany({
                where: { conversationId },
                orderBy: { createdAt: 'desc' },
                take: limit,
                select: {
                    id: true,
                    senderType: true,
                    message: true,
                    messageType: true,
                    createdAt: true,
                },
            })

            return messages.reverse() // Oldest first
        } catch (error) {
            logger.error('Error getting conversation history:', error)
            return []
        }
    }

    /**
     * Calculate relevance score (0-1)
     */
    calculateRelevanceScore(query, text) {
        if (!text) return 0

        const queryLower = query.toLowerCase()
        const textLower = text.toLowerCase()

        // Exact match → high score
        if (textLower.includes(queryLower)) {
            const position = textLower.indexOf(queryLower)
            // Càng ở đầu càng cao điểm
            const positionScore = 1 - position / textLower.length
            return 0.8 + positionScore * 0.2
        }

        // Partial match → medium score
        const keywords = this.extractKeywords(query)
        const matchedKeywords = keywords.filter((keyword) =>
            textLower.includes(keyword.toLowerCase())
        )

        return (matchedKeywords.length / keywords.length) * 0.6
    }

    /**
     * Extract keywords từ query
     */
    extractKeywords(query) {
        // Remove common words (stopwords)
        const stopwords = [
            'là',
            'gì',
            'như',
            'thế',
            'nào',
            'the',
            'is',
            'what',
            'how',
        ]

        return query
            .toLowerCase()
            .split(/\s+/)
            .filter((word) => word.length > 2 && !stopwords.includes(word))
    }
}

export default new KnowledgeBaseService()
