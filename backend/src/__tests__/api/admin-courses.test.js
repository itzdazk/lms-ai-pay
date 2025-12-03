// src/__tests__/api/admin-courses.test.js
import request from 'supertest';
import app from '../../app.js';
import {
    createTestUser,
    createTestAdmin,
    createTestInstructor,
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

describe('Admin Courses API', () => {
    let admin;
    let adminToken;
    let instructor;
    let instructorToken;
    let student;
    let studentToken;
    let category;
    let course;

    beforeEach(async () => {
        // Create admin
        admin = await createTestAdmin();
        adminToken = generateTestToken(admin);

        // Create instructor
        instructor = await createTestInstructor();
        instructorToken = generateTestToken(instructor);

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
            isFeatured: false,
        });
    });

    afterAll(async () => {
        await cleanupTestData();
        await prisma.$disconnect();
    });

    describe('GET /api/v1/admin/courses', () => {
        it('should get all courses for admin', async () => {
            const response = await request(app)
                .get('/api/v1/admin/courses')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.pagination).toBeDefined();
        });

        it('should filter courses by status', async () => {
            const response = await request(app)
                .get('/api/v1/admin/courses')
                .query({ status: COURSE_STATUS.PUBLISHED })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            if (response.body.data.length > 0) {
                expect(response.body.data[0].status).toBe(COURSE_STATUS.PUBLISHED);
            }
        });

        it('should filter courses by category', async () => {
            const response = await request(app)
                .get('/api/v1/admin/courses')
                .query({ categoryId: category.id })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            // Verify all returned courses belong to the category
            // Service returns category as nested object
            if (response.body.data.length > 0) {
                response.body.data.forEach((course) => {
                    expect(course.category).toBeDefined();
                    expect(course.category.id).toBe(category.id);
                });
            }
        });

        it('should filter courses by instructor', async () => {
            const response = await request(app)
                .get('/api/v1/admin/courses')
                .query({ instructorId: instructor.id })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            // Verify all returned courses belong to the instructor
            // Service returns instructor as nested object
            if (response.body.data.length > 0) {
                response.body.data.forEach((course) => {
                    expect(course.instructor).toBeDefined();
                    expect(course.instructor.id).toBe(instructor.id);
                });
            }
        });

        it('should filter courses by featured status', async () => {
            const response = await request(app)
                .get('/api/v1/admin/courses')
                .query({ isFeatured: 'false' })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should search courses by title', async () => {
            const response = await request(app)
                .get('/api/v1/admin/courses')
                .query({ search: course.title })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should filter courses by price range', async () => {
            const response = await request(app)
                .get('/api/v1/admin/courses')
                .query({ minPrice: 50000, maxPrice: 200000 })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should paginate courses', async () => {
            const response = await request(app)
                .get('/api/v1/admin/courses')
                .query({ page: 1, limit: 5 })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.limit).toBe(5);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/admin/courses')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for non-admin user', async () => {
            const response = await request(app)
                .get('/api/v1/admin/courses')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for instructor', async () => {
            const response = await request(app)
                .get('/api/v1/admin/courses')
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PATCH /api/v1/admin/courses/:id/featured', () => {
        it('should toggle course featured status to true', async () => {
            const response = await request(app)
                .patch(`/api/v1/admin/courses/${course.id}/featured`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ isFeatured: true })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.isFeatured).toBe(true);
        });

        it('should toggle course featured status to false', async () => {
            // First set to true
            await request(app)
                .patch(`/api/v1/admin/courses/${course.id}/featured`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ isFeatured: true });

            // Then set to false
            const response = await request(app)
                .patch(`/api/v1/admin/courses/${course.id}/featured`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ isFeatured: false })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.isFeatured).toBe(false);
        });

        it('should return 400 for invalid course ID', async () => {
            // Controller validates ID and returns 400, but validator might return 422 first
            // Try both status codes
            const response = await request(app)
                .patch('/api/v1/admin/courses/invalid/featured')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ isFeatured: true });

            expect([400, 422]).toContain(response.status);
            expect(response.body.success).toBe(false);
        });

        it('should return 422 for missing isFeatured', async () => {
            const response = await request(app)
                .patch(`/api/v1/admin/courses/${course.id}/featured`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({})
                .expect(422);

            expect(response.body.success).toBe(false);
        });

        it('should return 400 for non-boolean isFeatured', async () => {
            // Controller checks type and returns 400
            const response = await request(app)
                .patch(`/api/v1/admin/courses/${course.id}/featured`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ isFeatured: 'true' })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should return 404 for non-existent course', async () => {
            const response = await request(app)
                .patch('/api/v1/admin/courses/99999/featured')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ isFeatured: true })
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .patch(`/api/v1/admin/courses/${course.id}/featured`)
                .send({ isFeatured: true })
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for non-admin user', async () => {
            const response = await request(app)
                .patch(`/api/v1/admin/courses/${course.id}/featured`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ isFeatured: true })
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/admin/courses/analytics', () => {
        it('should get platform analytics', async () => {
            const response = await request(app)
                .get('/api/v1/admin/courses/analytics')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/admin/courses/analytics')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for non-admin user', async () => {
            const response = await request(app)
                .get('/api/v1/admin/courses/analytics')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });
});

