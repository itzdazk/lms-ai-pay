// src/services/study-schedule.service.js
import { prisma } from '../config/database.config.js'
import { HTTP_STATUS } from '../config/constants.js'
import logger from '../config/logger.config.js'

class StudyScheduleService {
    /**
     * Get study schedules with filters
     * @param {number} userId - User ID
     * @param {object} filters - Filter options
     * @returns {Promise<Array>} Study schedules
     */
    async getStudySchedules(userId, filters = {}) {
        const {
            dateFrom,
            dateTo,
            courseId,
            status,
            limit = 100,
            offset = 0,
        } = filters

        const where = {
            userId,
        }

        if (dateFrom || dateTo) {
            where.scheduledDate = {}
            if (dateFrom) {
                where.scheduledDate.gte = new Date(dateFrom)
            }
            if (dateTo) {
                where.scheduledDate.lte = new Date(dateTo)
            }
        }

        if (courseId) {
            where.courseId = parseInt(courseId)
        }

        if (status) {
            where.status = status
        }

        const schedules = await prisma.studySchedule.findMany({
            where,
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        thumbnailUrl: true,
                    },
                },
                lesson: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        videoDuration: true,
                    },
                },
            },
            orderBy: {
                scheduledDate: 'asc',
            },
            take: parseInt(limit),
            skip: parseInt(offset),
        })

        return schedules
    }

    /**
     * Get study schedule by ID
     * @param {number} scheduleId - Schedule ID
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Study schedule
     */
    async getStudyScheduleById(scheduleId, userId) {
        const schedule = await prisma.studySchedule.findFirst({
            where: {
                id: parseInt(scheduleId),
                userId,
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        thumbnailUrl: true,
                    },
                },
                lesson: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        videoDuration: true,
                    },
                },
            },
        })

        if (!schedule) {
            const error = new Error('Study schedule not found')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        return schedule
    }

    /**
     * Get today's study schedules
     * @param {number} userId - User ID
     * @returns {Promise<Array>} Today's schedules
     */
    async getTodaySchedules(userId) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const schedules = await prisma.studySchedule.findMany({
            where: {
                userId,
                scheduledDate: {
                    gte: today,
                    lt: tomorrow,
                },
                status: 'scheduled',
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        thumbnailUrl: true,
                    },
                },
                lesson: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        videoDuration: true,
                    },
                },
            },
            orderBy: {
                scheduledDate: 'asc',
            },
        })

        return schedules
    }

    /**
     * Get upcoming study schedules (next 7 days)
     * @param {number} userId - User ID
     * @returns {Promise<Array>} Upcoming schedules
     */
    async getUpcomingSchedules(userId) {
        const now = new Date()
        const nextWeek = new Date(now)
        nextWeek.setDate(nextWeek.getDate() + 7)

        const schedules = await prisma.studySchedule.findMany({
            where: {
                userId,
                scheduledDate: {
                    gte: now,
                    lte: nextWeek,
                },
                status: 'scheduled',
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        thumbnailUrl: true,
                    },
                },
                lesson: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        videoDuration: true,
                    },
                },
            },
            orderBy: {
                scheduledDate: 'asc',
            },
        })

        return schedules
    }

    /**
     * Create study schedule
     * @param {number} userId - User ID
     * @param {object} data - Schedule data
     * @returns {Promise<Object>} Created schedule
     */
    async createStudySchedule(userId, data) {
        const {
            courseId,
            lessonId,
            title,
            scheduledDate,
            duration = 60,
            reminderMinutes = 15,
            repeatType,
            repeatDays,
            repeatUntil,
            notes,
        } = data

        // Verify user is enrolled in the course
        const enrollment = await prisma.enrollment.findFirst({
            where: {
                userId,
                courseId: parseInt(courseId),
                status: 'active',
            },
        })

        if (!enrollment) {
            const error = new Error('User is not enrolled in this course')
            error.statusCode = HTTP_STATUS.FORBIDDEN
            throw error
        }

        // If lessonId is provided, verify it belongs to the course
        if (lessonId) {
            const lesson = await prisma.lesson.findFirst({
                where: {
                    id: parseInt(lessonId),
                    courseId: parseInt(courseId),
                },
            })

            if (!lesson) {
                const error = new Error('Lesson not found in this course')
                error.statusCode = HTTP_STATUS.NOT_FOUND
                throw error
            }
        }

        const schedule = await prisma.studySchedule.create({
            data: {
                userId,
                courseId: parseInt(courseId),
                lessonId: lessonId ? parseInt(lessonId) : null,
                title: title || null,
                scheduledDate: new Date(scheduledDate),
                duration: parseInt(duration),
                reminderMinutes: parseInt(reminderMinutes),
                repeatType: repeatType || null,
                repeatDays: repeatDays ? JSON.parse(JSON.stringify(repeatDays)) : null,
                repeatUntil: repeatUntil ? new Date(repeatUntil) : null,
                notes: notes || null,
                status: 'scheduled',
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        thumbnailUrl: true,
                    },
                },
                lesson: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        videoDuration: true,
                    },
                },
            },
        })

        return schedule
    }

    /**
     * Update study schedule
     * @param {number} scheduleId - Schedule ID
     * @param {number} userId - User ID
     * @param {object} data - Update data
     * @returns {Promise<Object>} Updated schedule
     */
    async updateStudySchedule(scheduleId, userId, data) {
        // Verify ownership
        const existing = await prisma.studySchedule.findFirst({
            where: {
                id: parseInt(scheduleId),
                userId,
            },
        })

        if (!existing) {
            const error = new Error('Study schedule not found')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        const updateData = {}

        if (data.courseId !== undefined) {
            updateData.courseId = parseInt(data.courseId)
        }
        if (data.lessonId !== undefined) {
            updateData.lessonId = data.lessonId ? parseInt(data.lessonId) : null
        }
        if (data.title !== undefined) {
            updateData.title = data.title || null
        }
        if (data.scheduledDate !== undefined) {
            updateData.scheduledDate = new Date(data.scheduledDate)
        }
        if (data.duration !== undefined) {
            updateData.duration = parseInt(data.duration)
        }
        if (data.reminderMinutes !== undefined) {
            updateData.reminderMinutes = parseInt(data.reminderMinutes)
        }
        if (data.repeatType !== undefined) {
            updateData.repeatType = data.repeatType || null
        }
        if (data.repeatDays !== undefined) {
            updateData.repeatDays = data.repeatDays
                ? JSON.parse(JSON.stringify(data.repeatDays))
                : null
        }
        if (data.repeatUntil !== undefined) {
            updateData.repeatUntil = data.repeatUntil
                ? new Date(data.repeatUntil)
                : null
        }
        if (data.notes !== undefined) {
            updateData.notes = data.notes || null
        }
        if (data.status !== undefined) {
            updateData.status = data.status
        }

        // Reset reminder flags if scheduled date or reminder minutes changed
        if (
            data.scheduledDate !== undefined ||
            data.reminderMinutes !== undefined
        ) {
            updateData.isReminderSent = false
            updateData.reminderSentAt = null
        }

        const schedule = await prisma.studySchedule.update({
            where: {
                id: parseInt(scheduleId),
            },
            data: updateData,
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        thumbnailUrl: true,
                    },
                },
                lesson: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        videoDuration: true,
                    },
                },
            },
        })

        return schedule
    }

    /**
     * Delete study schedule
     * @param {number} scheduleId - Schedule ID
     * @param {number} userId - User ID
     * @returns {Promise<void>}
     */
    async deleteStudySchedule(scheduleId, userId) {
        const schedule = await prisma.studySchedule.findFirst({
            where: {
                id: parseInt(scheduleId),
                userId,
            },
        })

        if (!schedule) {
            const error = new Error('Study schedule not found')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        await prisma.studySchedule.delete({
            where: {
                id: parseInt(scheduleId),
            },
        })
    }

    /**
     * Mark schedule as completed
     * @param {number} scheduleId - Schedule ID
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Updated schedule
     */
    async completeSchedule(scheduleId, userId) {
        return this.updateStudySchedule(scheduleId, userId, {
            status: 'completed',
            completedAt: new Date(),
        })
    }

    /**
     * Skip schedule
     * @param {number} scheduleId - Schedule ID
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Updated schedule
     */
    async skipSchedule(scheduleId, userId) {
        return this.updateStudySchedule(scheduleId, userId, {
            status: 'skipped',
        })
    }

    /**
     * Get schedule suggestions based on user progress
     * @param {number} userId - User ID
     * @returns {Promise<Array>} Suggested schedules
     */
    async getScheduleSuggestions(userId) {
        // Get active enrollments with progress
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
                    },
                },
            },
        })

        const suggestions = []

        for (const enrollment of enrollments) {
            // Find next uncompleted lesson
            const nextLesson = await prisma.lesson.findFirst({
                where: {
                    courseId: enrollment.courseId,
                    isPublished: true,
                    progress: {
                        none: {
                            userId,
                            isCompleted: true,
                        },
                    },
                },
                orderBy: {
                    lessonOrder: 'asc',
                },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    videoDuration: true,
                },
            })

            if (nextLesson) {
                suggestions.push({
                    courseId: enrollment.courseId,
                    courseTitle: enrollment.course.title,
                    courseSlug: enrollment.course.slug,
                    lessonId: nextLesson.id,
                    lessonTitle: nextLesson.title,
                    lessonSlug: nextLesson.slug,
                    suggestedDuration: nextLesson.videoDuration || 60,
                })
            }
        }

        return suggestions
    }

    /**
     * Get schedules that need reminders
     * @param {number} minutesBefore - Minutes before scheduled time
     * @returns {Promise<Array>} Schedules needing reminders
     */
    async getSchedulesNeedingReminders(minutesBefore = 15) {
        const now = new Date()
        const reminderTime = new Date(now.getTime() + minutesBefore * 60 * 1000)

        // Get schedules that:
        // 1. Are scheduled (not completed/skipped/cancelled)
        // 2. Have scheduledDate within the reminder window
        // 3. Haven't had reminder sent yet
        // 4. Match the reminderMinutes setting
        const schedules = await prisma.studySchedule.findMany({
            where: {
                status: 'scheduled',
                scheduledDate: {
                    gte: now,
                    lte: reminderTime,
                },
                reminderMinutes: minutesBefore,
                isReminderSent: false,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                    },
                },
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                    },
                },
                lesson: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                    },
                },
            },
        })

        return schedules
    }

    /**
     * Mark reminder as sent
     * @param {number} scheduleId - Schedule ID
     * @returns {Promise<void>}
     */
    async markReminderSent(scheduleId) {
        await prisma.studySchedule.update({
            where: {
                id: scheduleId,
            },
            data: {
                isReminderSent: true,
                reminderSentAt: new Date(),
            },
        })
    }
}

export default new StudyScheduleService()

