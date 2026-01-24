import { prisma } from '../config/database.config.js'
import TranscriptParser from '../utils/transcript-parser.util.js'
import logger from '../config/logger.config.js'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'
import redisCacheService from './redis-cache.service.js'
import config from '../config/app.config.js'

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
                isPublished: true,
            }

            if (lessonId) {
                whereClause.id = lessonId
                logger.debug(`Searching transcript for specific lessonId: ${lessonId}`)
                // NOTE: Do NOT apply transcriptUrl constraint when searching specific lesson
                // Allow finding lessons without transcripts so fallback logic can work
            } else {
                // Only require transcript when not searching specific lesson (course, user, general search)
                whereClause.transcriptUrl = { not: null }
                
                if (courseId) {
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
    async buildContext(userId, query, conversationId = null, options = {}) {
        const { mode = 'course', dynamicLessonId = null } = options
        // Fast path for general mode: skip transcript/lesson/course searches
        if (mode === 'general') {
            try {
                const userContext = await this.getUserContext(userId)
                // Include conversation history in general mode if available
                const conversationHistory = conversationId
                    ? await this.getConversationHistory(conversationId)
                    : []
                return {
                    userContext,
                    searchResults: {
                        courses: [],
                        lessons: [],
                        transcripts: [],
                        totalResults: 0,
                    },
                    conversationHistory,
                    query,
                    mode,
                }
            } catch (error) {
                logger.error('Error building minimal context for general mode:', error)
                return {
                    userContext: null,
                    searchResults: { courses: [], lessons: [], transcripts: [], totalResults: 0 },
                    conversationHistory: [],
                    query,
                    mode,
                }
            }
        }
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
            
            // In course mode with dynamicLessonId: use only dynamicLessonId for lesson-specific search
            // In general mode: no specific lesson target
            const targetLessonId = mode === 'course' ? dynamicLessonId : null
            const targetCourseId = conversation?.courseId || userContext.currentCourse?.id
            
            logger.debug(
                `Building context for query: "${query}", conversationId: ${conversationId}, ` +
                `mode: ${mode}, targetLessonId: ${targetLessonId}, targetCourseId: ${targetCourseId}`
            )
            
            // Check cache for search results (key: mode + normalized query + context)
            const normalizedQuery = (query || '').toLowerCase().trim()
            const cacheKey =
                mode === 'advisor'
                    ? `advisor:${normalizedQuery}`
                    : mode === 'course' && targetLessonId
                      ? `course:${normalizedQuery}:lesson:${targetLessonId}`
                      : `general:${normalizedQuery}:${enrolledCourseIds.join(',')}`
            const cached = this.searchCache.get(cacheKey)
            if (cached && Date.now() - cached.timestamp < this.searchCacheMaxAge) {
                logger.debug(`Using cached search results for query: ${query}`)
                return {
                    ...cached.context,
                    userContext, // Always use fresh user context
                    conversationHistory: cached.context.conversationHistory,
                }
            }

            // 2. Search strategy
            // When in course mode with lessonId: only search transcripts for the current lesson
            let courses = []
            let lessons = []
            let transcripts = []

            if (mode === 'advisor') {
                // Advisor mode: Search courses to provide real recommendations
                // RAG ENABLED: Use vector search (semantic) + keyword search (hybrid)
                // FALLBACK: Use keyword search only if RAG disabled or unavailable
                
                // Check if RAG is enabled
                const useRAG = config.RAG_ENABLED !== false
                let vectorSearchAvailable = false
                
                if (useRAG) {
                    try {
                        // Dynamic import to avoid circular dependency
                        const vectorSearchService = (await import('./vector-search.service.js')).default
                        vectorSearchAvailable = await vectorSearchService.isAvailable()
                        
                        if (vectorSearchAvailable) {
                            // Try Redis cache first (faster than DB query)
                            const cachedCourses = await redisCacheService.getCachedAdvisorSearch(query)
                            if (cachedCourses) {
                                courses = cachedCourses
                                logger.debug(`Advisor (RAG): Using Redis cache for query: ${query.substring(0, 50)}`)
                            } else {
                                // Use hybrid search (vector + keyword) if enabled
                                if (config.RAG_HYBRID_SEARCH !== false) {
                                    logger.debug(`Advisor (RAG Hybrid): Searching with vector + keyword`)
                                    courses = await vectorSearchService.hybridSearch(query, {
                                        limit: 8,
                                        published: false,
                                    })
                                } else {
                                    // Pure vector search
                                    logger.debug(`Advisor (RAG Vector): Searching with vector only`)
                                    courses = await vectorSearchService.searchCoursesByVector(query, {
                                        limit: 8,
                                        status: 'PUBLISHED', // Use uppercase to match database
                                    })
                                }
                                
                                // Cache results in Redis (async, non-blocking)
                                if (courses.length > 0) {
                                    redisCacheService.cacheAdvisorSearch(query, courses).catch((err) => {
                                        logger.warn('Failed to cache advisor search in Redis', err.message)
                                    })
                                }
                                
                                // If no results, try fallback to keyword search
                                if (courses.length === 0 && query && query.trim()) {
                                    logger.debug(`Advisor (RAG): No vector results, falling back to keyword search`)
                                    courses = await this.searchCoursesByQuery(query, {
                                        published: false,
                                        limit: 8,
                                        orderBy: ['ratingAvg', 'enrolledCount', 'publishedAt']
                                    })
                                }
                            }
                        } else {
                            logger.warn('RAG enabled but vector search not available (pgvector not installed or no embeddings)')
                        }
                    } catch (error) {
                        logger.error('Error in RAG search, falling back to keyword search:', error)
                        vectorSearchAvailable = false
                    }
                }
                
                // Fallback to keyword search if RAG disabled or unavailable
                if (!useRAG || !vectorSearchAvailable || courses.length === 0) {
                    // Try Redis cache first (faster than DB query)
                    const cachedCourses = await redisCacheService.getCachedAdvisorSearch(query)
                    if (cachedCourses) {
                        courses = cachedCourses
                        logger.debug(`Advisor (Keyword): Using Redis cache for query: ${query.substring(0, 50)}`)
                    } else {
                        // Cache miss: query database with keyword search
                        courses = await this.searchCoursesByQuery(query, {
                            published: false, // Show all courses regardless of status for advisor recommendations
                            limit: 8, // Optimized: 8 courses đủ để rank và chọn best 4 (giảm từ 20)
                            orderBy: ['ratingAvg', 'enrolledCount', 'publishedAt']
                        })
                        
                        // Cache results in Redis (async, non-blocking)
                        redisCacheService.cacheAdvisorSearch(query, courses).catch((err) => {
                            logger.warn('Failed to cache advisor search in Redis', err.message)
                        })
                        
                        // If search returned no results but user provided a query, try broader search
                        if (courses.length === 0 && query && query.trim()) {
                            logger.debug(`Advisor search returned 0 results for "${query}", fetching top courses as fallback`)
                            courses = await this.searchCoursesByQuery('', {
                                published: false,
                                limit: 8, // Optimized: giảm từ 20 xuống 8
                                orderBy: ['ratingAvg', 'enrolledCount', 'publishedAt']
                            })
                            
                            // Cache fallback results too
                            if (courses.length > 0) {
                                redisCacheService.cacheAdvisorSearch(query, courses).catch((err) => {
                                    logger.warn('Failed to cache fallback search in Redis', err.message)
                                })
                            }
                        }
                    }
                }
                
                lessons = []
                transcripts = []
                logger.debug(`Advisor mode: Found ${courses.length} courses for recommendations (RAG: ${vectorSearchAvailable ? 'enabled' : 'disabled'})`)
            } else if (mode === 'course' && targetLessonId) {
                // Restrict to the exact lesson's transcript; searchInTranscripts already
                // falls back to lesson content/description/title if transcript is missing
                transcripts = await this.searchInTranscripts(
                    query,
                    targetLessonId,
                    null,
                    userId,
                    enrolledCourseIds
                )
                // No course-level fallback; rely only on lesson transcript + lesson content
            } else {
                // Broader search for general mode - only search transcripts
                // (searchInCourses and searchInLessons methods don't exist)
                transcripts = await this.searchInTranscripts(
                    query,
                    targetLessonId,
                    targetCourseId,
                    userId,
                    enrolledCourseIds
                )
            }

            // 3. Get conversation history (nếu có)
            let conversationHistory = []
            if (conversationId) {
                conversationHistory =
                    await this.getConversationHistory(conversationId)
            }

            const context = {
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
                mode,
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

    /**
     * Extract keywords from query (remove stopwords, keep meaningful tech keywords)
     * @param {string} query - User query
     * @returns {Array<string>} Extracted keywords
     */
    /**
     * Expand category keywords with synonyms
     * @param {string} query - User query
     * @returns {Array<string>} Expanded keywords including synonyms
     */
    _expandCategoryKeywords(keywords) {
        if (!keywords || keywords.length === 0) return keywords

        const categorySynonyms = {
            'web': ['web', 'lập trình web', 'web development', 'website', 'frontend', 'backend', 'full stack', 'fullstack'],
            'mobile': ['mobile', 'di động', 'app', 'application', 'ios', 'android', 'flutter', 'react native'],
            'data': ['data', 'dữ liệu', 'data science', 'big data', 'analytics', 'machine learning', 'ai'],
            'ai': ['ai', 'artificial intelligence', 'trí tuệ nhân tạo', 'machine learning', 'deep learning', 'neural network'],
            'game': ['game', 'trò chơi', 'gaming', 'unity', 'game development', 'game design'],
            'cybersecurity': ['security', 'bảo mật', 'hacking', 'ethical hacking', 'penetration testing', 'cybersecurity'],
        }

        const expanded = [...keywords]
        
        for (const keyword of keywords) {
            const keywordLower = keyword.toLowerCase()
            for (const [category, synonyms] of Object.entries(categorySynonyms)) {
                if (synonyms.some(syn => keywordLower.includes(syn) || syn.includes(keywordLower))) {
                    // Add all synonyms for this category
                    synonyms.forEach(syn => {
                        if (!expanded.includes(syn) && syn.length >= 3) {
                            expanded.push(syn)
                        }
                    })
                    break
                }
            }
        }

        return expanded.length > keywords.length ? expanded : keywords
    }

    /**
     * Detect course level from natural language query
     * @param {string} query - User query
     * @returns {string|null} Detected level (BEGINNER, INTERMEDIATE, ADVANCED) or null
     */
    _detectLevelFromQuery(query) {
        if (!query || query.trim().length === 0) return null

        const queryLower = query.toLowerCase()
        
        // Level keywords mapping
        const levelKeywords = {
            'BEGINNER': [
                'mới bắt đầu', 'mới học', 'chưa biết', 'chưa học', 'chưa có kinh nghiệm',
                'cơ bản', 'basic', 'beginner', 'starter', 'người mới',
                'từ đầu', 'từ zero', 'zero to hero', 'nhập môn', 'khởi đầu'
            ],
            'INTERMEDIATE': [
                'trung cấp', 'có kinh nghiệm', 'đã biết', 'đã học',
                'intermediate', 'nâng cao cơ bản', 'cải thiện', 'improve',
                'nâng cao kỹ năng', 'học thêm', 'mở rộng'
            ],
            'ADVANCED': [
                'nâng cao', 'chuyên sâu', 'expert', 'advanced', 'pro',
                'cao cấp', 'master', 'professional', 'deep dive',
                'chuyên nghiệp', 'thành thạo'
            ]
        }

        // Check for level keywords in query
        for (const [level, keywords] of Object.entries(levelKeywords)) {
            for (const keyword of keywords) {
                if (queryLower.includes(keyword)) {
                    logger.debug(`Detected level "${level}" from query: "${query}" (keyword: "${keyword}")`)
                    return level
                }
            }
        }

        return null
    }

    _extractKeywords(query) {
        if (!query || query.trim().length === 0) return []

        const stopwords = new Set([
            'hoc', 'học', 'muon', 'muốn', 'toi', 'tôi', 'ban', 'bạn',
            'lam', 'làm', 'viec', 'việc', 'can', 'cần', 'gi', 'gì',
            'the', 'thế', 'nào', 'phu', 'phù', 'hop', 'hợp',
            'de', 'để', 've', 'về', 'khoa', 'khóa', 'lop', 'lớp',
            'co', 'có', 'coi', 'xem', 'camon', 'cảm', 'cảm ơn', 'on', 'ơn',
        ])

        const allowShortKeywords = new Set([
            'ai', 'js', 'go', 'c', 'c++', 'c#', 'ui', 'ux', 'sql',
        ])

        return query
            .toLowerCase()
            .split(/[^\p{L}\p{N}+#.]+/u)
            .filter((w) => w.length > 0)
            .filter(
                (w) =>
                    (w.length >= 3 || allowShortKeywords.has(w)) &&
                    !stopwords.has(w)
            )
    }

    /**
     * Deterministic scoring cho khóa học dựa trên keyword match + tín hiệu chất lượng
     * Không dùng LLM, chỉ rule-based để Advisor ổn định.
     * @param {Object} course - Course object
     * @param {Array} keywords - Extracted keywords from query
     * @param {string|null} detectedLevel - Detected level from query (optional)
     */
    _scoreCourse(course, keywords = [], detectedLevel = null) {
        // Include category, tags, level in scoring text
        const tagsText = course.courseTags?.map(ct => ct.tag?.name || ct.tag).filter(Boolean).join(' ') || ''
        const categoryName = course.category?.name || ''
        
        const text = [
            course.title || '',
            course.shortDescription || '',
            course.description || '',
            course.whatYouLearn || '',
            categoryName,        // ✅ THÊM: Category
            tagsText,           // ✅ THÊM: Tags
            course.level || '', // ✅ THÊM: Level
        ]
            .join(' ')
            .toLowerCase()

        // Keyword hit: mỗi keyword trùng tăng điểm
        const keywordHits =
            keywords.length > 0
                ? keywords.reduce(
                      (acc, kw) => acc + (text.includes(kw) ? 1 : 0),
                      0
                  )
                : 0

        // ✅ THÊM: Level matching boost
        let levelBoost = 0
        if (detectedLevel && course.level === detectedLevel) {
            levelBoost = 3.0 // Strong boost for level match
            logger.debug(`Level match boost: course "${course.title}" (${course.level}) matches query level (${detectedLevel})`)
        } else if (detectedLevel) {
            // Small penalty for level mismatch (but not too harsh)
            levelBoost = -0.5
        }

        // Chất lượng: rating và độ phổ biến
        const ratingScore = course.ratingAvg
            ? Number(course.ratingAvg) / 5
            : 0
        const popularityScore = Math.log(1 + (course.enrolledCount || 0)) / 10

        // Độ mới: publishedAt gần hiện tại hơn → điểm cao hơn (simple decay)
        let freshnessScore = 0
        if (course.publishedAt) {
            const days =
                (Date.now() - new Date(course.publishedAt).getTime()) /
                (1000 * 60 * 60 * 24)
            // <=30 ngày: 1.0, 180 ngày: ~0.3, >365 ngày: ~0.1
            freshnessScore = Math.max(0.1, Math.min(1, 30 / Math.max(30, days)))
        }

        // Trọng số đơn giản, có thể tinh chỉnh sau
        return (
            keywordHits * 2 + // ưu tiên khớp từ khóa
            levelBoost +      // ✅ THÊM: Level matching boost/penalty
            ratingScore * 1.5 +
            popularityScore * 1.0 +
            freshnessScore * 0.5
        )
    }

    /**
     * Search courses by query (for advisor recommendations)
     * @param {string} query - Search query
     * @param {Object} options - Search options (published, active, limit, orderBy)
     * @returns {Promise<Array>} List of courses
     */
    async searchCoursesByQuery(query, options = {}) {
        try {
            const { published = true, limit = 10, orderBy = [] } = options

            // Build where clause
            const where = {}
            if (published) {
                where.status = 'PUBLISHED' // Use uppercase to match database
            }

            // ✅ THÊM: Detect level from query for better matching (used in scoring, not filtering)
            const detectedLevel = this._detectLevelFromQuery(query)
            
            // Search in title, description, shortDescription if query provided
            // OPTIMIZED: Extract keywords instead of using full query
            if (query && query.trim()) {
                let keywords = this._extractKeywords(query)
                
                // ✅ THÊM: Expand keywords with category synonyms for better matching
                keywords = this._expandCategoryKeywords(keywords)
                
                if (keywords.length > 0) {
                    // Search with each keyword (OR logic - course matches any keyword)
                    // This allows "Tôi muốn học Python" → extract "python" → match "Python Advanced"
                    where.OR = keywords.flatMap(keyword => [
                        { title: { contains: keyword, mode: 'insensitive' } },
                        { shortDescription: { contains: keyword, mode: 'insensitive' } },
                        { description: { contains: keyword, mode: 'insensitive' } },
                        { whatYouLearn: { contains: keyword, mode: 'insensitive' } },
                        { category: { name: { contains: keyword, mode: 'insensitive' } } }, // ✅ THÊM: Category
                        { courseTags: { some: { tag: { name: { contains: keyword, mode: 'insensitive' } } } } }, // ✅ THÊM: Tags
                        { level: { contains: keyword, mode: 'insensitive' } }, // ✅ THÊM: Level
                    ])
                    
                    logger.debug(`Extracted keywords from query "${query}": ${keywords.join(', ')}`)
                } else {
                    // Fallback: use full query if no keywords extracted
                    const searchTerm = query.toLowerCase().trim()
                    where.OR = [
                        { title: { contains: searchTerm, mode: 'insensitive' } },
                        { shortDescription: { contains: searchTerm, mode: 'insensitive' } },
                        { description: { contains: searchTerm, mode: 'insensitive' } },
                        { whatYouLearn: { contains: searchTerm, mode: 'insensitive' } },
                        { category: { name: { contains: searchTerm, mode: 'insensitive' } } }, // ✅ THÊM: Category
                        { courseTags: { some: { tag: { name: { contains: searchTerm, mode: 'insensitive' } } } } }, // ✅ THÊM: Tags
                        { level: { contains: searchTerm, mode: 'insensitive' } }, // ✅ THÊM: Level
                    ]
                }
            }

            logger.debug(`Searching courses with query="${query}", where=${JSON.stringify(where)}`)

            // Build orderBy clause (default: rating desc, enrolledCount desc, publishedAt desc)
            let orderByClause = []
            if (orderBy.length > 0) {
                orderByClause = orderBy.map(field => {
                    if (field === 'ratingAvg') return { ratingAvg: 'desc' }
                    if (field === 'enrolledCount') return { enrolledCount: 'desc' }
                    if (field === 'publishedAt') return { publishedAt: 'desc' }
                    return { [field]: 'desc' }
                })
            } else {
                orderByClause = [
                    { ratingAvg: 'desc' },
                    { enrolledCount: 'desc' },
                    { publishedAt: 'desc' },
                ]
            }

            const courses = await prisma.course.findMany({
                where,
                orderBy: orderByClause,
                take: Math.max(limit, 20), // lấy nhiều hơn một chút rồi sẽ tự rank/cắt
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    shortDescription: true,
                    description: true,
                    thumbnailUrl: true,
                    level: true,
                    price: true,
                    discountPrice: true,
                    ratingAvg: true,
                    ratingCount: true,
                    enrolledCount: true,
                    durationHours: true,
                    totalLessons: true,
                    instructor: {
                        select: {
                            id: true,
                            fullName: true,
                            avatarUrl: true,
                        },
                    },
                    publishedAt: true,
                    whatYouLearn: true,
                    category: {              // ✅ THÊM: Category cho scoring
                        select: {
                            id: true,
                            name: true,
                            description: true,
                        },
                    },
                    courseTags: {            // ✅ THÊM: Tags cho scoring
                        select: {
                            tag: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
            })

            // Deterministic ranking trên app layer (tăng độ ổn định, tránh phụ thuộc DB sort)
            const keywords =
                query && query.trim() ? this._extractKeywords(query) : []
            // ✅ THÊM: Use detected level for scoring boost
            const scored = courses.map((c) => ({
                course: c,
                score: this._scoreCourse(c, keywords, detectedLevel),
            }))

            const ranked = scored
                .sort((a, b) => b.score - a.score)
                .slice(0, limit)
                .map((item) => item.course)

            logger.info(
                `Advisor search: Found ${courses.length} courses, ranked top=${ranked.length} for query="${query}"`
            )
            if (ranked.length > 0) {
                logger.debug(
                    `Top ranked: ${ranked
                        .slice(0, 3)
                        .map((c) => c.title)
                        .join(', ')}`
                )
            }
            return ranked
        } catch (error) {
            logger.error('Error searching courses for advisor:', error)
            throw error
        }
    }
}

export default new KnowledgeBaseService()