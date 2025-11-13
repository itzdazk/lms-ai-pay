// src/routes/notifications.routes.js
import express from 'express'
import notificationsController from '../controllers/notifications.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import {
    getNotificationsValidator,
    getNotificationByIdValidator,
    markNotificationReadValidator,
    deleteNotificationValidator,
} from '../validators/notifications.validator.js'

const router = express.Router()

// All notification endpoints require authentication
router.use(authenticate)

router.get('/', getNotificationsValidator, notificationsController.getNotifications)
router.get(
    '/unread',
    getNotificationsValidator,
    notificationsController.getUnreadNotifications
)
router.get('/unread/count', notificationsController.getUnreadCount)
router.get(
    '/:id',
    getNotificationByIdValidator,
    notificationsController.getNotificationById
)
router.patch(
    '/:id/read',
    markNotificationReadValidator,
    notificationsController.markNotificationAsRead
)
router.patch('/read-all', notificationsController.markAllNotificationsAsRead)
router.delete(
    '/:id',
    deleteNotificationValidator,
    notificationsController.deleteNotification
)
router.delete('/', notificationsController.deleteAllNotifications)

export default router

