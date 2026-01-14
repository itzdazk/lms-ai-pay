// backend/src/services/search.service.js
import { prisma } from '../config/database.config.js'
import {
    COURSE_STATUS,
    USER_STATUS,
    USER_ROLES,
    HTTP_STATUS,
} from '../config/constants.js'

class SearchService {
    /**
     * Search courses with advanced filters
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
     * Get search suggestions/autocomplete
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

        // Get course suggestions
        const courses = await prisma.course.findMany({
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
