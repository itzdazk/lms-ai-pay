// src/services/knowledge-base.service.js
import { prisma } from '../config/database.config.js'
import TranscriptParser from '../utils/transcript-parser.util.js'
import logger from '../config/logger.config.js'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class KnowledgeBaseService {
    constructor() {
        // Cache parsed transcripts to avoid re-parsing (in-memory cache)
        this.transcriptCache = new Map()
        this.cacheMaxAge = 5 * 60 * 1000 // 5 minutes
        
        // Cache search results for same query (shared across users if same courses)
        this.searchCache = new Map()
        this.searchCacheMaxAge = 2 * 60 * 1000 // 2 minutes

        // Minimum relevance thresholds to filter out irrelevant results
        // Results below these thresholds will be filtered out to save tokens and avoid confusion
        this.MIN_RELEVANCE_THRESHOLD = {
            TRANSCRIPT: 0.4,  // Transcripts need higher relevance (more specific)
            LESSON: 0.35,     // Lessons can be slightly lower
            COURSE: 0.3       // Courses can be lowest (broader context)
        }
    }

    /**
     * Get cached transcript or parse and cache it
     * Ưu tiên đọc JSON (nhanh hơn), fallback về parse SRT/VTT
     */
    async _getCachedTranscript(transcriptPath) {
        const cacheKey = transcriptPath
        const cached = this.transcriptCache.get(cacheKey)

        if (cached && Date.now() - cached.timestamp < this.cacheMaxAge) {
            return cached.segments
        }

        // Try to read JSON first (much faster than parsing SRT)
        const jsonPath = transcriptPath.replace(/\.(srt|vtt|txt)$/i, '.json')
        let segments = null

        try {
            // Check if JSON file exists
            await fs.access(jsonPath)
            // Read and parse JSON (native, very fast)
            const jsonContent = await fs.readFile(jsonPath, 'utf-8')
            const jsonData = JSON.parse(jsonContent)

            // Convert JSON format to segments format
            segments = Array.isArray(jsonData)
                ? jsonData.map((item, index) => ({
                      id: item.index || item.id || index + 1,
                      startTime: item.start || item.startTime || null,
                      endTime: item.end || item.endTime || null,
                      text: item.text || '',
                  }))
                : []

            logger.debug(
                `Loaded transcript from JSON: ${jsonPath} (${segments.length} segments)`
            )
        } catch (jsonError) {
            // JSON not found or invalid, fallback to parse SRT/VTT/TXT
            try {
                segments = await TranscriptParser.parse(transcriptPath)
                logger.debug(
                    `Parsed transcript from ${path.extname(transcriptPath)}: ${transcriptPath} (${segments.length} segments)`
                )
            } catch (parseError) {
                logger.error(
                    `Failed to load transcript from ${transcriptPath}:`,
                    parseError
                )
                throw parseError
            }
        }

        // Cache the result
        this.transcriptCache.set(cacheKey, {
            segments,
            timestamp: Date.now(),
        })

        // Clean old cache entries if cache is too large
        if (this.transcriptCache.size > 100) {
            const now = Date.now()
            for (const [key, value] of this.transcriptCache.entries()) {
                if (now - value.timestamp > this.cacheMaxAge) {
                    this.transcriptCache.delete(key)
                }
            }
        }

        return segments
    }

    /**
     * Search trong courses mà user đã enroll
     */
    async searchInCourses(query, userId, enrolledCourseIds = null) {
        try {
            // Use provided courseIds or fetch if not provided (removed unused extractKeywords)
            let courseIds = enrolledCourseIds
            if (!courseIds || courseIds.length === 0) {
                const enrolledCourses = await prisma.enrollment.findMany({
                    where: {
                        userId,
                        status: 'ACTIVE',
                    },
                    select: { courseId: true },
                })
                courseIds = enrolledCourses.map((e) => e.courseId)
            }

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
    async searchInLessons(
        query,
        courseId = null,
        userId = null,
        enrolledCourseIds = null
    ) {
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
            } else if (userId && enrolledCourseIds && enrolledCourseIds.length > 0) {
                // Use provided courseIds to avoid duplicate query
                whereClause.courseId = {
                    in: enrolledCourseIds,
                }
            } else if (userId && !courseId) {
                // Fallback: fetch if not provided
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
                .filter((lesson) => lesson.relevanceScore >= this.MIN_RELEVANCE_THRESHOLD.LESSON)
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
        userId = null,
        enrolledCourseIds = null
    ) {
        try {
            // Lấy lessons có transcript
            const whereClause = {
                transcriptUrl: { not: null },
                isPublished: true,
            }

            if (lessonId) {
                whereClause.id = lessonId
                logger.debug(`Searching transcript for specific lessonId: ${lessonId}`)
            } else if (courseId) {
                whereClause.courseId = courseId
                logger.debug(`Searching transcript for specific courseId: ${courseId}`)
            } else if (userId && enrolledCourseIds && enrolledCourseIds.length > 0) {
                // Use provided courseIds to avoid duplicate query
                whereClause.courseId = {
                    in: enrolledCourseIds,
                }
            } else if (userId) {
                // Fallback: fetch if not provided
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
                    transcriptJsonUrl: true,
                    description: true,
                    content: true,
                    course: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                        },
                    },
                },
                take: 2, // Reduced to 2 for faster performance
            })

            logger.debug(
                `Found ${lessons.length} lessons with transcript for search: lessonId=${lessonId}, courseId=${courseId}`
            )
            
            if (lessons.length === 0) {
                logger.warn(
                    `No lessons found with transcript. lessonId=${lessonId}, courseId=${courseId}, userId=${userId}`
                )
            }

            const results = []

            // Parse và search trong từng transcript
            for (const lesson of lessons) {
                try {
                    // Check if transcriptUrl exists
                    if (!lesson.transcriptUrl) {
                        logger.warn(
                            `Lesson ${lesson.id} has no transcriptUrl. Trying to use content/description as fallback.`
                        )
                        
                        // Fallback: Search in lesson content/description if no transcript
                        const searchableText = [
                            lesson.title,
                            lesson.description,
                            lesson.content,
                        ]
                            .filter(Boolean)
                            .join(' ')
                        
                        const fallbackRelevanceScore = this.calculateRelevanceScore(query, searchableText)
                        if (searchableText.toLowerCase().includes(query.toLowerCase()) && 
                            fallbackRelevanceScore >= this.MIN_RELEVANCE_THRESHOLD.TRANSCRIPT) {
                            results.push({
                                type: 'transcript',
                                lessonId: lesson.id,
                                lessonTitle: lesson.title,
                                lessonSlug: lesson.slug,
                                courseId: lesson.courseId,
                                courseTitle: lesson.course.title,
                                courseSlug: lesson.course.slug,
                                videoUrl: lesson.videoUrl,
                                timestamp: null,
                                startTime: null,
                                text: lesson.description || lesson.content || '',
                                contextText: searchableText,
                                excerpt: TranscriptParser.getExcerpt(searchableText, 200),
                                highlightedText: searchableText,
                                relevanceScore: fallbackRelevanceScore,
                            })
                        } else if (fallbackRelevanceScore < this.MIN_RELEVANCE_THRESHOLD.TRANSCRIPT) {
                            logger.debug(
                                `Filtered out fallback transcript for lesson ${lesson.id} ` +
                                `(relevance score ${fallbackRelevanceScore.toFixed(2)} < threshold ${this.MIN_RELEVANCE_THRESHOLD.TRANSCRIPT})`
                            )
                        }
                        continue
                    }

                    // Construct full path to transcript
                    const uploadsDir = path.join(__dirname, '../../uploads')
                    // transcriptUrl format: /uploads/transcripts/filename.srt
                    // Remove leading /uploads/ if present
                    const transcriptUrlPath = lesson.transcriptUrl.startsWith('/uploads/')
                        ? lesson.transcriptUrl.substring('/uploads/'.length)
                        : lesson.transcriptUrl
                    const transcriptPath = path.join(uploadsDir, transcriptUrlPath)
                    
                    logger.debug(
                        `Processing transcript for lesson ${lesson.id}: ${lesson.transcriptUrl} -> ${transcriptPath}`
                    )

                    // Check if file exists
                    try {
                        await fs.access(transcriptPath)
                    } catch (fileError) {
                        logger.error(
                            `Transcript file not found for lesson ${lesson.id}: ${transcriptPath}. Error: ${fileError.message}`
                        )
                        // Try JSON file as fallback
                        if (lesson.transcriptJsonUrl) {
                            const jsonPath = path.join(
                                uploadsDir,
                                lesson.transcriptJsonUrl.startsWith('/uploads/')
                                    ? lesson.transcriptJsonUrl.substring('/uploads/'.length)
                                    : lesson.transcriptJsonUrl
                            )
                            try {
                                await fs.access(jsonPath)
                                logger.debug(`Using JSON transcript file: ${jsonPath}`)
                                // Will be handled by _getCachedTranscript
                            } catch (jsonError) {
                                logger.error(
                                    `JSON transcript file also not found: ${jsonPath}`
                                )
                                continue
                            }
                        } else {
                            continue
                        }
                    }

                    // Parse transcript (with caching)
                    const segments =
                        await this._getCachedTranscript(transcriptPath)

                    // Check if user is asking for full transcript content or what they learned
                    const isAskingForFullTranscript = /nội dung.*transcript|file transcript|transcript.*nội dung|toàn bộ.*transcript|full.*transcript/i.test(query)
                    const isAskingWhatLearned = /học được gì|học được những gì|nội dung.*bài học|bài học.*nội dung|bài học này/i.test(query)
                    
                    if ((isAskingForFullTranscript || isAskingWhatLearned) && segments.length > 0) {
                        // Return full transcript content for "what did I learn" queries
                        const fullTranscriptText = segments.map(s => s.text).join(' ')
                        const transcriptPreview = fullTranscriptText.length > 2000
                            ? fullTranscriptText.substring(0, 2000) + '...'
                            : fullTranscriptText
                        
                        logger.debug(
                            `User asking for ${isAskingForFullTranscript ? 'full transcript' : 'what they learned'}. Returning ${segments.length} segments for lesson ${lesson.id}`
                        )
                        
                        results.push({
                            type: 'transcript',
                            lessonId: lesson.id,
                            lessonTitle: lesson.title,
                            lessonSlug: lesson.slug,
                            courseId: lesson.courseId,
                            courseTitle: lesson.course.title,
                            courseSlug: lesson.course.slug,
                            videoUrl: lesson.videoUrl,
                            timestamp: segments[0]?.startTime ? TranscriptParser.secondsToTime(segments[0].startTime) : null,
                            startTime: segments[0]?.startTime || null,
                            text: fullTranscriptText,
                            contextText: fullTranscriptText,
                            excerpt: transcriptPreview,
                            highlightedText: fullTranscriptText,
                            relevanceScore: 1.0, // High relevance for full transcript request
                            isFullTranscript: true,
                            totalSegments: segments.length,
                        })
                    } else {
                        // Search keyword trong transcript
                        const matches = TranscriptParser.searchInTranscript(
                            segments,
                            query,
                            2 // context window: lấy 2 segments trước/sau để có nhiều context hơn
                        )

                        logger.debug(
                            `Found ${matches.length} matches in transcript for lesson ${lesson.id} with query: "${query}"`
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
                                        500 // Increased excerpt length
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
                                // Filter by threshold - remove if below minimum
                                const lastResult = results[results.length - 1]
                                if (lastResult.relevanceScore < this.MIN_RELEVANCE_THRESHOLD.TRANSCRIPT) {
                                    results.pop() // Remove if below threshold
                                    logger.debug(
                                        `Filtered out transcript match for lesson ${lesson.id} ` +
                                        `(relevance score ${lastResult.relevanceScore.toFixed(2)} < threshold ${this.MIN_RELEVANCE_THRESHOLD.TRANSCRIPT})`
                                    )
                                }
                            })
                        } else if (segments.length > 0) {
                            // If no matches but transcript exists, check if fallback meets threshold
                            const firstSegments = segments.slice(0, 5)
                            const fallbackText = firstSegments.map(s => s.text).join(' ')
                            const fallbackScore = this.calculateRelevanceScore(query, fallbackText)
                            
                            // Only add fallback if it meets minimum threshold
                            if (fallbackScore >= this.MIN_RELEVANCE_THRESHOLD.TRANSCRIPT) {
                                logger.debug(
                                    `No direct matches, but fallback meets threshold for lesson ${lesson.id} (score: ${fallbackScore.toFixed(2)})`
                                )
                                results.push({
                                    type: 'transcript',
                                    lessonId: lesson.id,
                                    lessonTitle: lesson.title,
                                    lessonSlug: lesson.slug,
                                    courseId: lesson.courseId,
                                    courseTitle: lesson.course.title,
                                    courseSlug: lesson.course.slug,
                                    videoUrl: lesson.videoUrl,
                                    timestamp: firstSegments[0]?.startTime ? TranscriptParser.secondsToTime(firstSegments[0].startTime) : null,
                                    startTime: firstSegments[0]?.startTime || null,
                                    text: fallbackText,
                                    contextText: fallbackText,
                                    excerpt: TranscriptParser.getExcerpt(fallbackText, 500),
                                    highlightedText: fallbackText,
                                    relevanceScore: fallbackScore,
                                })
                            } else {
                                logger.debug(
                                    `No matches found and fallback below threshold for lesson ${lesson.id} ` +
                                    `(score: ${fallbackScore.toFixed(2)} < ${this.MIN_RELEVANCE_THRESHOLD.TRANSCRIPT})`
                                )
                            }
                        }
                    }
                } catch (error) {
                    logger.error(
                        `Error parsing transcript for lesson ${lesson.id}:`,
                        error.message,
                        error.stack
                    )
                    // Continue với lesson khác
                }
            }

            logger.debug(
                `Transcript search completed. Found ${results.length} results for query: "${query}"`
            )

            // Sort by relevance
            // Filter by minimum relevance threshold before returning
            return results
                .filter((result) => result.relevanceScore >= this.MIN_RELEVANCE_THRESHOLD.TRANSCRIPT)
                .sort((a, b) => b.relevanceScore - a.relevanceScore)
        } catch (error) {
            logger.error('Error searching in transcripts:', error)
            return []
        }
    }

    /**
     * Lấy context của user (đang học gì, progress...) - Optimized with parallel queries
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

            // Optimize: Fetch progress data in parallel
            const [recentProgress, recentLessons] = await Promise.all([
                // Lấy lesson đang học (progress gần nhất)
                prisma.progress.findFirst({
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
                }),
                // Lấy các lessons đã hoàn thành gần đây
                prisma.progress.findMany({
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
                }),
            ])

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
            // 1. Get user context, enrolled courses, and conversation context (optimize: fetch once)
            const [userContext, enrolledCoursesData, conversation] = await Promise.all([
                this.getUserContext(userId),
                prisma.enrollment.findMany({
                    where: { userId, status: 'ACTIVE' },
                    select: { courseId: true },
                }),
                conversationId
                    ? prisma.conversation.findUnique({
                          where: { id: conversationId },
                          select: {
                              lessonId: true,
                              courseId: true,
                          },
                      })
                    : Promise.resolve(null),
            ])

            const enrolledCourseIds = enrolledCoursesData.map((e) => e.courseId).sort()
            
            // Priority: Use lessonId/courseId from conversation if available, otherwise use userContext
            const targetLessonId = conversation?.lessonId || userContext.currentLesson?.id
            const targetCourseId = conversation?.courseId || userContext.currentCourse?.id
            
            // Get lesson info if conversation has lessonId
            let conversationLesson = null
            if (conversation?.lessonId) {
                try {
                    conversationLesson = await prisma.lesson.findUnique({
                        where: { id: conversation.lessonId },
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            description: true,
                            content: true,
                            courseId: true,
                            course: {
                                select: {
                                    id: true,
                                    title: true,
                                },
                            },
                        },
                    })
                } catch (error) {
                    logger.error(`Error fetching conversation lesson: ${error.message}`)
                }
            }
            
            logger.debug(
                `Building context for query: "${query}", conversationId: ${conversationId}, ` +
                `targetLessonId: ${targetLessonId}, targetCourseId: ${targetCourseId}, ` +
                `conversationLessonId: ${conversation?.lessonId}, conversationCourseId: ${conversation?.courseId}`
            )
            
            // Check cache for search results (key: query + courseIds + lessonId)
            const cacheKey = `${query.toLowerCase()}:${enrolledCourseIds.join(',')}:${targetLessonId || ''}:${targetCourseId || ''}`
            const cached = this.searchCache.get(cacheKey)
            if (cached && Date.now() - cached.timestamp < this.searchCacheMaxAge) {
                logger.debug(`Using cached search results for query: ${query}`)
                return {
                    ...cached.context,
                    userContext, // Always use fresh user context
                    conversationHistory: cached.context.conversationHistory,
                }
            }

            // 2. Search trong courses, lessons, transcripts (parallel, reuse courseIds)
            // Limit transcript search to 2 lessons max for better performance
            // IMPORTANT: Use conversation's lessonId/courseId if available
            const [courses, lessons, transcripts] = await Promise.all([
                this.searchInCourses(query, userId, enrolledCourseIds),
                this.searchInLessons(
                    query,
                    targetCourseId,
                    userId,
                    enrolledCourseIds
                ),
                this.searchInTranscripts(
                    query,
                    targetLessonId,
                    targetCourseId,
                    userId,
                    enrolledCourseIds
                ),
            ])

            // 3. Get conversation history (nếu có)
            let conversationHistory = []
            if (conversationId) {
                conversationHistory =
                    await this.getConversationHistory(conversationId)
            }

            // Update userContext with conversation lesson if available
            const enhancedUserContext = {
                ...userContext,
                // Override currentLesson with conversation lesson if available
                currentLesson: conversationLesson
                    ? {
                          id: conversationLesson.id,
                          title: conversationLesson.title,
                          slug: conversationLesson.slug,
                          description: conversationLesson.description,
                          content: conversationLesson.content,
                          courseId: conversationLesson.courseId,
                      }
                    : userContext.currentLesson,
            }

            const context = {
                userContext: enhancedUserContext,
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

            // Cache search results (without userContext which is user-specific)
            this.searchCache.set(cacheKey, {
                context: {
                    searchResults: context.searchResults,
                    conversationHistory: [], // Don't cache conversation history
                    query: context.query,
                },
                timestamp: Date.now(),
            })

            // Clean old cache entries
            if (this.searchCache.size > 50) {
                const now = Date.now()
                for (const [key, value] of this.searchCache.entries()) {
                    if (now - value.timestamp > this.searchCacheMaxAge) {
                        this.searchCache.delete(key)
                    }
                }
            }

            return context
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
     * Calculate relevance score (0-1) - Improved algorithm
     */
    calculateRelevanceScore(query, text) {
        if (!text || !query) return 0

        const queryLower = query.toLowerCase().trim()
        const textLower = text.toLowerCase()

        // 1. Exact phrase match → highest score (0.9-1.0)
        if (textLower.includes(queryLower)) {
            const position = textLower.indexOf(queryLower)
            const textLength = textLower.length
            // Càng ở đầu càng cao điểm
            const positionScore = Math.max(0, 1 - position / Math.max(textLength, 1))
            return 0.9 + positionScore * 0.1
        }

        // 2. All keywords match (in order) → high score (0.7-0.9)
        const keywords = this.extractKeywords(query)
        if (keywords.length === 0) return 0.3 // No meaningful keywords

        // Check if all keywords appear
        const allKeywordsMatch = keywords.every(keyword =>
            textLower.includes(keyword.toLowerCase())
        )

        if (allKeywordsMatch) {
            // Check keyword proximity (keywords close together = higher score)
            const keywordPositions = keywords
                .map(keyword => textLower.indexOf(keyword.toLowerCase()))
                .filter(pos => pos !== -1)
                .sort((a, b) => a - b)

            if (keywordPositions.length === keywords.length) {
                // Calculate average distance between keywords
                let totalDistance = 0
                for (let i = 1; i < keywordPositions.length; i++) {
                    totalDistance += keywordPositions[i] - keywordPositions[i - 1]
                }
                const avgDistance = totalDistance / Math.max(keywordPositions.length - 1, 1)
                const proximityScore = Math.max(0, 1 - avgDistance / 100) // Closer = better
                return 0.7 + proximityScore * 0.2
            }
            return 0.7
        }

        // 3. Partial keyword match → medium score (0.3-0.7)
        const matchedKeywords = keywords.filter((keyword) =>
            textLower.includes(keyword.toLowerCase())
        )
        const matchRatio = matchedKeywords.length / keywords.length

        // Bonus for matching important keywords (longer keywords)
        const importantKeywords = keywords.filter(k => k.length > 4)
        const importantMatches = importantKeywords.filter(k =>
            textLower.includes(k.toLowerCase())
        )
        const importantMatchRatio = importantKeywords.length > 0
            ? importantMatches.length / importantKeywords.length
            : 0

        // Weighted score: base match ratio + important keyword bonus
        const baseScore = matchRatio * 0.5
        const importantBonus = importantMatchRatio * 0.2
        return Math.min(0.7, baseScore + importantBonus)

        // 4. No match → low score (0.0-0.3)
        // Already handled by returning 0.3 if no keywords
    }

    /**
     * Extract keywords từ query - Improved version
     */
    extractKeywords(query) {
        if (!query) return []

        // Extended stopwords list (Vietnamese + English)
        const stopwords = [
            // Vietnamese
            'là', 'gì', 'như', 'thế', 'nào', 'của', 'cho', 'với', 'về', 'từ',
            'trong', 'để', 'và', 'hoặc', 'nhưng', 'mà', 'có', 'không', 'được',
            'bạn', 'tôi', 'anh', 'chị', 'em', 'ông', 'bà', 'cô', 'thầy',
            'này', 'đó', 'đây', 'kia', 'một', 'hai', 'ba', 'nhiều', 'ít',
            // English
            'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'what', 'how', 'when', 'where', 'why', 'who', 'which',
            'a', 'an', 'and', 'or', 'but', 'if', 'of', 'to', 'for',
            'with', 'from', 'by', 'at', 'in', 'on', 'up', 'down',
            'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
        ]

        // Remove punctuation and split
        const words = query
            .toLowerCase()
            .replace(/[.,!?;:()\[\]{}'"]/g, ' ')
            .split(/\s+/)
            .filter((word) => {
                // Filter: length > 2, not stopword, not number only
                return word.length > 2 && 
                       !stopwords.includes(word) && 
                       !/^\d+$/.test(word)
            })

        // Remove duplicates while preserving order
        const uniqueWords = []
        const seen = new Set()
        for (const word of words) {
            if (!seen.has(word)) {
                seen.add(word)
                uniqueWords.push(word)
            }
        }

        return uniqueWords
    }

    /**
     * Get transcript text from transcript URL (public method)
     * Used by AI quiz generation service
     * @param {string} transcriptUrl - Transcript file URL
     * @param {number} maxSegments - Maximum number of segments to return (default: 20)
     * @returns {Promise<string>} Transcript text
     */
    async getTranscriptText(transcriptUrl, maxSegments = 20) {
        try {
            const segments = await this._getCachedTranscript(transcriptUrl)
            if (!segments || segments.length === 0) {
                return ''
            }
            
            return segments
                .slice(0, maxSegments)
                .map(seg => seg.text)
                .join(' ')
        } catch (error) {
            logger.warn('Failed to get transcript text:', error)
            return ''
        }
    }

    /**
     * Get full transcript text (all segments) from transcript URL (public method)
     * Used by AI quiz generation service when transcript is the primary content source
     * @param {string} transcriptUrl - Transcript file URL
     * @returns {Promise<string>} Full transcript text
     */
    async getFullTranscriptText(transcriptUrl) {
        try {
            const segments = await this._getCachedTranscript(transcriptUrl)
            if (!segments || segments.length === 0) {
                return ''
            }
            
            // Return all segments (no limit)
            return segments.map(seg => seg.text).join(' ')
        } catch (error) {
            logger.warn('Failed to get full transcript text:', error)
            return ''
        }
    }

    /**
     * Get representative transcript text (sampled segments) from transcript URL
     * Lấy segments đại diện từ transcript để đảm bảo bao phủ toàn bộ nội dung
     * Thay vì chỉ lấy đầu + cuối, lấy segments cách đều nhau
     * @param {string} transcriptUrl - Transcript file URL
     * @param {number} maxSegments - Maximum number of segments to return
     * @returns {Promise<string>} Representative transcript text
     */
    async getRepresentativeTranscriptText(transcriptUrl, maxSegments = 50) {
        try {
            const segments = await this._getCachedTranscript(transcriptUrl)
            if (!segments || segments.length === 0) {
                return ''
            }

            // Nếu số segments ít hơn maxSegments, lấy tất cả
            if (segments.length <= maxSegments) {
                return segments.map(seg => seg.text).join(' ')
            }

            // Lấy segments cách đều nhau để đại diện cho toàn bộ transcript
            // Ví dụ: 100 segments, maxSegments=20 → lấy segments 0, 5, 10, 15, 20, ..., 95
            const step = Math.floor(segments.length / maxSegments)
            const sampledSegments = []
            
            for (let i = 0; i < segments.length; i += step) {
                sampledSegments.push(segments[i])
                if (sampledSegments.length >= maxSegments) break
            }

            // Đảm bảo luôn có segment đầu và cuối
            if (sampledSegments[0] !== segments[0]) {
                sampledSegments.unshift(segments[0])
            }
            if (sampledSegments[sampledSegments.length - 1] !== segments[segments.length - 1]) {
                sampledSegments.push(segments[segments.length - 1])
            }

            return sampledSegments.map(seg => seg.text).join(' ')
        } catch (error) {
            logger.warn('Failed to get representative transcript text:', error)
            return ''
        }
    }
}

export default new KnowledgeBaseService()
