// src/__tests__/api/instructor-dashboard.test.js
import request from 'supertest';
import app from '../../app.js';
import {
    createTestUser,
    createTestInstructor,
    createTestAdmin,
    createTestCategory,
    createTestCourse,
    generateTestToken,
    cleanupTestData,
} from '../helpers/test-helpers.js';
import { prisma } from '../../config/database.config.js';
import {
    USER_ROLES,
    COURSE_STATUS,
} from '../../config/constants.js';

describe('Instructor Dashboard API', () => {
    let instructor;
    let instructorToken;
    let otherInstructor;
    let otherInstructorToken;
    let admin;
    let adminToken;
    let student;
    let studentToken;
    let category;
    let course;

    beforeEach(async () => {
        // Create instructor
        instructor = await createTestInstructor();
        instructorToken = generateTestToken(instructor);

        // Create other instructor
        otherInstructor = await createTestInstructor();
        otherInstructorToken = generateTestToken(otherInstructor);

        // Create admin
        admin = await createTestAdmin();
        adminToken = generateTestToken(admin);

        // Create student
        student = await createTestUser({
            role: USER_ROLES.STUDENT,
        });
        studentToken = generateTestToken(student);

        // Create category
        category = await createTestCategory({
            name: `Test Category ${Date.now()}`,
            slug: `test-category-${Date.now()}`,
        });

        // Create course
        course = await createTestCourse(instructor.id, {
            categoryId: category.id,
            status: COURSE_STATUS.PUBLISHED,
            price: 100000,
        });
    });

    afterAll(async () => {
        await cleanupTestData();
        await prisma.$disconnect();
    });

    describe('GET /api/v1/dashboard/instructor', () => {
        it('should get instructor dashboard overview', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/instructor')
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should allow admin to view instructor dashboard', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/instructor')
                .query({ instructorId: instructor.id })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/instructor')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for student', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/instructor')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/dashboard/instructor/stats', () => {
        it('should get instructor statistics', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/instructor/stats')
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should allow admin to view instructor stats', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/instructor/stats')
                .query({ instructorId: instructor.id })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/instructor/stats')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for student', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/instructor/stats')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/dashboard/instructor/revenue', () => {
        it('should get instructor revenue', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/instructor/revenue')
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should get revenue with period', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/instructor/revenue')
                .query({ period: 'month' })
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should allow admin to view instructor revenue', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/instructor/revenue')
                .query({ instructorId: instructor.id })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/instructor/revenue')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for student', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/instructor/revenue')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/dashboard/instructor/analytics', () => {
        it('should get instructor analytics', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/instructor/analytics')
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should allow admin to view instructor analytics', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/instructor/analytics')
                .query({ instructorId: instructor.id })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/instructor/analytics')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for student', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/instructor/analytics')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/dashboard/instructor/students', () => {
        it('should get instructor students', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/instructor/students')
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should get students with pagination', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/instructor/students')
                .query({ page: 1, limit: 10 })
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should get students with search', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/instructor/students')
                .query({ search: 'test' })
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should allow admin to view instructor students', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/instructor/students')
                .query({ instructorId: instructor.id })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/instructor/students')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for student', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/instructor/students')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });
});

