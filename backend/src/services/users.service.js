// src/services/users.service.js
import { prisma } from '../config/database.config.js';
import BcryptUtil from '../utils/bcrypt.util.js';
import logger from '../config/logger.config.js';
import { USER_ROLES } from '../config/constants.js';
import path from 'path';
import fs from 'fs';

class UsersService {
    /**
     * Get current user profile
     */
    async getProfile(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
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
        });

        if (!user) {
            throw new Error('User not found');
        }

        return user;
    }

    /**
     * Update current user profile
     */
    async updateProfile(userId, data) {
        const updateData = {};

        if (data.fullName !== undefined) {
            updateData.fullName = data.fullName.trim();
        }
        if (data.phone !== undefined) {
            updateData.phone = data.phone ? data.phone.trim() : null;
        }
        if (data.bio !== undefined) {
            updateData.bio = data.bio ? data.bio.trim() : null;
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                username: true,
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
        });

        logger.info(`User profile updated: ${user.username} (${user.id})`);

        return user;
    }

    /**
     * Upload avatar
     */
    async uploadAvatar(userId, file) {
        if (!file) {
            throw new Error('No file uploaded');
        }

        // Get current user to delete old avatar if exists
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { avatarUrl: true },
        });

        // Generate avatar URL (relative path from uploads directory)
        const avatarUrl = `/uploads/avatars/${file.filename}`;

        // Update user with new avatar URL
        const user = await prisma.user.update({
            where: { id: userId },
            data: { avatarUrl },
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                avatarUrl: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        // Delete old avatar file if exists
        if (currentUser?.avatarUrl) {
            try {
                const oldAvatarPath = path.join(
                    process.cwd(),
                    'backend',
                    currentUser.avatarUrl
                );
                if (fs.existsSync(oldAvatarPath)) {
                    fs.unlinkSync(oldAvatarPath);
                    logger.info(`Old avatar deleted: ${currentUser.avatarUrl}`);
                }
            } catch (error) {
                logger.warn(`Failed to delete old avatar: ${error.message}`);
            }
        }

        logger.info(`Avatar uploaded for user: ${user.username} (${user.id})`);

        return user;
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
                username: true,
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Verify current password
        const isPasswordValid = await BcryptUtil.compare(
            currentPassword,
            user.passwordHash
        );

        if (!isPasswordValid) {
            throw new Error('Current password is incorrect');
        }

        // Hash new password
        const newPasswordHash = await BcryptUtil.hash(newPassword);

        // Update password
        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newPasswordHash },
        });

        logger.info(`Password changed for user: ${user.username} (${user.id})`);

        return { message: 'Password changed successfully' };
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
        } = query;

        // Parse page and limit to integers
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 20;

        const skip = (pageNum - 1) * limitNum;

        // Build where clause
        const where = {};

        if (role) {
            where.role = role;
        }

        if (status) {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { username: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { fullName: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Get users and total count
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limitNum,
                select: {
                    id: true,
                    username: true,
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
                orderBy: { createdAt: 'desc' },
            }),
            prisma.user.count({ where }),
        ]);

        return {
            users,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        };
    }

    /**
     * Get user by ID
     */
    async getUserById(userId) {
        const userIdInt = parseInt(userId, 10);
        if (isNaN(userIdInt)) {
            throw new Error('Invalid user ID');
        }

        const user = await prisma.user.findUnique({
            where: { id: userIdInt },
            select: {
                id: true,
                username: true,
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
        });

        if (!user) {
            throw new Error('User not found');
        }

        return user;
    }

    /**
     * Update user (Admin only)
     */
    async updateUser(userId, data) {
        const userIdInt = parseInt(userId, 10);
        if (isNaN(userIdInt)) {
            throw new Error('Invalid user ID');
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userIdInt },
            select: { id: true, username: true, role: true },
        });

        if (!existingUser) {
            throw new Error('User not found');
        }

        // Prevent changing admin role to non-admin
        if (
            existingUser.role === USER_ROLES.ADMIN &&
            data.role !== undefined &&
            data.role !== USER_ROLES.ADMIN
        ) {
            throw new Error('Cannot change admin role to non-admin role');
        }

        const updateData = {};

        if (data.fullName !== undefined) {
            updateData.fullName = data.fullName.trim();
        }
        if (data.phone !== undefined) {
            updateData.phone = data.phone ? data.phone.trim() : null;
        }
        if (data.bio !== undefined) {
            updateData.bio = data.bio ? data.bio.trim() : null;
        }
        if (data.role !== undefined) {
            updateData.role = data.role;
        }
        if (data.status !== undefined) {
            updateData.status = data.status;
        }
        if (data.emailVerified !== undefined) {
            updateData.emailVerified = data.emailVerified;
            if (data.emailVerified && !existingUser.emailVerifiedAt) {
                updateData.emailVerifiedAt = new Date();
            }
        }

        const user = await prisma.user.update({
            where: { id: userIdInt },
            data: updateData,
            select: {
                id: true,
                username: true,
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
        });

        logger.info(`User updated by admin: ${user.username} (${user.id})`);

        return user;
    }

    /**
     * Delete user (Admin only)
     */
    async deleteUser(userId) {
        const userIdInt = parseInt(userId, 10);
        if (isNaN(userIdInt)) {
            throw new Error('Invalid user ID');
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userIdInt },
            select: {
                id: true,
                username: true,
                email: true,
                avatarUrl: true,
                role: true,
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Prevent deleting admin users (safety check)
        if (user.role === USER_ROLES.ADMIN) {
            throw new Error('Cannot delete admin user');
        }

        // Delete avatar file if exists
        if (user.avatarUrl) {
            try {
                const avatarPath = path.join(
                    process.cwd(),
                    'backend',
                    user.avatarUrl
                );
                if (fs.existsSync(avatarPath)) {
                    fs.unlinkSync(avatarPath);
                    logger.info(`Avatar deleted: ${user.avatarUrl}`);
                }
            } catch (error) {
                logger.warn(`Failed to delete avatar: ${error.message}`);
            }
        }

        // Delete user (cascade will handle related records)
        await prisma.user.delete({
            where: { id: userIdInt },
        });

        logger.info(`User deleted: ${user.username} (${user.id})`);

        return { message: 'User deleted successfully' };
    }
}

export default new UsersService();


