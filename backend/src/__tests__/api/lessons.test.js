// src/__tests__/api/lessons.test.js
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

describe('Lessons API', () => {
    let student;
    let studentToken;
    let instructor;
    let instructorToken;
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
        instructorToken = generateTestToken(instructor);

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
            videoUrl: 'https://example.com/video.mp4',
            videoDuration: 600,
            transcriptUrl: 'https://example.com/transcript.txt',
            isPublished: true,
        });

        // Create enrollment for student
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

    describe('GET /api/v1/lessons/:id', () => {
        it('should get lesson by ID for enrolled student', async () => {
            const response = await request(app)
                .get(`/api/v1/lessons/${lesson.id}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.id).toBe(lesson.id);
            expect(response.body.data.title).toBe(lesson.title);
            expect(response.body.data.course).toBeDefined();
        });

        it('should get lesson by ID for course instructor', async () => {
            const response = await request(app)
                .get(`/api/v1/lessons/${lesson.id}`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.id).toBe(lesson.id);
        });

        it('should return 404 for non-existent lesson', async () => {
            const response = await request(app)
                .get('/api/v1/lessons/99999')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(
                response.body.message?.toLowerCase().includes('not found') ||
                response.body.error?.message?.toLowerCase().includes('not found')
            ).toBe(true);
        });

        it('should return 403 for non-enrolled user', async () => {
            const otherStudent = await createTestUser({
                role: USER_ROLES.STUDENT,
            });
            const otherStudentToken = generateTestToken(otherStudent);

            const response = await request(app)
                .get(`/api/v1/lessons/${lesson.id}`)
                .set('Authorization', `Bearer ${otherStudentToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get(`/api/v1/lessons/${lesson.id}`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/lessons/:id/video', () => {
        it('should get lesson video URL for enrolled student', async () => {
            const response = await request(app)
                .get(`/api/v1/lessons/${lesson.id}/video`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.id).toBe(lesson.id);
            expect(response.body.data.videoUrl).toBe(lesson.videoUrl);
            expect(response.body.data.videoDuration).toBe(lesson.videoDuration);
        });

        it('should get lesson video URL for course instructor', async () => {
            const response = await request(app)
                .get(`/api/v1/lessons/${lesson.id}/video`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.videoUrl).toBe(lesson.videoUrl);
        });

        it('should return 404 for lesson without video', async () => {
            const lessonWithoutVideo = await createTestLesson(course.id, {
                title: `Lesson Without Video ${Date.now()}`,
                slug: `lesson-without-video-${Date.now()}`,
                lessonOrder: 2,
                videoUrl: null,
            });

            const response = await request(app)
                .get(`/api/v1/lessons/${lessonWithoutVideo.id}/video`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(
                response.body.error?.message
                    ?.toLowerCase()
                    .includes('video not available')
            ).toBe(true);
        });

        it('should return 404 for non-existent lesson', async () => {
            const response = await request(app)
                .get('/api/v1/lessons/99999/video')
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
                .get(`/api/v1/lessons/${lesson.id}/video`)
                .set('Authorization', `Bearer ${otherStudentToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get(`/api/v1/lessons/${lesson.id}/video`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/lessons/:id/transcript', () => {
        it('should get lesson transcript URL for enrolled student', async () => {
            const response = await request(app)
                .get(`/api/v1/lessons/${lesson.id}/transcript`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.id).toBe(lesson.id);
            expect(response.body.data.transcriptUrl).toBe(lesson.transcriptUrl);
        });

        it('should get lesson transcript URL for course instructor', async () => {
            const response = await request(app)
                .get(`/api/v1/lessons/${lesson.id}/transcript`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.transcriptUrl).toBe(lesson.transcriptUrl);
        });

        it('should return 404 for lesson without transcript', async () => {
            const lessonWithoutTranscript = await createTestLesson(course.id, {
                title: `Lesson Without Transcript ${Date.now()}`,
                slug: `lesson-without-transcript-${Date.now()}`,
                lessonOrder: 3,
                transcriptUrl: null,
            });

            const response = await request(app)
                .get(`/api/v1/lessons/${lessonWithoutTranscript.id}/transcript`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(
                response.body.error?.message
                    ?.toLowerCase()
                    .includes('transcript not available')
            ).toBe(true);
        });

        it('should return 404 for non-existent lesson', async () => {
            const response = await request(app)
                .get('/api/v1/lessons/99999/transcript')
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
                .get(`/api/v1/lessons/${lesson.id}/transcript`)
                .set('Authorization', `Bearer ${otherStudentToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get(`/api/v1/lessons/${lesson.id}/transcript`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });
});

