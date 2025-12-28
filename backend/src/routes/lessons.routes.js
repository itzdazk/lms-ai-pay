// src/routes/lessons.routes.js
import express from 'express'
import lessonsController from '../controllers/lessons.controller.js'
import {
    getLessonByIdValidator,
    getLessonVideoValidator,
    getLessonTranscriptValidator,
} from '../validators/lessons.validator.js'
import { authenticate } from '../middlewares/authenticate.middleware.js'
import { isEnrolledOrInstructorOrAdmin } from '../middlewares/role.middleware.js'
import { restrictLessonAccess } from '../middlewares/lesson.middleware.js'

const router = express.Router()

// All lesson endpoints require authenticated users
router.use(authenticate)

/**
 * @route   GET /api/v1/lessons/:id
 * @desc    Get lesson by ID
 * @access  Private (enrolled users, course instructor, admin)
 */
router.get(
    '/:id',
    getLessonByIdValidator,
    isEnrolledOrInstructorOrAdmin('id'),
    restrictLessonAccess,
    lessonsController.getLessonById
)

/**
 * @route   GET /api/v1/lessons/:id/video
 * @desc    Get lesson video URL
 * @access  Private (enrolled users, course instructor, admin)
 */
router.get(
    '/:id/video',
    getLessonVideoValidator,
    isEnrolledOrInstructorOrAdmin('id'),
    restrictLessonAccess,
    lessonsController.getLessonVideo
)

/**
 * @route   GET /api/v1/lessons/:id/transcript
 * @desc    Get lesson transcript URL
 * @access  Private (enrolled users, course instructor, admin)
 */
router.get(
    '/:id/transcript',
    getLessonTranscriptValidator,
    isEnrolledOrInstructorOrAdmin('id'),
    restrictLessonAccess,
    lessonsController.getLessonTranscript
)

export default router
