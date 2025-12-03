// src/__tests__/api/ai-recommendation.test.js
import request from 'supertest';
import app from '../../app.js';
import {
    createTestUser,
    createTestInstructor,
    generateTestToken,
    cleanupTestData,
    createTestCourse,
} from '../helpers/test-helpers.js';
import { prisma } from '../../config/database.config.js';
import { USER_ROLES } from '../../config/constants.js';

describe('AI Recommendation API', () => {
    let student;
    let studentToken;
    let instructor;
    let instructorToken;
    let course;

    beforeEach(async () => {
        // Create student
        student = await createTestUser({
            role: USER_ROLES.STUDENT,
        });
        studentToken = generateTestToken(student);

        // Create instructor
        instructor = await createTestInstructor();
        instructorToken = generateTestToken(instructor);

        // Create course
        course = await createTestCourse(instructor.id);
    });

    afterAll(async () => {
        await cleanupTestData();
        await prisma.$disconnect();
    });

    describe('GET /api/v1/ai/recommendations', () => {
        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/ai/recommendations')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should get recommendations', async () => {
            const response = await request(app)
                .get('/api/v1/ai/recommendations')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should limit recommendations', async () => {
            const response = await request(app)
                .get('/api/v1/ai/recommendations')
                .query({ limit: 5 })
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeLessThanOrEqual(5);
        });

        it('should return 422 for invalid limit', async () => {
            const response = await request(app)
                .get('/api/v1/ai/recommendations')
                .query({ limit: 100 }) // Max is 50
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(422);

            expect(response.body.success).toBe(false);
        });

        it('should force refresh recommendations', async () => {
            const response = await request(app)
                .get('/api/v1/ai/recommendations')
                .query({ forceRefresh: 'true' })
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('GET /api/v1/ai/recommendations/similar/:courseId', () => {
        it('should get similar courses without authentication', async () => {
            const response = await request(app)
                .get(`/api/v1/ai/recommendations/similar/${course.id}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should get similar courses with authentication', async () => {
            const response = await request(app)
                .get(`/api/v1/ai/recommendations/similar/${course.id}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should limit similar courses', async () => {
            const response = await request(app)
                .get(`/api/v1/ai/recommendations/similar/${course.id}`)
                .query({ limit: 3 })
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeLessThanOrEqual(3);
        });

        it('should return 404 for non-existent course', async () => {
            const response = await request(app)
                .get('/api/v1/ai/recommendations/similar/99999')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return 422 for invalid limit', async () => {
            const response = await request(app)
                .get(`/api/v1/ai/recommendations/similar/${course.id}`)
                .query({ limit: 100 }) // Max is 20
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(422);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/v1/ai/recommendations/:id/view', () => {
        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .post(`/api/v1/ai/recommendations/${course.id}/view`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should mark recommendation as viewed', async () => {
            const response = await request(app)
                .post(`/api/v1/ai/recommendations/${course.id}/view`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('viewed');
        });

        it('should return 404 for non-existent course', async () => {
            const response = await request(app)
                .post('/api/v1/ai/recommendations/99999/view')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });
});

