// src/controllers/lessons.controller.js
import lessonsService from '../services/lessons.service.js'
import ApiResponse from '../utils/response.util.js'
import { asyncHandler } from '../middlewares/error.middleware.js'
import logger from '../config/logger.config.js'
import fs from 'fs'

class LessonsController {
    /**
     * @route   GET /api/v1/lessons/:id
     * @desc    Get lesson by ID
     * @access  Private (enrolled users, course instructor, admin)
     * @note    Authorization is handled by isEnrolledOrInstructorOrAdmin middleware
     */
    getLessonById = asyncHandler(async (req, res) => {
        const { id } = req.params
        const lesson = await lessonsService.getLessonById(parseInt(id))

        return ApiResponse.success(res, lesson, 'Lesson retrieved successfully')
    })

    /**
     * @route   GET /api/v1/courses/:slug/lessons/:lessonSlug
     * @desc    Get lesson by slug
     * @access  Private (enrolled users, course instructor, admin)
     */
    getLessonBySlug = asyncHandler(async (req, res) => {
        const { slug, lessonSlug } = req.params
        const lesson = await lessonsService.getLessonBySlug(slug, lessonSlug)

        return ApiResponse.success(res, lesson, 'Lesson retrieved successfully')
    })

    /**
     * @route   GET /api/v1/lessons/:id/video
     * @desc    Get lesson video URL
     * @access  Private (enrolled users, course instructor, admin)
     * @note    Authorization is handled by isEnrolledOrInstructorOrAdmin middleware
     */
    getLessonVideo = asyncHandler(async (req, res) => {
        const { id } = req.params
        const result = await lessonsService.getLessonVideo(parseInt(id))

        return ApiResponse.success(
            res,
            {
                id: result.id,
                title: result.title,
                videoUrl: result.videoUrl,
                videoDuration: result.videoDuration,
            },
            'Video URL retrieved successfully'
        )
    })

    /**
     * @route   GET /api/v1/lessons/:id/transcript
     * @desc    Get lesson transcript URL
     * @access  Private (enrolled users, course instructor, admin)
     * @note    Authorization is handled by isEnrolledOrInstructorOrAdmin middleware
     */
    getLessonTranscript = asyncHandler(async (req, res) => {
        const { id } = req.params
        const result = await lessonsService.getLessonTranscript(parseInt(id))

        // If no transcript, return 404 (frontend will handle silently)
        if (!result.transcriptUrl) {
            return ApiResponse.notFound(res, 'Transcript not available for this lesson')
        }

        return ApiResponse.success(
            res,
            {
                id: result.id,
                title: result.title,
                transcriptUrl: result.transcriptUrl,
            },
            'Transcript URL retrieved successfully'
        )
    })

    /**
     * @route   POST /api/v1/instructor/courses/:courseId/lessons
     * @desc    Create new lesson
     * @access  Private (Instructor/Admin)
     */
    createLesson = asyncHandler(async (req, res) => {
        const { courseId } = req.params
        const lesson = await lessonsService.createLesson(
            parseInt(courseId),
            req.body,
            req.user.id
        )

        return ApiResponse.created(res, lesson, 'Lesson created successfully')
    })

    /**
     * @route   PUT /api/v1/instructor/courses/:courseId/lessons/:id
     * @desc    Update lesson
     * @access  Private (Instructor/Admin)
     */
    updateLesson = asyncHandler(async (req, res) => {
        const { courseId, id } = req.params
        const lesson = await lessonsService.updateLesson(
            parseInt(courseId),
            parseInt(id),
            req.body
        )

        return ApiResponse.success(res, lesson, 'Lesson updated successfully')
    })

    /**
     * @route   DELETE /api/v1/instructor/courses/:courseId/lessons/:id
     * @desc    Delete lesson
     * @access  Private (Instructor/Admin)
     */
    deleteLesson = asyncHandler(async (req, res) => {
        const { courseId, id } = req.params

        await lessonsService.deleteLesson(parseInt(courseId), parseInt(id))

        return ApiResponse.success(res, null, 'Lesson deleted successfully')
    })

    /**
     * @route   PATCH /api/v1/instructor/courses/:courseId/lessons/:id/video
     * @desc    Upload video to lesson
     * @access  Private (Instructor/Admin)
     */
    uploadVideo = asyncHandler(async (req, res) => {
        const { courseId, id } = req.params
        const autoCreateTranscript = req.body.autoCreateTranscript === true || req.body.autoCreateTranscript === 'true' || req.query.autoCreateTranscript === 'true'

        if (!req.file) {
            return ApiResponse.badRequest(res, 'Video file is required')
        }

        try {
            const lesson = await lessonsService.uploadVideo(
                parseInt(courseId),
                parseInt(id),
                req.file,
                req.user.id,
                autoCreateTranscript
            )

            return ApiResponse.success(
                res,
                lesson,
                'Video uploaded successfully'
            )
        } catch (error) {
            // Delete uploaded file if there's an error
            if (req.file && req.file.path) {
                try {
                    if (fs.existsSync(req.file.path)) {
                        fs.unlinkSync(req.file.path)
                        logger.info(`Deleted uploaded video file due to error: ${req.file.path}`)
                    }
                } catch (deleteError) {
                    logger.error(`Error deleting uploaded file: ${deleteError.message}`)
                }
            }
            throw error
        }
    })

    /**
     * @route   PATCH /api/v1/instructor/courses/:courseId/lessons/:id/transcript
     * @desc    Upload transcript to lesson
     * @access  Private (Instructor/Admin)
     */
    uploadTranscript = asyncHandler(async (req, res) => {
        const { courseId, id } = req.params

        if (!req.file) {
            return ApiResponse.badRequest(res, 'Transcript file is required')
        }

        try {
            const lesson = await lessonsService.uploadTranscript(
                parseInt(courseId),
                parseInt(id),
                req.file
            )

            return ApiResponse.success(
                res,
                lesson,
                'Transcript uploaded successfully'
            )
        } catch (error) {
            // Delete uploaded file if there's an error
            if (req.file && req.file.path) {
                try {
                    if (fs.existsSync(req.file.path)) {
                        fs.unlinkSync(req.file.path)
                        logger.info(`Deleted uploaded transcript file due to error: ${req.file.path}`)
                    }
                } catch (deleteError) {
                    logger.error(`Error deleting uploaded file: ${deleteError.message}`)
                }
            }
            throw error
        }
    })

    /**
     * @route   POST /api/v1/instructor/courses/:courseId/lessons/:id/transcript/request
     * @desc    Request transcript creation for a lesson
     * @access  Private (Instructor/Admin)
     */
    requestTranscript = asyncHandler(async (req, res) => {
        const { courseId, id } = req.params

        const lesson = await lessonsService.requestTranscript(
            parseInt(courseId),
            parseInt(id),
            req.user.id
        )

        return ApiResponse.success(
            res,
            lesson,
            'Transcript creation requested successfully. Processing will start shortly.'
        )
    })

    /**
     * @route   PATCH /api/v1/instructor/courses/:courseId/lessons/:id/order
     * @desc    Reorder lesson
     * @access  Private (Instructor/Admin)
     */
    reorderLesson = asyncHandler(async (req, res) => {
        const { courseId, id } = req.params
        const { newOrder } = req.body

        const lesson = await lessonsService.reorderLesson(
            parseInt(courseId),
            parseInt(id),
            parseInt(newOrder)
        )

        return ApiResponse.success(res, lesson, 'Lesson reordered successfully')
    })

    /**
     * @route   PUT /api/v1/instructor/courses/:courseId/chapters/:chapterId/lessons/reorder
     * @desc    Reorder multiple lessons in a chapter
     * @access  Private (Instructor/Admin)
     */
    reorderLessons = asyncHandler(async (req, res) => {
        const { courseId, chapterId } = req.params
        const { lessonIds } = req.body

        await lessonsService.reorderLessons(
            parseInt(courseId),
            parseInt(chapterId),
            lessonIds.map((id) => parseInt(id))
        )

        return ApiResponse.success(res, null, 'Lessons reordered successfully')
    })

    /**
     * @route   PATCH /api/v1/instructor/courses/:courseId/lessons/:id/publish
     * @desc    Publish/Unpublish lesson
     * @access  Private (Instructor/Admin)
     */
    publishLesson = asyncHandler(async (req, res) => {
        const { courseId, id } = req.params
        const { isPublished } = req.body

        const lesson = await lessonsService.publishLesson(
            parseInt(courseId),
            parseInt(id),
            isPublished
        )

        return ApiResponse.success(
            res,
            lesson,
            `Lesson ${isPublished ? 'published' : 'unpublished'} successfully`
        )
    })
}

export default new LessonsController()

