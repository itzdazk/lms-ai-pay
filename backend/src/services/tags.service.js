// src/services/tags.service.js
import { prisma } from '../config/database.config.js'
import { COURSE_STATUS, HTTP_STATUS } from '../config/constants.js'
import logger from '../config/logger.config.js'

class TagsService {
    /**
     * Get tags list with pagination and search
     */
    async getTags(query) {
        const { page = 1, limit = 20, search } = query

        // Parse page and limit to integers
        const pageNum = parseInt(page, 10) || 1
        const limitNum = parseInt(limit, 10) || 20
        const skip = (pageNum - 1) * limitNum

        // Build where clause
        const where = {}

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ]
        }

        // Get tags and total count
        const [tags, total] = await Promise.all([
            prisma.tag.findMany({
                where,
                skip,
                take: limitNum,
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    description: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.tag.count({ where }),
        ])

        // Get published courses count for each tag
        const tagsWithCounts = await Promise.all(
            tags.map(async (tag) => {
                const publishedCoursesCount = await prisma.course.count({
                    where: {
                        status: COURSE_STATUS.PUBLISHED,
                        courseTags: {
                            some: {
                                tagId: tag.id,
                            },
                        },
                    },
                })

                return {
                    ...tag,
                    _count: {
                        courses: publishedCoursesCount,
                    },
                }
            })
        )

        return {
            tags: tagsWithCounts,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        }
    }

    /**
     * Get tag by ID
     */
    async getTagById(tagId) {
        const tag = await prisma.tag.findUnique({
            where: { id: tagId },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                createdAt: true,
            },
        })

        if (!tag) {
            const error = new Error('Tag not found')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Get published courses count
        const publishedCoursesCount = await prisma.course.count({
            where: {
                status: COURSE_STATUS.PUBLISHED,
                courseTags: {
                    some: {
                        tagId: tag.id,
                    },
                },
            },
        })

        return {
            ...tag,
            _count: {
                courses: publishedCoursesCount,
            },
        }
    }

    /**
     * Get courses by tag ID
     */
    async getTagCourses(tagId, query) {
        // Check if tag exists
        const tag = await prisma.tag.findUnique({
            where: { id: tagId },
            select: { id: true, name: true },
        })

        if (!tag) {
            const error = new Error('Tag not found')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        const { page = 1, limit = 20, level, sort = 'newest' } = query

        // Parse page and limit to integers
        const pageNum = parseInt(page, 10) || 1
        const limitNum = parseInt(limit, 10) || 20
        const skip = (pageNum - 1) * limitNum

        // Build where clause
        const where = {
            status: COURSE_STATUS.PUBLISHED,
            courseTags: {
                some: {
                    tagId: tagId,
                },
            },
        }

        if (level) {
            where.level = level
        }

        // Build orderBy
        let orderBy = {}
        switch (sort) {
            case 'newest':
                orderBy = { createdAt: 'desc' }
                break
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
            default:
                orderBy = { createdAt: 'desc' }
        }

        // Get courses and total count
        const [courses, total] = await Promise.all([
            prisma.course.findMany({
                where,
                skip,
                take: limitNum,
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    description: true,
                    shortDescription: true,
                    thumbnailUrl: true,
                    price: true,
                    discountPrice: true,
                    level: true,
                    ratingAvg: true,
                    ratingCount: true,
                    enrolledCount: true,
                    viewsCount: true,
                    createdAt: true,
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
                orderBy,
            }),
            prisma.course.count({ where }),
        ])

        return {
            tag: {
                id: tag.id,
                name: tag.name,
            },
            courses,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        }
    }

    /**
     * Create new tag
     */
    async createTag(data) {
        const { name, slug, description } = data

        // Check if slug already exists
        const existingTag = await prisma.tag.findUnique({
            where: { slug },
        })

        if (existingTag) {
            const error = new Error('Tag with this slug already exists')
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }

        // Check if name already exists
        const existingTagByName = await prisma.tag.findUnique({
            where: { name },
        })

        if (existingTagByName) {
            const error = new Error('Tag with this name already exists')
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }

        const tag = await prisma.tag.create({
            data: {
                name,
                slug,
                description,
            },
        })

        logger.info(`Tag created: ${tag.name} (ID: ${tag.id})`)

        return tag
    }

    /**
     * Update tag
     */
    async updateTag(tagId, updateData) {
        // Check if tag exists
        const existingTag = await prisma.tag.findUnique({
            where: { id: tagId },
        })

        if (!existingTag) {
            const error = new Error('Tag not found')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // If slug is being updated, check for uniqueness
        if (updateData.slug && updateData.slug !== existingTag.slug) {
            const slugExists = await prisma.tag.findUnique({
                where: { slug: updateData.slug },
            })

            if (slugExists) {
                const error = new Error('Tag with this slug already exists')
                error.statusCode = HTTP_STATUS.BAD_REQUEST
                throw error
            }
        }

        // If name is being updated, check for uniqueness
        if (updateData.name && updateData.name !== existingTag.name) {
            const nameExists = await prisma.tag.findUnique({
                where: { name: updateData.name },
            })

            if (nameExists) {
                const error = new Error('Tag with this name already exists')
                error.statusCode = HTTP_STATUS.BAD_REQUEST
                throw error
            }
        }

        const tag = await prisma.tag.update({
            where: { id: tagId },
            data: updateData,
        })

        logger.info(`Tag updated: ${tag.name} (ID: ${tag.id})`)

        return tag
    }

    /**
     * Delete tag
     */
    async deleteTag(tagId) {
        // Check if tag exists
        const tag = await prisma.tag.findUnique({
            where: { id: tagId },
            include: {
                _count: {
                    select: {
                        courses: true,
                    },
                },
            },
        })

        if (!tag) {
            const error = new Error('Tag not found')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Note: We allow deleting tags even if they have courses
        // The relationship will be handled by cascade or manual cleanup
        // If you want to prevent deletion, uncomment below:
        // if (tag._count.courses > 0) {
        //     throw new Error(
        //         `Cannot delete tag with ${tag._count.courses} courses. Please remove tag from courses first.`
        //     )
        // }

        await prisma.tag.delete({
            where: { id: tagId },
        })

        logger.info(`Tag deleted: ${tag.name} (ID: ${tag.id})`)

        return true
    }
}

export default new TagsService()
