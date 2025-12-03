// src/__tests__/api/student-dashboard.test.js
import request from 'supertest';
import app from '../../app.js';
import {
    createTestUser,
    createTestInstructor,
    createTestCategory,
    createTestCourse,
    createTestLesson,
    generateTestToken,
    cleanupTestData,
} from '../helpers/test-helpers.js';
import { prisma } from '../../config/database.config.js';
import {
    USER_ROLES,
    COURSE_STATUS,
    ENROLLMENT_STATUS,
} from '../../config/constants.js';

describe('Student Dashboard API', () => {
    let student;
    let studentToken;
    let instructor;
    let instructorToken;
    let admin;
    let adminToken;
    let category;
    let course;
    let lesson;

    beforeEach(async () => {
        // Create student
        student = await createTestUser({
            role: USER_ROLES.STUDENT,
        });
        studentToken = generateTestToken(student);

        // Create instructor
        instructor = await createTestInstructor();
        instructorToken = generateTestToken(instructor);

        // Create admin
        admin = await createTestUser({
            role: USER_ROLES.ADMIN,
        });
        adminToken = generateTestToken(admin);

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

        // Create lesson
        lesson = await createTestLesson(course.id, {
            title: `Test Lesson ${Date.now()}`,
            lessonOrder: 1,
        });

        // Create enrollment
        await prisma.enrollment.create({
            data: {
                userId: student.id,
                courseId: course.id,
                status: ENROLLMENT_STATUS.ACTIVE,
                progressPercentage: 0,
            },
        });
    });

    afterAll(async () => {
        await cleanupTestData();
        await prisma.$disconnect();
    });

    describe('GET /api/v1/dashboard/student', () => {
        it('should get student dashboard overview', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/student')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/student')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should allow instructor to access student dashboard', async () => {
            // isStudent middleware allows STUDENT, INSTRUCTOR, and ADMIN
            const response = await request(app)
                .get('/api/v1/dashboard/student')
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('GET /api/v1/dashboard/student/stats', () => {
        it('should get student statistics', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/student/stats')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/student/stats')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should allow instructor to access student stats', async () => {
            // isStudent middleware allows STUDENT, INSTRUCTOR, and ADMIN
            const response = await request(app)
                .get('/api/v1/dashboard/student/stats')
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('GET /api/v1/dashboard/student/enrolled-courses', () => {
        it('should get student enrolled courses', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/student/enrolled-courses')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should get enrolled courses with limit', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/student/enrolled-courses')
                .query({ limit: 5 })
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/student/enrolled-courses')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should allow instructor to access enrolled courses', async () => {
            // isStudent middleware allows STUDENT, INSTRUCTOR, and ADMIN
            const response = await request(app)
                .get('/api/v1/dashboard/student/enrolled-courses')
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('GET /api/v1/dashboard/student/continue-watching', () => {
        it('should get continue watching lessons', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/student/continue-watching')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should get continue watching with limit', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/student/continue-watching')
                .query({ limit: 5 })
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/dashboard/student/continue-watching')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should allow instructor to access continue watching', async () => {
            // isStudent middleware allows STUDENT, INSTRUCTOR, and ADMIN
            const response = await request(app)
                .get('/api/v1/dashboard/student/continue-watching')
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });
});

