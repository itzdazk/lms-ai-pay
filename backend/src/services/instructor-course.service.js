// src/services/instructor-course.service.js
import { prisma } from '../config/database.config.js'
import { COURSE_STATUS, COURSE_LEVEL, USER_ROLES } from '../config/constants.js'
import logger from '../config/logger.config.js'
import slugify from '../utils/slugify.util.js'

class InstructorCourseService {
    /**
     * Get all courses of an instructor with filters and pagination
     * @param {number} instructorId - Instructor user ID
     * @param {object} filters - Filters and pagination options
     * @returns {Promise<{courses: Array, total: number}>}
     */
    async getInstructorCourses(instructorId, filters) {
        const {
            page = 1,
            limit = 20,
            search,
            status,
            categoryId,
            level,
            sort = 'newest',
        } = filters

        const skip = (page - 1) * limit

        // Build where clause
        const where = {
            instructorId,
        }

        // Filter by search term
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { shortDescription: { contains: search, mode: 'insensitive' } },
            ]
        }

        // Filter by status
        if (status) {
            where.status = status
        }

        // Filter by category
        if (categoryId) {
            where.categoryId = parseInt(categoryId)
        }

        // Filter by level
        if (level) {
            where.level = level
        }

        // Build orderBy clause
        let orderBy = {}
        switch (sort) {
            case 'oldest':
                orderBy = { createdAt: 'asc' }
                break
            case 'updated':
                orderBy = { updatedAt: 'desc' }
                break
            case 'popular':
                orderBy = { enrolledCount: 'desc' }
                break
            case 'rating':
                orderBy = { ratingAvg: 'desc' }
                break
            case 'newest':
            default:
                orderBy = { createdAt: 'desc' }
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
                    status: true,
                    durationHours: true,
                    totalLessons: true,
                    ratingAvg: true,
                    ratingCount: true,
                    enrolledCount: true,
                    viewsCount: true,
                    isFeatured: true,
                    publishedAt: true,
                    createdAt: true,
                    updatedAt: true,
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                    _count: {
                        select: {
                            lessons: true,
                            enrollments: true,
                        },
                    },
                },
            }),
            prisma.course.count({ where }),
        ])

        logger.info(
            `Instructor ${instructorId} retrieved ${courses.length} courses`
        )

        return {
            courses: courses.map((course) => ({
                ...course,
                lessonsCount: course._count.lessons,
                enrollmentsCount: course._count.enrollments,
                _count: undefined,
            })),
            total,
        }
    }

    /**
     * Create a new course
     * @param {number} instructorId - Instructor user ID
     * @param {object} data - Course data
     * @returns {Promise<object>} Created course
     */
    async createCourse(instructorId, data) {
        const {
            title,
            slug,
            description,
            shortDescription,
            thumbnailUrl,
            videoPreviewUrl,
            videoPreviewDuration,
            price,
            discountPrice,
            categoryId,
            level,
            durationHours,
            language,
            requirements,
            whatYouLearn,
            courseObjectives,
            targetAudience,
            status = COURSE_STATUS.DRAFT,
            isFeatured = false,
            tags = [], // Array of tag IDs
        } = data

        // Generate slug if not provided
        const courseSlug = slug || slugify(title)

        // Check if slug already exists
        const existingCourse = await prisma.course.findUnique({
            where: { slug: courseSlug },
        })

        if (existingCourse) {
            throw new Error('Course with this slug already exists')
        }

        // Verify category exists
        const category = await prisma.category.findUnique({
            where: { id: parseInt(categoryId) },
        })

        if (!category) {
            throw new Error('Category not found')
        }

        // Create course with tags
        const course = await prisma.course.create({
            data: {
                title,
                slug: courseSlug,
                description,
                shortDescription,
                thumbnailUrl,
                videoPreviewUrl,
                videoPreviewDuration: videoPreviewDuration
                    ? parseInt(videoPreviewDuration)
                    : null,
                price: parseFloat(price || 0),
                discountPrice: discountPrice ? parseFloat(discountPrice) : null,
                instructorId,
                categoryId: parseInt(categoryId),
                level: level || COURSE_LEVEL.BEGINNER,
                durationHours: durationHours ? parseInt(durationHours) : 0,
                language: language || 'vi',
                requirements,
                whatYouLearn,
                courseObjectives,
                targetAudience,
                status,
                isFeatured,
                publishedAt:
                    status === COURSE_STATUS.PUBLISHED ? new Date() : null,
                // Create tag associations if tags provided
                ...(tags.length > 0 && {
                    courseTags: {
                        create: tags.map((tagId) => ({
                            tagId: parseInt(tagId),
                        })),
                    },
                }),
            },
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
                status: true,
                durationHours: true,
                language: true,
                requirements: true,
                whatYouLearn: true,
                courseObjectives: true,
                targetAudience: true,
                isFeatured: true,
                publishedAt: true,
                createdAt: true,
                updatedAt: true,
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

        logger.info(
            `Instructor ${instructorId} created course: ${course.title} (ID: ${course.id})`
        )

        // Format response
        return {
            ...course,
            tags: course.courseTags.map((ct) => ct.tag),
            courseTags: undefined,
        }
    }

    /**
     * Update a course
     * @param {number} courseId - Course ID
     * @param {number} instructorId - Instructor user ID
     * @param {object} data - Course data to update
     * @returns {Promise<object>} Updated course
     */
    async updateCourse(courseId, instructorId, data) {
        // Check if course exists and belongs to instructor
        const existingCourse = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                id: true,
                instructorId: true,
                slug: true,
                status: true,
            },
        })

        if (!existingCourse) {
            throw new Error('Course not found')
        }

        if (existingCourse.instructorId !== instructorId) {
            throw new Error('You do not have permission to update this course')
        }

        const {
            title,
            slug,
            description,
            shortDescription,
            thumbnailUrl,
            videoPreviewUrl,
            videoPreviewDuration,
            price,
            discountPrice,
            categoryId,
            level,
            durationHours,
            totalLessons,
            language,
            requirements,
            whatYouLearn,
            courseObjectives,
            targetAudience,
            isFeatured,
            tags, // Array of tag IDs to replace existing tags
        } = data

        // Build update data
        const updateData = {}

        if (title !== undefined) updateData.title = title
        if (description !== undefined) updateData.description = description
        if (shortDescription !== undefined)
            updateData.shortDescription = shortDescription
        if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl
        if (videoPreviewUrl !== undefined)
            updateData.videoPreviewUrl = videoPreviewUrl
        if (videoPreviewDuration !== undefined)
            updateData.videoPreviewDuration = parseInt(videoPreviewDuration)
        if (price !== undefined) updateData.price = parseFloat(price)
        if (discountPrice !== undefined)
            updateData.discountPrice =
                discountPrice !== null ? parseFloat(discountPrice) : null
        if (categoryId !== undefined)
            updateData.categoryId = parseInt(categoryId)
        if (level !== undefined) updateData.level = level
        if (durationHours !== undefined)
            updateData.durationHours = parseInt(durationHours)
        if (totalLessons !== undefined)
            updateData.totalLessons = parseInt(totalLessons)
        if (language !== undefined) updateData.language = language
        if (requirements !== undefined) updateData.requirements = requirements
        if (whatYouLearn !== undefined) updateData.whatYouLearn = whatYouLearn
        if (courseObjectives !== undefined)
            updateData.courseObjectives = courseObjectives
        if (targetAudience !== undefined)
            updateData.targetAudience = targetAudience
        if (isFeatured !== undefined) updateData.isFeatured = isFeatured

        // Handle slug update
        if (slug !== undefined && slug !== existingCourse.slug) {
            const newSlug = slugify(slug)
            const slugExists = await prisma.course.findUnique({
                where: { slug: newSlug },
            })

            if (slugExists) {
                throw new Error('Course with this slug already exists')
            }

            updateData.slug = newSlug
        }

        // Verify category if provided
        if (categoryId !== undefined) {
            const category = await prisma.category.findUnique({
                where: { id: parseInt(categoryId) },
            })

            if (!category) {
                throw new Error('Category not found')
            }
        }

        // Update course
        const course = await prisma.course.update({
            where: { id: courseId },
            data: updateData,
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
                status: true,
                durationHours: true,
                totalLessons: true,
                language: true,
                requirements: true,
                whatYouLearn: true,
                courseObjectives: true,
                targetAudience: true,
                isFeatured: true,
                enrolledCount: true,
                viewsCount: true,
                ratingAvg: true,
                ratingCount: true,
                publishedAt: true,
                createdAt: true,
                updatedAt: true,
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

        // Update tags if provided
        if (tags !== undefined && Array.isArray(tags)) {
            // Delete existing tags
            await prisma.courseTag.deleteMany({
                where: { courseId },
            })

            // Create new tag associations
            if (tags.length > 0) {
                await prisma.courseTag.createMany({
                    data: tags.map((tagId) => ({
                        courseId,
                        tagId: parseInt(tagId),
                    })),
                })
            }

            // Fetch updated tags
            const updatedCourseTags = await prisma.courseTag.findMany({
                where: { courseId },
                select: {
                    tag: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                },
            })

            course.courseTags = updatedCourseTags
        }

        logger.info(
            `Instructor ${instructorId} updated course: ${course.title} (ID: ${courseId})`
        )

        // Format response
        return {
            ...course,
            tags: course.courseTags.map((ct) => ct.tag),
            courseTags: undefined,
        }
    }

    /**
     * Delete a course
     * @param {number} courseId - Course ID
     * @param {number} instructorId - Instructor user ID
     * @returns {Promise<boolean>}
     */
    async deleteCourse(courseId, instructorId) {
        // Check if course exists and belongs to instructor
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                id: true,
                title: true,
                instructorId: true,
                _count: {
                    select: {
                        enrollments: true,
                    },
                },
            },
        })

        if (!course) {
            throw new Error('Course not found')
        }

        if (course.instructorId !== instructorId) {
            throw new Error('You do not have permission to delete this course')
        }

        // Check if course has enrollments
        if (course._count.enrollments > 0) {
            throw new Error(
                'Cannot delete course with active enrollments. Please archive it instead.'
            )
        }

        // Delete course (cascade will handle related records)
        await prisma.course.delete({
            where: { id: courseId },
        })

        logger.info(
            `Instructor ${instructorId} deleted course: ${course.title} (ID: ${courseId})`
        )

        return true
    }

    /**
     * Change course status
     * @param {number} courseId - Course ID
     * @param {number} instructorId - Instructor user ID
     * @param {string} status - New status (draft, published, archived)
     * @returns {Promise<object>} Updated course
     */
    async changeCourseStatus(courseId, instructorId, status) {
        // Validate status
        if (!Object.values(COURSE_STATUS).includes(status)) {
            throw new Error('Invalid status')
        }

        // Check if course exists and belongs to instructor
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                id: true,
                title: true,
                instructorId: true,
                status: true,
                publishedAt: true,
                _count: {
                    select: {
                        lessons: {
                            where: {
                                isPublished: true,
                            },
                        },
                    },
                },
            },
        })

        if (!course) {
            throw new Error('Course not found')
        }

        if (course.instructorId !== instructorId) {
            throw new Error(
                'You do not have permission to change this course status'
            )
        }

        // Validate publishing requirements
        if (status === COURSE_STATUS.PUBLISHED) {
            if (course._count.lessons === 0) {
                throw new Error(
                    'Cannot publish course without any published lessons'
                )
            }

            // Additional validation can be added here
            // e.g., check if course has description, thumbnail, etc.
        }

        // Update status
        const updateData = {
            status,
        }

        // Set publishedAt timestamp when publishing for the first time
        if (status === COURSE_STATUS.PUBLISHED && !course.publishedAt) {
            updateData.publishedAt = new Date()
        }

        const updatedCourse = await prisma.course.update({
            where: { id: courseId },
            data: updateData,
            select: {
                id: true,
                title: true,
                slug: true,
                status: true,
                publishedAt: true,
                updatedAt: true,
            },
        })

        logger.info(
            `Instructor ${instructorId} changed status of course: ${course.title} (ID: ${courseId}) to ${status}`
        )

        return updatedCourse
    }

    /**
     * Get course statistics for instructor
     * @param {number} instructorId - Instructor user ID
     * @returns {Promise<object>} Course statistics
     */
    async getCourseStatistics(instructorId) {
        const [
            totalCourses,
            publishedCourses,
            draftCourses,
            archivedCourses,
            totalEnrollments,
            totalRevenue,
        ] = await Promise.all([
            // Total courses
            prisma.course.count({
                where: { instructorId },
            }),
            // Published courses
            prisma.course.count({
                where: {
                    instructorId,
                    status: COURSE_STATUS.PUBLISHED,
                },
            }),
            // Draft courses
            prisma.course.count({
                where: {
                    instructorId,
                    status: COURSE_STATUS.DRAFT,
                },
            }),
            // Archived courses
            prisma.course.count({
                where: {
                    instructorId,
                    status: COURSE_STATUS.ARCHIVED,
                },
            }),
            // Total enrollments
            prisma.enrollment.count({
                where: {
                    course: {
                        instructorId,
                    },
                },
            }),
            // Total revenue (from paid orders)
            prisma.order.aggregate({
                where: {
                    course: {
                        instructorId,
                    },
                    paymentStatus: 'PAID',
                },
                _sum: {
                    finalPrice: true,
                },
            }),
        ])

        return {
            totalCourses,
            publishedCourses,
            draftCourses,
            archivedCourses,
            totalEnrollments,
            totalRevenue: totalRevenue._sum.finalPrice || 0,
        }
    }

    /**
     * Upload course thumbnail
     * @param {number} courseId - Course ID
     * @param {number} instructorId - Instructor user ID
     * @param {string} thumbnailUrl - Thumbnail URL
     * @returns {Promise<object>} Updated course
     */
    async uploadThumbnail(courseId, instructorId, thumbnailUrl) {
        // Check if course exists and belongs to instructor
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                id: true,
                title: true,
                instructorId: true,
            },
        })

        if (!course) {
            throw new Error('Course not found')
        }

        if (course.instructorId !== instructorId) {
            throw new Error(
                'You do not have permission to update this course thumbnail'
            )
        }

        // Update thumbnail
        const updatedCourse = await prisma.course.update({
            where: { id: courseId },
            data: { thumbnailUrl },
            select: {
                id: true,
                title: true,
                thumbnailUrl: true,
                updatedAt: true,
            },
        })

        logger.info(
            `Instructor ${instructorId} updated thumbnail for course: ${course.title} (ID: ${courseId})`
        )

        return updatedCourse
    }

    /**
     * Upload course video preview
     * @param {number} courseId - Course ID
     * @param {number} instructorId - Instructor user ID
     * @param {object} videoData - Video preview data {videoPreviewUrl, videoPreviewDuration}
     * @returns {Promise<object>} Updated course
     */
    async uploadVideoPreview(courseId, instructorId, videoData) {
        const { videoPreviewUrl, videoPreviewDuration } = videoData

        // Check if course exists and belongs to instructor
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                id: true,
                title: true,
                instructorId: true,
            },
        })

        if (!course) {
            throw new Error('Course not found')
        }

        if (course.instructorId !== instructorId) {
            throw new Error(
                'You do not have permission to update this course video preview'
            )
        }

        // Update video preview
        const updatedCourse = await prisma.course.update({
            where: { id: courseId },
            data: {
                videoPreviewUrl,
                videoPreviewDuration: videoPreviewDuration
                    ? parseInt(videoPreviewDuration)
                    : null,
            },
            select: {
                id: true,
                title: true,
                videoPreviewUrl: true,
                videoPreviewDuration: true,
                updatedAt: true,
            },
        })

        logger.info(
            `Instructor ${instructorId} updated video preview for course: ${course.title} (ID: ${courseId})`
        )

        return updatedCourse
    }
}

export default new InstructorCourseService()
