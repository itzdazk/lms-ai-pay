// src/validators/study-schedule.validator.js
import { body, query, param } from 'express-validator'

export const createStudyScheduleValidator = [
    body('courseId')
        .notEmpty()
        .withMessage('Course ID is required')
        .isInt()
        .withMessage('Course ID must be an integer'),
    body('lessonId')
        .optional()
        .isInt()
        .withMessage('Lesson ID must be an integer'),
    body('title')
        .optional()
        .isString()
        .withMessage('Title must be a string')
        .isLength({ max: 200 })
        .withMessage('Title must not exceed 200 characters'),
    body('scheduledDate')
        .notEmpty()
        .withMessage('Scheduled date is required')
        .isISO8601()
        .withMessage('Scheduled date must be a valid ISO 8601 date'),
    body('duration')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Duration must be a positive integer (minutes)'),
    body('reminderMinutes')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Reminder minutes must be a non-negative integer'),
    body('repeatType')
        .optional()
        .isIn(['ONCE', 'DAILY', 'WEEKLY', 'CUSTOM'])
        .withMessage('Repeat type must be ONCE, DAILY, WEEKLY, or CUSTOM'),
    body('repeatDays')
        .optional()
        .isArray()
        .withMessage('Repeat days must be an array')
        .custom((value) => {
            if (value && value.length > 0) {
                const validDays = [1, 2, 3, 4, 5, 6, 7] // 1=Mon, 7=Sun
                return value.every((day) => validDays.includes(day))
            }
            return true
        })
        .withMessage('Repeat days must be numbers between 1-7'),
    body('repeatUntil')
        .optional()
        .isISO8601()
        .withMessage('Repeat until must be a valid ISO 8601 date'),
    body('notes')
        .optional()
        .isString()
        .withMessage('Notes must be a string'),
]

export const updateStudyScheduleValidator = [
    param('id')
        .notEmpty()
        .withMessage('Schedule ID is required')
        .isInt()
        .withMessage('Schedule ID must be an integer'),
    body('courseId')
        .optional()
        .isInt()
        .withMessage('Course ID must be an integer'),
    body('lessonId')
        .optional()
        .isInt()
        .withMessage('Lesson ID must be an integer'),
    body('title')
        .optional()
        .isString()
        .withMessage('Title must be a string')
        .isLength({ max: 200 })
        .withMessage('Title must not exceed 200 characters'),
    body('scheduledDate')
        .optional()
        .isISO8601()
        .withMessage('Scheduled date must be a valid ISO 8601 date'),
    body('duration')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Duration must be a positive integer (minutes)'),
    body('reminderMinutes')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Reminder minutes must be a non-negative integer'),
    body('repeatType')
        .optional()
        .isIn(['ONCE', 'DAILY', 'WEEKLY', 'CUSTOM'])
        .withMessage('Repeat type must be ONCE, DAILY, WEEKLY, or CUSTOM'),
    body('repeatDays')
        .optional()
        .isArray()
        .withMessage('Repeat days must be an array')
        .custom((value) => {
            if (value && value.length > 0) {
                const validDays = [1, 2, 3, 4, 5, 6, 7]
                return value.every((day) => validDays.includes(day))
            }
            return true
        })
        .withMessage('Repeat days must be numbers between 1-7'),
    body('repeatUntil')
        .optional()
        .isISO8601()
        .withMessage('Repeat until must be a valid ISO 8601 date'),
    body('notes')
        .optional()
        .isString()
        .withMessage('Notes must be a string'),
    body('status')
        .optional()
        .isIn(['scheduled', 'completed', 'skipped', 'cancelled'])
        .withMessage('Status must be scheduled, completed, skipped, or cancelled'),
]

export const getStudySchedulesValidator = [
    query('dateFrom')
        .optional()
        .isISO8601()
        .withMessage('Date from must be a valid ISO 8601 date'),
    query('dateTo')
        .optional()
        .isISO8601()
        .withMessage('Date to must be a valid ISO 8601 date'),
    query('courseId')
        .optional()
        .isInt()
        .withMessage('Course ID must be an integer'),
    query('status')
        .optional()
        .isIn(['scheduled', 'completed', 'skipped', 'cancelled'])
        .withMessage('Status must be scheduled, completed, skipped, or cancelled'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('offset')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Offset must be a non-negative integer'),
]

export const scheduleIdValidator = [
    param('id')
        .notEmpty()
        .withMessage('Schedule ID is required')
        .isInt()
        .withMessage('Schedule ID must be an integer'),
]

