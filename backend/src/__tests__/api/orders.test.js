// src/__tests__/api/orders.test.js
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
    PAYMENT_STATUS,
    PAYMENT_GATEWAY,
} from '../../config/constants.js';

describe('Orders API', () => {
    let student;
    let studentToken;
    let otherStudent;
    let otherStudentToken;
    let instructor;
    let category;
    let paidCourse;
    let freeCourse;

    beforeEach(async () => {
        // Create students
        student = await createTestUser({
            role: USER_ROLES.STUDENT,
        });
        studentToken = generateTestToken(student);

        otherStudent = await createTestUser({
            role: USER_ROLES.STUDENT,
        });
        otherStudentToken = generateTestToken(otherStudent);

        // Create instructor
        instructor = await createTestInstructor();

        // Create category
        category = await createTestCategory({
            name: `Test Category ${Date.now()}`,
            slug: `test-category-${Date.now()}`,
        });

        // Create paid course
        paidCourse = await createTestCourse(instructor.id, {
            categoryId: category.id,
            status: COURSE_STATUS.PUBLISHED,
            price: 100000,
            discountPrice: 80000,
        });

        // Create free course
        freeCourse = await createTestCourse(instructor.id, {
            categoryId: category.id,
            status: COURSE_STATUS.PUBLISHED,
            price: 0,
            discountPrice: 0,
        });
    });

    afterAll(async () => {
        await cleanupTestData();
        await prisma.$disconnect();
    });

    describe('POST /api/v1/orders', () => {
        it('should create order for paid course', async () => {
            const response = await request(app)
                .post('/api/v1/orders')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    courseId: paidCourse.id,
                    paymentGateway: PAYMENT_GATEWAY.VNPAY,
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.courseId).toBe(paidCourse.id);
            expect(response.body.data.paymentGateway).toBe(PAYMENT_GATEWAY.VNPAY);
            expect(response.body.data.paymentStatus).toBe(PAYMENT_STATUS.PENDING);
            expect(response.body.data.orderCode).toBeDefined();
            expect(parseFloat(response.body.data.finalPrice)).toBe(80000);
        });

        it('should return 400 for free course', async () => {
            const response = await request(app)
                .post('/api/v1/orders')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    courseId: freeCourse.id,
                    paymentGateway: PAYMENT_GATEWAY.VNPAY,
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(
                response.body.message?.toLowerCase().includes('free course') ||
                response.body.error?.message?.toLowerCase().includes('free course')
            ).toBe(true);
        });

        it('should return 422 for invalid payment gateway (validator)', async () => {
            const response = await request(app)
                .post('/api/v1/orders')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    courseId: paidCourse.id,
                    paymentGateway: 'INVALID_GATEWAY',
                })
                .expect(422);

            expect(response.body.success).toBe(false);
        });

        it('should return 400 for already enrolled course', async () => {
            // Create enrollment first
            await prisma.enrollment.create({
                data: {
                    userId: student.id,
                    courseId: paidCourse.id,
                    status: 'ACTIVE',
                    progressPercentage: 0,
                },
            });

            const response = await request(app)
                .post('/api/v1/orders')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    courseId: paidCourse.id,
                    paymentGateway: PAYMENT_GATEWAY.VNPAY,
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(
                response.body.message?.toLowerCase().includes('already enrolled') ||
                response.body.error?.message?.toLowerCase().includes('already enrolled')
            ).toBe(true);
        });

        it('should return 404 for non-existent course', async () => {
            const response = await request(app)
                .post('/api/v1/orders')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    courseId: 99999,
                    paymentGateway: PAYMENT_GATEWAY.VNPAY,
                })
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .post('/api/v1/orders')
                .send({
                    courseId: paidCourse.id,
                    paymentGateway: PAYMENT_GATEWAY.VNPAY,
                })
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should create order with billing address', async () => {
            const billingAddress = {
                fullName: 'Test User',
                email: 'test@example.com',
                phone: '0123456789',
                address: '123 Test Street',
            };

            const response = await request(app)
                .post('/api/v1/orders')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    courseId: paidCourse.id,
                    paymentGateway: PAYMENT_GATEWAY.MOMO,
                    billingAddress,
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.billingAddress).toBeDefined();
        });
    });

    describe('GET /api/v1/orders', () => {
        let order1;
        let order2;

        beforeEach(async () => {
            // Create orders for student
            order1 = await prisma.order.create({
                data: {
                    userId: student.id,
                    courseId: paidCourse.id,
                    orderCode: `ORD-TEST-${Date.now()}-1`,
                    originalPrice: 100000,
                    discountAmount: 20000,
                    finalPrice: 80000,
                    paymentGateway: PAYMENT_GATEWAY.VNPAY,
                    paymentStatus: PAYMENT_STATUS.PENDING,
                },
            });

            order2 = await prisma.order.create({
                data: {
                    userId: student.id,
                    courseId: paidCourse.id,
                    orderCode: `ORD-TEST-${Date.now()}-2`,
                    originalPrice: 100000,
                    discountAmount: 0,
                    finalPrice: 100000,
                    paymentGateway: PAYMENT_GATEWAY.MOMO,
                    paymentStatus: PAYMENT_STATUS.PAID,
                },
            });
        });

        it('should get user orders', async () => {
            const response = await request(app)
                .get('/api/v1/orders')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThanOrEqual(2);
            expect(response.body.pagination).toBeDefined();
        });

        it('should filter orders by payment status', async () => {
            const response = await request(app)
                .get('/api/v1/orders?paymentStatus=PENDING')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeGreaterThanOrEqual(1);
            expect(
                response.body.data.every((order) => order.paymentStatus === PAYMENT_STATUS.PENDING)
            ).toBe(true);
        });

        it('should filter orders by payment gateway', async () => {
            const response = await request(app)
                .get(`/api/v1/orders?paymentGateway=${PAYMENT_GATEWAY.VNPAY}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(
                response.body.data.every(
                    (order) => order.paymentGateway === PAYMENT_GATEWAY.VNPAY
                )
            ).toBe(true);
        });

        it('should paginate orders', async () => {
            const response = await request(app)
                .get('/api/v1/orders?page=1&limit=1')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeLessThanOrEqual(1);
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.limit).toBe(1);
        });

        it('should return empty array for user with no orders', async () => {
            const response = await request(app)
                .get('/api/v1/orders')
                .set('Authorization', `Bearer ${otherStudentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual([]);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/orders')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/orders/:id', () => {
        let order;

        beforeEach(async () => {
            order = await prisma.order.create({
                data: {
                    userId: student.id,
                    courseId: paidCourse.id,
                    orderCode: `ORD-TEST-${Date.now()}`,
                    originalPrice: 100000,
                    discountAmount: 20000,
                    finalPrice: 80000,
                    paymentGateway: PAYMENT_GATEWAY.VNPAY,
                    paymentStatus: PAYMENT_STATUS.PENDING,
                },
            });
        });

        it('should get order by ID', async () => {
            const response = await request(app)
                .get(`/api/v1/orders/${order.id}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.id).toBe(order.id);
            expect(response.body.data.orderCode).toBe(order.orderCode);
            expect(response.body.data.course).toBeDefined();
        });

        it('should return 404 for non-existent order', async () => {
            const response = await request(app)
                .get('/api/v1/orders/99999')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for other user order', async () => {
            const response = await request(app)
                .get(`/api/v1/orders/${order.id}`)
                .set('Authorization', `Bearer ${otherStudentToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get(`/api/v1/orders/${order.id}`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/orders/code/:orderCode', () => {
        let order;

        beforeEach(async () => {
            order = await prisma.order.create({
                data: {
                    userId: student.id,
                    courseId: paidCourse.id,
                    orderCode: `ORD-TEST-${Date.now()}`,
                    originalPrice: 100000,
                    discountAmount: 20000,
                    finalPrice: 80000,
                    paymentGateway: PAYMENT_GATEWAY.VNPAY,
                    paymentStatus: PAYMENT_STATUS.PENDING,
                },
            });
        });

        it('should get order by order code', async () => {
            const response = await request(app)
                .get(`/api/v1/orders/code/${order.orderCode}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.orderCode).toBe(order.orderCode);
            expect(response.body.data.course).toBeDefined();
        });

        it('should return 404 for non-existent order code', async () => {
            const response = await request(app)
                .get('/api/v1/orders/code/INVALID-CODE')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for other user order', async () => {
            const response = await request(app)
                .get(`/api/v1/orders/code/${order.orderCode}`)
                .set('Authorization', `Bearer ${otherStudentToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PATCH /api/v1/orders/:id/cancel', () => {
        let pendingOrder;
        let paidOrder;

        beforeEach(async () => {
            pendingOrder = await prisma.order.create({
                data: {
                    userId: student.id,
                    courseId: paidCourse.id,
                    orderCode: `ORD-PENDING-${Date.now()}`,
                    originalPrice: 100000,
                    discountAmount: 20000,
                    finalPrice: 80000,
                    paymentGateway: PAYMENT_GATEWAY.VNPAY,
                    paymentStatus: PAYMENT_STATUS.PENDING,
                },
            });

            paidOrder = await prisma.order.create({
                data: {
                    userId: student.id,
                    courseId: paidCourse.id,
                    orderCode: `ORD-PAID-${Date.now()}`,
                    originalPrice: 100000,
                    discountAmount: 20000,
                    finalPrice: 80000,
                    paymentGateway: PAYMENT_GATEWAY.VNPAY,
                    paymentStatus: PAYMENT_STATUS.PAID,
                },
            });
        });

        it('should cancel pending order', async () => {
            const response = await request(app)
                .patch(`/api/v1/orders/${pendingOrder.id}/cancel`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.paymentStatus).toBe(PAYMENT_STATUS.FAILED);

            // Verify order is cancelled
            const cancelledOrder = await prisma.order.findUnique({
                where: { id: pendingOrder.id },
            });
            expect(cancelledOrder.paymentStatus).toBe(PAYMENT_STATUS.FAILED);
        });

        it('should return 400 for paid order', async () => {
            const response = await request(app)
                .patch(`/api/v1/orders/${paidOrder.id}/cancel`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should return 404 for non-existent order', async () => {
            const response = await request(app)
                .patch('/api/v1/orders/99999/cancel')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return 404 for other user order (not found due to userId filter)', async () => {
            const response = await request(app)
                .patch(`/api/v1/orders/${pendingOrder.id}/cancel`)
                .set('Authorization', `Bearer ${otherStudentToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/orders/stats', () => {
        beforeEach(async () => {
            // Create orders with different statuses
            await prisma.order.createMany({
                data: [
                    {
                        userId: student.id,
                        courseId: paidCourse.id,
                        orderCode: `ORD-STATS-1-${Date.now()}`,
                        originalPrice: 100000,
                        finalPrice: 80000,
                        paymentGateway: PAYMENT_GATEWAY.VNPAY,
                        paymentStatus: PAYMENT_STATUS.PAID,
                    },
                    {
                        userId: student.id,
                        courseId: paidCourse.id,
                        orderCode: `ORD-STATS-2-${Date.now()}`,
                        originalPrice: 100000,
                        finalPrice: 100000,
                        paymentGateway: PAYMENT_GATEWAY.MOMO,
                        paymentStatus: PAYMENT_STATUS.PENDING,
                    },
                    {
                        userId: student.id,
                        courseId: paidCourse.id,
                        orderCode: `ORD-STATS-3-${Date.now()}`,
                        originalPrice: 100000,
                        finalPrice: 50000,
                        paymentGateway: PAYMENT_GATEWAY.VNPAY,
                        paymentStatus: PAYMENT_STATUS.FAILED,
                    },
                ],
            });
        });

        it('should get user order statistics', async () => {
            const response = await request(app)
                .get('/api/v1/orders/stats')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.total).toBeGreaterThanOrEqual(3);
            expect(response.body.data.paid).toBeGreaterThanOrEqual(1);
            expect(response.body.data.pending).toBeGreaterThanOrEqual(1);
            expect(response.body.data.failed).toBeGreaterThanOrEqual(1);
            expect(response.body.data.totalSpent).toBeGreaterThanOrEqual(80000);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/orders/stats')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });
});

