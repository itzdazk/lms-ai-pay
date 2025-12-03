// src/__tests__/api/admin-dashboard.test.js
import request from 'supertest';
import app from '../../app.js';
import {
    createTestUser,
    createTestAdmin,
    createTestInstructor,
    generateTestToken,
    cleanupTestData,
} from '../helpers/test-helpers.js';
import { prisma } from '../../config/database.config.js';
import { USER_ROLES } from '../../config/constants.js';

describe('Admin Dashboard API', () => {
    let admin;
    let adminToken;
    let student;
    let studentToken;
    let instructor;
    let instructorToken;

    beforeEach(async () => {
        // Create admin
        admin = await createTestAdmin();
        adminToken = generateTestToken(admin);

        // Create student
        student = await createTestUser({
            role: USER_ROLES.STUDENT,
        });
        studentToken = generateTestToken(student);

        // Create instructor
        instructor = await createTestInstructor();
        instructorToken = generateTestToken(instructor);
    });

    afterAll(async () => {
        await cleanupTestData();
        await prisma.$disconnect();
    });

    describe('GET /api/v1/dashboard/admin', () => {
        it('should get admin dashboard overview', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/admin')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/admin')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for non-admin user', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/admin')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for instructor', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/admin')
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/dashboard/admin/stats', () => {
        it('should get system statistics', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/admin/stats')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for non-admin user', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/admin/stats')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/dashboard/admin/users-analytics', () => {
        it('should get user analytics', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/admin/users-analytics')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/admin/users-analytics')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for non-admin user', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/admin/users-analytics')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/dashboard/admin/courses-analytics', () => {
        it('should get course analytics', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/admin/courses-analytics')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/admin/courses-analytics')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for non-admin user', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/admin/courses-analytics')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/dashboard/admin/revenue', () => {
        it('should get revenue analytics', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/admin/revenue')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/admin/revenue')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for non-admin user', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/admin/revenue')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/dashboard/admin/activities', () => {
        it('should get recent activities', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/admin/activities')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should get recent activities with limit', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/admin/activities')
                .query({ limit: 10 })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/admin/activities')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for non-admin user', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/admin/activities')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });
});

