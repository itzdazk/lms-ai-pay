// src/__tests__/api/enrollments.test.js
import request from 'supertest';
import app from '../../app.js';
import {
    createTestUser,
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
    ENROLLMENT_STATUS,
} from '../../config/constants.js';

describe('Enrollments API', () => {
    let student;
    let studentToken;
    let instructor;
    let category;
    let freeCourse;
    let paidCourse;
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

        // Create free course
        freeCourse = await createTestCourse(instructor.id, {
            categoryId: category.id,
            status: COURSE_STATUS.PUBLISHED,
            price: 0,
            discountPrice: 0,
        });

        // Create paid course
        paidCourse = await createTestCourse(instructor.id, {
            categoryId: category.id,
            status: COURSE_STATUS.PUBLISHED,
            price: 499000,
            discountPrice: 299000,
        });

        // Create an enrollment for testing
        enrollment = await prisma.enrollment.create({
            data: {
                userId: student.id,
                courseId: freeCourse.id,
                status: ENROLLMENT_STATUS.ACTIVE,
                progressPercentage: 0,
            },
        });
    });

    afterAll(async () => {
        await cleanupTestData();
        await prisma.$disconnect();
    });

    describe('GET /api/v1/enrollments', () => {
        it('should get user enrollments', async () => {
            const response = await request(app)
                .get('/api/v1/enrollments')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.pagination).toBeDefined();
        });

        it('should get enrollments with pagination', async () => {
            const response = await request(app)
                .get('/api/v1/enrollments?page=1&limit=5')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeLessThanOrEqual(5);
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.limit).toBe(5);
        });

        it('should filter enrollments by status', async () => {
            const response = await request(app)
                .get('/api/v1/enrollments?status=ACTIVE')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            if (response.body.data.length > 0) {
                expect(response.body.data[0].status).toBe('ACTIVE');
            }
        });

        it('should search enrollments by course title', async () => {
            const response = await request(app)
                .get(`/api/v1/enrollments?search=${freeCourse.title}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(
                response.body.data.some(
                    (e) => e.course.id === freeCourse.id
                )
            ).toBe(true);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/enrollments')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/enrollments/:id', () => {
        it('should get enrollment by ID', async () => {
            const response = await request(app)
                .get(`/api/v1/enrollments/${enrollment.id}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.id).toBe(enrollment.id);
            expect(response.body.data.userId).toBe(student.id);
            expect(response.body.data.courseId).toBe(freeCourse.id);
        });

        it('should return 404 for non-existent enrollment', async () => {
            const response = await request(app)
                .get('/api/v1/enrollments/99999')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get(`/api/v1/enrollments/${enrollment.id}`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should return 404 for enrollment belonging to another user', async () => {
            const otherStudent = await createTestUser({
                role: USER_ROLES.STUDENT,
            });
            const otherStudentToken = generateTestToken(otherStudent);

            const response = await request(app)
                .get(`/api/v1/enrollments/${enrollment.id}`)
                .set('Authorization', `Bearer ${otherStudentToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/enrollments/active', () => {
        it('should get active enrollments', async () => {
            const response = await request(app)
                .get('/api/v1/enrollments/active')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should get active enrollments with limit', async () => {
            const response = await request(app)
                .get('/api/v1/enrollments/active?limit=5')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeLessThanOrEqual(5);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/enrollments/active')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/enrollments/completed', () => {
        it('should get completed enrollments', async () => {
            // Create a new course for completed enrollment
            const completedCourse = await createTestCourse(instructor.id, {
                categoryId: category.id,
                status: COURSE_STATUS.PUBLISHED,
            });

            // Create a completed enrollment
            const completedEnrollment = await prisma.enrollment.create({
                data: {
                    userId: student.id,
                    courseId: completedCourse.id,
                    status: ENROLLMENT_STATUS.COMPLETED,
                    progressPercentage: 100,
                    completedAt: new Date(),
                },
            });

            const response = await request(app)
                .get('/api/v1/enrollments/completed')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.pagination).toBeDefined();
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/enrollments/completed')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/enrollments/check/:courseId', () => {
        it('should check enrollment status - enrolled', async () => {
            const response = await request(app)
                .get(`/api/v1/enrollments/check/${freeCourse.id}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.isEnrolled).toBe(true);
            expect(response.body.data.isActive).toBe(true);
            expect(response.body.data.enrollment).toBeDefined();
        });

        it('should check enrollment status - not enrolled', async () => {
            // Create a new course that student hasn't enrolled in
            const newCourse = await createTestCourse(instructor.id, {
                categoryId: category.id,
                status: COURSE_STATUS.PUBLISHED,
            });

            const response = await request(app)
                .get(`/api/v1/enrollments/check/${newCourse.id}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.isEnrolled).toBe(false);
            // isActive can be false or null when not enrolled
            expect([false, null]).toContain(response.body.data.isActive);
            expect(response.body.data.enrollment).toBeNull();
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get(`/api/v1/enrollments/check/${freeCourse.id}`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/v1/enrollments', () => {
        it('should enroll in free course', async () => {
            // Delete existing enrollment first
            await prisma.enrollment.deleteMany({
                where: {
                    userId: student.id,
                    courseId: freeCourse.id,
                },
            });

            const response = await request(app)
                .post('/api/v1/enrollments')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ courseId: freeCourse.id })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.userId).toBe(student.id);
            expect(response.body.data.courseId).toBe(freeCourse.id);
            expect(response.body.data.status).toBe('ACTIVE');
        });

        it('should create order for paid course', async () => {
            // Create a new paid course
            const newPaidCourse = await createTestCourse(instructor.id, {
                categoryId: category.id,
                status: COURSE_STATUS.PUBLISHED,
                price: 499000,
                discountPrice: 299000,
            });

            const response = await request(app)
                .post('/api/v1/enrollments')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    courseId: newPaidCourse.id,
                    paymentGateway: 'VNPay',
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            // For paid courses, it should return an order
            expect(response.body.data.id).toBeDefined();
            expect(response.body.data.courseId).toBe(newPaidCourse.id);
        });

        it('should return 400 for duplicate enrollment', async () => {
            const response = await request(app)
                .post('/api/v1/enrollments')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ courseId: freeCourse.id })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(
                response.body.error?.message
                    ?.toLowerCase()
                    .includes('already enrolled')
            ).toBe(true);
        });

        it('should return 400 for paid course without payment gateway', async () => {
            const response = await request(app)
                .post('/api/v1/enrollments')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ courseId: paidCourse.id })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(
                response.body.error?.message
                    ?.toLowerCase()
                    .includes('payment gateway')
            ).toBe(true);
        });

        it('should return 404 for non-existent course', async () => {
            const response = await request(app)
                .post('/api/v1/enrollments')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ courseId: 99999 })
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return 400 for unpublished course', async () => {
            const draftCourse = await createTestCourse(instructor.id, {
                categoryId: category.id,
                status: COURSE_STATUS.DRAFT,
            });

            const response = await request(app)
                .post('/api/v1/enrollments')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ courseId: draftCourse.id })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .post('/api/v1/enrollments')
                .send({ courseId: freeCourse.id })
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });
});

