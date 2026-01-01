// src/routes/users.routes.js
import express from 'express'
import usersController from '../controllers/users.controller.js'
import { authenticate } from '../middlewares/authenticate.middleware.js'
import { isAdmin } from '../middlewares/role.middleware.js'
import {
    validateId,
    validatePagination,
} from '../middlewares/validate.middleware.js'
import {
    updateProfileValidator,
    changePasswordValidator,
    getUsersValidator,
    updateUserValidator,
    userIdValidator,
    changeRoleValidator,
    changeStatusValidator,
    getUserEnrollmentsValidator,
    deleteUserEnrollmentValidator,
} from '../validators/users.validator.js'
import { uploadAvatar } from '../config/multer.config.js'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Profile routes (current user)
router.get('/profile', usersController.getProfile)
router.put('/profile', updateProfileValidator, usersController.updateProfile)
router.patch(
    '/profile/avatar',
    uploadAvatar.single('avatar'),
    usersController.uploadAvatar
)
router.put(
    '/change-password',
    changePasswordValidator,
    usersController.changePassword
)

// Admin routes (users management)
// Routes with specific paths must be defined before routes with parameters
router.get(
    '/',
    isAdmin,
    validatePagination,
    getUsersValidator,
    usersController.getUsers
)
// Specific routes (/:id/role, /:id/status) must be before /:id
router.patch(
    '/:id/role',
    isAdmin,
    userIdValidator,
    changeRoleValidator,
    usersController.changeUserRole
)
router.patch(
    '/:id/status',
    isAdmin,
    userIdValidator,
    changeStatusValidator,
    usersController.changeUserStatus
)
// Generic routes with :id parameter
router.get('/:id', isAdmin, userIdValidator, usersController.getUserById)
router.put(
    '/:id',
    isAdmin,
    userIdValidator,
    updateUserValidator,
    usersController.updateUser
)
router.delete('/:id', isAdmin, userIdValidator, usersController.deleteUser)

// Get user enrollments (Admin only)
router.get(
    '/:id/enrollments',
    isAdmin,
    getUserEnrollmentsValidator,
    usersController.getUserEnrollments
)

// Delete a specific enrollment for user (Admin only)
router.delete(
    '/:id/enrollments/:enrollmentId',
    isAdmin,
    deleteUserEnrollmentValidator,
    usersController.deleteUserEnrollment
)

export default router
