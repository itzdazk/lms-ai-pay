// src/controllers/progress.controller.js
import { asyncHandler } from '../middlewares/error.middleware.js';
import ApiResponse from '../utils/response.util.js';
import progressService from '../services/progress.service.js';

class ProgressController {
    /**
     * Get course progress
     * GET /api/v1/progress/courses/:courseId
     */
    getCourseProgress = asyncHandler(async (req, res) => {
        const { courseId } = req.params;
        const userId = req.user.id;

        const progress = await progressService.getCourseProgress(
            userId,
            parseInt(courseId)
        );

        return ApiResponse.success(
            res,
            progress,
            'Course progress retrieved successfully'
        );
    });

    /**
     * Get lesson progress
     * GET /api/v1/progress/lessons/:lessonId
     */
    getLessonProgress = asyncHandler(async (req, res) => {
        const { lessonId } = req.params;
        const userId = req.user.id;

        const progress = await progressService.getLessonProgress(
            userId,
            parseInt(lessonId)
        );

        return ApiResponse.success(
            res,
            progress,
            'Lesson progress retrieved successfully'
        );
    });

    /**
     * Start learning a lesson
     * POST /api/v1/progress/lessons/:lessonId/start
     */
    startLesson = asyncHandler(async (req, res) => {
        const { lessonId } = req.params;
        const userId = req.user.id;

        const result = await progressService.startLesson(
            userId,
            parseInt(lessonId)
        );

        return ApiResponse.success(
            res,
            result,
            'Lesson started successfully'
        );
    });

    /**
     * Update lesson progress
     * PUT /api/v1/progress/lessons/:lessonId/update
     */
    updateProgress = asyncHandler(async (req, res) => {
        const { lessonId } = req.params;
        const userId = req.user.id;
        const { position, watchDuration } = req.body;

        const result = await progressService.updateProgress(
            userId,
            parseInt(lessonId),
            { position, watchDuration }
        );

        return ApiResponse.success(
            res,
            result,
            'Progress updated successfully'
        );
    });

    /**
     * Mark lesson as completed
     * POST /api/v1/progress/lessons/:lessonId/complete
     */
    completeLesson = asyncHandler(async (req, res) => {
        const { lessonId } = req.params;
        const userId = req.user.id;

        const result = await progressService.completeLesson(
            userId,
            parseInt(lessonId)
        );

        return ApiResponse.success(
            res,
            result,
            'Lesson marked as completed successfully'
        );
    });

    /**
     * Get resume position
     * GET /api/v1/progress/lessons/:lessonId/resume
     */
    getResumePosition = asyncHandler(async (req, res) => {
        const { lessonId } = req.params;
        const userId = req.user.id;

        const result = await progressService.getResumePosition(
            userId,
            parseInt(lessonId)
        );

        return ApiResponse.success(
            res,
            result,
            'Resume position retrieved successfully'
        );
    });

    /**
     * Get continue watching lessons
     * GET /api/v1/dashboard/continue-watching
     */
    getContinueWatching = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 10;

        const lessons = await progressService.getContinueWatching(
            userId,
            limit
        );

        return ApiResponse.success(
            res,
            lessons,
            'Continue watching lessons retrieved successfully'
        );
    });

    /**
     * Get recent activities
     * GET /api/v1/dashboard/recent-activities
     */
    getRecentActivities = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 10;

        const activities = await progressService.getRecentActivities(
            userId,
            limit
        );

        return ApiResponse.success(
            res,
            activities,
            'Recent activities retrieved successfully'
        );
    });

    /**
     * Get dashboard progress overview
     * GET /api/v1/dashboard/progress
     */
    getDashboardProgress = asyncHandler(async (req, res) => {
        const userId = req.user.id;

        // Get continue watching
        const continueWatching =
            await progressService.getContinueWatching(userId, 5);

        // Get recent activities
        const recentActivities =
            await progressService.getRecentActivities(userId, 10);

        // Get all enrollments with progress
        const { prisma } = await import('../config/database.config.js');
        const enrollments = await prisma.enrollment.findMany({
            where: {
                userId,
                status: 'active',
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
        });

        // Calculate stats
        const totalEnrollments = await prisma.enrollment.count({
            where: {
                userId,
                status: 'active',
            },
        });

        const completedEnrollments = await prisma.enrollment.count({
            where: {
                userId,
                status: 'completed',
            },
        });

        const totalProgress = await prisma.progress.count({
            where: {
                userId,
                isCompleted: true,
            },
        });

        return ApiResponse.success(
            res,
            {
                stats: {
                    totalEnrollments,
                    completedEnrollments,
                    totalLessonsCompleted: totalProgress,
                },
                continueWatching,
                recentActivities,
                activeCourses: enrollments,
            },
            'Dashboard progress retrieved successfully'
        );
    });
}

export default new ProgressController();


