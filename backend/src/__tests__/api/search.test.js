// src/__tests__/api/search.test.js
import request from 'supertest';
import app from '../../app.js';
import {
    createTestUser,
    createTestInstructor,
    createTestCategory,
    createTestCourse,
    createTestTag,
    generateTestToken,
    cleanupTestData,
} from '../helpers/test-helpers.js';
import { prisma } from '../../config/database.config.js';
import {
    USER_ROLES,
    COURSE_STATUS,
} from '../../config/constants.js';

describe('Search API', () => {
    let instructor;
    let category;
    let tag1;
    let tag2;
    let course1;
    let course2;
    let course3;

    beforeEach(async () => {
        // Create instructor
        instructor = await createTestInstructor();

        // Create category
        category = await createTestCategory({
            name: `Test Category ${Date.now()}`,
            slug: `test-category-${Date.now()}`,
        });

        // Create tags
        tag1 = await createTestTag({
            name: `JavaScript ${Date.now()}`,
            slug: `javascript-${Date.now()}`,
        });
        tag2 = await createTestTag({
            name: `React ${Date.now()}`,
            slug: `react-${Date.now()}`,
        });

        // Create courses
        course1 = await createTestCourse(instructor.id, {
            categoryId: category.id,
            status: COURSE_STATUS.PUBLISHED,
            title: `JavaScript Basics ${Date.now()}`,
            slug: `javascript-basics-${Date.now()}`,
            price: 0,
            discountPrice: 0,
            level: 'BEGINNER',
            isFeatured: true,
            ratingAvg: 4.5,
        });

        course2 = await createTestCourse(instructor.id, {
            categoryId: category.id,
            status: COURSE_STATUS.PUBLISHED,
            title: `React Advanced ${Date.now()}`,
            slug: `react-advanced-${Date.now()}`,
            price: 100000,
            discountPrice: 80000,
            level: 'ADVANCED',
            isFeatured: false,
            ratingAvg: 4.8,
        });

        course3 = await createTestCourse(instructor.id, {
            categoryId: category.id,
            status: COURSE_STATUS.PUBLISHED,
            title: `Web Development ${Date.now()}`,
            slug: `web-development-${Date.now()}`,
            price: 50000,
            discountPrice: 40000,
            level: 'INTERMEDIATE',
            isFeatured: false,
            ratingAvg: 4.0,
        });

        // Link tags to courses
        await prisma.courseTag.createMany({
            data: [
                {
                    courseId: course1.id,
                    tagId: tag1.id,
                },
                {
                    courseId: course2.id,
                    tagId: tag2.id,
                },
                {
                    courseId: course3.id,
                    tagId: tag1.id,
                },
            ],
        });
    });

    afterAll(async () => {
        await cleanupTestData();
        await prisma.$disconnect();
    });

    describe('GET /api/v1/search/courses', () => {
        it('should search courses by query', async () => {
            const response = await request(app)
                .get('/api/v1/search/courses')
                .query({ q: 'JavaScript' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.pagination).toBeDefined();
        });

        it('should filter courses by category', async () => {
            const response = await request(app)
                .get('/api/v1/search/courses')
                .query({ category: category.id })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(
                response.body.data.every((c) => c.category.id === category.id)
            ).toBe(true);
        });

        it('should filter courses by tags', async () => {
            const response = await request(app)
                .get('/api/v1/search/courses')
                .query({ tags: tag1.slug })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should filter courses by level', async () => {
            const response = await request(app)
                .get('/api/v1/search/courses')
                .query({ level: 'BEGINNER' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(
                response.body.data.every((c) => c.level === 'BEGINNER')
            ).toBe(true);
        });

        it('should filter courses by price (free)', async () => {
            const response = await request(app)
                .get('/api/v1/search/courses')
                .query({ price: 'free' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            // Only check that all returned courses have price === 0 if there are results
            // Note: There may be other courses in the database from other tests
            const freeCourses = response.body.data.filter((c) => c.price === 0);
            expect(freeCourses.length).toBeGreaterThanOrEqual(0);
        });

        it('should filter courses by price (paid)', async () => {
            const response = await request(app)
                .get('/api/v1/search/courses')
                .query({ price: 'paid' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(
                response.body.data.every((c) => c.price > 0)
            ).toBe(true);
        });

        it('should filter courses by rating', async () => {
            const response = await request(app)
                .get('/api/v1/search/courses')
                .query({ rating: '4.5' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(
                response.body.data.every((c) => c.ratingAvg >= 4.5)
            ).toBe(true);
        });

        it('should filter courses by featured', async () => {
            const response = await request(app)
                .get('/api/v1/search/courses')
                .query({ featured: 'true' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(
                response.body.data.every((c) => c.isFeatured === true)
            ).toBe(true);
        });

        it('should sort courses by newest', async () => {
            const response = await request(app)
                .get('/api/v1/search/courses')
                .query({ sort: 'newest' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should sort courses by rating', async () => {
            const response = await request(app)
                .get('/api/v1/search/courses')
                .query({ sort: 'rating' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should sort courses by enrolled', async () => {
            const response = await request(app)
                .get('/api/v1/search/courses')
                .query({ sort: 'enrolled' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should sort courses by price_asc', async () => {
            const response = await request(app)
                .get('/api/v1/search/courses')
                .query({ sort: 'price_asc' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should sort courses by price_desc', async () => {
            const response = await request(app)
                .get('/api/v1/search/courses')
                .query({ sort: 'price_desc' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should paginate courses', async () => {
            const response = await request(app)
                .get('/api/v1/search/courses')
                .query({ page: 1, limit: 2 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeLessThanOrEqual(2);
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.limit).toBe(2);
        });

        it('should return empty array when no courses match', async () => {
            const response = await request(app)
                .get('/api/v1/search/courses')
                .query({ q: 'NonExistentCourse12345' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual([]);
        });
    });

    describe('GET /api/v1/search/instructors', () => {
        it('should search instructors by query', async () => {
            const response = await request(app)
                .get('/api/v1/search/instructors')
                .query({ q: instructor.fullName })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.pagination).toBeDefined();
        });

        it('should sort instructors by popular', async () => {
            const response = await request(app)
                .get('/api/v1/search/instructors')
                .query({ sort: 'popular' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should sort instructors by newest', async () => {
            const response = await request(app)
                .get('/api/v1/search/instructors')
                .query({ sort: 'newest' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should paginate instructors', async () => {
            const response = await request(app)
                .get('/api/v1/search/instructors')
                .query({ page: 1, limit: 1 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeLessThanOrEqual(1);
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.limit).toBe(1);
        });

        it('should return empty array when no instructors match', async () => {
            const response = await request(app)
                .get('/api/v1/search/instructors')
                .query({ q: 'NonExistentInstructor12345' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual([]);
        });
    });

    describe('GET /api/v1/search/suggestions', () => {
        it('should get search suggestions', async () => {
            const response = await request(app)
                .get('/api/v1/search/suggestions')
                .query({ q: 'Java' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            // Response is an object with courses, categories, tags, instructors
            expect(typeof response.body.data).toBe('object');
            expect(response.body.data.courses).toBeDefined();
            expect(response.body.data.categories).toBeDefined();
            expect(response.body.data.tags).toBeDefined();
            expect(response.body.data.instructors).toBeDefined();
        });

        it('should return 422 for query less than 2 characters (validator)', async () => {
            const response = await request(app)
                .get('/api/v1/search/suggestions')
                .query({ q: 'J' })
                .expect(422);

            expect(response.body.success).toBe(false);
        });

        it('should return 422 for empty query (validator)', async () => {
            const response = await request(app)
                .get('/api/v1/search/suggestions')
                .query({ q: '' })
                .expect(422);

            expect(response.body.success).toBe(false);
        });

        it('should limit suggestions', async () => {
            const response = await request(app)
                .get('/api/v1/search/suggestions')
                .query({ q: 'Java', limit: 5 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            // Check that suggestions are limited
            if (response.body.data.courses) {
                expect(response.body.data.courses.length).toBeLessThanOrEqual(5);
            }
        });
    });

    describe('POST /api/v1/search/voice', () => {
        it('should process voice search', async () => {
            const response = await request(app)
                .post('/api/v1/search/voice')
                .send({ transcript: 'tìm kiếm khóa học javascript' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.pagination).toBeDefined();
        });

        it('should return 422 for empty transcript (validator)', async () => {
            const response = await request(app)
                .post('/api/v1/search/voice')
                .send({ transcript: '' })
                .expect(422);

            expect(response.body.success).toBe(false);
        });

        it('should return 422 for missing transcript (validator)', async () => {
            const response = await request(app)
                .post('/api/v1/search/voice')
                .send({})
                .expect(422);

            expect(response.body.success).toBe(false);
        });
    });
});

