// src/routes/users.routes.js
import express from 'express';
import usersController from '../controllers/users.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { isAdmin, isOwnerOrAdmin } from '../middlewares/role.middleware.js';
import { validateId, validatePagination } from '../middlewares/validate.middleware.js';
import {
    updateProfileValidator,
    changePasswordValidator,
    getUsersValidator,
    updateUserValidator,
    userIdValidator,
} from '../validators/users.validator.js';
import { uploadAvatar } from '../config/multer.config.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Profile routes (current user)
router.get('/profile', usersController.getProfile);
router.put('/profile', updateProfileValidator, usersController.updateProfile);
router.post(
    '/avatar',
    uploadAvatar.single('avatar'),
    usersController.uploadAvatar
);
router.put(
    '/password',
    changePasswordValidator,
    usersController.changePassword
);

// Admin routes (users management)
// Route with parameter must be defined before route without parameter
// Allow user to view their own profile or admin to view any user
router.get('/:id', isOwnerOrAdmin('id'), userIdValidator, usersController.getUserById);
router.get(
    '/',
    isAdmin,
    validatePagination,
    getUsersValidator,
    usersController.getUsers
);
router.put(
    '/:id',
    isAdmin,
    userIdValidator,
    updateUserValidator,
    usersController.updateUser
);
router.delete(
    '/:id',
    isAdmin,
    userIdValidator,
    usersController.deleteUser
);

export default router;


