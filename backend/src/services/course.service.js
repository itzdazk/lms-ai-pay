// src/services/course.service.js
import { prisma } from '../config/database.config.js'
import { Prisma } from '@prisma/client'
import { COURSE_STATUS, HTTP_STATUS } from '../config/constants.js'
import logger from '../config/logger.config.js'
import config from '../config/app.config.js'
import redisCacheService from './redis-cache.service.js'

class CourseService {
    /**
     * Get courses with filters, search, sort and pagination (with semantic search support)
     */
    async getCourses(filters) {
        const {
            page,
            limit,
            search,
            categoryId,
            level,
            minPrice,
            maxPrice,
            isFeatured,
            instructorId,
            sort,
            tagId,
            tagIds,
        } = filters

        const otherFilters = {
            categoryId,
            level,
            minPrice,
            maxPrice,
            isFeatured,
            instructorId,
            sort,
            tagId,
            tagIds,
        }

        // Short queries (< 3 chars): use keyword search only (faster)
        if (!search || search.trim().length < 3) {
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
                        search
                    )

                    let courses = []

                    if (cachedCourses) {
                        courses = cachedCourses
                        logger.debug(
                            `Course Search (RAG): Using Redis cache for query: ${search.substring(0, 50)}`
                        )
                    } else {
                        // Use hybrid search (vector + keyword) if enabled
                        if (config.RAG_HYBRID_SEARCH !== false) {
                            logger.debug(
                                `Course Search (RAG Hybrid): Searching with vector + keyword`
                            )
                            courses = await vectorSearchService.hybridSearch(
                                search,
                                {
                                    limit: limit * 3, // Get more for filtering
                                    threshold:
                                        config.RAG_SIMILARITY_THRESHOLD || 0.7,
                                }
                            )
                        } else {
                            // Pure vector search
                            logger.debug(
                                `Course Search (RAG Vector): Searching with vector only`
                            )
                            courses = await vectorSearchService.searchCoursesByVector(
                                search,
                                {
                                    limit: limit * 3,
                                    status: 'PUBLISHED',
                                }
                            )
                        }

                        // Cache results in Redis (async, non-blocking)
                        if (courses.length > 0) {
                            redisCacheService
                                .cacheAdvisorSearch(search, courses)
                                .catch((err) => {
                                    logger.warn(
                                        'Failed to cache course search results in Redis',
                                        err.message
                                    )
                                })
                        }
                    }

                    // If no results, try fallback to keyword search
                    if (courses.length === 0) {
                        logger.debug(
                            `Course Search (RAG): No vector results, falling back to keyword search`
                        )
                        return await this._keywordSearchCourses(filters)
                    }

                    // Apply other filters (category, level, price, tags, instructor)
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
     * Keyword search courses (original implementation)
     * @private
     */
    async _keywordSearchCourses(filters) {
        const {
            page,
            limit,
            search,
            categoryId,
            level,
            minPrice,
            maxPrice,
            isFeatured,
            instructorId,
            sort,
            tagId,
            tagIds,
        } = filters

        const skip = (page - 1) * limit

        // Build where clause
        const where = {
            status: COURSE_STATUS.PUBLISHED,
        }

        // Support multiple tagIds (preferred) or single tagId (legacy)
        if (tagIds && tagIds.length > 0) {
            // AND logic: course must have ALL selected tags
            // For each tagId, there must be at least one courseTag with that tagId
            const tagIdsInt = tagIds.map((id) => parseInt(id, 10))
            where.AND = tagIdsInt.map((tid) => ({
                courseTags: {
                    some: {
                        tagId: tid,
                    },
                },
            }))
        } else if (tagId) {
            // Legacy support: single tagId
            where.courseTags = {
                some: {
                    tagId: parseInt(tagId, 10),
                },
            }
        }

        // Search in title, description, short description, and instructor name
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { shortDescription: { contains: search, mode: 'insensitive' } },
                {
                    instructor: {
                        fullName: { contains: search, mode: 'insensitive' },
                    },
                },
            ]
        }

        // Filter by category
        if (categoryId) {
            where.categoryId = parseInt(categoryId)
        }

        // Filter by level
        if (level) {
            where.level = level
        }

        // Filter by price range
        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {}
            if (minPrice !== undefined) {
                where.price.gte = parseFloat(minPrice)
            }
            if (maxPrice !== undefined) {
                where.price.lte = parseFloat(maxPrice)
            }
        }

        // Filter by featured
        if (isFeatured !== undefined) {
            where.isFeatured = isFeatured === 'true' || isFeatured === true
        }

        // Filter by instructor
        if (instructorId) {
            where.instructorId = parseInt(instructorId)
        }

        // Build orderBy clause
        let orderBy = {}
        switch (sort) {
            case 'popular':
                orderBy = { enrolledCount: 'desc' }
                break
            case 'rating':
                orderBy = { ratingAvg: 'desc' }
                break
            case 'price_asc':
                orderBy = { price: 'asc' }
                break
            case 'price_desc':
                orderBy = { price: 'desc' }
                break
            case 'newest':
            default:
                // For newest: use COALESCE(publishedAt, createdAt) to prioritize publishedAt
                // If publishedAt is null, fallback to createdAt
                // This ensures published courses are sorted by publish date,
                // while newly created (unpublished) courses are sorted by creation date
                // We'll use raw query for this specific case to handle COALESCE
                break
        }

        // Execute query
        let courses, total
        if (sort === 'newest' || !sort) {
            // For newest sort, we need to use a workaround since Prisma doesn't support
            // COALESCE in orderBy directly. We'll fetch courses and sort them in memory
            // OR use a simpler approach: sort by publishedAt first, then createdAt
            // But to properly handle COALESCE, we need to fetch all matching courses first
            // then sort and paginate. This is not ideal for performance but works correctly.

            // First, get all matching course IDs with proper sorting using raw query
            // We'll use Prisma.sql for safe parameterized queries
            // Handle tagIds filter - course must have ALL selected tags (AND logic)
            const tagFilter =
                tagIds && tagIds.length > 0
                    ? Prisma.sql`AND c.id IN (
                    SELECT ct.course_id 
                    FROM course_tags ct 
                    WHERE ct.tag_id IN (${Prisma.join(tagIds.map((id) => parseInt(id, 10)))})
                    GROUP BY ct.course_id
                    HAVING COUNT(DISTINCT ct.tag_id) = ${tagIds.length}
                )`
                    : tagId
                      ? Prisma.sql`AND EXISTS (
                    SELECT 1 FROM course_tags ct 
                    WHERE ct.course_id = c.id 
                    AND ct.tag_id = ${parseInt(tagId, 10)}
                )`
                      : Prisma.empty

            const searchFilter = search
                ? Prisma.sql`AND (
                    c.title ILIKE ${`%${search}%`} 
                    OR c.description ILIKE ${`%${search}%`} 
                    OR c.short_description ILIKE ${`%${search}%`}
                    OR EXISTS (
                        SELECT 1 FROM users u 
                        WHERE u.id = c.instructor_id 
                        AND u.full_name ILIKE ${`%${search}%`}
                    )
                )`
                : Prisma.empty

            const categoryFilter = categoryId
                ? Prisma.sql`AND c.category_id = ${parseInt(categoryId, 10)}`
                : Prisma.empty

            const levelFilter = level
                ? Prisma.sql`AND c.level = ${level}`
                : Prisma.empty

            const minPriceFilter =
                minPrice !== undefined
                    ? Prisma.sql`AND c.price >= ${parseFloat(minPrice)}`
                    : Prisma.empty

            const maxPriceFilter =
                maxPrice !== undefined
                    ? Prisma.sql`AND c.price <= ${parseFloat(maxPrice)}`
                    : Prisma.empty

            const featuredFilter =
                isFeatured !== undefined
                    ? Prisma.sql`AND c.is_featured = ${isFeatured === 'true' || isFeatured === true}`
                    : Prisma.empty

            const instructorFilter = instructorId
                ? Prisma.sql`AND c.instructor_id = ${parseInt(instructorId, 10)}`
                : Prisma.empty

            // Get course IDs with proper sorting
            const courseIdsResult = await prisma.$queryRaw`
                SELECT c.id
                FROM courses c
                WHERE c.status = ${COURSE_STATUS.PUBLISHED}
                    ${searchFilter}
                    ${categoryFilter}
                    ${levelFilter}
                    ${minPriceFilter}
                    ${maxPriceFilter}
                    ${featuredFilter}
                    ${instructorFilter}
                    ${tagFilter}
                ORDER BY COALESCE(c.published_at, c.created_at) DESC
                LIMIT ${limit} OFFSET ${skip}
            `

            const courseIds = courseIdsResult.map((row) => row.id)

            // Get total count
            const countResult = await prisma.$queryRaw`
                SELECT COUNT(*) as count
                FROM courses c
                WHERE c.status = ${COURSE_STATUS.PUBLISHED}
                    ${searchFilter}
                    ${categoryFilter}
                    ${levelFilter}
                    ${minPriceFilter}
                    ${maxPriceFilter}
                    ${featuredFilter}
                    ${instructorFilter}
                    ${tagFilter}
            `
            total = Number(countResult[0].count)

            // Fetch full course data with relations
            if (courseIds.length > 0) {
                courses = await prisma.course.findMany({
                    where: {
                        id: { in: courseIds },
                    },
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
                })

                // Sort courses to match the order from raw query
                const courseMap = new Map(courses.map((c) => [c.id, c]))
                courses = courseIds
                    .map((id) => courseMap.get(id))
                    .filter((c) => c !== undefined)
            } else {
                courses = []
            }
        } else {
            // Use normal Prisma query for other sorts
            const result = await Promise.all([
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
            courses = result[0]
            total = result[1]
        }

        // Thêm transform để format tags
        const coursesWithTags = courses.map((course) => ({
            ...course,
            tags: course.courseTags?.map((ct) => ct.tag) || [],
            // Remove courseTags to keep response clean
            courseTags: undefined,
        }))

        return {
            courses: coursesWithTags,
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
        if (filters.categoryId) {
            const categoryId = parseInt(filters.categoryId)
            filtered = filtered.filter(
                (c) => c.categoryId === categoryId || c.category?.id === categoryId
            )
        }

        // Filter by level
        if (filters.level) {
            filtered = filtered.filter((c) => c.level === filters.level)
        }

        // Filter by price range
        if (filters.minPrice !== undefined) {
            filtered = filtered.filter(
                (c) => parseFloat(c.price || 0) >= parseFloat(filters.minPrice)
            )
        }
        if (filters.maxPrice !== undefined) {
            filtered = filtered.filter(
                (c) => parseFloat(c.price || 0) <= parseFloat(filters.maxPrice)
            )
        }

        // Filter by featured
        if (filters.isFeatured !== undefined) {
            const isFeatured = filters.isFeatured === 'true' || filters.isFeatured === true
            filtered = filtered.filter((c) => c.isFeatured === isFeatured)
        }

        // Filter by instructor
        if (filters.instructorId) {
            const instructorId = parseInt(filters.instructorId)
            filtered = filtered.filter(
                (c) => c.instructorId === instructorId || c.instructor?.id === instructorId
            )
        }

        // Filter by tags (requires DB query to check tag relationships)
        if (filters.tagIds && filters.tagIds.length > 0) {
            const tagIdsInt = filters.tagIds.map((id) => parseInt(id, 10))
            const courseIds = filtered.map((c) => c.id)

            // Query DB to check which courses have ALL specified tags (AND logic)
            const coursesWithTags = await prisma.course.findMany({
                where: {
                    id: { in: courseIds },
                    AND: tagIdsInt.map((tid) => ({
                        courseTags: {
                            some: {
                                tagId: tid,
                            },
                        },
                    })),
                },
                select: { id: true },
            })

            const validCourseIds = new Set(coursesWithTags.map((c) => c.id))
            filtered = filtered.filter((c) => validCourseIds.has(c.id))
        } else if (filters.tagId) {
            const tagId = parseInt(filters.tagId)
            const courseIds = filtered.map((c) => c.id)

            const coursesWithTags = await prisma.course.findMany({
                where: {
                    id: { in: courseIds },
                    courseTags: {
                        some: {
                            tagId: tagId,
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
            case 'popular':
                sorted.sort(
                    (a, b) => (b.enrolledCount || 0) - (a.enrolledCount || 0)
                )
                break
            case 'rating':
                sorted.sort(
                    (a, b) =>
                        parseFloat(b.ratingAvg || 0) -
                        parseFloat(a.ratingAvg || 0)
                )
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
     * Get featured courses
     * Sắp xếp: khóa học được đánh dấu nổi bật gần nhất lên đầu tiên
     */
    async getFeaturedCourses(limit = 10) {
        const courses = await prisma.course.findMany({
            where: {
                status: COURSE_STATUS.PUBLISHED,
                isFeatured: true,
            },
            take: limit,
            orderBy: [{ featuredAt: 'desc' }, { enrolledCount: 'desc' }, { ratingAvg: 'desc' }],
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
            },
        })

        return courses
    }

    /**
     * Get trending courses (based on recent enrollments and views)
     */
    async getTrendingCourses(limit = 10) {
        // Trending is determined by:
        // 1. High enrollment count
        // 2. High views count
        // 3. Recently published (last 3 months)
        const threeMonthsAgo = new Date()
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

        const courses = await prisma.course.findMany({
            where: {
                status: COURSE_STATUS.PUBLISHED,
                publishedAt: {
                    gte: threeMonthsAgo,
                },
            },
            take: limit,
            orderBy: [
                { viewsCount: 'desc' },
                { enrolledCount: 'desc' },
                { ratingAvg: 'desc' },
            ],
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
                viewsCount: true,
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
            },
        })

        return courses
    }

    /**
     * Get course by slug with full details
     */
    async getCourseBySlug(slug) {
        const course = await prisma.course.findUnique({
            where: { slug },
            select: {
                id: true,
                title: true,
                slug: true,
                description: true,
                shortDescription: true,
                thumbnailUrl: true,
                videoPreviewUrl: true,
                videoPreviewDuration: true,
                price: true,
                discountPrice: true,
                level: true,
                durationHours: true,
                totalLessons: true,
                language: true,
                requirements: true,
                whatYouLearn: true,
                courseObjectives: true,
                targetAudience: true,
                status: true,
                isFeatured: true,
                ratingAvg: true,
                ratingCount: true,
                enrolledCount: true,
                viewsCount: true,
                completionRate: true,
                publishedAt: true,
                createdAt: true,
                updatedAt: true,
                instructor: {
                    select: {
                        id: true,
                        userName: true,
                        fullName: true,
                        avatarUrl: true,
                        bio: true,
                    },
                },
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        description: true,
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
                _count: {
                    select: {
                        lessons: {
                            where: {
                                isPublished: true,
                            },
                        },
                        enrollments: true,
                    },
                },
            },
        })

        if (!course) {
            const error = new Error('Không tìm thấy khóa học')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Only return published courses
        if (course.status !== COURSE_STATUS.PUBLISHED) {
            throw new Error('Khóa học không khả dụng')
        }

        // Format tags
        const formattedCourse = {
            ...course,
            tags: course.courseTags.map((ct) => ct.tag),
            lessonsCount: course._count.lessons,
            enrollmentsCount: course._count.enrollments,
        }

        // Remove internal fields
        delete formattedCourse.courseTags
        delete formattedCourse._count

        return formattedCourse
    }

    /**
     * Get course by ID with full details
     */
    async getCourseById(courseId) {
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                id: true,
                title: true,
                slug: true,
                description: true,
                shortDescription: true,
                thumbnailUrl: true,
                videoPreviewUrl: true,
                videoPreviewDuration: true,
                price: true,
                discountPrice: true,
                level: true,
                durationHours: true,
                totalLessons: true,
                language: true,
                requirements: true,
                whatYouLearn: true,
                courseObjectives: true,
                targetAudience: true,
                status: true,
                isFeatured: true,
                ratingAvg: true,
                ratingCount: true,
                enrolledCount: true,
                viewsCount: true,
                completionRate: true,
                publishedAt: true,
                createdAt: true,
                updatedAt: true,
                instructor: {
                    select: {
                        id: true,
                        userName: true,
                        fullName: true,
                        avatarUrl: true,
                        bio: true,
                    },
                },
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        description: true,
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
                _count: {
                    select: {
                        lessons: {
                            where: {
                                isPublished: true,
                            },
                        },
                        enrollments: true,
                    },
                },
            },
        })

        if (!course) {
            const error = new Error('Không tìm thấy khóa học')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Only return published courses or provide limited info for unpublished
        if (course.status !== COURSE_STATUS.PUBLISHED) {
            throw new Error('Khóa học không khả dụng')
        }

        // Format tags
        const formattedCourse = {
            ...course,
            tags: course.courseTags.map((ct) => ct.tag),
            lessonsCount: course._count.lessons,
            enrollmentsCount: course._count.enrollments,
        }

        // Remove internal fields
        delete formattedCourse.courseTags
        delete formattedCourse._count

        return formattedCourse
    }

    /**
     * Get course lessons (with preview check)
     */
    async getCourseLessons(courseId) {
        // Check if course exists and is published
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                id: true,
                title: true,
                status: true,
            },
        })

        if (!course) {
            const error = new Error('Không tìm thấy khóa học')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        if (course.status !== COURSE_STATUS.PUBLISHED) {
            throw new Error('Khóa học không khả dụng')
        }

        // Get lessons (only published lessons, and only preview or basic info)
        const lessons = await prisma.lesson.findMany({
            where: {
                courseId,
                isPublished: true,
            },
            orderBy: {
                lessonOrder: 'asc',
            },
            select: {
                id: true,
                title: true,
                slug: true,
                description: true,
                videoDuration: true,
                lessonOrder: true,
                isPreview: true,
                // Don't include videoUrl, content, transcriptUrl for non-enrolled users
            },
        })

        return {
            course: {
                id: course.id,
                title: course.title,
            },
            lessons,
            totalLessons: lessons.length,
        }
    }

    /**
     * Get course instructor details
     */
    async getCourseInstructor(courseId) {
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                id: true,
                title: true,
                status: true,
                instructor: {
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
                },
            },
        })

        if (!course) {
            const error = new Error('Không tìm thấy khóa học')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        if (course.status !== COURSE_STATUS.PUBLISHED) {
            throw new Error('Khóa học không khả dụng')
        }

        // Get instructor's other courses
        const otherCourses = await prisma.course.findMany({
            where: {
                instructorId: course.instructor.id,
                status: COURSE_STATUS.PUBLISHED,
                NOT: {
                    id: courseId,
                },
            },
            take: 5,
            orderBy: {
                publishedAt: 'desc',
            },
            select: {
                id: true,
                title: true,
                slug: true,
                thumbnailUrl: true,
                price: true,
                discountPrice: true,
                ratingAvg: true,
                ratingCount: true,
                enrolledCount: true,
            },
        })

        const instructor = {
            ...course.instructor,
            totalCourses: course.instructor._count.coursesAsInstructor,
            otherCourses,
        }

        // Remove _count field
        delete instructor._count

        return instructor
    }

    /**
     * Increment course view count
     */
    async incrementViewCount(courseId) {
        // Check if course exists and is published
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                id: true,
                status: true,
                viewsCount: true,
            },
        })

        if (!course) {
            const error = new Error('Không tìm thấy khóa học')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        if (course.status !== COURSE_STATUS.PUBLISHED) {
            throw new Error('Khóa học không khả dụng')
        }

        // Increment view count
        const updatedCourse = await prisma.course.update({
            where: { id: courseId },
            data: {
                viewsCount: {
                    increment: 1,
                },
            },
            select: {
                id: true,
                viewsCount: true,
            },
        })

        return updatedCourse
    }

    /**
     * Get course counts by level
     */
    async getCourseCountsByLevel() {
        const counts = await prisma.course.groupBy({
            by: ['level'],
            where: {
                status: COURSE_STATUS.PUBLISHED,
            },
            _count: {
                id: true,
            },
        })

        // Format response
        const levelCounts = {
            BEGINNER: 0,
            INTERMEDIATE: 0,
            ADVANCED: 0,
        }

        counts.forEach((item) => {
            if (item.level && levelCounts.hasOwnProperty(item.level)) {
                levelCounts[item.level] = item._count.id
            }
        })

        return levelCounts
    }

    /**
     * Get course counts by price type (free, paid)
     */
    async getCourseCountsByPrice() {
        const [freeCount, paidCount] = await Promise.all([
            prisma.course.count({
                where: {
                    status: COURSE_STATUS.PUBLISHED,
                    price: {
                        lte: 0,
                    },
                },
            }),
            prisma.course.count({
                where: {
                    status: COURSE_STATUS.PUBLISHED,
                    price: {
                        gt: 0,
                    },
                },
            }),
        ])

        return {
            free: freeCount,
            paid: paidCount,
        }
    }
}

export default new CourseService()
