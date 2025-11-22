// src/routes/instructor.routes.js
import express from 'express'
import lessonsController from '../controllers/lessons.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { isInstructor } from '../middlewares/role.middleware.js'
import { isCourseInstructorOrAdmin } from '../middlewares/role.middleware.js'
import { checkLessonExists } from '../middlewares/lesson.middleware.js'
import {
    createLessonValidator,
    updateLessonValidator,
    deleteLessonValidator,
    uploadVideoValidator,
    uploadTranscriptValidator,
    reorderLessonValidator,
    publishLessonValidator,
} from '../validators/lessons.validator.js'
import { uploadVideo, uploadTranscript } from '../config/multer.config.js'
import ApiResponse from '../utils/response.util.js'

const router = express.Router()

/**
 * @route   POST /api/v1/instructor/courses/:courseId/lessons
 * @desc    Create new lesson
 * @access  Private (Instructor/Admin)
 */
router.post(
    '/courses/:courseId/lessons',
    authenticate,
    isInstructor,
    isCourseInstructorOrAdmin,
    createLessonValidator,
    lessonsController.createLesson
)

/**
 * @route   PUT /api/v1/instructor/courses/:courseId/lessons/:id
 * @desc    Update lesson
 * @access  Private (Instructor/Admin)
 */
router.put(
    '/courses/:courseId/lessons/:id',
    authenticate,
    isInstructor,
    isCourseInstructorOrAdmin,
    updateLessonValidator,
    checkLessonExists, // Check lesson exists before update
    lessonsController.updateLesson
)

/**
 * @route   DELETE /api/v1/instructor/courses/:courseId/lessons/:id
 * @desc    Delete lesson
 * @access  Private (Instructor/Admin)
 */
router.delete(
    '/courses/:courseId/lessons/:id',
    authenticate,
    isInstructor,
    isCourseInstructorOrAdmin,
    deleteLessonValidator,
    checkLessonExists, // Check lesson exists before delete
    lessonsController.deleteLesson
)

/**
 * @route   PATCH /api/v1/instructor/courses/:courseId/lessons/:id/video
 * @desc    Upload video to lesson
 * @access  Private (Instructor/Admin)
 */
router.patch(
    '/courses/:courseId/lessons/:id/video',
    authenticate,
    isInstructor,
    isCourseInstructorOrAdmin,
    uploadVideoValidator,
    checkLessonExists, // Check lesson exists BEFORE multer uploads file
    (req, res, next) => {
        uploadVideo.single('video')(req, res, (err) => {
            if (err) {
                if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    // Log the field name that was sent for debugging
                    console.log('Received fields:', req.body, req.files)
                    return ApiResponse.badRequest(
                        res,
                        'Unexpected field. Please use field name "video" for the file upload. Make sure your form-data uses the field name "video".'
                    )
                }
                return next(err)
            }
            next()
        })
    },
    lessonsController.uploadVideo
)

/**
 * @route   PATCH /api/v1/instructor/courses/:courseId/lessons/:id/transcript
 * @desc    Upload transcript to lesson
 * @access  Private (Instructor/Admin)
 */
router.patch(
    '/courses/:courseId/lessons/:id/transcript',
    authenticate,
    isInstructor,
    isCourseInstructorOrAdmin,
    uploadTranscriptValidator,
    checkLessonExists, // Check lesson exists BEFORE multer uploads file
    (req, res, next) => {
        uploadTranscript.single('transcript')(req, res, (err) => {
            if (err) {
                if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    return ApiResponse.badRequest(
                        res,
                        'Unexpected field. Please use field name "transcript" for the file upload.'
                    )
                }
                return next(err)
            }
            next()
        })
    },
    lessonsController.uploadTranscript
)

/**
 * @route   PATCH /api/v1/instructor/courses/:courseId/lessons/:id/order
 * @desc    Reorder lesson
 * @access  Private (Instructor/Admin)
 */
router.patch(
    '/courses/:courseId/lessons/:id/order',
    authenticate,
    isInstructor,
    isCourseInstructorOrAdmin,
    reorderLessonValidator,
    checkLessonExists, // Check lesson exists before reorder
    lessonsController.reorderLesson
)

/**
 * @route   PATCH /api/v1/instructor/courses/:courseId/lessons/:id/publish
 * @desc    Publish/Unpublish lesson
 * @access  Private (Instructor/Admin)
 */
router.patch(
    '/courses/:courseId/lessons/:id/publish',
    authenticate,
    isInstructor,
    isCourseInstructorOrAdmin,
    publishLessonValidator,
    checkLessonExists, // Check lesson exists before publish
    lessonsController.publishLesson
)

export default router



