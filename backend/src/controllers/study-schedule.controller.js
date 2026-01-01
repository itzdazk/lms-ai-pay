// src/controllers/study-schedule.controller.js
import { asyncHandler } from '../middlewares/error.middleware.js'
import ApiResponse from '../utils/response.util.js'
import studyScheduleService from '../services/study-schedule.service.js'

class StudyScheduleController {
    /**
     * @route   GET /api/v1/dashboard/student/study-schedules
     * @desc    Get study schedules
     * @access  Private (Student)
     */
    getStudySchedules = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const filters = {
            dateFrom: req.query.dateFrom,
            dateTo: req.query.dateTo,
            courseId: req.query.courseId,
            status: req.query.status,
            limit: req.query.limit || 100,
            offset: req.query.offset || 0,
        }

        const schedules =
            await studyScheduleService.getStudySchedules(userId, filters)

        return ApiResponse.success(
            res,
            schedules,
            'Study schedules retrieved successfully'
        )
    })

    /**
     * @route   GET /api/v1/dashboard/student/study-schedules/:id
     * @desc    Get study schedule by ID
     * @access  Private (Student)
     */
    getStudyScheduleById = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const scheduleId = req.params.id

        const schedule = await studyScheduleService.getStudyScheduleById(
            scheduleId,
            userId
        )

        return ApiResponse.success(
            res,
            schedule,
            'Study schedule retrieved successfully'
        )
    })

    /**
     * @route   GET /api/v1/dashboard/student/study-schedules/today
     * @desc    Get today's study schedules
     * @access  Private (Student)
     */
    getTodaySchedules = asyncHandler(async (req, res) => {
        const userId = req.user.id

        const schedules = await studyScheduleService.getTodaySchedules(userId)

        return ApiResponse.success(
            res,
            schedules,
            "Today's schedules retrieved successfully"
        )
    })

    /**
     * @route   GET /api/v1/dashboard/student/study-schedules/upcoming
     * @desc    Get upcoming study schedules (next 7 days)
     * @access  Private (Student)
     */
    getUpcomingSchedules = asyncHandler(async (req, res) => {
        const userId = req.user.id

        const schedules =
            await studyScheduleService.getUpcomingSchedules(userId)

        return ApiResponse.success(
            res,
            schedules,
            'Upcoming schedules retrieved successfully'
        )
    })

    /**
     * @route   POST /api/v1/dashboard/student/study-schedules
     * @desc    Create study schedule
     * @access  Private (Student)
     */
    createStudySchedule = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const data = req.body

        const schedule = await studyScheduleService.createStudySchedule(
            userId,
            data
        )

        return ApiResponse.success(
            res,
            schedule,
            'Study schedule created successfully',
            201
        )
    })

    /**
     * @route   PUT /api/v1/dashboard/student/study-schedules/:id
     * @desc    Update study schedule
     * @access  Private (Student)
     */
    updateStudySchedule = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const scheduleId = req.params.id
        const data = req.body

        const schedule = await studyScheduleService.updateStudySchedule(
            scheduleId,
            userId,
            data
        )

        return ApiResponse.success(
            res,
            schedule,
            'Study schedule updated successfully'
        )
    })

    /**
     * @route   DELETE /api/v1/dashboard/student/study-schedules/:id
     * @desc    Delete study schedule
     * @access  Private (Student)
     */
    deleteStudySchedule = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const scheduleId = req.params.id

        await studyScheduleService.deleteStudySchedule(scheduleId, userId)

        return ApiResponse.success(
            res,
            null,
            'Study schedule deleted successfully',
            204
        )
    })

    /**
     * @route   POST /api/v1/dashboard/student/study-schedules/:id/complete
     * @desc    Mark schedule as completed
     * @access  Private (Student)
     */
    completeSchedule = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const scheduleId = req.params.id

        const schedule = await studyScheduleService.completeSchedule(
            scheduleId,
            userId
        )

        return ApiResponse.success(
            res,
            schedule,
            'Schedule marked as completed'
        )
    })

    /**
     * @route   POST /api/v1/dashboard/student/study-schedules/:id/skip
     * @desc    Skip schedule
     * @access  Private (Student)
     */
    skipSchedule = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const scheduleId = req.params.id

        const schedule = await studyScheduleService.skipSchedule(
            scheduleId,
            userId
        )

        return ApiResponse.success(res, schedule, 'Schedule skipped')
    })

    /**
     * @route   GET /api/v1/dashboard/student/study-schedules/suggestions
     * @desc    Get schedule suggestions
     * @access  Private (Student)
     */
    getScheduleSuggestions = asyncHandler(async (req, res) => {
        const userId = req.user.id

        const suggestions =
            await studyScheduleService.getScheduleSuggestions(userId)

        return ApiResponse.success(
            res,
            suggestions,
            'Schedule suggestions retrieved successfully'
        )
    })
}

export default new StudyScheduleController()

