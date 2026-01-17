// src/services/lessons.service.js
import { prisma } from '../config/database.config.js'
import {
    ENROLLMENT_STATUS,
    TRANSCRIPT_STATUS,
    HTTP_STATUS,
    HLS_STATUS,
} from '../config/constants.js'
import config from '../config/app.config.js'
import logger from '../config/logger.config.js'
import path from 'path'
import fs from 'fs'
import transcriptionService from './transcription.service.js'
import slugify from '../utils/slugify.util.js'
import { getVideoDuration } from '../utils/video.util.js'
import { enqueueHlsJob } from '../queues/hls.queue.js'
import pathUtil from '../utils/path.util.js'

class LessonsService {
    async _recalcCourseDuration(courseId) {
        const lessons = await prisma.lesson.findMany({
            where: { courseId },
            select: { videoDuration: true },
        })
        const totalSeconds = lessons.reduce(
            (acc, lesson) => acc + (lesson.videoDuration || 0),
            0
        )
        const totalMinutes = Math.round(totalSeconds / 60)

        await prisma.course.update({
            where: { id: courseId },
            data: { durationHours: totalMinutes },
        })
    }
    _deleteTranscriptFiles(filename, courseId, transcriptJsonUrl = null) {
        if (!filename || !courseId) return

        try {
            // Get course transcript directory
            const transcriptDir = pathUtil.getTranscriptDir(courseId)
            const absoluteTranscriptDir = path.isAbsolute(transcriptDir)
                ? transcriptDir
                : path.join(process.cwd(), transcriptDir)

            // Delete SRT file
            const transcriptPath = path.join(absoluteTranscriptDir, filename)
            if (fs.existsSync(transcriptPath)) {
                fs.unlinkSync(transcriptPath)
                logger.info(`Deleted transcript file: ${transcriptPath}`)
            }

            // Delete JSON file (if exists)
            if (transcriptJsonUrl) {
                const jsonFilename = path.basename(transcriptJsonUrl)
                const jsonPath = path.join(absoluteTranscriptDir, jsonFilename)
                if (fs.existsSync(jsonPath)) {
                    fs.unlinkSync(jsonPath)
                    logger.info(`Deleted transcript JSON file: ${jsonPath}`)
                }
            } else {
                // Try to delete JSON file based on SRT filename (for auto-generated transcripts)
                const baseName = filename.replace(path.extname(filename), '')
                const jsonPath = path.join(absoluteTranscriptDir, `${baseName}.json`)
                if (fs.existsSync(jsonPath)) {
                    fs.unlinkSync(jsonPath)
                    logger.info(`Deleted transcript JSON file: ${jsonPath}`)
                }
            }
        } catch (error) {
            logger.error(
                `Failed to delete transcript files for ${filename}: ${error.message}`
            )
        }
    }

    async _deleteHlsArtifacts(lessonId, courseId) {
        if (!lessonId || !courseId) return

        const lessonHlsDir = path.join(
            pathUtil.getHlsDir(courseId),
            String(lessonId)
        )
        try {
            await fs.promises.rm(lessonHlsDir, { recursive: true, force: true })
        } catch (error) {}
    }

    /**
     * Generate slug from title
     */
    generateSlug(title) {
        return slugify(title)
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
            const error = new Error('Không tìm thấy bài học')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Only return published lessons for non-instructors
        // This will be handled in controller based on user role

        return lesson
    }

    /**
     * Get lesson by slug and course slug
     */
    async getLessonBySlug(courseSlug, lessonSlug) {
        // First find course by slug
        const course = await prisma.course.findUnique({
            where: { slug: courseSlug },
            select: { id: true },
        })

        if (!course) {
            const error = new Error('Không tìm thấy khóa học')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Then find lesson by slug within that course
        const lesson = await prisma.lesson.findUnique({
            where: {
                courseId_slug: {
                    courseId: course.id,
                    slug: lessonSlug,
                },
            },
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
            const error = new Error('Không tìm thấy bài học')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

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
                hlsUrl: true,
                hlsStatus: true,
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
            const error = new Error('Không tìm thấy bài học')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        if (!lesson.videoUrl) {
            const error = new Error('Video không khả dụng cho bài học này')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
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
            const error = new Error('Không tìm thấy bài học')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Transcript is optional, return lesson even if transcriptUrl is null
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
                    in: [ENROLLMENT_STATUS.ACTIVE, ENROLLMENT_STATUS.COMPLETED],
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
     * Note: videoDuration is NOT accepted from request body.
     * It is automatically calculated when video is uploaded via uploadVideo() method.
     */
    async createLesson(courseId, data, userId) {
        const {
            title,
            slug,
            description,
            content,
            lessonOrder,
            completionThreshold,
            isPreview,
            isPublished,
            chapterId,
            // videoDuration is intentionally excluded - it's set automatically when video is uploaded
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
            throw new Error('Không tìm thấy khóa học')
        }

        // If chapterId is provided, verify it belongs to the course
        let chapter = null
        if (chapterId) {
            chapter = await prisma.chapter.findUnique({
                where: { id: parseInt(chapterId) },
                select: {
                    id: true,
                    courseId: true,
                },
            })

            if (!chapter) {
                const error = new Error('Không tìm thấy chương học')
                error.statusCode = HTTP_STATUS.NOT_FOUND
                throw error
            }

            if (chapter.courseId !== courseId) {
                throw new Error('Chương không thuộc về khóa học này')
            }
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
        // If chapterId is provided, calculate order within chapter, otherwise within course
        let finalLessonOrder = lessonOrder
        if (!finalLessonOrder) {
            const whereClause = chapterId
                ? { chapterId: parseInt(chapterId) }
                : { courseId, chapterId: null }
            const maxOrder = await prisma.lesson.aggregate({
                where: whereClause,
                _max: { lessonOrder: true },
            })
            finalLessonOrder = (maxOrder._max.lessonOrder || 0) + 1
        } else {
            // If order is provided, shift other lessons
            const whereClause = chapterId
                ? {
                      chapterId: parseInt(chapterId),
                      lessonOrder: { gte: finalLessonOrder },
                  }
                : {
                      courseId,
                      chapterId: null,
                      lessonOrder: { gte: finalLessonOrder },
                  }
            await prisma.lesson.updateMany({
                where: whereClause,
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
                chapterId: chapterId ? parseInt(chapterId) : null,
                title,
                slug: lessonSlug,
                description,
                content,
                lessonOrder: finalLessonOrder,
                completionThreshold: completionThreshold !== undefined ? parseFloat(completionThreshold) : 0.7,
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

        // Recalculate course duration based on all lesson video durations
        await this._recalcCourseDuration(courseId)

        return lesson
    }

    /**
     * Update lesson
     * Note: videoDuration is NOT accepted from request body.
     * It is automatically calculated when video is uploaded via uploadVideo() method.
     */
    async updateLesson(courseId, lessonId, data) {
        const {
            title,
            slug,
            description,
            content,
            lessonOrder,
            completionThreshold,
            isPreview,
            isPublished,
            // videoDuration is intentionally excluded - it's set automatically when video is uploaded
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
            throw new Error('Không tìm thấy bài học')
        }

        if (existingLesson.courseId !== courseId) {
            throw new Error('Bài học không thuộc về khóa học này')
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
                throw new Error('Slug đã tồn tại trong khóa học này')
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
        if (completionThreshold !== undefined) {
            const threshold = parseFloat(completionThreshold)
            if (isNaN(threshold) || threshold < 0 || threshold > 1) {
                throw new Error('Ngưỡng hoàn thành phải là số từ 0 đến 1')
            }
            updateData.completionThreshold = threshold
        }
        if (isPreview !== undefined) updateData.isPreview = isPreview
        if (isPublished !== undefined) updateData.isPublished = isPublished

        // Handle lessonOrder change
        if (
            lessonOrder !== undefined &&
            lessonOrder !== existingLesson.lessonOrder
        ) {
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
                transcriptJsonUrl: true,
                transcriptStatus: true,
            },
        })

        if (!lesson) {
            throw new Error('Không tìm thấy bài học')
        }

        if (lesson.courseId !== courseId) {
            throw new Error('Bài học không thuộc về khóa học này')
        }

        // Cancel any ongoing transcription job if it exists
        if (lesson.transcriptStatus === TRANSCRIPT_STATUS.PROCESSING) {
            const wasCancelled =
                transcriptionService.cancelTranscriptionJob(lessonId)
            if (wasCancelled) {
                // Give a small delay to ensure the process is killed
                await new Promise((resolve) => setTimeout(resolve, 500))
            }
        } else {
            // Also try to cancel even if status is not PROCESSING (might be in queue)
            transcriptionService.cancelTranscriptionJob(lessonId)
        }

        // Delete associated files
        if (lesson.videoUrl) {
            try {
                const filename = path.basename(lesson.videoUrl)
                const videoPath = path.join(
                    pathUtil.getVideoDir(courseId),
                    filename
                )
                if (fs.existsSync(videoPath)) {
                    fs.unlinkSync(videoPath)
                }
            } catch (error) {}
        }

        // Delete HLS artifacts if present
        await this._deleteHlsArtifacts(lessonId, lesson.courseId)

        // Delete transcript files (both SRT and JSON)
        if (lesson.transcriptUrl) {
            const filename = path.basename(lesson.transcriptUrl)
            this._deleteTranscriptFiles(
                filename,
                lesson.courseId,
                lesson.transcriptJsonUrl
            )
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

        // Recalculate course duration after deletion
        await this._recalcCourseDuration(courseId)

        return true
    }

    /**
     * Upload video to lesson
     * @param {number} courseId - Course ID
     * @param {number} lessonId - Lesson ID
     * @param {Object} file - Video file object
     * @param {number} userId - User ID
     * @param {boolean} autoCreateTranscript - Whether to automatically create transcript (default: false)
     */
    async uploadVideo(
        courseId,
        lessonId,
        file,
        userId,
        autoCreateTranscript = false
    ) {
        // Check if lesson exists
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            select: {
                id: true,
                courseId: true,
                title: true,
                videoUrl: true,
                transcriptUrl: true,
                transcriptJsonUrl: true,
            },
        })

        if (!lesson) {
            throw new Error('Không tìm thấy bài học')
        }

        if (lesson.courseId !== courseId) {
            throw new Error('Bài học không thuộc về khóa học này')
        }

        // Delete old video if exists
        if (lesson.videoUrl) {
            try {
                // Extract filename from URL (e.g., /uploads/courses/{courseId}/videos/filename.mp4 -> filename.mp4)
                const filename = path.basename(lesson.videoUrl)
                const oldVideoPath = path.join(
                    pathUtil.getVideoDir(courseId),
                    filename
                )

                if (fs.existsSync(oldVideoPath)) {
                    fs.unlinkSync(oldVideoPath)
                } else {
                }
            } catch (error) {
                // Log error but don't fail the upload
            }
        }

        // Delete old HLS outputs if exist (video changed)
        await this._deleteHlsArtifacts(lessonId, courseId)

        // Delete old transcript because video changed
        if (lesson.transcriptUrl) {
            const transcriptFilename = path.basename(lesson.transcriptUrl)
            this._deleteTranscriptFiles(
                transcriptFilename,
                courseId,
                lesson.transcriptJsonUrl
            )
        }

        // Save new video URL (course-based path)
        const videoUrl = `/uploads/courses/${courseId}/videos/${file.filename}`

        // Get video duration
        let videoDuration = null
        try {
            videoDuration = await getVideoDuration(file.path)
            if (videoDuration) {
            } else {
            }
        } catch (error) {
            // Continue without duration - don't fail the upload
        }

        // Only transcribe if autoCreateTranscript is true AND Whisper is enabled
        const shouldTranscribe =
            autoCreateTranscript && config.WHISPER_ENABLED !== false

        // Cancel any existing transcription job BEFORE updating database
        // This ensures the old job is stopped before we start a new one
        const wasCancelled =
            transcriptionService.cancelTranscriptionJob(lessonId)
        if (wasCancelled) {
            // Give a small delay to ensure the process is killed
            await new Promise((resolve) => setTimeout(resolve, 500))
        }

        const updatedLesson = await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                videoUrl,
                videoDuration,
                hlsUrl: null,
                hlsStatus: HLS_STATUS.PROCESSING,
                transcriptUrl: null,
                transcriptJsonUrl: null,
                transcriptStatus: shouldTranscribe
                    ? TRANSCRIPT_STATUS.PROCESSING
                    : TRANSCRIPT_STATUS.IDLE,
            },
        })

        if (shouldTranscribe) {
            // Start new transcription job after ensuring old one is cancelled
            setImmediate(() => {
                transcriptionService
                    .transcribeLessonVideo({
                        videoPath: file.path,
                        lessonId,
                        userId,
                        source: 'lesson-route-video-upload',
                    })
                    .catch((error) => {
                        prisma.lesson
                            .update({
                                where: { id: lessonId },
                                data: {
                                    transcriptStatus: TRANSCRIPT_STATUS.FAILED,
                                },
                            })
                            .catch((statusError) => {})
                    })
            })
        }

        // Enqueue HLS conversion in the background (non-blocking)
        // Pass courseId to the job so it can use course-based paths
        setImmediate(() => {
            enqueueHlsJob({ lessonId, videoPath: file.path, courseId }).catch(
                (error) => {
                    prisma.lesson
                        .update({
                            where: { id: lessonId },
                            data: {
                                hlsStatus: HLS_STATUS.FAILED,
                                hlsUrl: null,
                            },
                        })
                        .catch((updateError) => {})
                }
            )
        })

        // Recalculate course duration based on lesson video durations
        await this._recalcCourseDuration(courseId)

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
                transcriptJsonUrl: true,
            },
        })

        if (!lesson) {
            throw new Error('Không tìm thấy bài học')
        }

        if (lesson.courseId !== courseId) {
            throw new Error('Bài học không thuộc về khóa học này')
        }

        // Delete old transcript if exists
        if (lesson.transcriptUrl) {
            const filename = path.basename(lesson.transcriptUrl)
            this._deleteTranscriptFiles(
                filename,
                courseId,
                lesson.transcriptJsonUrl
            )
        }

        // Save new transcript URL (course-based path)
        const transcriptUrl = `/uploads/courses/${courseId}/transcripts/${file.filename}`

        const updatedLesson = await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                transcriptUrl,
                transcriptJsonUrl: null, // Manual upload, clear auto-generated JSON
                transcriptStatus: TRANSCRIPT_STATUS.COMPLETED, // Manual upload is always completed
            },
        })

        return updatedLesson
    }

    /**
     * Request transcript creation for a lesson that has video but no transcript
     */
    async requestTranscript(courseId, lessonId, userId) {
        // Check if lesson exists
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            select: {
                id: true,
                courseId: true,
                title: true,
                videoUrl: true,
                transcriptStatus: true,
            },
        })

        if (!lesson) {
            throw new Error('Không tìm thấy bài học')
        }

        if (lesson.courseId !== courseId) {
            throw new Error('Bài học không thuộc về khóa học này')
        }

        // Check if lesson has video
        if (!lesson.videoUrl) {
            throw new Error(
                'Bài học không có video. Vui lòng tải video lên trước'
            )
        }

        // Check if transcript is already processing or completed
        if (lesson.transcriptStatus === TRANSCRIPT_STATUS.PROCESSING) {
            throw new Error('Transcript hiện đang được xử lý')
        }

        if (lesson.transcriptStatus === TRANSCRIPT_STATUS.COMPLETED) {
            throw new Error('Transcript đã tồn tại trong bài học này')
        }

        // Check if Whisper is enabled
        if (config.WHISPER_ENABLED === false) {
            throw new Error('Whisper transcription bị tắt')
        }

        // Get video file path
        const videoFilename = path.basename(lesson.videoUrl)
        const videoPath = path.join(
            pathUtil.getVideoDir(courseId),
            videoFilename
        )

        if (!fs.existsSync(videoPath)) {
            throw new Error('Không tìm thấy video file')
        }

        // Update transcript status to PROCESSING
        const updatedLesson = await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                transcriptStatus: TRANSCRIPT_STATUS.PROCESSING,
                transcriptUrl: null,
                transcriptJsonUrl: null,
            },
        })

        // Start transcription process
        transcriptionService.cancelTranscriptionJob(lessonId) // Cancel any existing job
        setImmediate(() => {
            transcriptionService
                .transcribeLessonVideo({
                    videoPath,
                    lessonId,
                    userId,
                    source: 'manual-request',
                })
                .catch((error) => {
                    prisma.lesson
                        .update({
                            where: { id: lessonId },
                            data: {
                                transcriptStatus: TRANSCRIPT_STATUS.FAILED,
                            },
                        })
                        .catch((statusError) => {})
                })
        })

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
            throw new Error('Không tìm thấy bài học')
        }

        if (lesson.courseId !== courseId) {
            throw new Error('Bài học không thuộc về khóa học này')
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

        return updatedLesson
    }

    /**
     * Reorder multiple lessons in a chapter
     */
    async reorderLessons(courseId, chapterId, lessonIds) {
        // Verify chapter belongs to course
        const chapter = await prisma.chapter.findUnique({
            where: { id: chapterId },
            select: {
                id: true,
                courseId: true,
            },
        })

        if (!chapter) {
            throw new Error('Không tìm thấy chương học')
        }

        if (chapter.courseId !== courseId) {
            throw new Error('Chương học không thuộc về khóa học này')
        }

        // Verify all lessons belong to this chapter
        const lessons = await prisma.lesson.findMany({
            where: {
                id: { in: lessonIds },
                chapterId: chapterId,
            },
            select: {
                id: true,
                lessonOrder: true,
            },
        })

        if (lessons.length !== lessonIds.length) {
            throw new Error(
                'Một số bài học không thuộc về chương này hoặc không tồn tại'
            )
        }

        // Update lesson orders in transaction
        await prisma.$transaction(async (tx) => {
            for (let i = 0; i < lessonIds.length; i++) {
                const lessonId = lessonIds[i]
                const newOrder = i + 1

                await tx.lesson.update({
                    where: { id: lessonId },
                    data: { lessonOrder: newOrder },
                })
            }
        })
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
            throw new Error('Không tìm thấy bài học')
        }

        if (lesson.courseId !== courseId) {
            throw new Error('Bài học không thuộc về khóa học này')
        }

        const updatedLesson = await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                isPublished,
            },
        })

        return updatedLesson
    }
}

export default new LessonsService()
