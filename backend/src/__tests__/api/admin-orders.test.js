// src/__tests__/api/admin-orders.test.js
import request from 'supertest';
import app from '../../app.js';
import {
    createTestUser,
    createTestAdmin,
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
    PAYMENT_STATUS,
    PAYMENT_GATEWAY,
} from '../../config/constants.js';

describe('Admin Orders API', () => {
    let admin;
    let adminToken;
    let instructor;
    let instructorToken;
    let student;
    let studentToken;
    let category;
    let course;
    let order;

    beforeEach(async () => {
        // Create admin
        admin = await createTestAdmin();
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
            price: 100000,
        });

        // Create order
        order = await prisma.order.create({
            data: {
                userId: student.id,
                courseId: course.id,
                orderCode: `ORDER_${Date.now()}`,
                originalPrice: course.price,
                discountAmount: 0,
                finalPrice: course.price,
                paymentStatus: PAYMENT_STATUS.PENDING,
                paymentGateway: PAYMENT_GATEWAY.VNPAY,
            },
        });
    });

    afterAll(async () => {
        await cleanupTestData();
        await prisma.$disconnect();
    });

    describe('GET /api/v1/admin/orders', () => {
        it('should get all orders for admin', async () => {
            const response = await request(app)
                .get('/api/v1/admin/orders')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.pagination).toBeDefined();
        });

        it('should filter orders by payment status', async () => {
            const response = await request(app)
                .get('/api/v1/admin/orders')
                .query({ paymentStatus: PAYMENT_STATUS.PENDING })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should search orders by order code', async () => {
            const response = await request(app)
                .get('/api/v1/admin/orders')
                .query({ search: order.orderCode })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should filter orders by date range', async () => {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
            const endDate = new Date();

            const response = await request(app)
                .get('/api/v1/admin/orders')
                .query({
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should filter orders by amount range', async () => {
            const response = await request(app)
                .get('/api/v1/admin/orders')
                .query({ minAmount: 50000, maxAmount: 200000 })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should paginate orders', async () => {
            const response = await request(app)
                .get('/api/v1/admin/orders')
                .query({ page: 1, limit: 5 })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.limit).toBe(5);
        });

        it('should sort orders', async () => {
            const response = await request(app)
                .get('/api/v1/admin/orders')
                .query({ sort: 'newest' })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/admin/orders')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for non-admin user', async () => {
            const response = await request(app)
                .get('/api/v1/admin/orders')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/admin/orders/stats', () => {
        it('should get order statistics', async () => {
            const response = await request(app)
                .get('/api/v1/admin/orders/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/admin/orders/stats')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for non-admin user', async () => {
            const response = await request(app)
                .get('/api/v1/admin/orders/stats')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/admin/orders/revenue-trend', () => {
        it('should get revenue trend', async () => {
            const response = await request(app)
                .get('/api/v1/admin/orders/revenue-trend')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/admin/orders/revenue-trend')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for non-admin user', async () => {
            const response = await request(app)
                .get('/api/v1/admin/orders/revenue-trend')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });
});

