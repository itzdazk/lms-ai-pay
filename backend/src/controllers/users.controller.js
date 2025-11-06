// src/controllers/users.controller.js
import { asyncHandler } from '../middlewares/error.middleware.js';
import ApiResponse from '../utils/response.util.js';
import usersService from '../services/users.service.js';

class UsersController {
    /**
     * Get current user profile
     * GET /api/v1/users/profile
     */
    getProfile = asyncHandler(async (req, res) => {
        const user = await usersService.getProfile(req.user.id);
        return ApiResponse.success(res, user, 'Profile retrieved successfully');
    });

    /**
     * Update current user profile
     * PUT /api/v1/users/profile
     */
    updateProfile = asyncHandler(async (req, res) => {
        const user = await usersService.updateProfile(req.user.id, req.body);
        return ApiResponse.success(res, user, 'Profile updated successfully');
    });

    /**
     * Upload avatar
     * PATCH /api/v1/users/profile/avatar
     */
    uploadAvatar = asyncHandler(async (req, res) => {
        const user = await usersService.uploadAvatar(req.user.id, req.file);
        return ApiResponse.success(res, user, 'Avatar uploaded successfully');
    });

    /**
     * Change password
     * PUT /api/v1/users/change-password
     */
    changePassword = asyncHandler(async (req, res) => {
        const { currentPassword, newPassword } = req.body;
        await usersService.changePassword(
            req.user.id,
            currentPassword,
            newPassword
        );
        return ApiResponse.success(
            res,
            null,
            'Password changed successfully'
        );
    });

    /**
     * Get users list (Admin only)
     * GET /api/v1/users
     */
    getUsers = asyncHandler(async (req, res) => {
        const result = await usersService.getUsers(req.query);
        return ApiResponse.success(
            res,
            result,
            'Users retrieved successfully'
        );
    });

    /**
     * Get user by ID (Admin only)
     * GET /api/v1/users/:id
     */
    getUserById = asyncHandler(async (req, res) => {
        const user = await usersService.getUserById(req.params.id);
        return ApiResponse.success(res, user, 'User retrieved successfully');
    });

    /**
     * Update user (Admin only)
     * PUT /api/v1/users/:id
     */
    updateUser = asyncHandler(async (req, res) => {
        const user = await usersService.updateUser(req.params.id, req.body);
        return ApiResponse.success(res, user, 'User updated successfully');
    });

    /**
     * Change user role (Admin only)
     * PATCH /api/v1/users/:id/role
     */
    changeUserRole = asyncHandler(async (req, res) => {
        const { role } = req.body;
        const user = await usersService.changeUserRole(req.params.id, role);
        return ApiResponse.success(res, user, 'User role updated successfully');
    });

    /**
     * Change user status (Admin only)
     * PATCH /api/v1/users/:id/status
     */
    changeUserStatus = asyncHandler(async (req, res) => {
        const { status } = req.body;
        const user = await usersService.changeUserStatus(req.params.id, status);
        return ApiResponse.success(res, user, 'User status updated successfully');
    });

    /**
     * Delete user (Admin only)
     * DELETE /api/v1/users/:id
     */
    deleteUser = asyncHandler(async (req, res) => {
        await usersService.deleteUser(req.params.id);
        return ApiResponse.success(res, null, 'User deleted successfully');
    });
}

export default new UsersController();

