// src/routes/chapters.routes.js
import express from 'express'
import chaptersController from '../controllers/chapters.controller.js'
import { authenticate } from '../middlewares/authenticate.middleware.js'
import { isInstructor } from '../middlewares/role.middleware.js'
import {
    getChaptersByCourseValidator,
    getChapterByIdValidator,
    createChapterValidator,
    updateChapterValidator,
    deleteChapterValidator,
    reorderChaptersValidator,
} from '../validators/chapters.validator.js'

const router = express.Router()

/**
 * @route   GET /api/v1/courses/:courseId/chapters
 * @desc    Get all chapters by course ID (Public)
 */
router.get(
    '/courses/:courseId/chapters',
    getChaptersByCourseValidator,
    chaptersController.getChaptersByCourse
)

/**
 * @route   GET /api/v1/chapters/:id
 * @desc    Get chapter by ID (Public)
 */
router.get(
    '/chapters/:id',
    getChapterByIdValidator,
    chaptersController.getChapterById
)

// Instructor routes - require authentication and instructor role
const instructorRouter = express.Router()
instructorRouter.use(authenticate)
instructorRouter.use(isInstructor)

/**
 * @route   POST /api/v1/instructor/courses/:courseId/chapters
 * @desc    Create a new chapter
 * @access  Private (Instructor/Admin)
 */
instructorRouter.post(
    '/courses/:courseId/chapters',
    createChapterValidator,
    chaptersController.createChapter
)

/**
 * @route   PUT /api/v1/instructor/chapters/:id
 * @desc    Update a chapter
 * @access  Private (Instructor/Admin)
 */
instructorRouter.put(
    '/chapters/:id',
    updateChapterValidator,
    chaptersController.updateChapter
)

/**
 * @route   DELETE /api/v1/instructor/chapters/:id
 * @desc    Delete a chapter
 * @access  Private (Instructor/Admin)
 */
instructorRouter.delete(
    '/chapters/:id',
    deleteChapterValidator,
    chaptersController.deleteChapter
)

/**
 * @route   PUT /api/v1/instructor/courses/:courseId/chapters/reorder
 * @desc    Reorder chapters
 * @access  Private (Instructor/Admin)
 */
instructorRouter.put(
    '/courses/:courseId/chapters/reorder',
    reorderChaptersValidator,
    chaptersController.reorderChapters
)

router.use('/instructor', instructorRouter)

export default router

