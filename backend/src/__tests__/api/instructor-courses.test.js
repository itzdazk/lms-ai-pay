// src/__tests__/api/instructor-courses.test.js
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

describe('Instructor Courses API', () => {
    let instructor;
    let instructorToken;
    let otherInstructor;
    let otherInstructorToken;
    let student;
    let studentToken;
    let category;
    let course;
    let tag;

    beforeEach(async () => {
        // Create instructors
        instructor = await createTestInstructor();
        instructorToken = generateTestToken(instructor);

        otherInstructor = await createTestInstructor();
        otherInstructorToken = generateTestToken(otherInstructor);

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
            status: COURSE_STATUS.DRAFT,
            price: 100000,
            discountPrice: 80000,
        });

        // Create tag
        tag = await createTestTag({
            name: `Test Tag ${Date.now()}`,
            slug: `test-tag-${Date.now()}`,
        });
    });

    afterAll(async () => {
        await cleanupTestData();
        await prisma.$disconnect();
    });

    describe('GET /api/v1/instructor/courses', () => {
        it('should get instructor courses', async () => {
            const response = await request(app)
                .get('/api/v1/instructor/courses')
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.pagination).toBeDefined();
        });

        it('should filter courses by status', async () => {
            const response = await request(app)
                .get('/api/v1/instructor/courses')
                .query({ status: COURSE_STATUS.DRAFT })
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should filter courses by category', async () => {
            const response = await request(app)
                .get('/api/v1/instructor/courses')
                .query({ categoryId: category.id })
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should paginate courses', async () => {
            const response = await request(app)
                .get('/api/v1/instructor/courses')
                .query({ page: 1, limit: 1 })
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeLessThanOrEqual(1);
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.limit).toBe(1);
        });

        it('should return 403 for student', async () => {
            const response = await request(app)
                .get('/api/v1/instructor/courses')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/instructor/courses')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/instructor/courses/statistics', () => {
        it('should get course statistics', async () => {
            const response = await request(app)
                .get('/api/v1/instructor/courses/statistics')
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });
    });

    describe('POST /api/v1/instructor/courses', () => {
        it('should create course', async () => {
            const response = await request(app)
                .post('/api/v1/instructor/courses')
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    title: `New Course ${Date.now()}`,
                    slug: `new-course-${Date.now()}`,
                    shortDescription: 'Short description',
                    description: 'Full description',
                    categoryId: category.id,
                    level: 'BEGINNER',
                    price: 50000,
                    discountPrice: 40000,
                    status: COURSE_STATUS.DRAFT,
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.title).toBeDefined();
            // Check instructorId if present in response
            if (response.body.data.instructorId !== undefined) {
                expect(response.body.data.instructorId).toBe(instructor.id);
            }
        });

        it('should return 400 for duplicate slug', async () => {
            // Create a course first to get a slug
            const existingCourse = await createTestCourse(instructor.id, {
                categoryId: category.id,
                status: COURSE_STATUS.DRAFT,
            });

            const response = await request(app)
                .post('/api/v1/instructor/courses')
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    title: 'Duplicate Course',
                    slug: existingCourse.slug, // Use existing slug
                    shortDescription: 'Short description',
                    description: 'Full description',
                    categoryId: category.id,
                    level: 'BEGINNER',
                    price: 50000,
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for student', async () => {
            const response = await request(app)
                .post('/api/v1/instructor/courses')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    title: 'New Course',
                    slug: 'new-course',
                    categoryId: category.id,
                })
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/v1/instructor/courses/:id', () => {
        it('should update course', async () => {
            const response = await request(app)
                .put(`/api/v1/instructor/courses/${course.id}`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    title: 'Updated Course Title',
                    description: 'Updated description',
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.title).toBe('Updated Course Title');
        });

        it('should return 404 for non-existent course', async () => {
            const response = await request(app)
                .put('/api/v1/instructor/courses/99999')
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    title: 'Updated Title',
                })
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for other instructor course', async () => {
            const response = await request(app)
                .put(`/api/v1/instructor/courses/${course.id}`)
                .set('Authorization', `Bearer ${otherInstructorToken}`)
                .send({
                    title: 'Updated Title',
                })
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/v1/instructor/courses/:id', () => {
        it('should delete course', async () => {
            const courseToDelete = await createTestCourse(instructor.id, {
                categoryId: category.id,
                status: COURSE_STATUS.DRAFT,
            });

            const response = await request(app)
                .delete(`/api/v1/instructor/courses/${courseToDelete.id}`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Course deleted successfully');

            // Verify deleted
            const deleted = await prisma.course.findUnique({
                where: { id: courseToDelete.id },
            });
            expect(deleted).toBeNull();
        });

        it('should return 404 for non-existent course', async () => {
            const response = await request(app)
                .delete('/api/v1/instructor/courses/99999')
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for other instructor course', async () => {
            const response = await request(app)
                .delete(`/api/v1/instructor/courses/${course.id}`)
                .set('Authorization', `Bearer ${otherInstructorToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PATCH /api/v1/instructor/courses/:id/status', () => {
        it('should change course status to draft', async () => {
            const response = await request(app)
                .patch(`/api/v1/instructor/courses/${course.id}/status`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    status: COURSE_STATUS.DRAFT,
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.status).toBe(COURSE_STATUS.DRAFT);
        });

        it('should return 400 when trying to publish course without lessons', async () => {
            const response = await request(app)
                .patch(`/api/v1/instructor/courses/${course.id}/status`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    status: COURSE_STATUS.PUBLISHED,
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should return 404 for non-existent course', async () => {
            const response = await request(app)
                .patch('/api/v1/instructor/courses/99999/status')
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    status: COURSE_STATUS.DRAFT,
                })
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for other instructor course', async () => {
            const response = await request(app)
                .patch(`/api/v1/instructor/courses/${course.id}/status`)
                .set('Authorization', `Bearer ${otherInstructorToken}`)
                .send({
                    status: COURSE_STATUS.PUBLISHED,
                })
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/instructor/courses/:id/analytics', () => {
        it('should get course analytics', async () => {
            const response = await request(app)
                .get(`/api/v1/instructor/courses/${course.id}/analytics`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should return 404 for non-existent course', async () => {
            const response = await request(app)
                .get('/api/v1/instructor/courses/99999/analytics')
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for other instructor course', async () => {
            const response = await request(app)
                .get(`/api/v1/instructor/courses/${course.id}/analytics`)
                .set('Authorization', `Bearer ${otherInstructorToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/v1/instructor/courses/:id/tags', () => {
        it('should add tags to course', async () => {
            const response = await request(app)
                .post(`/api/v1/instructor/courses/${course.id}/tags`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    tagIds: [tag.id],
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should return 404 for non-existent course', async () => {
            const response = await request(app)
                .post('/api/v1/instructor/courses/99999/tags')
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    tagIds: [tag.id],
                })
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for other instructor course', async () => {
            const response = await request(app)
                .post(`/api/v1/instructor/courses/${course.id}/tags`)
                .set('Authorization', `Bearer ${otherInstructorToken}`)
                .send({
                    tagIds: [tag.id],
                })
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/v1/instructor/courses/:id/tags/:tagId', () => {
        beforeEach(async () => {
            // Add tag to course first
            await prisma.courseTag.create({
                data: {
                    courseId: course.id,
                    tagId: tag.id,
                },
            });
        });

        it('should remove tag from course', async () => {
            const response = await request(app)
                .delete(`/api/v1/instructor/courses/${course.id}/tags/${tag.id}`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should return 404 for non-existent course', async () => {
            const response = await request(app)
                .delete(`/api/v1/instructor/courses/99999/tags/${tag.id}`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for other instructor course', async () => {
            const response = await request(app)
                .delete(`/api/v1/instructor/courses/${course.id}/tags/${tag.id}`)
                .set('Authorization', `Bearer ${otherInstructorToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    // Note: File upload endpoints (thumbnail, preview) are skipped as they require file uploads
    describe.skip('File Upload Endpoints', () => {
        it('should upload course thumbnail', async () => {
            // Requires file upload
        });

        it('should upload course video preview', async () => {
            // Requires file upload
        });
    });
});

