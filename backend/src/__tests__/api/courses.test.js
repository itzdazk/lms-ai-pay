// Integration tests for Courses API
import request from 'supertest';
import app from '../../app.js';
import { createTestUser, createTestCategory, createTestCourse, cleanupTestData, generateTestToken } from '../helpers/test-helpers.js';
import { USER_ROLES } from '../../config/constants.js';
import { prisma } from '../../config/database.config.js';

describe('Courses API', () => {
    let testCategory;
    let testInstructor;
    let testCourse;

    beforeEach(async () => {
        // Cleanup only courses and categories, preserve users from other tests
        await prisma.course.deleteMany({
            where: { slug: { contains: 'test-course-' } },
        });
        await prisma.category.deleteMany({
            where: { slug: { contains: 'test-category-' } },
        });
        
        testCategory = await createTestCategory();
        testInstructor = await createTestUser({ role: USER_ROLES.INSTRUCTOR });
        testCourse = await createTestCourse(testInstructor.id, {
            categoryId: testCategory.id,
            status: 'PUBLISHED',
        });
    });

    afterAll(async () => {
        await cleanupTestData();
    });

    describe('GET /api/v1/courses', () => {
        it('should get all courses', async () => {
            const response = await request(app)
                .get('/api/v1/courses')
                .query({ page: 1, limit: 10 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body).toHaveProperty('pagination');
            expect(response.body.pagination).toHaveProperty('page');
            expect(response.body.pagination).toHaveProperty('limit');
            expect(response.body.pagination).toHaveProperty('total');
        });

        it('should filter courses by search query', async () => {
            const response = await request(app)
                .get('/api/v1/courses')
                .query({ search: 'Test', page: 1, limit: 10 })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should filter courses by category', async () => {
            const response = await request(app)
                .get('/api/v1/courses')
                .query({ categoryId: testCategory.id, page: 1, limit: 10 })
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('GET /api/v1/courses/:id', () => {
        it('should get course by ID', async () => {
            const response = await request(app)
                .get(`/api/v1/courses/${testCourse.id}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(testCourse.id);
        });

        it('should return 404 for non-existent course', async () => {
            const response = await request(app)
                .get('/api/v1/courses/999999')
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/courses/featured', () => {
        it('should get featured courses', async () => {
            const response = await request(app)
                .get('/api/v1/courses/featured')
                .query({ limit: 10 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });
    });

    describe('GET /api/v1/courses/trending', () => {
        it('should get trending courses', async () => {
            const response = await request(app)
                .get('/api/v1/courses/trending')
                .query({ limit: 10 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });
    });
});


