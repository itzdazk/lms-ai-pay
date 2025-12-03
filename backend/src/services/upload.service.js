// src/services/upload.service.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { prisma } from '../config/database.config.js'
import logger from '../config/logger.config.js'
import config from '../config/app.config.js'
import { USER_ROLES } from '../config/constants.js'
import lessonsService from './lessons.service.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class UploadService {
    /**
     * Upload image file
     */
    async uploadImage(file, userId, type = 'general') {
        try {
            // Xây dựng URL truy cập file
            const fileUrl = `${config.SERVER_URL}/uploads/${this._getUploadFolder(type, 'image')}/${file.filename}`

            // Lưu thông tin file vào database (tùy chọn - có thể tạo bảng files)
            const fileInfo = {
                id: file.filename, // Sử dụng filename làm ID tạm thời
                userId,
                type,
                category: 'image',
                filename: file.filename,
                originalName: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                path: file.path,
                url: fileUrl,
                uploadedAt: new Date(),
            }

            logger.info(
                `Image uploaded successfully by user ${userId}: ${file.filename}`
            )

            return fileInfo
        } catch (error) {
            logger.error('Error uploading image:', error)
            // Xóa file nếu có lỗi
            if (file.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path)
            }
            throw new Error('Failed to upload image')
        }
    }

    /**
     * Upload video file
     */
    async uploadVideo(file, userId, type = 'general', metadata = {}) {
        try {
            const { courseId, lessonId } = metadata

            // Xây dựng URL truy cập file
            const fileUrl = `${config.SERVER_URL}/uploads/${this._getUploadFolder(type, 'video')}/${file.filename}`

            // Lưu thông tin file
            const fileInfo = {
                id: file.filename,
                userId,
                type,
                category: 'video',
                filename: file.filename,
                originalName: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                path: file.path,
                url: fileUrl,
                courseId,
                lessonId,
                uploadedAt: new Date(),
                status: 'completed', // Hoặc 'processing' nếu cần xử lý thêm
            }

            // Nếu là video bài học, dùng lessons service để xử lý
            if (type === 'lesson' && lessonId) {
                const resolvedCourseId =
                    courseId || (await this._getLessonCourseId(lessonId))

                if (resolvedCourseId) {
                    await lessonsService.uploadVideo(
                        resolvedCourseId,
                        lessonId,
                        file,
                        userId
                    )
                    logger.info(
                        `Lesson video processed via lessons service for lesson ${lessonId}`
                    )
                } else {
                    // fallback: chỉ cập nhật URL nếu không tìm được courseId
                    await prisma.lesson.update({
                        where: { id: lessonId },
                        data: { videoUrl: fileUrl },
                    })
                    logger.warn(
                        `Fallback lesson video update without courseId for lesson ${lessonId}`
                    )
                }
            } else if (lessonId) {
                // Legacy path nếu type không phải lesson nhưng vẫn có lessonId
                await prisma.lesson.update({
                    where: { id: lessonId },
                    data: { videoUrl: fileUrl },
                })
                logger.info(
                    `Video URL updated for lesson ${lessonId}: ${fileUrl}`
                )
            }

            // Nếu là video preview khóa học, cập nhật course
            if (type === 'preview' && courseId) {
                await prisma.course.update({
                    where: { id: courseId },
                    data: { videoPreviewUrl: fileUrl },
                })
                logger.info(
                    `Video preview URL updated for course ${courseId}: ${fileUrl}`
                )
            }

            logger.info(
                `Video uploaded successfully by user ${userId}: ${file.filename}`
            )

            return fileInfo
        } catch (error) {
            logger.error('Error uploading video:', error)
            // Xóa file nếu có lỗi
            if (file.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path)
            }
            throw new Error('Failed to upload video')
        }
    }

    /**
     * Upload document file
     */
    async uploadDocument(file, userId, type = 'general', metadata = {}) {
        try {
            const { lessonId } = metadata

            // Xây dựng URL truy cập file
            const fileUrl = `${config.SERVER_URL}/uploads/${this._getUploadFolder(type, 'document')}/${file.filename}`

            // Lưu thông tin file
            const fileInfo = {
                id: file.filename,
                userId,
                type,
                category: 'document',
                filename: file.filename,
                originalName: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                path: file.path,
                url: fileUrl,
                lessonId,
                uploadedAt: new Date(),
            }

            // Nếu là transcript, cập nhật lesson
            if (type === 'transcript' && lessonId) {
                await prisma.lesson.update({
                    where: { id: lessonId },
                    data: { transcriptUrl: fileUrl },
                })
                logger.info(
                    `Transcript URL updated for lesson ${lessonId}: ${fileUrl}`
                )
            }

            logger.info(
                `Document uploaded successfully by user ${userId}: ${file.filename}`
            )

            return fileInfo
        } catch (error) {
            logger.error('Error uploading document:', error)
            // Xóa file nếu có lỗi
            if (file.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path)
            }
            throw new Error('Failed to upload document')
        }
    }

    /**
     * Delete file
     */
    async deleteFile(fileId, userId, userRole) {
        try {
            // Tìm file trong các thư mục upload
            const uploadDirs = [
                path.join(__dirname, '../../uploads/avatars'),
                path.join(__dirname, '../../uploads/videos'),
                path.join(__dirname, '../../uploads/transcripts'),
                path.join(__dirname, '../../uploads/thumbnails'),
                path.join(__dirname, '../../uploads/video-previews'),
            ]

            let filePath = null
            let fileFound = false

            for (const dir of uploadDirs) {
                const possiblePath = path.join(dir, fileId)
                if (fs.existsSync(possiblePath)) {
                    filePath = possiblePath
                    fileFound = true
                    break
                }
            }

            if (!fileFound) {
                const error = new Error('File not found')
                error.statusCode = 404
                throw error
            }

            // Kiểm tra quyền: chỉ owner hoặc admin mới được xóa
            // Extract userId from filename (format: timestamp-userId-name.ext)
            const fileUserId = this._extractUserIdFromFilename(fileId)

            if (
                userRole !== USER_ROLES.ADMIN &&
                fileUserId &&
                fileUserId !== userId
            ) {
                const error = new Error(
                    'You do not have permission to delete this file'
                )
                error.statusCode = 403
                throw error
            }

            // Xóa file vật lý
            fs.unlinkSync(filePath)

            // TODO: Xóa tham chiếu trong database nếu có
            // Ví dụ: cập nhật videoUrl, thumbnailUrl, etc. thành null

            logger.info(
                `File deleted successfully: ${fileId} by user ${userId}`
            )

            return {
                deleted: true,
                fileId,
                message: 'File deleted successfully',
            }
        } catch (error) {
            logger.error('Error deleting file:', error)
            throw error
        }
    }

    /**
     * Get upload status (cho video lớn)
     */
    async getUploadStatus(fileId, userId) {
        try {
            // Tìm file và kiểm tra trạng thái
            const uploadDirs = [
                path.join(__dirname, '../../uploads/videos'),
                path.join(__dirname, '../../uploads/video-previews'),
            ]

            let fileExists = false
            let fileInfo = null

            for (const dir of uploadDirs) {
                const filePath = path.join(dir, fileId)
                if (fs.existsSync(filePath)) {
                    fileExists = true
                    const stats = fs.statSync(filePath)

                    fileInfo = {
                        id: fileId,
                        exists: true,
                        status: 'completed', // Hoặc 'processing' nếu đang xử lý
                        size: stats.size,
                        uploadedAt: stats.birthtime,
                        url: `${config.SERVER_URL}/uploads/${path.basename(dir)}/${fileId}`,
                    }
                    break
                }
            }

            if (!fileExists) {
                return {
                    id: fileId,
                    exists: false,
                    status: 'not_found',
                    message: 'File not found or upload not completed',
                }
            }

            logger.info(
                `Upload status checked for file ${fileId} by user ${userId}`
            )

            return fileInfo
        } catch (error) {
            logger.error('Error checking upload status:', error)
            const err = new Error('Failed to check upload status')
            err.statusCode = 500
            throw err
        }
    }

    /**
     * Get user's uploaded files
     */
    async getUserFiles(userId, filters) {
        try {
            const { type, page = 1, limit = 20 } = filters

            // Đọc tất cả file trong thư mục uploads của user
            const uploadDirs = [
                {
                    dir: path.join(__dirname, '../../uploads/avatars'),
                    category: 'image',
                },
                {
                    dir: path.join(__dirname, '../../uploads/videos'),
                    category: 'video',
                },
                {
                    dir: path.join(__dirname, '../../uploads/transcripts'),
                    category: 'document',
                },
                {
                    dir: path.join(__dirname, '../../uploads/thumbnails'),
                    category: 'image',
                },
                {
                    dir: path.join(__dirname, '../../uploads/video-previews'),
                    category: 'video',
                },
            ]

            let allFiles = []

            for (const { dir, category } of uploadDirs) {
                if (fs.existsSync(dir)) {
                    const files = fs.readdirSync(dir)

                    // Lọc file của user (dựa trên userId trong filename)
                    const userFiles = files.filter((file) => {
                        const fileUserId = this._extractUserIdFromFilename(file)
                        return fileUserId === userId
                    })

                    // Map thông tin file
                    userFiles.forEach((file) => {
                        const filePath = path.join(dir, file)
                        const stats = fs.statSync(filePath)

                        allFiles.push({
                            id: file,
                            filename: file,
                            category,
                            size: stats.size,
                            uploadedAt: stats.birthtime,
                            url: `${config.SERVER_URL}/uploads/${path.basename(dir)}/${file}`,
                        })
                    })
                }
            }

            // Lọc theo type nếu có
            if (type) {
                allFiles = allFiles.filter((file) => file.category === type)
            }

            // Sắp xếp theo ngày upload (mới nhất trước)
            allFiles.sort((a, b) => b.uploadedAt - a.uploadedAt)

            // Pagination
            const total = allFiles.length
            const start = (page - 1) * limit
            const end = start + limit
            const files = allFiles.slice(start, end)

            logger.info(
                `Retrieved ${files.length} files for user ${userId} (total: ${total})`
            )

            return {
                files,
                total,
            }
        } catch (error) {
            logger.error('Error getting user files:', error)
            throw new Error('Failed to get user files')
        }
    }

    /**
     * Helper: Get upload folder based on type
     */
    _getUploadFolder(type, category) {
        if (category === 'image') {
            if (type === 'avatar') return 'avatars'
            if (type === 'thumbnail') return 'thumbnails'
            return 'thumbnails' // general images go to thumbnails
        }

        if (category === 'video') {
            if (type === 'lesson') return 'videos'
            if (type === 'preview') return 'video-previews'
            return 'videos'
        }

        if (category === 'document') {
            if (type === 'transcript') return 'transcripts'
            return 'transcripts' // general documents go to transcripts
        }

        return 'uploads'
    }

    async _getLessonCourseId(lessonId) {
        if (!lessonId) return null

        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            select: { courseId: true },
        })

        return lesson?.courseId || null
    }

    /**
     * Helper: Extract userId from filename
     * Format: timestamp-userId-name.ext
     */
    _extractUserIdFromFilename(filename) {
        try {
            const parts = filename.split('-')
            if (parts.length >= 2) {
                const userId = parseInt(parts[1])
                return isNaN(userId) ? null : userId
            }
            return null
        } catch (error) {
            return null
        }
    }
}

export default new UploadService()
