// src/__tests__/api/notifications.test.js
import request from 'supertest';
import app from '../../app.js';
import {
    createTestUser,
    generateTestToken,
    cleanupTestData,
} from '../helpers/test-helpers.js';
import { prisma } from '../../config/database.config.js';
import { USER_ROLES, NOTIFICATION_TYPES } from '../../config/constants.js';

describe('Notifications API', () => {
    let user;
    let userToken;
    let otherUser;
    let otherUserToken;

    beforeEach(async () => {
        // Create users
        user = await createTestUser({
            role: USER_ROLES.STUDENT,
        });
        userToken = generateTestToken(user);

        otherUser = await createTestUser({
            role: USER_ROLES.STUDENT,
        });
        otherUserToken = generateTestToken(otherUser);
    });

    afterAll(async () => {
        await cleanupTestData();
        await prisma.$disconnect();
    });

    describe('GET /api/v1/notifications', () => {
        beforeEach(async () => {
            // Create notifications for user
            await prisma.notification.createMany({
                data: [
                    {
                        userId: user.id,
                        type: NOTIFICATION_TYPES.COURSE_ENROLLED,
                        title: 'Test Notification 1',
                        message: 'Test message 1',
                        isRead: false,
                    },
                    {
                        userId: user.id,
                        type: NOTIFICATION_TYPES.PAYMENT_SUCCESS,
                        title: 'Test Notification 2',
                        message: 'Test message 2',
                        isRead: true,
                    },
                    {
                        userId: user.id,
                        type: NOTIFICATION_TYPES.LESSON_COMPLETED,
                        title: 'Test Notification 3',
                        message: 'Test message 3',
                        isRead: false,
                    },
                ],
            });
        });

        it('should get user notifications', async () => {
            const response = await request(app)
                .get('/api/v1/notifications')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThanOrEqual(3);
            expect(response.body.pagination).toBeDefined();
            expect(response.body.pagination.total).toBeGreaterThanOrEqual(3);
        });

        it('should paginate notifications', async () => {
            const response = await request(app)
                .get('/api/v1/notifications?page=1&limit=2')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeLessThanOrEqual(2);
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.limit).toBe(2);
        });

        it('should return empty array for user with no notifications', async () => {
            const response = await request(app)
                .get('/api/v1/notifications')
                .set('Authorization', `Bearer ${otherUserToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual([]);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/notifications')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/notifications/unread', () => {
        beforeEach(async () => {
            // Create unread notifications for user
            await prisma.notification.createMany({
                data: [
                    {
                        userId: user.id,
                        type: NOTIFICATION_TYPES.COURSE_ENROLLED,
                        title: 'Unread Notification 1',
                        message: 'Unread message 1',
                        isRead: false,
                    },
                    {
                        userId: user.id,
                        type: NOTIFICATION_TYPES.PAYMENT_SUCCESS,
                        title: 'Unread Notification 2',
                        message: 'Unread message 2',
                        isRead: false,
                    },
                    {
                        userId: user.id,
                        type: NOTIFICATION_TYPES.LESSON_COMPLETED,
                        title: 'Read Notification',
                        message: 'Read message',
                        isRead: true,
                    },
                ],
            });
        });

        it('should get unread notifications', async () => {
            const response = await request(app)
                .get('/api/v1/notifications/unread')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThanOrEqual(2);
            // All should be unread
            expect(
                response.body.data.every((n) => n.isRead === false)
            ).toBe(true);
        });

        it('should return empty array when no unread notifications', async () => {
            const response = await request(app)
                .get('/api/v1/notifications/unread')
                .set('Authorization', `Bearer ${otherUserToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual([]);
        });
    });

    describe('GET /api/v1/notifications/unread/count', () => {
        beforeEach(async () => {
            // Create unread notifications for user
            await prisma.notification.createMany({
                data: [
                    {
                        userId: user.id,
                        type: NOTIFICATION_TYPES.COURSE_ENROLLED,
                        title: 'Unread 1',
                        message: 'Message 1',
                        isRead: false,
                    },
                    {
                        userId: user.id,
                        type: NOTIFICATION_TYPES.PAYMENT_SUCCESS,
                        title: 'Unread 2',
                        message: 'Message 2',
                        isRead: false,
                    },
                    {
                        userId: user.id,
                        type: NOTIFICATION_TYPES.LESSON_COMPLETED,
                        title: 'Read',
                        message: 'Message',
                        isRead: true,
                    },
                ],
            });
        });

        it('should get unread notifications count', async () => {
            const response = await request(app)
                .get('/api/v1/notifications/unread/count')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.count).toBeGreaterThanOrEqual(2);
        });

        it('should return 0 for user with no unread notifications', async () => {
            const response = await request(app)
                .get('/api/v1/notifications/unread/count')
                .set('Authorization', `Bearer ${otherUserToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.count).toBe(0);
        });
    });

    describe('GET /api/v1/notifications/:id', () => {
        let notification;

        beforeEach(async () => {
            notification = await prisma.notification.create({
                data: {
                    userId: user.id,
                    type: NOTIFICATION_TYPES.COURSE_ENROLLED,
                    title: 'Test Notification',
                    message: 'Test message',
                    isRead: false,
                },
            });
        });

        it('should get notification by ID', async () => {
            const response = await request(app)
                .get(`/api/v1/notifications/${notification.id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.id).toBe(notification.id);
            expect(response.body.data.title).toBe(notification.title);
        });

        it('should return 404 for non-existent notification', async () => {
            const response = await request(app)
                .get('/api/v1/notifications/99999')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return 404 for other user notification', async () => {
            const response = await request(app)
                .get(`/api/v1/notifications/${notification.id}`)
                .set('Authorization', `Bearer ${otherUserToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get(`/api/v1/notifications/${notification.id}`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PATCH /api/v1/notifications/:id/read', () => {
        let unreadNotification;
        let readNotification;

        beforeEach(async () => {
            unreadNotification = await prisma.notification.create({
                data: {
                    userId: user.id,
                    type: NOTIFICATION_TYPES.COURSE_ENROLLED,
                    title: 'Unread Notification',
                    message: 'Unread message',
                    isRead: false,
                },
            });

            readNotification = await prisma.notification.create({
                data: {
                    userId: user.id,
                    type: NOTIFICATION_TYPES.PAYMENT_SUCCESS,
                    title: 'Read Notification',
                    message: 'Read message',
                    isRead: true,
                    readAt: new Date(),
                },
            });
        });

        it('should mark notification as read', async () => {
            const response = await request(app)
                .patch(`/api/v1/notifications/${unreadNotification.id}/read`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.isRead).toBe(true);
            expect(response.body.data.readAt).toBeDefined();

            // Verify in database
            const updated = await prisma.notification.findUnique({
                where: { id: unreadNotification.id },
            });
            expect(updated.isRead).toBe(true);
            expect(updated.readAt).toBeDefined();
        });

        it('should return notification if already read', async () => {
            const response = await request(app)
                .patch(`/api/v1/notifications/${readNotification.id}/read`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.isRead).toBe(true);
        });

        it('should return 404 for non-existent notification', async () => {
            const response = await request(app)
                .patch('/api/v1/notifications/99999/read')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return 404 for other user notification', async () => {
            const response = await request(app)
                .patch(`/api/v1/notifications/${unreadNotification.id}/read`)
                .set('Authorization', `Bearer ${otherUserToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PATCH /api/v1/notifications/read-all', () => {
        beforeEach(async () => {
            // Create unread notifications
            await prisma.notification.createMany({
                data: [
                    {
                        userId: user.id,
                        type: NOTIFICATION_TYPES.COURSE_ENROLLED,
                        title: 'Unread 1',
                        message: 'Message 1',
                        isRead: false,
                    },
                    {
                        userId: user.id,
                        type: NOTIFICATION_TYPES.PAYMENT_SUCCESS,
                        title: 'Unread 2',
                        message: 'Message 2',
                        isRead: false,
                    },
                    {
                        userId: user.id,
                        type: NOTIFICATION_TYPES.LESSON_COMPLETED,
                        title: 'Read',
                        message: 'Message',
                        isRead: true,
                    },
                ],
            });
        });

        it('should mark all notifications as read', async () => {
            const response = await request(app)
                .patch('/api/v1/notifications/read-all')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.updated).toBeGreaterThanOrEqual(2);

            // Verify in database
            const unreadCount = await prisma.notification.count({
                where: {
                    userId: user.id,
                    isRead: false,
                },
            });
            expect(unreadCount).toBe(0);
        });

        it('should return 0 updated if no unread notifications', async () => {
            const response = await request(app)
                .patch('/api/v1/notifications/read-all')
                .set('Authorization', `Bearer ${otherUserToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.updated).toBe(0);
        });
    });

    describe('DELETE /api/v1/notifications/:id', () => {
        let notification;

        beforeEach(async () => {
            notification = await prisma.notification.create({
                data: {
                    userId: user.id,
                    type: NOTIFICATION_TYPES.COURSE_ENROLLED,
                    title: 'Test Notification',
                    message: 'Test message',
                    isRead: false,
                },
            });
        });

        it('should delete notification', async () => {
            const response = await request(app)
                .delete(`/api/v1/notifications/${notification.id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(204);

            // Verify deleted
            const deleted = await prisma.notification.findUnique({
                where: { id: notification.id },
            });
            expect(deleted).toBeNull();
        });

        it('should return 404 for non-existent notification', async () => {
            const response = await request(app)
                .delete('/api/v1/notifications/99999')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return 404 for other user notification', async () => {
            const response = await request(app)
                .delete(`/api/v1/notifications/${notification.id}`)
                .set('Authorization', `Bearer ${otherUserToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/v1/notifications', () => {
        beforeEach(async () => {
            // Create notifications for user
            await prisma.notification.createMany({
                data: [
                    {
                        userId: user.id,
                        type: NOTIFICATION_TYPES.COURSE_ENROLLED,
                        title: 'Notification 1',
                        message: 'Message 1',
                        isRead: false,
                    },
                    {
                        userId: user.id,
                        type: NOTIFICATION_TYPES.PAYMENT_SUCCESS,
                        title: 'Notification 2',
                        message: 'Message 2',
                        isRead: true,
                    },
                ],
            });
        });

        it('should delete all user notifications', async () => {
            const response = await request(app)
                .delete('/api/v1/notifications')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(204);

            // Verify deleted
            const count = await prisma.notification.count({
                where: { userId: user.id },
            });
            expect(count).toBe(0);
        });

        it('should not delete other user notifications', async () => {
            // Create notification for other user
            await prisma.notification.create({
                data: {
                    userId: otherUser.id,
                    type: NOTIFICATION_TYPES.COURSE_ENROLLED,
                    title: 'Other User Notification',
                    message: 'Message',
                    isRead: false,
                },
            });

            await request(app)
                .delete('/api/v1/notifications')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(204);

            // Verify other user's notification still exists
            const otherUserCount = await prisma.notification.count({
                where: { userId: otherUser.id },
            });
            expect(otherUserCount).toBe(1);
        });
    });
});

