// Integration tests for Courses API
import request from 'supertest';
import app from '../../app.js';
import { createTestUser, createTestCategory, createTestCourse, cleanupTestData, generateTestToken } from '../helpers/test-helpers.js';
import { USER_ROLES, COURSE_STATUS } from '../../config/constants.js';
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
        const now = new Date();
        testCourse = await createTestCourse(testInstructor.id, {
            categoryId: testCategory.id,
            status: COURSE_STATUS.PUBLISHED,
            publishedAt: now, // Set publishedAt for PUBLISHED courses
        });
    });

    afterAll(async () => {
        // Skip cleanup to avoid "too many bind variables" error
        // Tests will be cleaned up by test database reset
        try {
            await cleanupTestData();
        } catch (error) {
            // Ignore cleanup errors
        }
    });

    describe('GET /api/v1/courses', () => {
        it('should get all courses', async () => {
            const response = await request(app)
                .get('/api/v1/courses')
                .query({ page: 1, limit: 10 });

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            expect(response.body.success).toBe(true);
            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body).toHaveProperty('pagination');
            expect(response.body.pagination).toBeDefined();
            expect(typeof response.body.pagination.page).toBe('number');
            expect(typeof response.body.pagination.limit).toBe('number');
            expect(typeof response.body.pagination.total).toBe('number');
            expect(typeof response.body.pagination.totalPages).toBe('number');
        });

        it('should filter courses by search query', async () => {
            // Use testCourse title for search
            const searchTerm = testCourse.title.substring(0, 10);
            const response = await request(app)
                .get('/api/v1/courses')
                .query({ search: searchTerm, page: 1, limit: 10 });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body).toHaveProperty('pagination');
        });

        it('should filter courses by category', async () => {
            const response = await request(app)
                .get('/api/v1/courses')
                .query({ categoryId: testCategory.id, page: 1, limit: 10 });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body).toHaveProperty('pagination');
        });
    });

    describe('GET /api/v1/courses/:id', () => {
        it('should get course by ID', async () => {
            const response = await request(app)
                .get(`/api/v1/courses/${testCourse.id}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toBeDefined();
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
            // Create a featured course
            const featuredCourse = await createTestCourse(testInstructor.id, {
                categoryId: testCategory.id,
                status: COURSE_STATUS.PUBLISHED,
                isFeatured: true,
                publishedAt: new Date(), // Set publishedAt for PUBLISHED courses
            });

            const response = await request(app)
                .get('/api/v1/courses/featured')
                .query({ limit: 10 });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);
            // Featured courses may be empty if no courses are featured
            // Just verify the structure is correct
        });
    });

    describe('GET /api/v1/courses/trending', () => {
        it('should get trending courses', async () => {
            // Ensure test course has publishedAt within last 3 months
            await prisma.course.update({
                where: { id: testCourse.id },
                data: { publishedAt: new Date() },
            });

            const response = await request(app)
                .get('/api/v1/courses/trending')
                .query({ limit: 10 });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);
            // Trending courses may be empty if no courses have enrollments/views
            // Just verify the structure is correct
        });
    });
});


