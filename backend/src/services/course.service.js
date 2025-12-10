// src/services/course.service.js
import { prisma } from '../config/database.config.js'
import {
    COURSE_STATUS,
    COURSE_LEVEL,
    HTTP_STATUS,
} from '../config/constants.js'
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

        // Thêm transform để format tags
        const coursesWithTags = courses.map((course) => ({
            ...course,
            tags: course.courseTags?.map((ct) => ct.tag) || [],
            // Remove courseTags to keep response clean
            courseTags: undefined,
        }))

        logger.info(`Retrieved ${coursesWithTags.length} courses`)

        return {
            courses: coursesWithTags,
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

        logger.info(`Retrieved ${courses.length} featured courses`)

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

        logger.info(`Retrieved ${courses.length} trending courses`)

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
            const error = new Error('Course not found')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Only return published courses
        if (course.status !== COURSE_STATUS.PUBLISHED) {
            throw new Error('Course is not available')
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

        logger.info(
            `Retrieved course details by slug: ${course.title} (slug: ${slug})`
        )

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
            const error = new Error('Course not found')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Only return published courses or provide limited info for unpublished
        if (course.status !== COURSE_STATUS.PUBLISHED) {
            throw new Error('Course is not available')
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

        logger.info(
            `Retrieved course details: ${course.title} (ID: ${course.id})`
        )

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
            const error = new Error('Course not found')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        if (course.status !== COURSE_STATUS.PUBLISHED) {
            throw new Error('Course is not available')
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

        logger.info(
            `Retrieved ${lessons.length} lessons for course ID: ${courseId}`
        )

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
            const error = new Error('Course not found')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        if (course.status !== COURSE_STATUS.PUBLISHED) {
            throw new Error('Course is not available')
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

        logger.info(`Retrieved instructor details for course ID: ${courseId}`)

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
            const error = new Error('Course not found')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        if (course.status !== COURSE_STATUS.PUBLISHED) {
            throw new Error('Course is not available')
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

        logger.info(
            `Incremented view count for course ID: ${courseId}. New count: ${updatedCourse.viewsCount}`
        )

        return updatedCourse
    }
}

export default new CourseService()
