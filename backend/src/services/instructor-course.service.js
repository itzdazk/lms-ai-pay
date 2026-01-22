// src/services/instructor-course.service.js
import { prisma } from '../config/database.config.js'
import {
    COURSE_STATUS,
    COURSE_LEVEL,
    USER_ROLES,
    ENROLLMENT_STATUS,
    PAYMENT_STATUS,
    HTTP_STATUS,
} from '../config/constants.js'
import logger from '../config/logger.config.js'
import slugify from '../utils/slugify.util.js'
import path from 'path'
import fs from 'fs'
import sharp from 'sharp'
import { thumbnailsDir, videoPreviewsDir } from '../config/multer.config.js'
import { getVideoDuration } from '../utils/video.util.js'
import config from '../config/app.config.js'

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
            case 'updated-oldest':
                orderBy = { updatedAt: 'asc' }
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

        return {
            courses: courses.map((course) => ({
                ...course,
                lessonsCount: course._count.lessons,
                enrollmentsCount: course._count.enrollments,
                enrolledCount: course._count.enrollments,
                _count: undefined,
            })),
            total,
        }
    }

    /**
     * Get a single course by ID with full details
     * @param {number} courseId - Course ID
     * @param {number} instructorId - Instructor user ID
     * @returns {Promise<object>} Course with full details
     */
    async getInstructorCourseById(courseId, instructorId, isAdmin = false) {
        const course = await prisma.course.findFirst({
            where: {
                id: courseId,
                ...(isAdmin ? {} : { instructorId }),
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
                        lessons: true,
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

        // Transform course data
        const transformedCourse = {
            ...course,
            lessonsCount: course._count.lessons,
            enrollmentsCount: course._count.enrollments,
            tags: course.courseTags.map((ct) => ct.tag),
            courseTags: undefined,
            _count: undefined,
        }

        return transformedCourse
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
            const error = new Error('Khóa học với slug này đã tồn tại')
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }

        // Verify category exists
        const category = await prisma.category.findUnique({
            where: { id: parseInt(categoryId) },
        })

        if (!category) {
            const error = new Error('Không tìm thấy danh mục')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
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
                durationHours: 0, // Will be recalculated from lessons durations
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

        // Auto-generate embedding for RAG (async, non-blocking)
        // Only generate if RAG is enabled and course has content
        if (config.RAG_ENABLED !== false) {
            this._generateCourseEmbeddingAsync(course.id, course).catch((err) => {
                logger.warn(
                    `Failed to generate embedding for course ${course.id}:`,
                    err.message
                )
            })
        }

        // Format response
        return {
            ...course,
            tags: course.courseTags.map((ct) => ct.tag),
            courseTags: undefined,
        }
    }

    /**
     * Helper: Generate embedding for course asynchronously (non-blocking)
     * Supports two modes:
     * 1. Fire-and-forget (default): Simple async call
     * 2. Queue mode: Use BullMQ queue for better reliability and monitoring
     * @private
     */
    async _generateCourseEmbeddingAsync(courseId, courseData, useQueue = false) {
        try {
            // Option 1: Use BullMQ Queue (recommended for production)
            if (useQueue && config.RAG_USE_QUEUE !== false) {
                try {
                    const { enqueueEmbeddingJob } = await import('../queues/embedding.queue.js')
                    const job = await enqueueEmbeddingJob({
                        courseId,
                        courseData,
                        priority: 'normal',
                    })
                    logger.info(
                        `[Embedding] Queued embedding job ${job.id} for course ${courseId}`
                    )
                    return
                } catch (queueError) {
                    logger.warn(
                        `Failed to queue embedding job, falling back to direct generation:`,
                        queueError.message
                    )
                    // Fall through to direct generation
                }
            }

            // Option 2: Fire-and-forget (simple, direct)
            // Dynamic import to avoid circular dependency
            const embeddingService = (await import('./embedding.service.js')).default

            // Check if course has enough content to embed
            const hasContent =
                courseData.title ||
                courseData.shortDescription ||
                courseData.description ||
                courseData.whatYouLearn

            if (!hasContent) {
                logger.debug(`Course ${courseId} has no content, skipping embedding`)
                return
            }

            // Generate embedding (fire-and-forget, non-blocking)
            // Don't await - let it run in background
            embeddingService
                .generateCourseEmbedding(courseData)
                .then(async (embedding) => {
                    const embeddingString = `[${embedding.join(',')}]`
                    const model = embeddingService.getModel()

                    // Update database (using raw SQL to cast to vector type)
                    // PostgreSQL will automatically convert JSON string to vector(768)
                    await prisma.$executeRaw`
                        UPDATE courses
                        SET 
                            embedding = ${embeddingString}::vector,
                            embedding_model = ${model},
                            embedding_updated_at = NOW()
                        WHERE id = ${courseId}
                    `

                    logger.info(`✅ Generated embedding for course ${courseId}: ${courseData.title}`)
                })
                .catch((error) => {
                    // Don't throw - this is async and shouldn't block course creation
                    logger.error(`Error generating embedding for course ${courseId}:`, error.message)
                })
        } catch (error) {
            // Don't throw - this is async and shouldn't block course creation
            logger.error(`Error in embedding generation setup for course ${courseId}:`, error.message)
        }
    }

    /**
     * Update a course
     * @param {number} courseId - Course ID
     * @param {number} instructorId - Instructor user ID
     * @param {object} data - Course data to update
     * @returns {Promise<object>} Updated course
     */
    async updateCourse(courseId, instructorId, data, isAdmin = false) {
        // Check if course exists and belongs to instructor
        const existingCourse = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                id: true,
                instructorId: true,
                slug: true,
                status: true,
                thumbnailUrl: true, // Need to get old thumbnail for deletion
                videoPreviewUrl: true, // Need to get old video preview for deletion
            },
        })

        if (!existingCourse) {
            const error = new Error('Không tìm thấy khóa học')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Check ownership - allow if instructor is the owner OR if user is admin
        if (existingCourse.instructorId !== instructorId && !isAdmin) {
            const error = new Error('Bạn không có quyền quản lý khóa học này')
            error.statusCode = HTTP_STATUS.FORBIDDEN
            throw error
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

        // Get old thumbnail and video preview URLs before update (for file deletion)
        const oldThumbnailUrl = existingCourse.thumbnailUrl
        const oldVideoPreviewUrl = existingCourse.videoPreviewUrl

        // Build update data
        const updateData = {}

        if (title !== undefined) updateData.title = title
        if (description !== undefined) updateData.description = description
        if (shortDescription !== undefined)
            updateData.shortDescription = shortDescription
        if (thumbnailUrl !== undefined) {
            updateData.thumbnailUrl = thumbnailUrl
            // If thumbnailUrl is null, delete the old file
            if (thumbnailUrl === null && oldThumbnailUrl) {
                const oldPath = path.join(
                    process.cwd(),
                    oldThumbnailUrl.replace(/^\//, '')
                )
                if (fs.existsSync(oldPath)) {
                    try {
                        fs.unlinkSync(oldPath)
                    } catch (error) {
                        // Don't throw error, just log it
                    }
                }
            }
        }
        if (videoPreviewUrl !== undefined) {
            updateData.videoPreviewUrl = videoPreviewUrl
            // If videoPreviewUrl is null, delete the old file
            if (videoPreviewUrl === null && oldVideoPreviewUrl) {
                const oldPath = path.join(
                    process.cwd(),
                    oldVideoPreviewUrl.replace(/^\//, '')
                )
                if (fs.existsSync(oldPath)) {
                    try {
                        fs.unlinkSync(oldPath)
                    } catch (error) {
                        // Don't throw error, just log it
                    }
                }
            }
        }
        if (videoPreviewDuration !== undefined)
            updateData.videoPreviewDuration = parseInt(videoPreviewDuration)
        if (price !== undefined) updateData.price = parseFloat(price)
        if (discountPrice !== undefined)
            updateData.discountPrice =
                discountPrice !== null ? parseFloat(discountPrice) : null
        if (categoryId !== undefined)
            updateData.categoryId = parseInt(categoryId)
        if (level !== undefined) updateData.level = level
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
                const error = new Error('Khóa học với slug này đã tồn tại')
                error.statusCode = HTTP_STATUS.BAD_REQUEST
                throw error
            }

            updateData.slug = newSlug
        }

        // Verify category if provided
        if (categoryId !== undefined) {
            const category = await prisma.category.findUnique({
                where: { id: parseInt(categoryId) },
            })

            if (!category) {
                const error = new Error('Không tìm thấy danh mục')
                error.statusCode = HTTP_STATUS.NOT_FOUND
                throw error
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

        // Auto-regenerate embedding if RAG enabled and content changed
        // Check if any embedding-relevant fields were updated
        const embeddingFieldsChanged =
            title !== undefined ||
            description !== undefined ||
            shortDescription !== undefined ||
            whatYouLearn !== undefined ||
            courseObjectives !== undefined ||
            targetAudience !== undefined

        if (config.RAG_ENABLED !== false && embeddingFieldsChanged) {
            // Get full course data for embedding
            const fullCourseData = await prisma.course.findUnique({
                where: { id: courseId },
                select: {
                    id: true,
                    title: true,
                    shortDescription: true,
                    description: true,
                    whatYouLearn: true,
                    courseObjectives: true,
                    targetAudience: true,
                },
            })

            if (fullCourseData) {
                this._generateCourseEmbeddingAsync(courseId, fullCourseData).catch((err) => {
                    logger.warn(
                        `Failed to regenerate embedding for course ${courseId}:`,
                        err.message
                    )
                })
            }
        }

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
    async deleteCourse(courseId, instructorId, isAdmin = false) {
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
            const error = new Error('Không tìm thấy khóa học')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Check ownership - allow if instructor is the owner OR if user is admin
        if (course.instructorId !== instructorId && !isAdmin) {
            const error = new Error('Bạn không có quyền quản lý khóa học này')
            error.statusCode = HTTP_STATUS.FORBIDDEN
            throw error
        }

        // Check if course has enrollments
        if (course._count.enrollments > 0) {
            const error = new Error(
                'Không thể xóa khóa học đã có người đăng ký. Vui lòng lưu trữ khóa học thay vì xóa.'
            )
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }

        // Delete course (cascade will handle related records)
        await prisma.course.delete({
            where: { id: courseId },
        })

        return true
    }

    /**
     * Change course status
     * @param {number} courseId - Course ID
     * @param {number} instructorId - Instructor user ID
     * @param {string} status - New status (draft, published, archived)
     * @returns {Promise<object>} Updated course
     */
    async changeCourseStatus(courseId, instructorId, status, isAdmin = false) {
        // Validate status
        if (!Object.values(COURSE_STATUS).includes(status)) {
            const error = new Error('Trạng thái không hợp lệ')
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
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
            const error = new Error('Không tìm thấy khóa học')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Check ownership FIRST before any validation - allow if instructor is the owner OR if user is admin
        if (course.instructorId !== instructorId && !isAdmin) {
            const error = new Error('Bạn không có quyền quản lý khóa học này')
            error.statusCode = HTTP_STATUS.FORBIDDEN
            throw error
        }

        // Validate publishing requirements
        if (status === COURSE_STATUS.PUBLISHED) {
            if (course._count.lessons === 0) {
                const error = new Error(
                    'Không thể xuất bản khóa học mà không có bài giảng nào được xuất bản'
                )
                error.statusCode = HTTP_STATUS.BAD_REQUEST
                throw error
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

        // Notify admins when course is published for the first time
        if (status === COURSE_STATUS.PUBLISHED && !course.publishedAt) {
            try {
                const { default: notificationsService } =
                    await import('./notifications.service.js')
                const instructor = await prisma.user.findUnique({
                    where: { id: instructorId },
                    select: { fullName: true },
                })
                if (instructor) {
                    await notificationsService.notifyAdminsCoursePendingApproval(
                        courseId,
                        course.title,
                        instructor.fullName
                    )
                }
            } catch (error) {
                // Don't fail course publish if notification fails
            }
        }

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
                    paymentStatus: PAYMENT_STATUS.PAID,
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
     * @param {object} file - Uploaded file object from multer
     * @param {string} userRole - User role (for admin access)
     * @returns {Promise<object>} Updated course
     */
    async uploadThumbnail(
        courseId,
        instructorId,
        file,
        userRole = USER_ROLES.INSTRUCTOR,
        isAdmin = false
    ) {
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                id: true,
                title: true,
                instructorId: true,
                thumbnailUrl: true,
            },
        })

        if (!course) {
            const error = new Error('Không tìm thấy khóa học')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Check ownership - allow if instructor is the owner OR if user is admin
        if (course.instructorId !== instructorId && !isAdmin) {
            const error = new Error('Bạn không có quyền quản lý khóa học này')
            error.statusCode = HTTP_STATUS.FORBIDDEN
            throw error
        }

        // Auto-crop/resize image to 16:9 aspect ratio
        const filePath = file.path
        const targetAspectRatio = 16 / 9 // 1.777...

        try {
            const metadata = await sharp(filePath).metadata()
            const { width, height } = metadata

            if (width && height) {
                const currentAspectRatio = width / height

                // Only process if aspect ratio is different from 16:9
                if (Math.abs(currentAspectRatio - targetAspectRatio) > 0.01) {
                    let newWidth, newHeight, left, top

                    if (currentAspectRatio > targetAspectRatio) {
                        // Image is wider than 16:9 - crop width (center crop)
                        newHeight = height
                        newWidth = Math.round(height * targetAspectRatio)
                        left = Math.round((width - newWidth) / 2)
                        top = 0
                    } else {
                        // Image is taller than 16:9 - crop height (center crop)
                        newWidth = width
                        newHeight = Math.round(width / targetAspectRatio)
                        left = 0
                        top = Math.round((height - newHeight) / 2)
                    }

                    // Crop and resize to 16:9
                    await sharp(filePath)
                        .extract({
                            left,
                            top,
                            width: newWidth,
                            height: newHeight,
                        })
                        .resize(1920, 1080, {
                            // Standard 16:9 resolution
                            fit: 'cover',
                            position: 'center',
                        })
                        .toFile(filePath + '.processed')

                    // Replace original with processed image
                    fs.renameSync(filePath + '.processed', filePath)
                }
            }
        } catch (error) {
            // Continue with original file if processing fails
        }

        const thumbnailUrl = `/uploads/shared/thumbnails/${file.filename}`

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

        // XÓA FILE CŨ
        if (course.thumbnailUrl) {
            const oldPath = path.join(
                process.cwd(),
                course.thumbnailUrl.replace(/^\//, '')
            )
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath)
            }
        }

        return updatedCourse
    }

    /**
     * Upload course video preview
     * @param {number} courseId - Course ID
     * @param {number} instructorId - Instructor user ID
     * @param {object} videoData - Video preview data {videoPreviewUrl, videoPreviewDuration}
     * @returns {Promise<object>} Updated course
     */
    async uploadVideoPreview(
        courseId,
        instructorId,
        file,
        userRole = USER_ROLES.INSTRUCTOR,
        isAdmin = false
    ) {
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                id: true,
                title: true,
                instructorId: true,
                videoPreviewUrl: true,
            },
        })

        if (!course) {
            const error = new Error('Không tìm thấy khóa học')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Check ownership - allow if instructor is the owner OR if user is admin
        if (course.instructorId !== instructorId && !isAdmin) {
            const error = new Error('Bạn không có quyền quản lý khóa học này')
            error.statusCode = HTTP_STATUS.FORBIDDEN
            throw error
        }

        const videoPreviewUrl = `/uploads/shared/previews/${file.filename}`

        // Get video duration
        let videoPreviewDuration = null
        try {
            videoPreviewDuration = await getVideoDuration(file.path)
            if (videoPreviewDuration) {
            } else {
            }
        } catch (error) {
            // Continue without duration - don't fail the upload
        }

        const updatedCourse = await prisma.course.update({
            where: { id: courseId },
            data: { videoPreviewUrl, videoPreviewDuration },
            select: {
                id: true,
                title: true,
                videoPreviewUrl: true,
                videoPreviewDuration: true,
                updatedAt: true,
            },
        })

        // XÓA FILE CŨ DÙNG BIẾN videoPreviewsDir
        if (course.videoPreviewUrl) {
            const oldFileName = path.basename(course.videoPreviewUrl)
            const oldPath = path.join(videoPreviewsDir, oldFileName)

            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath)
            }
        }

        return updatedCourse
    }

    /**
     * Add tags to a course
     * @param {number} courseId - Course ID
     * @param {number} instructorId - Instructor user ID
     * @param {array} tagIds - Array of tag IDs to add
     * @returns {Promise<object>} Updated course with tags
     */
    async addTagsToCourse(courseId, instructorId, tagIds, isAdmin = false) {
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
            const error = new Error('Không tìm thấy khóa học')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Check ownership - allow if instructor is the owner OR if user is admin
        if (course.instructorId !== instructorId && !isAdmin) {
            const error = new Error('Bạn không có quyền quản lý khóa học này')
            error.statusCode = HTTP_STATUS.FORBIDDEN
            throw error
        }

        // Verify all tags exist
        const tags = await prisma.tag.findMany({
            where: {
                id: {
                    in: tagIds.map((id) => parseInt(id)),
                },
            },
        })

        if (tags.length !== tagIds.length) {
            const error = new Error('Một hoặc nhiều thẻ không tìm thấy')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Get existing tags
        const existingTags = await prisma.courseTag.findMany({
            where: { courseId },
            select: { tagId: true },
        })

        const existingTagIds = existingTags.map((ct) => ct.tagId)

        // Filter out tags that already exist
        const newTagIds = tagIds.filter(
            (tagId) => !existingTagIds.includes(parseInt(tagId))
        )

        if (newTagIds.length === 0) {
            const error = new Error(
                'Tất cả các thẻ đã được liên kết với khóa học này'
            )
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }

        // Add new tags
        await prisma.courseTag.createMany({
            data: newTagIds.map((tagId) => ({
                courseId,
                tagId: parseInt(tagId),
            })),
        })

        // Fetch updated course with all tags
        const updatedCourse = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                id: true,
                title: true,
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
                updatedAt: true,
            },
        })

        return {
            ...updatedCourse,
            tags: updatedCourse.courseTags.map((ct) => ct.tag),
            courseTags: undefined,
        }
    }

    /**
     * Remove a tag from a course
     * @param {number} courseId - Course ID
     * @param {number} instructorId - Instructor user ID
     * @param {number} tagId - Tag ID to remove
     * @returns {Promise<object>} Updated course with tags
     */
    async removeTagFromCourse(courseId, instructorId, tagId, isAdmin = false) {
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
            const error = new Error('Không tìm thấy khóa học')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Check ownership - allow if instructor is the owner OR if user is admin
        if (course.instructorId !== instructorId && !isAdmin) {
            const error = new Error('Bạn không có quyền quản lý khóa học này')
            error.statusCode = HTTP_STATUS.FORBIDDEN
            throw error
        }

        // Check if tag exists in course
        const courseTag = await prisma.courseTag.findUnique({
            where: {
                courseId_tagId: {
                    courseId,
                    tagId,
                },
            },
        })

        if (!courseTag) {
            const error = new Error('Thẻ không được liên kết với khóa học này')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Remove tag
        await prisma.courseTag.delete({
            where: {
                courseId_tagId: {
                    courseId,
                    tagId,
                },
            },
        })

        // Fetch updated course with remaining tags
        const updatedCourse = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                id: true,
                title: true,
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
                updatedAt: true,
            },
        })

        return {
            ...updatedCourse,
            tags: updatedCourse.courseTags.map((ct) => ct.tag),
            courseTags: undefined,
        }
    }

    /**
     * Get detailed analytics for a course
     * @param {number} courseId - Course ID
     * @param {number} instructorId - Instructor user ID
     * @returns {Promise<object>} Course analytics
     */
    async getCourseAnalytics(courseId, instructorId, isAdmin = false) {
        // Check if course exists and belongs to instructor
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                id: true,
                title: true,
                instructorId: true,
                status: true,
                publishedAt: true,
            },
        })

        if (!course) {
            const error = new Error('Không tìm thấy khóa học')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Check ownership - allow if instructor is the owner OR if user is admin
        if (course.instructorId !== instructorId && !isAdmin) {
            const error = new Error('Bạn không có quyền quản lý khóa học này')
            error.statusCode = HTTP_STATUS.FORBIDDEN
            throw error
        }

        // Get course overview stats
        const courseStats = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                enrolledCount: true,
                viewsCount: true,
                ratingAvg: true,
                ratingCount: true,
                completionRate: true,
                price: true,
                discountPrice: true,
                _count: {
                    select: {
                        lessons: {
                            where: { isPublished: true },
                        },
                    },
                },
            },
        })

        // Get enrollment statistics
        const [
            totalEnrollments,
            activeEnrollments,
            completedEnrollments,
            droppedEnrollments,
        ] = await Promise.all([
            prisma.enrollment.count({
                where: { courseId },
            }),
            prisma.enrollment.count({
                where: { courseId, status: ENROLLMENT_STATUS.ACTIVE },
            }),
            prisma.enrollment.count({
                where: { courseId, status: ENROLLMENT_STATUS.COMPLETED },
            }),
            prisma.enrollment.count({
                where: { courseId, status: ENROLLMENT_STATUS.DROPPED },
            }),
        ])

        // Get revenue statistics
        const revenueStats = await prisma.order.aggregate({
            where: {
                courseId,
                paymentStatus: PAYMENT_STATUS.PAID,
            },
            _sum: {
                finalPrice: true,
                discountAmount: true,
            },
            _count: true,
        })

        // Get recent enrollments (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const recentEnrollments = await prisma.enrollment.count({
            where: {
                courseId,
                enrolledAt: {
                    gte: thirtyDaysAgo,
                },
            },
        })

        // Get enrollment trend (last 7 days)
        const enrollmentTrend = []
        for (let i = 6; i >= 0; i--) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            date.setHours(0, 0, 0, 0)

            const nextDate = new Date(date)
            nextDate.setDate(nextDate.getDate() + 1)

            const count = await prisma.enrollment.count({
                where: {
                    courseId,
                    enrolledAt: {
                        gte: date,
                        lt: nextDate,
                    },
                },
            })

            enrollmentTrend.push({
                date: date.toISOString().split('T')[0],
                enrollments: count,
            })
        }

        // Get student progress distribution
        const progressDistribution = await prisma.enrollment.groupBy({
            by: ['progressPercentage'],
            where: { courseId },
            _count: true,
        })

        // Categorize progress
        let beginners = 0 // 0-25%
        let intermediate = 0 // 26-50%
        let advanced = 0 // 51-75%
        let nearComplete = 0 // 76-99%
        let completed = 0 // 100%

        progressDistribution.forEach((item) => {
            const percentage = parseFloat(item.progressPercentage)
            if (percentage === 0) beginners += item._count
            else if (percentage <= 25) beginners += item._count
            else if (percentage <= 50) intermediate += item._count
            else if (percentage <= 75) advanced += item._count
            else if (percentage < 100) nearComplete += item._count
            else if (percentage === 100) completed += item._count
        })

        // Get top students (by progress)
        const topStudents = await prisma.enrollment.findMany({
            where: { courseId },
            orderBy: { progressPercentage: 'desc' },
            take: 10,
            select: {
                user: {
                    select: {
                        id: true,
                        userName: true,
                        fullName: true,
                        avatarUrl: true,
                    },
                },
                progressPercentage: true,
                enrolledAt: true,
                completedAt: true,
                lastAccessedAt: true,
            },
        })

        return {
            courseInfo: {
                id: course.id,
                title: course.title,
                status: course.status,
                publishedAt: course.publishedAt,
            },
            overview: {
                totalViews: courseStats.viewsCount,
                totalEnrollments,
                totalLessons: courseStats._count.lessons,
                averageRating: parseFloat(courseStats.ratingAvg) || 0,
                totalRatings: courseStats.ratingCount,
                completionRate: parseFloat(courseStats.completionRate) || 0,
                price: parseFloat(courseStats.price),
                discountPrice: courseStats.discountPrice
                    ? parseFloat(courseStats.discountPrice)
                    : null,
            },
            enrollments: {
                total: totalEnrollments,
                active: activeEnrollments,
                completed: completedEnrollments,
                dropped: droppedEnrollments,
                recentEnrollments, // Last 30 days
                trend: enrollmentTrend, // Last 7 days
            },
            revenue: {
                totalRevenue: parseFloat(revenueStats._sum.finalPrice) || 0,
                totalDiscounts:
                    parseFloat(revenueStats._sum.discountAmount) || 0,
                totalOrders: revenueStats._count,
                averageOrderValue:
                    revenueStats._count > 0
                        ? parseFloat(revenueStats._sum.finalPrice) /
                          revenueStats._count
                        : 0,
            },
            studentProgress: {
                beginners, // 0-25%
                intermediate, // 26-50%
                advanced, // 51-75%
                nearComplete, // 76-99%
                completed, // 100%
            },
            topStudents,
        }
    }

    /**
     * Get enrollments (students) for a specific course
     * @param {number} courseId - Course ID
     * @param {number} instructorId - Instructor user ID
     * @param {boolean} isAdmin - Whether the user is an admin
     * @param {object} filters - Filters and pagination options
     * @returns {Promise<{enrollments: Array, pagination: object, totalEnrollments: number}>}
     */
    async getCourseEnrollments(courseId, instructorId, isAdmin, filters) {
        const {
            page = 1,
            limit = 20,
            search = '',
            status,
            sort = 'newest',
        } = filters

        const skip = (page - 1) * limit

        // Verify course exists and user has access
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { id: true, instructorId: true, title: true },
        })

        if (!course) {
            const error = new Error('Không tìm thấy khóa học')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Check authorization (admin can access all, instructor only their own)
        if (!isAdmin && course.instructorId !== instructorId) {
            const error = new Error('Bạn không có quyền quản lý khóa học này')
            error.statusCode = HTTP_STATUS.FORBIDDEN
            throw error
        }

        // Build where clause
        const where = {
            courseId,
        }

        // Filter by status
        if (status) {
            where.status = status
        }

        // Search in user name/email
        if (search) {
            where.user = {
                OR: [
                    { fullName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { userName: { contains: search, mode: 'insensitive' } },
                ],
            }
        }

        // Build orderBy clause
        let orderBy = {}
        switch (sort) {
            case 'oldest':
                orderBy = { enrolledAt: 'asc' }
                break
            case 'progress':
                orderBy = { progressPercentage: 'desc' }
                break
            case 'lastAccessed':
                orderBy = { lastAccessedAt: 'desc' }
                break
            case 'newest':
            default:
                orderBy = { enrolledAt: 'desc' }
        }

        // Execute query
        const [enrollments, total] = await Promise.all([
            prisma.enrollment.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                select: {
                    id: true,
                    userId: true,
                    courseId: true,
                    enrolledAt: true,
                    startedAt: true,
                    completedAt: true,
                    progressPercentage: true,
                    lastAccessedAt: true,
                    expiresAt: true,
                    status: true,
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            userName: true,
                            email: true,
                            avatarUrl: true,
                            role: true,
                        },
                    },
                },
            }),
            prisma.enrollment.count({ where }),
        ])

        return {
            enrollments,
            totalEnrollments: total,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        }
    }
}

export default new InstructorCourseService()
