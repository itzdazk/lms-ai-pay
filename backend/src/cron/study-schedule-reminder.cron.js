// backend/src/cron/study-schedule-reminder.cron.js
import logger from '../config/logger.config.js'
import studyScheduleService from '../services/study-schedule.service.js'
import emailService from '../services/email.service.js'
import notificationsService from '../services/notifications.service.js'

class StudyScheduleReminderCron {
    constructor() {
        this.intervalId = null
        this.isRunning = false
    }

    start() {
        if (this.intervalId) {
            logger.warn('Study schedule reminder cron job is already running')
            return
        }

        // Chạy mỗi phút để kiểm tra reminders
        this.intervalId = setInterval(async () => {
            if (this.isRunning) {
                logger.warn('Previous cron job still running, skipping...')
                return
            }

            this.isRunning = true

            try {
                logger.info('Running study schedule reminder cron job...')

                // Check for reminders at different intervals (10, 15, 30, 60 minutes)
                const reminderIntervals = [10, 15, 30, 60]
                let totalProcessed = 0
                let totalFailed = 0

                for (const minutes of reminderIntervals) {
                    try {
                        const schedules =
                            await studyScheduleService.getSchedulesNeedingReminders(
                                minutes
                            )

                        for (const schedule of schedules) {
                            try {
                                // Send email reminder
                                if (schedule.user?.email) {
                                    await emailService.sendStudyScheduleReminderEmail(
                                        schedule.user.email,
                                        schedule.user.fullName || 'Học viên',
                                        schedule
                                    )
                                    logger.info(
                                        `Reminder email sent for schedule ${schedule.id} to ${schedule.user.email}`
                                    )
                                }

                                // Create in-app notification
                                await notificationsService.createNotification({
                                    userId: schedule.userId,
                                    type: 'STUDY_SCHEDULE_REMINDER',
                                    title: 'Nhắc nhở: Lịch học sắp tới',
                                    message: `Bạn có buổi học "${schedule.course.title}"${schedule.lesson ? ` - ${schedule.lesson.title}` : ''} sắp bắt đầu trong ${minutes} phút`,
                                    relatedId: schedule.id,
                                    relatedType: 'STUDY_SCHEDULE',
                                })

                                // Mark reminder as sent
                                await studyScheduleService.markReminderSent(
                                    schedule.id
                                )

                                totalProcessed++
                            } catch (error) {
                                logger.error(
                                    `Failed to send reminder for schedule ${schedule.id}:`,
                                    error
                                )
                                totalFailed++
                            }
                        }
                    } catch (error) {
                        logger.error(
                            `Error processing reminders for ${minutes} minutes:`,
                            error
                        )
                    }
                }

                if (totalProcessed > 0 || totalFailed > 0) {
                    logger.info('Study schedule reminder cron job completed:', {
                        processed: totalProcessed,
                        failed: totalFailed,
                    })
                }
            } catch (error) {
                logger.error(
                    `Study schedule reminder cron failed: ${error.message}`,
                    error
                )
            } finally {
                this.isRunning = false
            }
        }, 60000) // 1 minute

        logger.info(
            'Study schedule reminder cron job started (runs every minute)'
        )
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId)
            this.intervalId = null
            this.isRunning = false
            logger.info('Study schedule reminder cron job stopped')
        }
    }

    async runNow() {
        logger.info('Running study schedule reminder manually...')
        try {
            const reminderIntervals = [10, 15, 30, 60]
            let totalProcessed = 0

            for (const minutes of reminderIntervals) {
                const schedules =
                    await studyScheduleService.getSchedulesNeedingReminders(
                        minutes
                    )

                for (const schedule of schedules) {
                    try {
                        if (schedule.user?.email) {
                            await emailService.sendStudyScheduleReminderEmail(
                                schedule.user.email,
                                schedule.user.fullName || 'Học viên',
                                schedule
                            )
                        }

                        await notificationsService.createNotification({
                            userId: schedule.userId,
                            type: 'STUDY_SCHEDULE_REMINDER',
                            title: 'Nhắc nhở: Lịch học sắp tới',
                            message: `Bạn có buổi học "${schedule.course.title}"${schedule.lesson ? ` - ${schedule.lesson.title}` : ''} sắp bắt đầu trong ${minutes} phút`,
                            relatedId: schedule.id,
                            relatedType: 'STUDY_SCHEDULE',
                        })

                        await studyScheduleService.markReminderSent(schedule.id)
                        totalProcessed++
                    } catch (error) {
                        logger.error(
                            `Failed to send reminder for schedule ${schedule.id}:`,
                            error
                        )
                    }
                }
            }

            logger.info('Manual run completed:', { processed: totalProcessed })
            return { processed: totalProcessed }
        } catch (error) {
            logger.error(`Manual run failed: ${error.message}`)
            throw error
        }
    }
}

export default new StudyScheduleReminderCron()

