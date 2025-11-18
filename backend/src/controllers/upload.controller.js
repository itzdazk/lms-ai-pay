// src/controllers/upload.controller.js
import uploadService from '../services/upload.service.js'
import ApiResponse from '../utils/response.util.js'
import { asyncHandler } from '../middlewares/error.middleware.js'
import logger from '../config/logger.config.js'

class UploadController {
    /**
     * @route   POST /api/v1/uploads/image
     * @desc    Upload image file (avatar, thumbnail, etc.)
     * @access  Private
     * @body    multipart/form-data with 'image' field
     * @query   type - Optional: 'avatar' | 'thumbnail' | 'general' (default: 'general')
     */
    uploadImage = asyncHandler(async (req, res) => {
        if (!req.file) {
            return ApiResponse.badRequest(res, 'No image file provided')
        }

        const userId = req.user.id
        const type = req.query.type || 'general'

        const result = await uploadService.uploadImage(req.file, userId, type)

        return ApiResponse.created(res, result, 'Image uploaded successfully')
    })

    /**
     * @route   POST /api/v1/uploads/video
     * @desc    Upload video file (lesson video, preview video)
     * @access  Private (Instructor/Admin)
     * @body    multipart/form-data with 'video' field
     * @query   type - Optional: 'lesson' | 'preview' | 'general' (default: 'general')
     * @query   courseId - Optional: Course ID to associate video with
     * @query   lessonId - Optional: Lesson ID to associate video with
     */
    uploadVideo = asyncHandler(async (req, res) => {
        if (!req.file) {
            return ApiResponse.badRequest(res, 'No video file provided')
        }

        const userId = req.user.id
        const type = req.query.type || 'general'
        const courseId = req.query.courseId
            ? parseInt(req.query.courseId)
            : null
        const lessonId = req.query.lessonId
            ? parseInt(req.query.lessonId)
            : null

        const result = await uploadService.uploadVideo(req.file, userId, type, {
            courseId,
            lessonId,
        })

        return ApiResponse.created(res, result, 'Video uploaded successfully')
    })

    /**
     * @route   POST /api/v1/uploads/document
     * @desc    Upload document file (PDF, Word, etc.)
     * @access  Private
     * @body    multipart/form-data with 'document' field
     * @query   type - Optional: 'transcript' | 'material' | 'general' (default: 'general')
     * @query   lessonId - Optional: Lesson ID to associate document with
     */
    uploadDocument = asyncHandler(async (req, res) => {
        if (!req.file) {
            return ApiResponse.badRequest(res, 'No document file provided')
        }

        const userId = req.user.id
        const type = req.query.type || 'general'
        const lessonId = req.query.lessonId
            ? parseInt(req.query.lessonId)
            : null

        const result = await uploadService.uploadDocument(
            req.file,
            userId,
            type,
            { lessonId }
        )

        return ApiResponse.created(
            res,
            result,
            'Document uploaded successfully'
        )
    })

    /**
     * @route   DELETE /api/v1/uploads/:fileId
     * @desc    Delete uploaded file
     * @access  Private
     * @param   fileId - File ID (format: timestamp-userId-filename)
     */
    deleteFile = asyncHandler(async (req, res) => {
        const { fileId } = req.params
        const userId = req.user.id
        const userRole = req.user.role

        const result = await uploadService.deleteFile(fileId, userId, userRole)

        return ApiResponse.success(res, result, 'File deleted successfully')
    })

    /**
     * @route   GET /api/v1/uploads/:fileId/status
     * @desc    Check upload status (especially for large video files)
     * @access  Private
     * @param   fileId - File ID or temporary upload identifier
     */
    getUploadStatus = asyncHandler(async (req, res) => {
        const { fileId } = req.params
        const userId = req.user.id

        const result = await uploadService.getUploadStatus(fileId, userId)

        return ApiResponse.success(
            res,
            result,
            'Upload status retrieved successfully'
        )
    })

    /**
     * @route   GET /api/v1/uploads/user/files
     * @desc    Get all uploaded files by current user
     * @access  Private
     * @query   type - Optional filter by file type
     * @query   page, limit - Pagination
     */
    getUserFiles = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const { type, page = 1, limit = 20 } = req.query

        const result = await uploadService.getUserFiles(userId, {
            type,
            page: parseInt(page),
            limit: parseInt(limit),
        })

        return ApiResponse.paginated(
            res,
            result.files,
            {
                page: parseInt(page),
                limit: parseInt(limit),
                total: result.total,
            },
            'User files retrieved successfully'
        )
    })
}

export default new UploadController()
