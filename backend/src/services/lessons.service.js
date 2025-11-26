// src/services/lessons.service.js
import { prisma } from '../config/database.config.js'
import { ENROLLMENT_STATUS, TRANSCRIPT_STATUS } from '../config/constants.js'
import logger from '../config/logger.config.js'
import config from '../config/app.config.js'
import path from 'path'
import fs from 'fs'
import transcriptionService from './transcription.service.js'
import { videosDir, transcriptsDir } from '../config/multer.config.js'

class LessonsService {
    _deleteTranscriptFiles(filename) {
        if (!filename) return

        try {
            const transcriptPath = path.join(transcriptsDir, filename)
            if (fs.existsSync(transcriptPath)) {
                fs.unlinkSync(transcriptPath)
                logger.info(`Deleted transcript file: ${transcriptPath}`)
            }

            const baseName = filename.replace(path.extname(filename), '')
            const jsonPath = path.join(transcriptsDir, `${baseName}.json`)
            if (fs.existsSync(jsonPath)) {
                fs.unlinkSync(jsonPath)
                logger.info(`Deleted transcript JSON file: ${jsonPath}`)
            }
        } catch (error) {
            logger.error(
                `Error deleting transcript artifacts: ${error.message}`,
                { error: error.stack }
            )
        }
    }

    /**
     * Generate slug from title
     */
    generateSlug(title) {
        return title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    }

    /**
     * Get lesson by ID (Public)
     */
    async getLessonById(lessonId) {
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        status: true,
                        instructor: {
                            select: {
                                id: true,
                                fullName: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
            },
        })

        if (!lesson) {
            throw new Error('Lesson not found')
        }

        // Only return published lessons for non-instructors
        // This will be handled in controller based on user role

        return lesson
    }

    /**
     * Get lesson video URL
     */
    async getLessonVideo(lessonId) {
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            select: {
                id: true,
                title: true,
                videoUrl: true,
                videoDuration: true,
                isPublished: true,
                course: {
                    select: {
                        id: true,
                        status: true,
                        instructor: {
                            select: {
                                id: true,
                            },
                        },
                    },
                },
            },
        })

        if (!lesson) {
            throw new Error('Lesson not found')
        }

        if (!lesson.videoUrl) {
            throw new Error('Video not available for this lesson')
        }

        return lesson
    }

    /**
     * Get lesson transcript URL
     */
    async getLessonTranscript(lessonId) {
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            select: {
                id: true,
                title: true,
                transcriptUrl: true,
                transcriptJsonUrl: true,
                transcriptStatus: true,
                isPublished: true,
                course: {
                    select: {
                        id: true,
                        status: true,
                        instructor: {
                            select: {
                                id: true,
                            },
                        },
                    },
                },
            },
        })

        if (!lesson) {
            throw new Error('Lesson not found')
        }

        if (!lesson.transcriptUrl) {
            throw new Error('Transcript not available for this lesson')
        }

        return lesson
    }

    /**
     * Check if user has access to course (enrolled)
     */
    async hasUserAccessToCourse(userId, courseId) {
        const enrollment = await prisma.enrollment.findFirst({
            where: {
                userId,
                courseId,
                status: {
                    in: [
                        ENROLLMENT_STATUS.ACTIVE,
                        ENROLLMENT_STATUS.COMPLETED,
                    ],
                },
            },
            select: {
                id: true,
            },
        })

        return Boolean(enrollment)
    }

    /**
     * Create new lesson
     */
    async createLesson(courseId, data, userId) {
        const {
            title,
            slug,
            description,
            content,
            lessonOrder,
            isPreview,
            isPublished,
        } = data

        // Check if course exists and user is instructor
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                id: true,
                instructorId: true,
                title: true,
            },
        })

        if (!course) {
            throw new Error('Course not found')
        }

        // Generate slug from title if not provided
        let lessonSlug = slug
        if (!lessonSlug) {
            lessonSlug = this.generateSlug(title)
        }

        // Check if slug already exists in this course
        const existingLesson = await prisma.lesson.findUnique({
            where: {
                courseId_slug: {
                    courseId: courseId,
                    slug: lessonSlug,
                },
            },
        })

        if (existingLesson) {
            // Append number if slug exists
            let counter = 1
            let uniqueSlug = `${lessonSlug}-${counter}`
            while (
                await prisma.lesson.findUnique({
                    where: {
                        courseId_slug: {
                            courseId: courseId,
                            slug: uniqueSlug,
                        },
                    },
                })
            ) {
                counter++
                uniqueSlug = `${lessonSlug}-${counter}`
            }
            lessonSlug = uniqueSlug
        }

        // Get max lessonOrder if not provided
        let finalLessonOrder = lessonOrder
        if (!finalLessonOrder) {
            const maxOrder = await prisma.lesson.aggregate({
                where: { courseId },
                _max: { lessonOrder: true },
            })
            finalLessonOrder = (maxOrder._max.lessonOrder || 0) + 1
        } else {
            // If order is provided, shift other lessons
            await prisma.lesson.updateMany({
                where: {
                    courseId,
                    lessonOrder: { gte: finalLessonOrder },
                },
                data: {
                    lessonOrder: {
                        increment: 1,
                    },
                },
            })
        }

        const lesson = await prisma.lesson.create({
            data: {
                courseId,
                title,
                slug: lessonSlug,
                description,
                content,
                lessonOrder: finalLessonOrder,
                isPreview: isPreview || false,
                isPublished: isPublished !== undefined ? isPublished : true,
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        })

        // Update course totalLessons count
        await prisma.course.update({
            where: { id: courseId },
            data: {
                totalLessons: {
                    increment: 1,
                },
            },
        })

        logger.info(`Lesson created: ${lesson.title} (ID: ${lesson.id})`)

        return lesson
    }

    /**
     * Update lesson
     */
    async updateLesson(courseId, lessonId, data) {
        const {
            title,
            slug,
            description,
            content,
            lessonOrder,
            isPreview,
            isPublished,
        } = data

        // Check if lesson exists
        const existingLesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            select: {
                id: true,
                courseId: true,
                slug: true,
                title: true,
            },
        })

        if (!existingLesson) {
            throw new Error('Lesson not found')
        }

        if (existingLesson.courseId !== courseId) {
            throw new Error('Lesson does not belong to this course')
        }

        const updateData = {}

        // Handle slug generation and validation
        if (slug !== undefined) {
            // User provided slug explicitly
            // Check if slug already exists in this course (excluding current lesson)
            const slugExists = await prisma.lesson.findFirst({
                where: {
                    courseId,
                    slug,
                    id: { not: lessonId },
                },
            })

            if (slugExists) {
                throw new Error('Slug already exists in this course')
            }
            updateData.slug = slug
        } else if (title !== undefined && title !== existingLesson.title) {
            // Title changed but no slug provided - auto-generate slug
            updateData.title = title
            let generatedSlug = this.generateSlug(title)
            
            // Only update slug if it's different from current slug
            if (generatedSlug !== existingLesson.slug) {
                // Check if generated slug already exists (excluding current lesson)
                const slugExists = await prisma.lesson.findFirst({
                    where: {
                        courseId,
                        slug: generatedSlug,
                        id: { not: lessonId },
                    },
                })

                if (slugExists) {
                    // Append number if slug exists
                    let counter = 1
                    let uniqueSlug = `${generatedSlug}-${counter}`
                    while (
                        await prisma.lesson.findFirst({
                            where: {
                                courseId,
                                slug: uniqueSlug,
                                id: { not: lessonId },
                            },
                        })
                    ) {
                        counter++
                        uniqueSlug = `${generatedSlug}-${counter}`
                    }
                    generatedSlug = uniqueSlug
                }
                updateData.slug = generatedSlug
            }
        } else if (title !== undefined) {
            // Title provided but same as existing - just update title, keep slug
            updateData.title = title
        }

        if (description !== undefined) updateData.description = description
        if (content !== undefined) updateData.content = content
        if (isPreview !== undefined) updateData.isPreview = isPreview
        if (isPublished !== undefined) updateData.isPublished = isPublished

        // Handle lessonOrder change
        if (lessonOrder !== undefined && lessonOrder !== existingLesson.lessonOrder) {
            const oldOrder = existingLesson.lessonOrder
            const newOrder = lessonOrder

            // Use transaction to ensure atomicity
            await prisma.$transaction(async (tx) => {
                // Shift lessons between old and new order
                if (newOrder > oldOrder) {
                    // Moving down: decrement lessons between old and new
                    await tx.lesson.updateMany({
                        where: {
                            courseId,
                            lessonOrder: {
                                gt: oldOrder,
                                lte: newOrder,
                            },
                            id: { not: lessonId },
                        },
                        data: {
                            lessonOrder: { decrement: 1 },
                        },
                    })
                } else {
                    // Moving up: increment lessons between new and old
                    await tx.lesson.updateMany({
                        where: {
                            courseId,
                            lessonOrder: {
                                gte: newOrder,
                                lt: oldOrder,
                            },
                            id: { not: lessonId },
                        },
                        data: {
                            lessonOrder: { increment: 1 },
                        },
                    })
                }

                // Update the lesson order
                updateData.lessonOrder = newOrder
            })
        }

        const lesson = await prisma.lesson.update({
            where: { id: lessonId },
            data: updateData,
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        })

        logger.info(`Lesson updated: ${lesson.title} (ID: ${lesson.id})`)

        return lesson
    }

    /**
     * Delete lesson
     */
    async deleteLesson(courseId, lessonId) {
        // Check if lesson exists
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            select: {
                id: true,
                courseId: true,
                title: true,
                videoUrl: true,
                transcriptUrl: true,
            },
        })

        if (!lesson) {
            throw new Error('Lesson not found')
        }

        if (lesson.courseId !== courseId) {
            throw new Error('Lesson does not belong to this course')
        }

        // Delete associated files
        if (lesson.videoUrl) {
            try {
                const filename = path.basename(lesson.videoUrl)
                const videoPath = path.join(videosDir, filename)
                if (fs.existsSync(videoPath)) {
                    fs.unlinkSync(videoPath)
                    logger.info(`Deleted video file: ${videoPath}`)
                }
            } catch (error) {
                logger.error(`Error deleting video file: ${error.message}`)
            }
        }

        // Delete transcript files (both SRT and JSON)
        if (lesson.transcriptUrl) {
            const filename = path.basename(lesson.transcriptUrl)
            this._deleteTranscriptFiles(filename)
        }

        // Get lesson order before deletion
        const lessonOrder = await prisma.lesson.findUnique({
            where: { id: lessonId },
            select: { lessonOrder: true },
        })

        // Delete lesson
        await prisma.lesson.delete({
            where: { id: lessonId },
        })

        // Reorder remaining lessons
        await prisma.lesson.updateMany({
            where: {
                courseId,
                lessonOrder: { gt: lessonOrder.lessonOrder },
            },
            data: {
                lessonOrder: { decrement: 1 },
            },
        })

        // Update course totalLessons count
        await prisma.course.update({
            where: { id: courseId },
            data: {
                totalLessons: {
                    decrement: 1,
                },
            },
        })

        logger.info(`Lesson deleted: ${lesson.title} (ID: ${lesson.id})`)

        return true
    }

    /**
     * Upload video to lesson
     */
    async uploadVideo(courseId, lessonId, file, userId) {
        // Check if lesson exists
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            select: {
                id: true,
                courseId: true,
                title: true,
                videoUrl: true,
                transcriptUrl: true,
            },
        })

        if (!lesson) {
            throw new Error('Lesson not found')
        }

        if (lesson.courseId !== courseId) {
            throw new Error('Lesson does not belong to this course')
        }

        // Delete old video if exists
        if (lesson.videoUrl) {
            try {
                // Extract filename from URL (e.g., /uploads/videos/filename.mp4 -> filename.mp4)
                const filename = path.basename(lesson.videoUrl)
                const oldVideoPath = path.join(videosDir, filename)
                
                if (fs.existsSync(oldVideoPath)) {
                    fs.unlinkSync(oldVideoPath)
                    logger.info(`Deleted old video: ${oldVideoPath}`)
                } else {
                    logger.warn(`Old video file not found: ${oldVideoPath} (from URL: ${lesson.videoUrl})`)
                }
            } catch (error) {
                // Log error but don't fail the upload
                logger.error(`Error deleting old video: ${error.message}`, { error: error.stack })
            }
        }

        // Delete old transcript because video changed
        if (lesson.transcriptUrl) {
            const transcriptFilename = path.basename(lesson.transcriptUrl)
            this._deleteTranscriptFiles(transcriptFilename)
        }

        // Save new video URL
        const videoUrl = `/uploads/videos/${file.filename}`

        const shouldTranscribe = config.WHISPER_ENABLED !== false

        const updatedLesson = await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                videoUrl,
                transcriptUrl: null,
                transcriptJsonUrl: null,
                transcriptStatus: shouldTranscribe
                    ? TRANSCRIPT_STATUS.PROCESSING
                    : TRANSCRIPT_STATUS.IDLE,
            },
        })

        if (shouldTranscribe) {
            transcriptionService.cancelTranscriptionJob(lessonId)
            setImmediate(() => {
                transcriptionService
                    .transcribeLessonVideo({
                        videoPath: file.path,
                        lessonId,
                        userId,
                        source: 'lesson-route-video-upload',
                    })
                    .catch((error) => {
                        logger.error(
                            `Whisper transcription failed for lesson ${lessonId}: ${error.message}`
                        )
                        prisma.lesson
                            .update({
                                where: { id: lessonId },
                                data: {
                                    transcriptStatus:
                                        TRANSCRIPT_STATUS.FAILED,
                                },
                            })
                            .catch((statusError) =>
                                logger.error(
                                    `Failed to update transcript status for lesson ${lessonId}: ${statusError.message}`
                                )
                            )
                    })
            })
        }

        logger.info(`Video uploaded for lesson: ${lesson.title} (ID: ${lesson.id})`)

        return updatedLesson
    }

    /**
     * Upload transcript to lesson
     */
    async uploadTranscript(courseId, lessonId, file) {
        // Check if lesson exists
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            select: {
                id: true,
                courseId: true,
                title: true,
                transcriptUrl: true,
            },
        })

        if (!lesson) {
            throw new Error('Lesson not found')
        }

        if (lesson.courseId !== courseId) {
            throw new Error('Lesson does not belong to this course')
        }

        // Delete old transcript if exists
        if (lesson.transcriptUrl) {
            const filename = path.basename(lesson.transcriptUrl)
            this._deleteTranscriptFiles(filename)
        }

        // Save new transcript URL
        const transcriptUrl = `/uploads/transcripts/${file.filename}`

        const updatedLesson = await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                transcriptUrl,
                transcriptJsonUrl: null, // Manual upload, clear auto-generated JSON
                transcriptStatus: TRANSCRIPT_STATUS.COMPLETED, // Manual upload is always completed
            },
        })

        logger.info(
            `Transcript uploaded for lesson: ${lesson.title} (ID: ${lesson.id})`
        )

        return updatedLesson
    }

    /**
     * Reorder lesson
     */
    async reorderLesson(courseId, lessonId, newOrder) {
        // Check if lesson exists
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            select: {
                id: true,
                courseId: true,
                lessonOrder: true,
            },
        })

        if (!lesson) {
            throw new Error('Lesson not found')
        }

        if (lesson.courseId !== courseId) {
            throw new Error('Lesson does not belong to this course')
        }

        const oldOrder = lesson.lessonOrder

        if (oldOrder === newOrder) {
            // No change needed
            return await prisma.lesson.findUnique({
                where: { id: lessonId },
            })
        }

        // Use transaction to ensure atomicity
        const updatedLesson = await prisma.$transaction(async (tx) => {
            // Shift lessons between old and new order
            if (newOrder > oldOrder) {
                // Moving down: decrement lessons between old and new
                await tx.lesson.updateMany({
                    where: {
                        courseId,
                        lessonOrder: {
                            gt: oldOrder,
                            lte: newOrder,
                        },
                        id: { not: lessonId },
                    },
                    data: {
                        lessonOrder: { decrement: 1 },
                    },
                })
            } else {
                // Moving up: increment lessons between new and old
                await tx.lesson.updateMany({
                    where: {
                        courseId,
                        lessonOrder: {
                            gte: newOrder,
                            lt: oldOrder,
                        },
                        id: { not: lessonId },
                    },
                    data: {
                        lessonOrder: { increment: 1 },
                    },
                })
            }

            // Update the lesson order
            return await tx.lesson.update({
                where: { id: lessonId },
                data: { lessonOrder: newOrder },
            })
        })

        logger.info(
            `Lesson reordered: ${lesson.title} from ${oldOrder} to ${newOrder}`
        )

        return updatedLesson
    }

    /**
     * Publish/Unpublish lesson
     */
    async publishLesson(courseId, lessonId, isPublished) {
        // Check if lesson exists
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            select: {
                id: true,
                courseId: true,
                title: true,
            },
        })

        if (!lesson) {
            throw new Error('Lesson not found')
        }

        if (lesson.courseId !== courseId) {
            throw new Error('Lesson does not belong to this course')
        }

        const updatedLesson = await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                isPublished,
            },
        })

        logger.info(
            `Lesson ${isPublished ? 'published' : 'unpublished'}: ${lesson.title} (ID: ${lesson.id})`
        )

        return updatedLesson
    }
}

export default new LessonsService()

