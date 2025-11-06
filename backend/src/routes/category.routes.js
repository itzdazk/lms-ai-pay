// src/routes/category.routes.js
import express from 'express'
import categoryController from '../controllers/category.controller.js'
import {
    authenticate,
    optionalAuthenticate,
} from '../middlewares/auth.middleware.js'
import { isAdmin, isInstructor } from '../middlewares/role.middleware.js'
import {
    createCategoryValidator,
    updateCategoryValidator,
    getCategoryByIdValidator,
    getCategoryBySlugValidator,
    getCategoriesValidator,
    getCategoryCoursesValidator,
    deleteCategoryValidator,
} from '../validators/category.validator.js'

const router = express.Router()

/**
 * @route   POST /api/v1/categories
 * @desc    Create new category
 * @access  Private (Admin/Instructor)
 */
router.post(
    '/',
    authenticate,
    isInstructor,
    createCategoryValidator,
    categoryController.createCategory
)

/**
 * @route   PUT /api/v1/categories/:id
 * @desc    Update category
 * @access  Private (Admin/Instructor)
 */
router.put(
    '/:id',
    authenticate,
    isInstructor,
    updateCategoryValidator,
    categoryController.updateCategory
)

/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Delete category
 * @access  Private (Admin/Instructor)
 */
router.delete(
    '/:id',
    authenticate,
    isInstructor,
    deleteCategoryValidator,
    categoryController.deleteCategory
)

/**
 * @route   GET /api/v1/categories
 * @desc    Get all categories with optional filters
 * @access  Public
 * @query   page, limit, parentId, isActive, search
 */
router.get('/', getCategoriesValidator, categoryController.getCategories)

export default router
