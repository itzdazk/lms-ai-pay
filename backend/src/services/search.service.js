// backend/src/services/search.service.js
import { prisma } from '../config/database.config.js'
import {
    COURSE_STATUS,
    USER_STATUS,
    USER_ROLES,
    HTTP_STATUS,
} from '../config/constants.js'
import logger from '../config/logger.config.js'
import config from '../config/app.config.js'
import redisCacheService from './redis-cache.service.js'

class SearchService {
    /**
     * Search courses with advanced filters (with semantic search support)
     * @param {object} filters - Search filters
     * @returns {Promise<{courses: Array, total: number}>}
     */
    async searchCourses(filters) {
        const {
            q, // search keyword
            category,
            tags,
            level,
            price, // free|paid
            rating, // minimum rating
            featured,
            sort = 'newest',
            page = 1,
            limit = 20,
        } = filters

        const otherFilters = {
            category,
            tags,
            level,
            price,
            rating,
            featured,
            sort,
        }

        // Short queries (< 3 chars): use keyword search only (faster)
        if (!q || q.trim().length < 3) {
            return await this._keywordSearchCourses(filters)
        }

        // Long queries (>= 3 chars): try semantic search
        const useRAG = config.RAG_ENABLED !== false
        let vectorSearchAvailable = false

        if (useRAG) {
            try {
                // Dynamic import to avoid circular dependency
                const vectorSearchService = (
                    await import('./vector-search.service.js')
                ).default
                vectorSearchAvailable = await vectorSearchService.isAvailable()

                if (vectorSearchAvailable) {
                    // Check Redis cache first (performance optimization)
                    const cachedCourses = await redisCacheService.getCachedAdvisorSearch(
                        q
                    )

                    let courses = []

                    if (cachedCourses) {
                        courses = cachedCourses
                        logger.debug(
                            `Search (RAG): Using Redis cache for query: ${q.substring(0, 50)}`
                        )
                    } else {
                        // Use hybrid search (vector + keyword) if enabled
                        if (config.RAG_HYBRID_SEARCH !== false) {
                            logger.debug(
                                `Search (RAG Hybrid): Searching with vector + keyword`
                            )
                            courses = await vectorSearchService.hybridSearch(q, {
                                limit: limit * 3, // Get more for filtering
                                threshold:
                                    config.RAG_SIMILARITY_THRESHOLD || 0.7,
                            })
                        } else {
                            // Pure vector search
                            logger.debug(
                                `Search (RAG Vector): Searching with vector only`
                            )
                            courses = await vectorSearchService.searchCoursesByVector(
                                q,
                                {
                                    limit: limit * 3,
                                    status: 'PUBLISHED',
                                }
                            )
                        }

                        // Cache results in Redis (async, non-blocking)
                        if (courses.length > 0) {
                            redisCacheService
                                .cacheAdvisorSearch(q, courses)
                                .catch((err) => {
                                    logger.warn(
                                        'Failed to cache search results in Redis',
                                        err.message
                                    )
                                })
                        }
                    }

                    // If no results, try fallback to keyword search
                    if (courses.length === 0) {
                        logger.debug(
                            `Search (RAG): No vector results, falling back to keyword search`
                        )
                        return await this._keywordSearchCourses(filters)
                    }

                    // Apply other filters (category, level, price, tags, rating, featured)
                    const filteredCourses = await this._applyFiltersToCourses(
                        courses,
                        otherFilters
                    )

                    // Sort courses
                    const sortedCourses = this._sortCourses(
                        filteredCourses,
                        sort
                    )

                    // Paginate
                    const skip = (page - 1) * limit
                    const paginatedCourses = sortedCourses.slice(
                        skip,
                        skip + limit
                    )

                    // Load tags for courses if not present (vector search doesn't include tags)
                    const courseIds = paginatedCourses.map((c) => c.id)
                    const coursesWithTags = await prisma.course.findMany({
                        where: { id: { in: courseIds } },
                        select: {
                            id: true,
                            courseTags: {
                                select: {
                                    tag: {
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

                    const tagsMap = new Map()
                    coursesWithTags.forEach((c) => {
                        tagsMap.set(
                            c.id,
                            c.courseTags.map((ct) => ct.tag)
                        )
                    })

                    // Format courses
                    const formattedCourses = paginatedCourses.map((course) => ({
                        ...course,
                        tags: tagsMap.get(course.id) || course.tags || [],
                        courseTags: undefined,
                    }))

                    return {
                        courses: formattedCourses,
                        total: sortedCourses.length,
                    }
                }
            } catch (error) {
                logger.warn(
                    'Vector search failed, falling back to keyword search:',
                    error.message
                )
                vectorSearchAvailable = false
            }
        }

        // Fallback to keyword search if RAG disabled or unavailable
        return await this._keywordSearchCourses(filters)
    }

    /**
     * Search instructors
     * @param {object} filters - Search filters
     * @returns {Promise<{instructors: Array, total: number}>}
     */
    async searchInstructors(filters) {
        const { q, sort = 'popular', page = 1, limit = 20 } = filters

        const skip = (page - 1) * limit

        // Build where clause
        const where = {
            role: USER_ROLES.INSTRUCTOR,
            status: USER_STATUS.ACTIVE,
        }

        // Full-text search trong fullName, userName, bio
        if (q) {
            where.OR = [
                { fullName: { contains: q, mode: 'insensitive' } },
                { userName: { contains: q, mode: 'insensitive' } },
                { bio: { contains: q, mode: 'insensitive' } },
            ]
        }

        // Build orderBy clause
        let orderBy = {}
        switch (sort) {
            case 'name':
                orderBy = { fullName: 'asc' }
                break
            case 'newest':
                orderBy = { createdAt: 'desc' }
                break
            case 'popular':
            default:
                // Sẽ sort theo số lượng courses published (handle ở dưới)
                orderBy = { createdAt: 'desc' }
        }

        // Execute query
        const [instructors, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                select: {
                    id: true,
                    userName: true,
                    fullName: true,
                    avatarUrl: true,
                    bio: true,
                    createdAt: true,
                    _count: {
                        select: {
                            coursesAsInstructor: {
                                where: {
                                    status: COURSE_STATUS.PUBLISHED,
                                },
                            },
                        },
                    },
                },
            }),
            prisma.user.count({ where }),
        ])

        // Calculate total enrollments for each instructor
        const instructorsWithStats = await Promise.all(
            instructors.map(async (instructor) => {
                // Get total enrollments across all courses
                const enrollmentsCount = await prisma.enrollment.count({
                    where: {
                        course: {
                            instructorId: instructor.id,
                            status: COURSE_STATUS.PUBLISHED,
                        },
                    },
                })

                // Get average rating across all courses
                const avgRating = await prisma.course.aggregate({
                    where: {
                        instructorId: instructor.id,
                        status: COURSE_STATUS.PUBLISHED,
                    },
                    _avg: {
                        ratingAvg: true,
                    },
                })

                return {
                    ...instructor,
                    totalCourses: instructor._count.coursesAsInstructor,
                    totalEnrollments: enrollmentsCount,
                    averageRating: avgRating._avg.ratingAvg
                        ? parseFloat(avgRating._avg.ratingAvg)
                        : 0,
                    _count: undefined,
                }
            })
        )

        // Sort by popularity (total enrollments) if needed
        if (sort === 'popular') {
            instructorsWithStats.sort(
                (a, b) => b.totalEnrollments - a.totalEnrollments
            )
        }

        return {
            instructors: instructorsWithStats,
            total,
        }
    }

    /**
     * Get search suggestions/autocomplete (with semantic search support for courses)
     * @param {string} q - Search query
     * @param {number} limit - Maximum number of suggestions
     * @returns {Promise<object>}
     */
    async getSearchSuggestions(q, limit = 10) {
        if (!q || q.trim().length < 2) {
            return {
                courses: [],
                categories: [],
                tags: [],
                instructors: [],
            }
        }

        const searchTerm = q.trim()

        // For suggestions, use semantic search for courses if query is long enough
        let courses = []

        if (searchTerm.length >= 3 && config.RAG_ENABLED !== false) {
            try {
                const vectorSearchService = (
                    await import('./vector-search.service.js')
                ).default
                const available = await vectorSearchService.isAvailable()

                if (available) {
                    // Use vector search for courses (semantic)
                    const vectorResults = await vectorSearchService.searchCoursesByVector(
                        searchTerm,
                        {
                            limit: limit,
                            threshold: 0.6, // Lower threshold for suggestions
                        }
                    )

                    courses = vectorResults.map((c) => ({
                        id: c.id,
                        title: c.title,
                        slug: c.slug,
                        thumbnailUrl: c.thumbnailUrl,
                    }))
                }
            } catch (error) {
                logger.warn(
                    'Vector search for suggestions failed, using keyword search:',
                    error.message
                )
            }
        }

        // Fallback to keyword search for courses if vector search didn't work
        if (courses.length === 0) {
            courses = await prisma.course.findMany({
                where: {
                    status: COURSE_STATUS.PUBLISHED,
                    title: {
                        contains: searchTerm,
                        mode: 'insensitive',
                    },
                },
                take: limit,
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    thumbnailUrl: true,
                },
                orderBy: {
                    enrolledCount: 'desc',
                },
            })
        }

        // Get category suggestions
        const categories = await prisma.category.findMany({
            where: {
                isActive: true,
                name: {
                    contains: searchTerm,
                    mode: 'insensitive',
                },
            },
            take: limit,
            select: {
                id: true,
                name: true,
                slug: true,
            },
        })

        // Get tag suggestions
        const tags = await prisma.tag.findMany({
            where: {
                name: {
                    contains: searchTerm,
                    mode: 'insensitive',
                },
            },
            take: limit,
            select: {
                id: true,
                name: true,
                slug: true,
            },
        })

        // Get instructor suggestions
        const instructors = await prisma.user.findMany({
            where: {
                role: USER_ROLES.INSTRUCTOR,
                status: USER_STATUS.ACTIVE,
                OR: [
                    {
                        fullName: {
                            contains: searchTerm,
                            mode: 'insensitive',
                        },
                    },
                    {
                        userName: {
                            contains: searchTerm,
                            mode: 'insensitive',
                        },
                    },
                ],
            },
            take: limit,
            select: {
                id: true,
                userName: true,
                fullName: true,
                avatarUrl: true,
            },
        })

        return {
            courses,
            categories,
            tags,
            instructors,
        }
    }

    /**
     * Keyword search (original implementation)
     * @private
     */
    async _keywordSearchCourses(filters) {
        const {
            q,
            category,
            tags,
            level,
            price,
            rating,
            featured,
            sort = 'newest',
            page = 1,
            limit = 20,
        } = filters

        const skip = (page - 1) * limit

        // Build where clause
        const where = {
            status: COURSE_STATUS.PUBLISHED,
        }

        // Full-text search trong title, description, shortDescription
        if (q) {
            where.OR = [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
                { shortDescription: { contains: q, mode: 'insensitive' } },
            ]
        }

        // Filter by category
        if (category) {
            where.categoryId = parseInt(category)
        }

        // Filter by tags (comma-separated: tag1,tag2,tag3)
        if (tags) {
            const tagArray = tags.split(',').map((tag) => tag.trim())
            where.courseTags = {
                some: {
                    tag: {
                        slug: {
                            in: tagArray,
                        },
                    },
                },
            }
        }

        // Filter by level
        if (level) {
            where.level = level
        }

        // Filter by price (free or paid)
        if (price === 'free') {
            where.price = 0
        } else if (price === 'paid') {
            where.price = {
                gt: 0,
            }
        }

        // Filter by minimum rating
        if (rating) {
            where.ratingAvg = {
                gte: parseFloat(rating),
            }
        }

        // Filter by featured
        if (featured === 'true' || featured === true) {
            where.isFeatured = true
        }

        // Build orderBy clause
        let orderBy = {}
        switch (sort) {
            case 'oldest':
                orderBy = { publishedAt: 'asc' }
                break
            case 'price_asc':
                orderBy = { price: 'asc' }
                break
            case 'price_desc':
                orderBy = { price: 'desc' }
                break
            case 'rating':
                orderBy = { ratingAvg: 'desc' }
                break
            case 'enrolled':
                orderBy = { enrolledCount: 'desc' }
                break
            case 'newest':
            default:
                orderBy = { publishedAt: 'desc' }
        }

        // Execute query
        const [courses, total] = await Promise.all([
            prisma.course.findMany({
                where,
                skip,
                take: limit,
                orderBy,
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
                    isFeatured: true,
                    publishedAt: true,
                    instructor: {
                        select: {
                            id: true,
                            userName: true,
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
                    courseTags: {
                        select: {
                            tag: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true,
                                },
                            },
                        },
                    },
                },
            }),
            prisma.course.count({ where }),
        ])

        // Format courses
        const formattedCourses = courses.map((course) => ({
            ...course,
            tags: course.courseTags.map((ct) => ct.tag),
            courseTags: undefined,
        }))

        return {
            courses: formattedCourses,
            total,
        }
    }

    /**
     * Apply filters to vector search results
     * @private
     */
    async _applyFiltersToCourses(courses, filters) {
        let filtered = [...courses]

        // Filter by category
        if (filters.category) {
            const categoryId = parseInt(filters.category)
            filtered = filtered.filter(
                (c) => c.categoryId === categoryId || c.category?.id === categoryId
            )
        }

        // Filter by level
        if (filters.level) {
            filtered = filtered.filter((c) => c.level === filters.level)
        }

        // Filter by price (free or paid)
        if (filters.price === 'free') {
            filtered = filtered.filter(
                (c) => parseFloat(c.price) === 0 || c.price === 0
            )
        } else if (filters.price === 'paid') {
            filtered = filtered.filter(
                (c) => parseFloat(c.price) > 0 || c.price > 0
            )
        }

        // Filter by minimum rating
        if (filters.rating) {
            const minRating = parseFloat(filters.rating)
            filtered = filtered.filter(
                (c) => parseFloat(c.ratingAvg || 0) >= minRating
            )
        }

        // Filter by featured
        if (filters.featured === 'true' || filters.featured === true) {
            filtered = filtered.filter((c) => c.isFeatured === true)
        }

        // Filter by tags (requires DB query to check tag relationships)
        if (filters.tags) {
            const tagArray = filters.tags.split(',').map((tag) => tag.trim())
            const courseIds = filtered.map((c) => c.id)

            // Query DB to check which courses have the specified tags
            const coursesWithTags = await prisma.course.findMany({
                where: {
                    id: { in: courseIds },
                    courseTags: {
                        some: {
                            tag: {
                                slug: { in: tagArray },
                            },
                        },
                    },
                },
                select: { id: true },
            })

            const validCourseIds = new Set(coursesWithTags.map((c) => c.id))
            filtered = filtered.filter((c) => validCourseIds.has(c.id))
        }

        return filtered
    }

    /**
     * Sort courses
     * @private
     */
    _sortCourses(courses, sort) {
        const sorted = [...courses]

        switch (sort) {
            case 'oldest':
                sorted.sort((a, b) => {
                    const dateA = new Date(a.publishedAt || a.createdAt || 0)
                    const dateB = new Date(b.publishedAt || b.createdAt || 0)
                    return dateA - dateB
                })
                break
            case 'price_asc':
                sorted.sort(
                    (a, b) => parseFloat(a.price || 0) - parseFloat(b.price || 0)
                )
                break
            case 'price_desc':
                sorted.sort(
                    (a, b) => parseFloat(b.price || 0) - parseFloat(a.price || 0)
                )
                break
            case 'rating':
                sorted.sort(
                    (a, b) =>
                        parseFloat(b.ratingAvg || 0) -
                        parseFloat(a.ratingAvg || 0)
                )
                break
            case 'enrolled':
                sorted.sort(
                    (a, b) => (b.enrolledCount || 0) - (a.enrolledCount || 0)
                )
                break
            case 'newest':
            default:
                sorted.sort((a, b) => {
                    const dateA = new Date(a.publishedAt || a.createdAt || 0)
                    const dateB = new Date(b.publishedAt || b.createdAt || 0)
                    return dateB - dateA
                })
        }

        return sorted
    }

    /**
     * Process voice search (speech-to-text result)
     * @param {string} transcript - Speech-to-text transcript
     * @returns {Promise<object>} - Search results
     */
    async processVoiceSearch(transcript) {
        if (!transcript || transcript.trim().length === 0) {
            const error = new Error('Transcript is required for voice search')
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }

        // Clean up transcript
        const cleanedQuery = transcript
            .trim()
            .toLowerCase()
            .replace(/[^\w\s]/gi, '') // Remove special characters

        // Use the same search logic as text search
        const results = await this.searchCourses({
            q: cleanedQuery,
            page: 1,
            limit: 20,
            sort: 'enrolled', // Prioritize popular courses for voice search
        })

        return {
            transcript: cleanedQuery,
            ...results,
        }
    }
}

export default new SearchService()
