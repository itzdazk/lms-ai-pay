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
     * Get a single course by ID with full details
     * @param {number} courseId - Course ID
     * @param {number} instructorId - Instructor user ID
     * @returns {Promise<object>} Course with full details
     */
    async getInstructorCourseById(courseId, instructorId) {
        const course = await prisma.course.findFirst({
            where: {
                id: courseId,
                instructorId,
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
            const error = new Error('Course not found')
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

        logger.info(
            `Instructor ${instructorId} retrieved course ${courseId}`
        )

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
            const error = new Error('Course with this slug already exists')
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }

        // Verify category exists
        const category = await prisma.category.findUnique({
            where: { id: parseInt(categoryId) },
        })

        if (!category) {
            const error = new Error('Category not found')
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
                thumbnailUrl: true, // Need to get old thumbnail for deletion
                videoPreviewUrl: true, // Need to get old video preview for deletion
            },
        })

        if (!existingCourse) {
            const error = new Error('Course not found')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Check ownership
        if (existingCourse.instructorId !== instructorId) {
            const error = new Error('You do not have permission to manage this course')
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
                        logger.info(`Thumbnail file deleted: ${oldThumbnailUrl}`)
                    } catch (error) {
                        logger.error(`Error deleting thumbnail file: ${error.message}`)
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
                        logger.info(`Video preview file deleted: ${oldVideoPreviewUrl}`)
                    } catch (error) {
                        logger.error(`Error deleting video preview file: ${error.message}`)
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
                const error = new Error('Course with this slug already exists')
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
                const error = new Error('Category not found')
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
            const error = new Error('Course not found')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Check ownership
        if (course.instructorId !== instructorId) {
            const error = new Error('You do not have permission to manage this course')
            error.statusCode = HTTP_STATUS.FORBIDDEN
            throw error
        }

        // Check if course has enrollments
        if (course._count.enrollments > 0) {
            const error = new Error(
                'Cannot delete course with active enrollments. Please archive it instead.'
            )
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
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
            const error = new Error('Invalid status')
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
            const error = new Error('Course not found')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Check ownership FIRST before any validation
        if (course.instructorId !== instructorId) {
            const error = new Error('You do not have permission to manage this course')
            error.statusCode = HTTP_STATUS.FORBIDDEN
            throw error
        }

        // Validate publishing requirements
        if (status === COURSE_STATUS.PUBLISHED) {
            if (course._count.lessons === 0) {
                const error = new Error(
                    'Cannot publish course without any published lessons'
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
        userRole = USER_ROLES.INSTRUCTOR
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
            const error = new Error('Course not found')
            error.statusCode = HTTP_STATUS.NOT_FOUND
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
                        .extract({ left, top, width: newWidth, height: newHeight })
                        .resize(1920, 1080, { // Standard 16:9 resolution
                            fit: 'cover',
                            position: 'center'
                        })
                        .toFile(filePath + '.processed')
                    
                    // Replace original with processed image
                    fs.renameSync(filePath + '.processed', filePath)
                    
                    logger.info(
                        `Thumbnail auto-cropped to 16:9: ${width}×${height} → ${newWidth}×${newHeight} (Course ${courseId})`
                    )
                }
            }
        } catch (error) {
            logger.error(`Error processing thumbnail: ${error.message}`)
            // Continue with original file if processing fails
        }

        const thumbnailUrl = `/uploads/thumbnails/${file.filename}`

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
                logger.info(`Old thumbnail deleted: ${course.thumbnailUrl}`)
            }
        }

        logger.info(
            `Thumbnail uploaded: Course ${course.title} (ID: ${courseId})`
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
    async uploadVideoPreview(
        courseId,
        instructorId,
        file,
        userRole = USER_ROLES.INSTRUCTOR
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
            const error = new Error('Course not found')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        const videoPreviewUrl = `/uploads/video-previews/${file.filename}`

        // Get video duration
        let videoPreviewDuration = null
        try {
            videoPreviewDuration = await getVideoDuration(file.path)
            if (videoPreviewDuration) {
                logger.info(`Video preview duration extracted: ${videoPreviewDuration} seconds for course ${courseId}`)
            } else {
                logger.warn(`Could not extract video preview duration for course ${courseId}`)
            }
        } catch (error) {
            logger.error(`Error extracting video preview duration: ${error.message}`, { error: error.stack })
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
                logger.info(
                    `Deleted old video preview: ${course.videoPreviewUrl}`
                )
            }
        }

        logger.info(
            `Video preview uploaded for course: ${course.title} (ID: ${courseId})`
        )
        return updatedCourse
    }

    /**
     * Add tags to a course
     * @param {number} courseId - Course ID
     * @param {number} instructorId - Instructor user ID
     * @param {array} tagIds - Array of tag IDs to add
     * @returns {Promise<object>} Updated course with tags
     */
    async addTagsToCourse(courseId, instructorId, tagIds) {
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
            const error = new Error('Course not found')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Check ownership
        if (course.instructorId !== instructorId) {
            const error = new Error('You do not have permission to manage this course')
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
            const error = new Error('One or more tags not found')
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
            const error = new Error('All tags are already associated with this course')
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

        logger.info(
            `Instructor ${instructorId} added ${newTagIds.length} tags to course: ${course.title} (ID: ${courseId})`
        )

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
    async removeTagFromCourse(courseId, instructorId, tagId) {
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
            const error = new Error('Course not found')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Check ownership
        if (course.instructorId !== instructorId) {
            const error = new Error('You do not have permission to manage this course')
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
            const error = new Error('Tag is not associated with this course')
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

        logger.info(
            `Instructor ${instructorId} removed tag ${tagId} from course: ${course.title} (ID: ${courseId})`
        )

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
    async getCourseAnalytics(courseId, instructorId) {
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
            const error = new Error('Course not found')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Check ownership
        if (course.instructorId !== instructorId) {
            const error = new Error('You do not have permission to manage this course')
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

        logger.info(
            `Instructor ${instructorId} retrieved analytics for course ID: ${courseId}`
        )

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
}

export default new InstructorCourseService()
