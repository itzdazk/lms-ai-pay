// src/services/users.service.js
import { prisma } from '../config/database.config.js'
import BcryptUtil from '../utils/bcrypt.util.js'
import { USER_ROLES, USER_STATUS, HTTP_STATUS } from '../config/constants.js'
import path from 'path'
import fs from 'fs'
import { avatarsDir } from '../config/multer.config.js'

class UsersService {
    /**
     * Get current user profile
     */
    async getProfile(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                userName: true,
                email: true,
                fullName: true,
                avatarUrl: true,
                phone: true,
                bio: true,
                role: true,
                status: true,
                emailVerified: true,
                emailVerifiedAt: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
            },
        })

        if (!user) {
            throw new Error('Không tìm thấy người dùng')
        }

        return user
    }

    /**
     * Update current user profile
     */
    async updateProfile(userId, data) {
        const updateData = {}

        if (data.fullName !== undefined) {
            updateData.fullName = data.fullName.trim()
        }
        if (data.phone !== undefined) {
            updateData.phone = data.phone ? data.phone.trim() : null
        }
        if (data.bio !== undefined) {
            updateData.bio = data.bio ? data.bio.trim() : null
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                userName: true,
                email: true,
                fullName: true,
                avatarUrl: true,
                phone: true,
                bio: true,
                role: true,
                status: true,
                emailVerified: true,
                createdAt: true,
                updatedAt: true,
            },
        })

        return user
    }

    /**
     * Upload avatar
     */
    async uploadAvatar(userId, file) {
        if (!file) {
            throw new Error('Không tải tệp nào lên')
        }

        // Get current user to delete old avatar if exists
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { avatarUrl: true },
        })

        // Generate avatar URL (relative path from uploads directory)
        const avatarUrl = `/uploads/shared/avatars/${file.filename}`

        // Update user with new avatar URL
        const user = await prisma.user.update({
            where: { id: userId },
            data: { avatarUrl },
            select: {
                id: true,
                userName: true,
                email: true,
                fullName: true,
                avatarUrl: true,
                createdAt: true,
                updatedAt: true,
            },
        })

        // Delete old avatar file if exists
        if (currentUser?.avatarUrl) {
            try {
                // Extract filename from avatarUrl (e.g., /uploads/avatars/filename.webp -> filename.webp)
                const filename = path.basename(currentUser.avatarUrl)
                const oldAvatarPath = path.join(avatarsDir, filename)

                if (fs.existsSync(oldAvatarPath)) {
                    fs.unlinkSync(oldAvatarPath)
                } else {
                }
            } catch (error) {}
        }

        return user
    }

    /**
     * Change password
     */
    async changePassword(userId, currentPassword, newPassword) {
        // Get user with password hash
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                passwordHash: true,
                userName: true,
            },
        })

        if (!user) {
            const error = new Error('Không tìm thấy người dùng')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Verify current password
        const isPasswordValid = await BcryptUtil.compare(
            currentPassword,
            user.passwordHash
        )

        if (!isPasswordValid) {
            const error = new Error('Mật khẩu hiện tại không đúng')
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }

        // Hash new password
        const newPasswordHash = await BcryptUtil.hash(newPassword)

        // Double-check user still exists before updating (race condition protection)
        const userStillExists = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        })

        if (!userStillExists) {
            const error = new Error('Không tìm thấy người dùng')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Update password
        const updatedUser = await prisma.user
            .update({
                where: { id: userId },
                data: { passwordHash: newPasswordHash },
            })
            .catch((error) => {
                if (error.code === 'P2025') {
                    // Record not found
                    const notFoundError = new Error('Không tìm thấy người dùng')
                    notFoundError.statusCode = HTTP_STATUS.NOT_FOUND
                    throw notFoundError
                }
                throw error
            })

        return { message: 'Mật khẩu đã được thay đổi thành công' }
    }

    /**
     * Get users list (Admin only)
     */
    async getUsers(query) {
        const {
            page = 1,
            limit = 20,
            role,
            status,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = query

        // Parse page and limit to integers
        const pageNum = parseInt(page, 10) || 1
        const limitNum = parseInt(limit, 10) || 20

        const skip = (pageNum - 1) * limitNum

        // Build where clause
        const where = {}

        if (role) {
            where.role = role
        }

        if (status) {
            where.status = status
        }

        if (search) {
            where.OR = [
                { userName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { fullName: { contains: search, mode: 'insensitive' } },
            ]
        }

        // Build orderBy clause
        const validSortFields = [
            'createdAt',
            'fullName',
            'email',
            'updatedAt',
            'lastLoginAt',
        ]
        const sortField = validSortFields.includes(sortBy)
            ? sortBy
            : 'createdAt'
        const sortDirection = sortOrder === 'asc' ? 'asc' : 'desc'
        const orderBy = { [sortField]: sortDirection }

        // Get users and total count
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limitNum,
                select: {
                    id: true,
                    userName: true,
                    email: true,
                    fullName: true,
                    avatarUrl: true,
                    phone: true,
                    bio: true,
                    role: true,
                    status: true,
                    emailVerified: true,
                    lastLoginAt: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy,
            }),
            prisma.user.count({ where }),
        ])

        return {
            users,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        }
    }

    /**
     * Get user by ID
     */
    async getUserById(userId) {
        const userIdInt = parseInt(userId, 10)
        if (isNaN(userIdInt)) {
            throw new Error('Invalid user ID')
        }

        const user = await prisma.user.findUnique({
            where: { id: userIdInt },
            select: {
                id: true,
                userName: true,
                email: true,
                fullName: true,
                avatarUrl: true,
                phone: true,
                bio: true,
                role: true,
                status: true,
                emailVerified: true,
                emailVerifiedAt: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
            },
        })

        if (!user) {
            throw new Error('Không tìm thấy người dùng')
        }

        return user
    }

    /**
     * Update user (Admin only)
     */
    async updateUser(userId, data) {
        const userIdInt = parseInt(userId, 10)
        if (isNaN(userIdInt)) {
            throw new Error('ID người dùng không hợp lệ')
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userIdInt },
            select: { id: true, userName: true, role: true },
        })

        if (!existingUser) {
            throw new Error('Không tìm thấy người dùng')
        }

        // Prevent changing admin role to non-admin
        if (
            existingUser.role === USER_ROLES.ADMIN &&
            data.role !== undefined &&
            data.role !== USER_ROLES.ADMIN
        ) {
            throw new Error(
                'Không thể thay đổi quyền admin thành quyền người dùng'
            )
        }

        // Prevent changing role to admin or guest (only STUDENT and INSTRUCTOR are allowed)
        if (data.role !== undefined) {
            const roleUpper = data.role?.toUpperCase()

            // Block ADMIN
            if (
                data.role === USER_ROLES.ADMIN ||
                roleUpper === USER_ROLES.ADMIN
            ) {
                throw new Error(
                    'Không thể thay đổi vai trò người dùng thành Admin thông qua API'
                )
            }

            // Block GUEST - only STUDENT and INSTRUCTOR are allowed
            if (
                data.role === USER_ROLES.GUEST ||
                roleUpper === USER_ROLES.GUEST
            ) {
                throw new Error(
                    'Không thể thay đổi vai trò người dùng thành khách hàng. Chỉ STUDENT và INSTRUCTOR được phép'
                )
            }

            // Only allow STUDENT and INSTRUCTOR
            if (
                data.role !== USER_ROLES.STUDENT &&
                data.role !== USER_ROLES.INSTRUCTOR &&
                roleUpper !== USER_ROLES.STUDENT &&
                roleUpper !== USER_ROLES.INSTRUCTOR
            ) {
                throw new Error(
                    'Vai trò không hợp lệ. Chỉ STUDENT và INSTRUCTOR được phép'
                )
            }
        }

        const updateData = {}

        if (data.fullName !== undefined) {
            updateData.fullName = data.fullName.trim()
        }
        if (data.phone !== undefined) {
            updateData.phone = data.phone ? data.phone.trim() : null
        }
        if (data.bio !== undefined) {
            updateData.bio = data.bio ? data.bio.trim() : null
        }
        if (data.role !== undefined) {
            updateData.role = data.role
        }
        if (data.status !== undefined) {
            updateData.status = data.status
        }
        if (data.emailVerified !== undefined) {
            updateData.emailVerified = data.emailVerified
            if (data.emailVerified && !existingUser.emailVerifiedAt) {
                updateData.emailVerifiedAt = new Date()
            }
        }

        const user = await prisma.user.update({
            where: { id: userIdInt },
            data: updateData,
            select: {
                id: true,
                userName: true,
                email: true,
                fullName: true,
                avatarUrl: true,
                phone: true,
                bio: true,
                role: true,
                status: true,
                emailVerified: true,
                emailVerifiedAt: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
            },
        })

        return user
    }

    /**
     * Change user role (Admin only)
     */
    async changeUserRole(userId, role) {
        const userIdInt = parseInt(userId, 10)
        if (isNaN(userIdInt)) {
            throw new Error('ID người dùng không hợp lệ')
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userIdInt },
            select: { id: true, userName: true, role: true },
        })

        if (!existingUser) {
            throw new Error('Không tìm thấy người dùng')
        }

        // Prevent changing admin role to non-admin
        if (
            existingUser.role === USER_ROLES.ADMIN &&
            role !== USER_ROLES.ADMIN
        ) {
            throw new Error(
                'Không thể thay đổi quyền admin thành quyền người dùng'
            )
        }

        // Prevent changing role to admin or guest (only STUDENT and INSTRUCTOR are allowed)
        // Check both uppercase and compare with constant
        const roleUpper = role?.toUpperCase()

        // Block ADMIN
        if (role === USER_ROLES.ADMIN || roleUpper === USER_ROLES.ADMIN) {
            throw new Error(
                'Không thể thay đổi vai trò người dùng thành Admin thông qua API'
            )
        }

        // Block GUEST - only STUDENT and INSTRUCTOR are allowed
        if (role === USER_ROLES.GUEST || roleUpper === USER_ROLES.GUEST) {
            throw new Error(
                'Không thể thay đổi vai trò người dùng thành khách hàng. Chỉ STUDENT và INSTRUCTOR được phép'
            )
        }

        // Only allow STUDENT and INSTRUCTOR
        if (
            role !== USER_ROLES.STUDENT &&
            role !== USER_ROLES.INSTRUCTOR &&
            roleUpper !== USER_ROLES.STUDENT &&
            roleUpper !== USER_ROLES.INSTRUCTOR
        ) {
            throw new Error(
                'Vai trò không hợp lệ. Chỉ STUDENT và INSTRUCTOR được phép'
            )
        }

        const user = await prisma.user.update({
            where: { id: userIdInt },
            data: { role },
            select: {
                id: true,
                userName: true,
                email: true,
                fullName: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
        })

        return user
    }

    /**
     * Change user status (Admin only)
     */
    async changeUserStatus(userId, status) {
        const userIdInt = parseInt(userId, 10)
        if (isNaN(userIdInt)) {
            throw new Error('Invalid user ID')
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userIdInt },
            select: { id: true, userName: true, role: true },
        })

        if (!existingUser) {
            throw new Error('User not found')
        }

        // Prevent changing admin status (safety check)
        if (
            existingUser.role === USER_ROLES.ADMIN &&
            status !== USER_STATUS.ACTIVE
        ) {
            throw new Error('Không thể thay đổi trạng thái người dùng admin')
        }

        const user = await prisma.user.update({
            where: { id: userIdInt },
            data: { status },
            select: {
                id: true,
                userName: true,
                email: true,
                fullName: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
        })

        return user
    }

    /**
     * Delete user (Admin only)
     */
    async deleteUser(userId) {
        const userIdInt = parseInt(userId, 10)
        if (isNaN(userIdInt)) {
            throw new Error('ID người dùng không hợp lệ')
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userIdInt },
            select: {
                id: true,
                userName: true,
                email: true,
                avatarUrl: true,
                role: true,
            },
        })

        if (!user) {
            throw new Error('Không tìm thấy người dùng')
        }

        // Prevent deleting admin users (safety check)
        if (user.role === USER_ROLES.ADMIN) {
            throw new Error('Không thể xóa người dùng admin')
        }

        // Delete avatar file if exists
        if (user.avatarUrl) {
            try {
                const avatarPath = path.join(
                    process.cwd(),
                    'backend',
                    user.avatarUrl
                )
                if (fs.existsSync(avatarPath)) {
                    fs.unlinkSync(avatarPath)
                }
            } catch (error) {}
        }

        // Delete user (cascade will handle related records)
        await prisma.user.delete({
            where: { id: userIdInt },
        })

        return { message: 'User deleted successfully' }
    }

    /**
     * Get user enrollments (Admin only)
     */
    async getUserEnrollments(userId, filters) {
        const userIdInt = parseInt(userId, 10)
        if (isNaN(userIdInt)) {
            throw new Error('ID người dùng không hợp lệ')
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userIdInt },
            select: { id: true, userName: true },
        })

        if (!user) {
            throw new Error('Không tìm thấy người dùng')
        }

        const {
            page = 1,
            limit = 20,
            status,
            search,
            sort = 'newest',
        } = filters

        const skip = (page - 1) * limit

        // Build where clause
        const where = {
            userId: userIdInt,
        }

        // Filter by status
        if (status) {
            where.status = status
        }

        // Search in course title
        if (search) {
            where.course = {
                title: {
                    contains: search,
                    mode: 'insensitive',
                },
            }
        }

        // Build orderBy clause
        let orderBy = {}
        switch (sort) {
            case 'oldest':
                orderBy = { enrolledAt: 'asc' }
                break
            case 'progress':
                orderBy = { progressPercentage: 'desc' }
                break
            case 'lastAccessed':
                orderBy = { lastAccessedAt: 'desc' }
                break
            case 'newest':
            default:
                orderBy = { enrolledAt: 'desc' }
        }

        // Execute query
        const [enrollments, total] = await Promise.all([
            prisma.enrollment.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                select: {
                    id: true,
                    userId: true,
                    courseId: true,
                    enrolledAt: true,
                    startedAt: true,
                    completedAt: true,
                    progressPercentage: true,
                    lastAccessedAt: true,
                    expiresAt: true,
                    status: true,
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            userName: true,
                            email: true,
                            role: true,
                        },
                    },
                    course: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            thumbnailUrl: true,
                            shortDescription: true,
                            level: true,
                            durationHours: true,
                            totalLessons: true,
                            instructor: {
                                select: {
                                    id: true,
                                    fullName: true,
                                    userName: true,
                                },
                            },
                        },
                    },
                },
            }),
            prisma.enrollment.count({ where }),
        ])

        return {
            enrollments,
            totalEnrollments: total,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        }
    }

    /**
     * Delete a specific enrollment for a user (Admin only)
     */
    async deleteUserEnrollment(userId, enrollmentId) {
        const userIdInt = parseInt(userId, 10)
        const enrollmentIdInt = parseInt(enrollmentId, 10)

        if (isNaN(userIdInt) || isNaN(enrollmentIdInt)) {
            throw new Error('ID người dùng hoặc ID đăng ký không hợp lệ')
        }

        // Ensure enrollment belongs to user and grab course for cleanup
        const enrollment = await prisma.enrollment.findFirst({
            where: {
                id: enrollmentIdInt,
                userId: userIdInt,
            },
            select: { id: true, courseId: true },
        })

        if (!enrollment) {
            const error = new Error('Không tìm thấy đăng ký cho người dùng này')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Delete related learning artifacts for this course/user, then enrollment
        await prisma.$transaction([
            prisma.progress.deleteMany({
                where: {
                    userId: userIdInt,
                    courseId: enrollment.courseId,
                },
            }),
            prisma.quizSubmission.deleteMany({
                where: {
                    userId: userIdInt,
                    quiz: { courseId: enrollment.courseId },
                },
            }),
            prisma.lessonNote.deleteMany({
                where: {
                    userId: userIdInt,
                    courseId: enrollment.courseId,
                },
            }),
            prisma.enrollment.delete({ where: { id: enrollmentIdInt } }),
        ])

        const totalRemaining = await prisma.enrollment.count({
            where: { userId: userIdInt },
        })

        return {
            message: 'Enrollment deleted successfully',
            totalEnrollments: totalRemaining,
        }
    }
}

export default new UsersService()
