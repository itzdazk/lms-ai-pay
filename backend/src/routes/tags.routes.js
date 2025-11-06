// src/routes/tags.routes.js
import express from 'express'
import tagsController from '../controllers/tags.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { isInstructor } from '../middlewares/role.middleware.js'
import {
    createTagValidator,
    updateTagValidator,
    getTagByIdValidator,
    getTagsValidator,
    getTagCoursesValidator,
    deleteTagValidator,
} from '../validators/tags.validator.js'

const router = express.Router()

/**
 * @route   GET /api/v1/tags
 * @desc    Get tags list with pagination and search
 * @access  Public
 */
router.get(
    '/',
    getTagsValidator,
    tagsController.getTags
)

/**
 * @route   GET /api/v1/tags/:id/courses
 * @desc    Get courses by tag ID
 * @access  Public
 * @note    Must be defined before /:id to avoid route conflict
 */
router.get(
    '/:id/courses',
    getTagCoursesValidator,
    tagsController.getTagCourses
)

/**
 * @route   GET /api/v1/tags/:id
 * @desc    Get tag by ID
 * @access  Public
 */
router.get(
    '/:id',
    getTagByIdValidator,
    tagsController.getTagById
)

/**
 * @route   POST /api/v1/tags
 * @desc    Create new tag
 * @access  Private (Admin/Instructor)
 */
router.post(
    '/',
    authenticate,
    isInstructor,
    createTagValidator,
    tagsController.createTag
)

/**
 * @route   PUT /api/v1/tags/:id
 * @desc    Update tag
 * @access  Private (Admin/Instructor)
 */
router.put(
    '/:id',
    authenticate,
    isInstructor,
    updateTagValidator,
    tagsController.updateTag
)

/**
 * @route   DELETE /api/v1/tags/:id
 * @desc    Delete tag
 * @access  Private (Admin/Instructor)
 */
router.delete(
    '/:id',
    authenticate,
    isInstructor,
    deleteTagValidator,
    tagsController.deleteTag
)

export default router

