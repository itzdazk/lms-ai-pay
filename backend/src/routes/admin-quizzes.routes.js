// src/routes/admin-quizzes.routes.js
import express from 'express'
import quizzesController from '../controllers/quizzes.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { isAdmin } from '../middlewares/role.middleware.js'
import {
    getAdminQuizzesValidator,
    getAdminQuizSubmissionsValidator,
} from '../validators/quizzes.validator.js'

const router = express.Router()

/**
 * @route   GET /api/v1/admin/quizzes
 * @desc    List quizzes with filters
 * @access  Private (Admin)
 */
router.get(
    '/',
    authenticate,
    isAdmin,
    getAdminQuizzesValidator,
    quizzesController.getAdminQuizzes
)

/**
 * @route   GET /api/v1/admin/quizzes/:quizId/submissions
 * @desc    List quiz submissions
 * @access  Private (Admin)
 */
router.get(
    '/:quizId/submissions',
    authenticate,
    isAdmin,
    getAdminQuizSubmissionsValidator,
    quizzesController.getAdminQuizSubmissions
)

export default router

