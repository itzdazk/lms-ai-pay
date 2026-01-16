// src/controllers/users.controller.js
import { asyncHandler } from '../middlewares/error.middleware.js'
import ApiResponse from '../utils/response.util.js'
import usersService from '../services/users.service.js'

class UsersController {
    /**
     * Get current user profile
     * GET /api/v1/users/profile
     */
    getProfile = asyncHandler(async (req, res) => {
        const user = await usersService.getProfile(req.user.id)
        return ApiResponse.success(res, user, 'Truy xuất hồ sơ thành công')
    })

    /**
     * Update current user profile
     * PUT /api/v1/users/profile
     */
    updateProfile = asyncHandler(async (req, res) => {
        const user = await usersService.updateProfile(req.user.id, req.body)
        return ApiResponse.success(res, user, 'Cập nhật hồ sơ thành công')
    })

    /**
     * Upload avatar
     * PATCH /api/v1/users/profile/avatar
     */
    uploadAvatar = asyncHandler(async (req, res) => {
        const user = await usersService.uploadAvatar(req.user.id, req.file)
        return ApiResponse.success(res, user, 'Tải ảnh đại diện lên thành công')
    })

    /**
     * Change password
     * PUT /api/v1/users/change-password
     */
    changePassword = asyncHandler(async (req, res) => {
        const { currentPassword, newPassword } = req.body
        await usersService.changePassword(
            req.user.id,
            currentPassword,
            newPassword
        )
        return ApiResponse.success(
            res,
            null,
            'Mật khẩu đã được thay đổi thành công'
        )
    })

    /**
     * Get users list (Admin only)
     * GET /api/v1/users
     */
    getUsers = asyncHandler(async (req, res) => {
        const result = await usersService.getUsers(req.query)
        return ApiResponse.success(
            res,
            result,
            'Truy xuất danh sách người dùng thành công'
        )
    })

    /**
     * Get user by ID (Admin only)
     * GET /api/v1/users/:id
     */
    getUserById = asyncHandler(async (req, res) => {
        const user = await usersService.getUserById(req.params.id)
        return ApiResponse.success(
            res,
            user,
            'Truy xuất người dùng thành công.'
        )
    })

    /**
     * Update user (Admin only)
     * PUT /api/v1/users/:id
     */
    updateUser = asyncHandler(async (req, res) => {
        const user = await usersService.updateUser(req.params.id, req.body)
        return ApiResponse.success(res, user, 'Cập nhật người dùng thành công')
    })

    /**
     * Change user role (Admin only)
     * PATCH /api/v1/users/:id/role
     */
    changeUserRole = asyncHandler(async (req, res) => {
        const { role } = req.body
        const user = await usersService.changeUserRole(req.params.id, role)
        return ApiResponse.success(
            res,
            user,
            'Cập nhật vai trò người dùng thành công'
        )
    })

    /**
     * Change user status (Admin only)
     * PATCH /api/v1/users/:id/status
     */
    changeUserStatus = asyncHandler(async (req, res) => {
        const { status } = req.body
        const user = await usersService.changeUserStatus(req.params.id, status)
        return ApiResponse.success(
            res,
            user,
            'Trạng thái người dùng đã được cập nhật thành công'
        )
    })

    /**
     * Delete user (Admin only)
     * DELETE /api/v1/users/:id
     */
    deleteUser = asyncHandler(async (req, res) => {
        await usersService.deleteUser(req.params.id)
        return ApiResponse.success(res, null, 'Người dùng đã bị xóa thành công')
    })

    /**
     * Get user enrollments (Admin only)
     * GET /api/v1/users/:id/enrollments
     */
    getUserEnrollments = asyncHandler(async (req, res) => {
        const userId = parseInt(req.params.id)
        const filters = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 20,
            status: req.query.status,
            search: req.query.search,
            sort: req.query.sort || 'newest',
        }
        const result = await usersService.getUserEnrollments(userId, filters)
        return ApiResponse.success(
            res,
            result,
            'Truy xuất danh sách ghi danh của người dùng thành công'
        )
    })

    /**
     * Delete a user's enrollment (Admin only)
     * DELETE /api/v1/users/:id/enrollments/:enrollmentId
     */
    deleteUserEnrollment = asyncHandler(async (req, res) => {
        const userId = parseInt(req.params.id)
        const enrollmentId = parseInt(req.params.enrollmentId)
        const result = await usersService.deleteUserEnrollment(
            userId,
            enrollmentId
        )
        return ApiResponse.success(
            res,
            result,
            'Ghi danh của người dùng đã bị xóa thành công'
        )
    })
}

export default new UsersController()
