// src/routes/lessons.routes.js
import express from 'express'
import lessonsController from '../controllers/lessons.controller.js'
import {
    getLessonByIdValidator,
    getLessonVideoValidator,
    getLessonTranscriptValidator,
} from '../validators/lessons.validator.js'

const router = express.Router()

/**
 * @route   GET /api/v1/lessons/:id
 * @desc    Get lesson by ID
 * @access  Public
 */
router.get(
    '/:id',
    getLessonByIdValidator,
    lessonsController.getLessonById
)

/**
 * @route   GET /api/v1/lessons/:id/video
 * @desc    Get lesson video URL
 * @access  Public
 */
router.get(
    '/:id/video',
    getLessonVideoValidator,
    lessonsController.getLessonVideo
)

/**
 * @route   GET /api/v1/lessons/:id/transcript
 * @desc    Get lesson transcript URL
 * @access  Public
 */
router.get(
    '/:id/transcript',
    getLessonTranscriptValidator,
    lessonsController.getLessonTranscript
)

export default router



