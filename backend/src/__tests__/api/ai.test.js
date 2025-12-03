// src/__tests__/api/ai.test.js
import request from 'supertest';
import app from '../../app.js';
import {
    createTestUser,
    createTestInstructor,
    generateTestToken,
    cleanupTestData,
    createTestCourse,
    createTestLesson,
} from '../helpers/test-helpers.js';
import { prisma } from '../../config/database.config.js';
import { USER_ROLES } from '../../config/constants.js';

describe('AI API', () => {
    let student;
    let studentToken;
    let instructor;
    let instructorToken;
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

        // Create course and lesson for context
        course = await createTestCourse(instructor.id);
        lesson = await createTestLesson(course.id);
    });

    afterAll(async () => {
        await cleanupTestData();
        await prisma.$disconnect();
    });

    describe('GET /api/v1/ai/conversations', () => {
        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/ai/conversations')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should get user conversations', async () => {
            const response = await request(app)
                .get('/api/v1/ai/conversations')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should paginate conversations', async () => {
            const response = await request(app)
                .get('/api/v1/ai/conversations')
                .query({ page: 1, limit: 10 })
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.pagination).toBeDefined();
        });

        it('should filter archived conversations', async () => {
            const response = await request(app)
                .get('/api/v1/ai/conversations')
                .query({ isArchived: 'true' })
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('POST /api/v1/ai/conversations', () => {
        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .post('/api/v1/ai/conversations')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should create conversation without course/lesson', async () => {
            const response = await request(app)
                .post('/api/v1/ai/conversations')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({})
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.id).toBeDefined();
        });

        it('should create conversation with course', async () => {
            const response = await request(app)
                .post('/api/v1/ai/conversations')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ courseId: course.id })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.courseId).toBe(course.id);
        });

        it('should create conversation with lesson', async () => {
            const response = await request(app)
                .post('/api/v1/ai/conversations')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ lessonId: lesson.id })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.lessonId).toBe(lesson.id);
        });

        it('should return 404 for non-existent course', async () => {
            const response = await request(app)
                .post('/api/v1/ai/conversations')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ courseId: 99999 })
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return 404 for non-existent lesson', async () => {
            const response = await request(app)
                .post('/api/v1/ai/conversations')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ lessonId: 99999 })
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/ai/conversations/:id', () => {
        let conversation;

        beforeEach(async () => {
            conversation = await prisma.conversation.create({
                data: {
                    userId: student.id,
                    title: 'Test Conversation',
                },
            });
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get(`/api/v1/ai/conversations/${conversation.id}`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should get conversation details', async () => {
            const response = await request(app)
                .get(`/api/v1/ai/conversations/${conversation.id}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(conversation.id);
        });

        it('should return 404 for non-existent conversation', async () => {
            const response = await request(app)
                .get('/api/v1/ai/conversations/99999')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return 404 for other user conversation', async () => {
            const otherUser = await createTestUser({
                role: USER_ROLES.STUDENT,
            });
            const otherToken = generateTestToken(otherUser);

            const response = await request(app)
                .get(`/api/v1/ai/conversations/${conversation.id}`)
                .set('Authorization', `Bearer ${otherToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/v1/ai/conversations/:id', () => {
        let conversation;

        beforeEach(async () => {
            conversation = await prisma.conversation.create({
                data: {
                    userId: student.id,
                    title: 'Test Conversation',
                },
            });
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .delete(`/api/v1/ai/conversations/${conversation.id}`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should delete conversation', async () => {
            const response = await request(app)
                .delete(`/api/v1/ai/conversations/${conversation.id}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('deleted successfully');
        });

        it('should return 404 for non-existent conversation', async () => {
            const response = await request(app)
                .delete('/api/v1/ai/conversations/99999')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PATCH /api/v1/ai/conversations/:id/archive', () => {
        let conversation;

        beforeEach(async () => {
            conversation = await prisma.conversation.create({
                data: {
                    userId: student.id,
                    title: 'Test Conversation',
                },
            });
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .patch(`/api/v1/ai/conversations/${conversation.id}/archive`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should archive conversation', async () => {
            const response = await request(app)
                .patch(`/api/v1/ai/conversations/${conversation.id}/archive`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('archived successfully');
        });

        it('should return 404 for non-existent conversation', async () => {
            const response = await request(app)
                .patch('/api/v1/ai/conversations/99999/archive')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PATCH /api/v1/ai/conversations/:id/activate', () => {
        let conversation;

        beforeEach(async () => {
            conversation = await prisma.conversation.create({
                data: {
                    userId: student.id,
                    title: 'Test Conversation',
                    isArchived: true,
                },
            });
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .patch(`/api/v1/ai/conversations/${conversation.id}/activate`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should activate conversation', async () => {
            const response = await request(app)
                .patch(`/api/v1/ai/conversations/${conversation.id}/activate`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('activated successfully');
        });

        it('should return 404 for non-existent conversation', async () => {
            const response = await request(app)
                .patch('/api/v1/ai/conversations/99999/activate')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/ai/conversations/:id/messages', () => {
        let conversation;

        beforeEach(async () => {
            conversation = await prisma.conversation.create({
                data: {
                    userId: student.id,
                    title: 'Test Conversation',
                },
            });
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get(`/api/v1/ai/conversations/${conversation.id}/messages`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should get messages', async () => {
            const response = await request(app)
                .get(`/api/v1/ai/conversations/${conversation.id}/messages`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should paginate messages', async () => {
            const response = await request(app)
                .get(`/api/v1/ai/conversations/${conversation.id}/messages`)
                .query({ page: 1, limit: 10 })
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.pagination).toBeDefined();
        });

        it('should return 404 for non-existent conversation', async () => {
            const response = await request(app)
                .get('/api/v1/ai/conversations/99999/messages')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/v1/ai/conversations/:id/messages', () => {
        let conversation;

        beforeEach(async () => {
            conversation = await prisma.conversation.create({
                data: {
                    userId: student.id,
                    title: 'Test Conversation',
                },
            });
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .post(`/api/v1/ai/conversations/${conversation.id}/messages`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should return 422 for missing message', async () => {
            const response = await request(app)
                .post(`/api/v1/ai/conversations/${conversation.id}/messages`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send({})
                .expect(422);

            expect(response.body.success).toBe(false);
        });

        it.skip('should send message to AI', async () => {
            // This test requires Ollama service to be running
            // Skipped for now
        });

        it('should return 404 for non-existent conversation', async () => {
            const response = await request(app)
                .post('/api/v1/ai/conversations/99999/messages')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ message: 'Hello' })
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/ai/search', () => {
        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/ai/search')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should return 422 for missing query', async () => {
            const response = await request(app)
                .get('/api/v1/ai/search')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(422);

            expect(response.body.success).toBe(false);
        });

        it.skip('should search knowledge base', async () => {
            // This test requires Ollama service to be running
            // Skipped for now
        });
    });

    describe('GET /api/v1/ai/ollama/status', () => {
        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/ai/ollama/status')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it.skip('should get Ollama status', async () => {
            // This test requires Ollama service to be running
            // Skipped for now
        });
    });
});

