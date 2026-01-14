// src/controllers/progress.controller.js
import { asyncHandler } from '../middlewares/error.middleware.js'
import ApiResponse from '../utils/response.util.js'
import progressService from '../services/progress.service.js'
import { ENROLLMENT_STATUS, ERROR_CODES } from '../config/constants.js'

class ProgressController {
    /**
     * Get progress status for all lessons in a course (for LessonList UI)
     * GET /api/v1/progress/courses/:courseId/lesson-progress
     */
    getCourseLessonProgressList = asyncHandler(async (req, res) => {
        const { courseId } = req.params
        const userId = req.user.id
        const result = await progressService.getCourseLessonProgressList(
            userId,
            parseInt(courseId)
        )
        return ApiResponse.success(
            res,
            result,
            'Truy xuất danh sách tiến độ bài học của khóa học thành công'
        )
    })
    /**
     * Get course progress
     * GET /api/v1/progress/courses/:courseId
     */
    getCourseProgress = asyncHandler(async (req, res) => {
        const { courseId } = req.params
        const userId = req.user.id

        const progress = await progressService.getCourseProgress(
            userId,
            parseInt(courseId)
        )

        return ApiResponse.success(
            res,
            progress,
            'Truy xuất tiến độ khóa học thành công'
        )
    })

    /**
     * Get lesson progress
     * GET /api/v1/progress/lessons/:lessonId
     */
    getLessonProgress = asyncHandler(async (req, res) => {
        const { lessonId } = req.params
        const userId = req.user.id

        const progress = await progressService.getLessonProgress(
            userId,
            parseInt(lessonId)
        )

        return ApiResponse.success(
            res,
            progress,
            'Truy xuất tiến độ bài học thành công'
        )
    })

    /**
     * Start learning a lesson
     * POST /api/v1/progress/lessons/:lessonId/start
     */
    startLesson = asyncHandler(async (req, res) => {
        const { lessonId } = req.params
        const userId = req.user.id

        const result = await progressService.startLesson(
            userId,
            parseInt(lessonId)
        )

        return ApiResponse.success(
            res,
            result,
            'Bắt đầu học bài học thành công'
        )
    })

    /**
     * Update lesson progress
     * PUT /api/v1/progress/lessons/:lessonId/update
     */
    updateProgress = asyncHandler(async (req, res) => {
        const { lessonId } = req.params
        const userId = req.user.id
        let { position, watchDuration, actionType } = req.body

        // Ensure position and watchDuration are non-negative integers
        if (position !== undefined) {
            if (typeof position !== 'number' || position < 0) {
                return ApiResponse.error(res, {
                    success: false,
                    message: 'Xác thực thất bại',
                    errors: [
                        {
                            field: 'position',
                            message: 'Position phải là một số nguyên không âm',
                            value: position,
                        },
                    ],
                })
            }
            position = Math.floor(position)
        }
        if (watchDuration !== undefined) {
            if (typeof watchDuration !== 'number' || watchDuration < 0) {
                return ApiResponse.error(res, {
                    success: false,
                    message: 'Xác thực thất bại',
                    errors: [
                        {
                            field: 'watchDuration',
                            message:
                                'Watch duration phải là một số nguyên không âm',
                            value: watchDuration,
                        },
                    ],
                })
            }
            watchDuration = Math.floor(watchDuration)
        }

        // Simple in-memory rate limit (có thể thay bằng Redis hoặc DB nếu cần)
        // Mỗi user/lesson/actionType chỉ được update mỗi X giây
        const RATE_LIMITS = {
            auto: 3, // 3 giây cho auto (30s gọi vẫn thoải mái)
            seek: 10, // 10 giây cho seek
            pause: 10, // 10 giây cho pause
        }
        const type = actionType || 'auto'
        const key = `${userId}:${lessonId}:${type}`
        if (!global._progressRateLimit) global._progressRateLimit = {}
        const now = Date.now()
        const last = global._progressRateLimit[key] || 0
        if (now - last < (RATE_LIMITS[type] || 3) * 1000) {
            // Trả về lỗi rate limit đúng chuẩn HTTP 429
            return res.status(429).json({
                success: false,
                errorCode: ERROR_CODES.RATE_LIMIT_ERROR,
            })
        }
        global._progressRateLimit[key] = now

        const result = await progressService.updateProgress(
            userId,
            parseInt(lessonId),
            { position, watchDuration }
        )

        return ApiResponse.success(res, result, 'Cập nhật tiến độ thành công')
    })

    /**
     * Get resume position
     * GET /api/v1/progress/lessons/:lessonId/resume
     */
    getResumePosition = asyncHandler(async (req, res) => {
        const { lessonId } = req.params
        const userId = req.user.id

        const result = await progressService.getResumePosition(
            userId,
            parseInt(lessonId)
        )

        return ApiResponse.success(
            res,
            result,
            'Truy xuất vị trí tiếp tục học thành công'
        )
    })

    /**
     * Get continue watching lessons
     * GET /api/v1/dashboard/continue-watching
     */
    getContinueWatching = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const limit = parseInt(req.query.limit) || 10

        const lessons = await progressService.getContinueWatching(userId, limit)

        return ApiResponse.success(
            res,
            lessons,
            'Truy xuất danh sách bài học đang xem thành công'
        )
    })

    /**
     * Get recent activities
     * GET /api/v1/dashboard/recent-activities
     */
    getRecentActivities = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const limit = parseInt(req.query.limit) || 10

        const activities = await progressService.getRecentActivities(
            userId,
            limit
        )

        return ApiResponse.success(
            res,
            activities,
            'Truy xuất hoạt động gần đây thành công'
        )
    })

    /**
     * Get dashboard progress overview
     * GET /api/v1/dashboard/progress
     */
    getDashboardProgress = asyncHandler(async (req, res) => {
        const userId = req.user.id

        // Get continue watching
        const continueWatching = await progressService.getContinueWatching(
            userId,
            5
        )

        // Get recent activities
        const recentActivities = await progressService.getRecentActivities(
            userId,
            10
        )

        // Get all enrollments with progress
        const { prisma } = await import('../config/database.config.js')
        const enrollments = await prisma.enrollment.findMany({
            where: {
                userId,
                status: ENROLLMENT_STATUS.ACTIVE,
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        thumbnailUrl: true,
                        totalLessons: true,
                    },
                },
            },
            orderBy: {
                lastAccessedAt: 'desc',
            },
            take: 10,
        })

        // Calculate stats
        // Total enrollments (all statuses)
        const totalEnrollments = await prisma.enrollment.count({
            where: {
                userId,
            },
        })

        // Active enrollments (currently learning)
        const activeEnrollments = await prisma.enrollment.count({
            where: {
                userId,
                status: ENROLLMENT_STATUS.ACTIVE,
            },
        })

        // Completed enrollments
        const completedEnrollments = await prisma.enrollment.count({
            where: {
                userId,
                status: ENROLLMENT_STATUS.COMPLETED,
            },
        })

        const totalProgress = await prisma.progress.count({
            where: {
                userId,
                isCompleted: true,
            },
        })

        return ApiResponse.success(
            res,
            {
                stats: {
                    totalEnrollments,
                    activeEnrollments,
                    completedEnrollments,
                    totalLessonsCompleted: totalProgress,
                },
                continueWatching,
                recentActivities,
                activeCourses: enrollments,
            },
            'Truy xuất tiến độ dashboard thành công'
        )
    })
}

export default new ProgressController()
