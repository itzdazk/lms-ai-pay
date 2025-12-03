// src/__tests__/api/admin-quizzes.test.js
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
} from '../../config/constants.js';

describe('Admin Quizzes API', () => {
    let admin;
    let adminToken;
    let instructor;
    let instructorToken;
    let student;
    let studentToken;
    let category;
    let course;
    let lesson;
    let quiz;
    let quizSubmission;

    beforeEach(async () => {
        // Create admin
        admin = await createTestUser({
            role: USER_ROLES.ADMIN,
        });
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
            price: 0,
            discountPrice: 0,
        });

        // Create lesson
        lesson = await createTestLesson(course.id, {
            title: `Test Lesson ${Date.now()}`,
            slug: `test-lesson-${Date.now()}`,
            lessonOrder: 1,
            isPublished: true,
        });

        // Create quiz
        quiz = await prisma.quiz.create({
            data: {
                lessonId: lesson.id,
                courseId: course.id,
                title: `Test Quiz ${Date.now()}`,
                description: 'Test quiz description',
                questions: [
                    {
                        id: '1',
                        question: 'What is 2+2?',
                        type: 'multiple-choice',
                        options: ['3', '4', '5', '6'],
                        correctAnswer: '4',
                    },
                ],
                passingScore: 70,
                attemptsAllowed: 3,
                timeLimitMinutes: 30,
                isPublished: true,
            },
        });

        // Create quiz submission
        quizSubmission = await prisma.quizSubmission.create({
            data: {
                quizId: quiz.id,
                userId: student.id,
                answers: [
                    {
                        questionId: '1',
                        answer: '4',
                    },
                ],
                score: 100,
                isPassed: true,
                submittedAt: new Date(),
            },
        });
    });

    afterAll(async () => {
        await cleanupTestData();
        await prisma.$disconnect();
    });

    describe('GET /api/v1/admin/quizzes', () => {
        it('should get all quizzes for admin', async () => {
            const response = await request(app)
                .get('/api/v1/admin/quizzes')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.pagination).toBeDefined();
        });

        it('should filter quizzes by courseId', async () => {
            const response = await request(app)
                .get(`/api/v1/admin/quizzes?courseId=${course.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(
                response.body.data.every((q) => q.courseId === course.id)
            ).toBe(true);
        });

        it('should filter quizzes by lessonId', async () => {
            const response = await request(app)
                .get(`/api/v1/admin/quizzes?lessonId=${lesson.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(
                response.body.data.every((q) => q.lessonId === lesson.id)
            ).toBe(true);
        });

        it('should filter quizzes by instructorId', async () => {
            const response = await request(app)
                .get(`/api/v1/admin/quizzes?instructorId=${instructor.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should filter quizzes by isPublished', async () => {
            const response = await request(app)
                .get('/api/v1/admin/quizzes?isPublished=true')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(
                response.body.data.every((q) => q.isPublished === true)
            ).toBe(true);
        });

        it('should paginate quizzes', async () => {
            const response = await request(app)
                .get('/api/v1/admin/quizzes?page=1&limit=1')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeLessThanOrEqual(1);
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.limit).toBe(1);
        });

        it('should return 403 for instructor', async () => {
            const response = await request(app)
                .get('/api/v1/admin/quizzes')
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for student', async () => {
            const response = await request(app)
                .get('/api/v1/admin/quizzes')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/admin/quizzes')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/admin/quizzes/:quizId/submissions', () => {
        it('should get quiz submissions for admin', async () => {
            const response = await request(app)
                .get(`/api/v1/admin/quizzes/${quiz.id}/submissions`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.pagination).toBeDefined();
        });

        it('should filter submissions by studentId', async () => {
            const response = await request(app)
                .get(
                    `/api/v1/admin/quizzes/${quiz.id}/submissions?studentId=${student.id}`
                )
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(
                response.body.data.every((s) => s.userId === student.id)
            ).toBe(true);
        });

        it('should filter submissions by isPassed', async () => {
            const response = await request(app)
                .get(
                    `/api/v1/admin/quizzes/${quiz.id}/submissions?isPassed=true`
                )
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(
                response.body.data.every((s) => s.isPassed === true)
            ).toBe(true);
        });

        it('should paginate submissions', async () => {
            const response = await request(app)
                .get(
                    `/api/v1/admin/quizzes/${quiz.id}/submissions?page=1&limit=1`
                )
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeLessThanOrEqual(1);
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.limit).toBe(1);
        });

        it('should return 404 for non-existent quiz', async () => {
            const response = await request(app)
                .get('/api/v1/admin/quizzes/99999/submissions')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for instructor', async () => {
            const response = await request(app)
                .get(`/api/v1/admin/quizzes/${quiz.id}/submissions`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for student', async () => {
            const response = await request(app)
                .get(`/api/v1/admin/quizzes/${quiz.id}/submissions`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get(`/api/v1/admin/quizzes/${quiz.id}/submissions`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });
});

