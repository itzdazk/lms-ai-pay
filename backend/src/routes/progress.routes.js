
// src/routes/progress.routes.js
import express from 'express'
import progressController from '../controllers/progress.controller.js'
import { authenticate } from '../middlewares/authenticate.middleware.js'
import {
    getCourseProgressValidator,
    getLessonProgressValidator,
    startLessonValidator,
    updateProgressValidator,
    getResumePositionValidator,
} from '../validators/progress.validator.js'

const router = express.Router()

/**
 * @route   GET /api/v1/progress/courses/:courseId
 * @desc    Get course progress
 * @access  Private
 */
router.get(
    '/courses/:courseId',
    authenticate,
    getCourseProgressValidator,
    progressController.getCourseProgress
)

/**
 * @route   GET /api/v1/progress/lessons/:lessonId
 * @desc    Get lesson progress
 * @access  Private
 */
router.get(
    '/lessons/:lessonId',
    authenticate,
    getLessonProgressValidator,
    progressController.getLessonProgress
)

/**
 * @route   POST /api/v1/progress/lessons/:lessonId/start
 * @desc    Start learning a lesson
 * @access  Private
 */
router.post(
    '/lessons/:lessonId/start',
    authenticate,
    startLessonValidator,
    progressController.startLesson
)

/**
 * @route   PUT /api/v1/progress/lessons/:lessonId/update
 * @desc    Update lesson progress (position, watch duration)
 * @access  Private
 */
router.put(
    '/lessons/:lessonId/update',
    authenticate,
    updateProgressValidator,
    progressController.updateProgress
)

/**
 * @route   GET /api/v1/progress/lessons/:lessonId/resume
 * @desc    Get resume position for a lesson
 * @access  Private
 */
router.get(
    '/lessons/:lessonId/resume',
    authenticate,
    getResumePositionValidator,
    progressController.getResumePosition
)

/**
 * @route   GET /api/v1/progress/courses/:courseId/lesson-progress
 * @desc    Get progress status for all lessons in a course (for LessonList UI)
 * @access  Private
 */
router.get(
    '/courses/:courseId/lesson-progress',
    authenticate,
    progressController.getCourseLessonProgressList
)

export default router
