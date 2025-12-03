// src/__tests__/api/progress.test.js
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

describe('Progress API', () => {
    let student;
    let studentToken;
    let instructor;
    let category;
    let course;
    let lesson;
    let enrollment;

    beforeEach(async () => {
        // Create student for authenticated requests
        student = await createTestUser({
            role: USER_ROLES.STUDENT,
        });
        studentToken = generateTestToken(student);

        // Create instructor
        instructor = await createTestInstructor();

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
            videoDuration: 600,
        });

        // Create enrollment
        enrollment = await prisma.enrollment.create({
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

    describe('GET /api/v1/progress/courses/:courseId', () => {
        it('should get course progress', async () => {
            const response = await request(app)
                .get(`/api/v1/progress/courses/${course.id}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.enrollment).toBeDefined();
            expect(response.body.data.course).toBeDefined();
            expect(response.body.data.progress).toBeDefined();
            expect(response.body.data.lessons).toBeDefined();
            expect(Array.isArray(response.body.data.lessons)).toBe(true);
        });

        it('should return 403 for non-enrolled user', async () => {
            const otherStudent = await createTestUser({
                role: USER_ROLES.STUDENT,
            });
            const otherStudentToken = generateTestToken(otherStudent);

            const response = await request(app)
                .get(`/api/v1/progress/courses/${course.id}`)
                .set('Authorization', `Bearer ${otherStudentToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get(`/api/v1/progress/courses/${course.id}`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/progress/lessons/:lessonId', () => {
        it('should get lesson progress', async () => {
            const response = await request(app)
                .get(`/api/v1/progress/lessons/${lesson.id}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.lesson).toBeDefined();
            expect(response.body.data.progress).toBeDefined();
            expect(response.body.data.progress.isCompleted).toBe(false);
        });

        it('should return 404 for non-existent lesson', async () => {
            const response = await request(app)
                .get('/api/v1/progress/lessons/99999')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for non-enrolled user', async () => {
            const otherStudent = await createTestUser({
                role: USER_ROLES.STUDENT,
            });
            const otherStudentToken = generateTestToken(otherStudent);

            const response = await request(app)
                .get(`/api/v1/progress/lessons/${lesson.id}`)
                .set('Authorization', `Bearer ${otherStudentToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get(`/api/v1/progress/lessons/${lesson.id}`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/v1/progress/lessons/:lessonId/start', () => {
        it('should start learning a lesson', async () => {
            const response = await request(app)
                .post(`/api/v1/progress/lessons/${lesson.id}/start`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.progress).toBeDefined();
            expect(response.body.data.progress.attemptsCount).toBeGreaterThan(0);
        });

        it('should increment attempts count on multiple starts', async () => {
            // Start lesson first time
            await request(app)
                .post(`/api/v1/progress/lessons/${lesson.id}/start`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            // Start lesson second time
            const response = await request(app)
                .post(`/api/v1/progress/lessons/${lesson.id}/start`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.progress.attemptsCount).toBe(2);
        });

        it('should return 404 for non-existent lesson', async () => {
            const response = await request(app)
                .post('/api/v1/progress/lessons/99999/start')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for non-enrolled user', async () => {
            const otherStudent = await createTestUser({
                role: USER_ROLES.STUDENT,
            });
            const otherStudentToken = generateTestToken(otherStudent);

            const response = await request(app)
                .post(`/api/v1/progress/lessons/${lesson.id}/start`)
                .set('Authorization', `Bearer ${otherStudentToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .post(`/api/v1/progress/lessons/${lesson.id}/start`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/v1/progress/lessons/:lessonId/update', () => {
        it('should update lesson progress with position', async () => {
            const response = await request(app)
                .put(`/api/v1/progress/lessons/${lesson.id}/update`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ position: 300 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.progress.lastPosition).toBe(300);
        });

        it('should update lesson progress with watch duration', async () => {
            const response = await request(app)
                .put(`/api/v1/progress/lessons/${lesson.id}/update`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ watchDuration: 120 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.progress.watchDuration).toBe(120);
        });

        it('should update lesson progress with both position and watch duration', async () => {
            const response = await request(app)
                .put(`/api/v1/progress/lessons/${lesson.id}/update`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ position: 450, watchDuration: 180 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.progress.lastPosition).toBe(450);
            expect(response.body.data.progress.watchDuration).toBe(180);
        });

        it('should return 404 for non-existent lesson', async () => {
            const response = await request(app)
                .put('/api/v1/progress/lessons/99999/update')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ position: 300 })
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for non-enrolled user', async () => {
            const otherStudent = await createTestUser({
                role: USER_ROLES.STUDENT,
            });
            const otherStudentToken = generateTestToken(otherStudent);

            const response = await request(app)
                .put(`/api/v1/progress/lessons/${lesson.id}/update`)
                .set('Authorization', `Bearer ${otherStudentToken}`)
                .send({ position: 300 })
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .put(`/api/v1/progress/lessons/${lesson.id}/update`)
                .send({ position: 300 })
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/v1/progress/lessons/:lessonId/complete', () => {
        it('should mark lesson as completed', async () => {
            const response = await request(app)
                .post(`/api/v1/progress/lessons/${lesson.id}/complete`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.progress.isCompleted).toBe(true);
            expect(response.body.data.progress.completedAt).toBeDefined();
        });

        it('should update course progress percentage', async () => {
            // Create another lesson
            const lesson2 = await createTestLesson(course.id, {
                title: `Test Lesson 2 ${Date.now()}`,
                slug: `test-lesson-2-${Date.now()}`,
                lessonOrder: 2,
            });

            // Complete first lesson
            await request(app)
                .post(`/api/v1/progress/lessons/${lesson.id}/complete`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            // Complete second lesson
            await request(app)
                .post(`/api/v1/progress/lessons/${lesson2.id}/complete`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            // Check course progress
            const progressResponse = await request(app)
                .get(`/api/v1/progress/courses/${course.id}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(progressResponse.body.data.progress.progressPercentage).toBe(
                100
            );
        });

        it('should return 404 for non-existent lesson', async () => {
            const response = await request(app)
                .post('/api/v1/progress/lessons/99999/complete')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for non-enrolled user', async () => {
            const otherStudent = await createTestUser({
                role: USER_ROLES.STUDENT,
            });
            const otherStudentToken = generateTestToken(otherStudent);

            const response = await request(app)
                .post(`/api/v1/progress/lessons/${lesson.id}/complete`)
                .set('Authorization', `Bearer ${otherStudentToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .post(`/api/v1/progress/lessons/${lesson.id}/complete`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/progress/lessons/:lessonId/resume', () => {
        it('should get resume position for a lesson', async () => {
            // First, update progress with a position
            await request(app)
                .put(`/api/v1/progress/lessons/${lesson.id}/update`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ position: 250 })
                .expect(200);

            const response = await request(app)
                .get(`/api/v1/progress/lessons/${lesson.id}/resume`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.resumePosition).toBe(250);
            expect(response.body.data.isCompleted).toBe(false);
        });

        it('should return 0 for resume position if no progress', async () => {
            // Create a new lesson without progress
            const newLesson = await createTestLesson(course.id, {
                title: `New Lesson ${Date.now()}`,
                slug: `new-lesson-${Date.now()}`,
                lessonOrder: 2,
            });

            const response = await request(app)
                .get(`/api/v1/progress/lessons/${newLesson.id}/resume`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.resumePosition).toBe(0);
        });

        it('should return 404 for non-existent lesson', async () => {
            const response = await request(app)
                .get('/api/v1/progress/lessons/99999/resume')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for non-enrolled user', async () => {
            const otherStudent = await createTestUser({
                role: USER_ROLES.STUDENT,
            });
            const otherStudentToken = generateTestToken(otherStudent);

            const response = await request(app)
                .get(`/api/v1/progress/lessons/${lesson.id}/resume`)
                .set('Authorization', `Bearer ${otherStudentToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get(`/api/v1/progress/lessons/${lesson.id}/resume`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });
});

