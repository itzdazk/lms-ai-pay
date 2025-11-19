// src/routes/upload.routes.js
import express from 'express'
import uploadController from '../controllers/upload.controller.js'
import { authenticate } from '../middlewares/authenticate.middleware.js'
import { USER_ROLES } from '../config/constants.js'
import {
    uploadAvatar,
    uploadVideo,
    uploadTranscript,
    uploadThumbnail,
    uploadVideoPreview,
} from '../config/multer.config.js'
import { uploadFileValidator } from '../validators/upload.validator.js'
import { isInstructor } from '../middlewares/role.middleware.js'

const router = express.Router()

/**
 * @route   POST /api/v1/uploads/image
 * @desc    Upload image file (avatar, thumbnail, etc.)
 * @access  Private
 * @query   type - Optional: 'avatar' | 'thumbnail' | 'general' (default: 'general')
 */
router.post(
    '/image',
    authenticate,
    (req, res, next) => {
        const type = req.query.type || 'general'

        // Chọn multer middleware dựa trên type
        if (type === 'avatar') {
            return uploadAvatar.single('image')(req, res, next)
        } else if (type === 'thumbnail') {
            return uploadThumbnail(req, res, next)
        } else {
            // General image - dùng thumbnail middleware
            return uploadThumbnail(req, res, next)
        }
    },
    uploadFileValidator,
    uploadController.uploadImage
)

/**
 * @route   POST /api/v1/uploads/video
 * @desc    Upload video file (lesson video, preview video)
 * @access  Private - Instructor/Admin only
 * @query   type - Optional: 'lesson' | 'preview' | 'general' (default: 'general')
 * @query   courseId - Optional: Course ID to associate video with
 * @query   lessonId - Optional: Lesson ID to associate video with
 */
router.post(
    '/video',
    authenticate,
    isInstructor,
    (req, res, next) => {
        const type = req.query.type || 'general'

        // Chọn multer middleware dựa trên type
        if (type === 'preview') {
            return uploadVideoPreview(req, res, next)
        } else {
            // Lesson video hoặc general
            return uploadVideo.single('video')(req, res, next)
        }
    },
    uploadFileValidator,
    uploadController.uploadVideo
)

/**
 * @route   POST /api/v1/uploads/document
 * @desc    Upload document file (PDF, Word, etc.)
 * @access  Private - Instructor/Admin only
 * @query   type - Optional: 'transcript' | 'material' | 'general' (default: 'general')
 * @query   lessonId - Optional: Lesson ID to associate document with
 */
router.post(
    '/document',
    authenticate,
    isInstructor,
    uploadTranscript.single('document'),
    uploadFileValidator,
    uploadController.uploadDocument
)

/**
 * @route   DELETE /api/v1/uploads/:fileId
 * @desc    Delete uploaded file
 * @access  Private
 * @param   fileId - File ID (format: timestamp-userId-filename)
 */
router.delete(
    '/:fileId',
    authenticate,
    isInstructor,
    uploadController.deleteFile
)

/**
 * @route   GET /api/v1/uploads/:fileId/status
 * @desc    Check upload status (especially for large video files)
 * @access  Private
 * @param   fileId - File ID or temporary upload identifier
 */
router.get('/:fileId/status', authenticate, uploadController.getUploadStatus)

/**
 * @route   GET /api/v1/uploads/user/files
 * @desc    Get all uploaded files by current user
 * @access  Private
 * @query   type - Optional filter by file type (image|video|document)
 * @query   page, limit - Pagination
 */
router.get('/user/files', authenticate, uploadController.getUserFiles)

export default router
