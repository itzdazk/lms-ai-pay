// src/services/course.service.js
import { prisma } from '../config/database.config.js'
import { COURSE_STATUS, COURSE_LEVEL } from '../config/constants.js'
import logger from '../config/logger.config.js'

class CourseService {
    /**
     * Get courses with filters, search, sort and pagination
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
        } = filters

        const skip = (page - 1) * limit

        // Build where clause
        const where = {
            status: COURSE_STATUS.PUBLISHED,
        }

        // Search in title, description, short description
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { shortDescription: { contains: search, mode: 'insensitive' } },
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
                            username: true,
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
            }),
            prisma.course.count({ where }),
        ])

        logger.info(`Retrieved ${courses.length} courses`)

        return {
            courses,
            total,
        }
    }

    /**
     * Get featured courses
     */
    async getFeaturedCourses(limit = 10) {
        const courses = await prisma.course.findMany({
            where: {
                status: COURSE_STATUS.PUBLISHED,
                isFeatured: true,
            },
            take: limit,
            orderBy: [{ enrolledCount: 'desc' }, { ratingAvg: 'desc' }],
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
                        username: true,
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

        logger.info(`Retrieved ${courses.length} featured courses`)

        return courses
    }
}

export default new CourseService()
