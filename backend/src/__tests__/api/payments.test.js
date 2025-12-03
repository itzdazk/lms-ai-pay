// src/__tests__/api/payments.test.js
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

describe('Payments API', () => {
    let student;
    let studentToken;
    let otherStudent;
    let otherStudentToken;
    let admin;
    let adminToken;
    let instructor;
    let category;
    let course;
    let vnpayOrder;
    let momoOrder;
    let paidOrder;

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

        // Create admin
        admin = await createTestUser({
            role: USER_ROLES.ADMIN,
        });
        adminToken = generateTestToken(admin);

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
            price: 100000,
            discountPrice: 80000,
        });

        // Create VNPay order
        vnpayOrder = await prisma.order.create({
            data: {
                userId: student.id,
                courseId: course.id,
                orderCode: `ORD-VNPAY-${Date.now()}`,
                originalPrice: 100000,
                discountAmount: 20000,
                finalPrice: 80000,
                paymentGateway: PAYMENT_GATEWAY.VNPAY,
                paymentStatus: PAYMENT_STATUS.PENDING,
            },
        });

        // Create MoMo order
        momoOrder = await prisma.order.create({
            data: {
                userId: student.id,
                courseId: course.id,
                orderCode: `ORD-MOMO-${Date.now()}`,
                originalPrice: 100000,
                discountAmount: 20000,
                finalPrice: 80000,
                paymentGateway: PAYMENT_GATEWAY.MOMO,
                paymentStatus: PAYMENT_STATUS.PENDING,
            },
        });

        // Create paid order for refund tests
        paidOrder = await prisma.order.create({
            data: {
                userId: student.id,
                courseId: course.id,
                orderCode: `ORD-PAID-${Date.now()}`,
                originalPrice: 100000,
                discountAmount: 20000,
                finalPrice: 80000,
                paymentGateway: PAYMENT_GATEWAY.VNPAY,
                paymentStatus: PAYMENT_STATUS.PAID,
                paidAt: new Date(),
            },
        });

        // Create successful transaction for paid order
        await prisma.paymentTransaction.create({
            data: {
                orderId: paidOrder.id,
                transactionId: `TXN-${Date.now()}`,
                paymentGateway: PAYMENT_GATEWAY.VNPAY,
                amount: 80000,
                currency: 'VND',
                status: 'SUCCESS',
            },
        });
    });

    afterAll(async () => {
        await cleanupTestData();
        await prisma.$disconnect();
    });

    describe('POST /api/v1/payments/vnpay/create', () => {
        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .post('/api/v1/payments/vnpay/create')
                .send({ orderId: vnpayOrder.id })
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should return 404 for non-existent order', async () => {
            const response = await request(app)
                .post('/api/v1/payments/vnpay/create')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ orderId: 99999 })
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for other user order', async () => {
            const response = await request(app)
                .post('/api/v1/payments/vnpay/create')
                .set('Authorization', `Bearer ${otherStudentToken}`)
                .send({ orderId: vnpayOrder.id })
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should return 400 for order with wrong payment gateway', async () => {
            const response = await request(app)
                .post('/api/v1/payments/vnpay/create')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ orderId: momoOrder.id })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(
                response.body.message?.toLowerCase().includes('momo') ||
                response.body.message?.toLowerCase().includes('not assigned') ||
                response.body.error?.message?.toLowerCase().includes('momo') ||
                response.body.error?.message?.toLowerCase().includes('not assigned')
            ).toBe(true);
        });

        it('should return 400 for already paid order', async () => {
            const response = await request(app)
                .post('/api/v1/payments/vnpay/create')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ orderId: paidOrder.id })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(
                response.body.message?.toLowerCase().includes('already paid') ||
                response.body.message?.toLowerCase().includes('paid') ||
                response.body.error?.message?.toLowerCase().includes('already paid') ||
                response.body.error?.message?.toLowerCase().includes('paid')
            ).toBe(true);
        });

        // Note: Actual payment URL creation requires VNPay config
        // This test may fail if VNPay config is not set up
        it.skip('should create VNPay payment URL for pending order', async () => {
            const response = await request(app)
                .post('/api/v1/payments/vnpay/create')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ orderId: vnpayOrder.id })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.paymentUrl).toBeDefined();
        });
    });

    describe('POST /api/v1/payments/momo/create', () => {
        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .post('/api/v1/payments/momo/create')
                .send({ orderId: momoOrder.id })
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should return 404 for non-existent order', async () => {
            const response = await request(app)
                .post('/api/v1/payments/momo/create')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ orderId: 99999 })
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for other user order', async () => {
            const response = await request(app)
                .post('/api/v1/payments/momo/create')
                .set('Authorization', `Bearer ${otherStudentToken}`)
                .send({ orderId: momoOrder.id })
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should return 400 for order with wrong payment gateway', async () => {
            const response = await request(app)
                .post('/api/v1/payments/momo/create')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ orderId: vnpayOrder.id })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(
                response.body.message?.toLowerCase().includes('vnpay') ||
                response.body.message?.toLowerCase().includes('not assigned') ||
                response.body.error?.message?.toLowerCase().includes('vnpay') ||
                response.body.error?.message?.toLowerCase().includes('not assigned')
            ).toBe(true);
        });

        it('should return 400 for already paid order', async () => {
            const response = await request(app)
                .post('/api/v1/payments/momo/create')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ orderId: paidOrder.id })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        // Note: Actual payment URL creation requires MoMo config
        // This test may fail if MoMo config is not set up
        it.skip('should create MoMo payment URL for pending order', async () => {
            const response = await request(app)
                .post('/api/v1/payments/momo/create')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ orderId: momoOrder.id })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.paymentUrl).toBeDefined();
        });
    });

    describe('POST /api/v1/payments/refund/:orderId', () => {
        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .post(`/api/v1/payments/refund/${paidOrder.id}`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for non-admin user', async () => {
            const response = await request(app)
                .post(`/api/v1/payments/refund/${paidOrder.id}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should return 404 for non-existent order', async () => {
            const response = await request(app)
                .post('/api/v1/payments/refund/99999')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return 400 for non-paid order', async () => {
            const response = await request(app)
                .post(`/api/v1/payments/refund/${vnpayOrder.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(
                response.body.message?.toLowerCase().includes('paid') ||
                response.body.error?.message?.toLowerCase().includes('paid')
            ).toBe(true);
        });

        // Note: Actual refund requires payment gateway config and API calls
        // This test may fail if payment gateway config is not set up
        it.skip('should process refund for paid order', async () => {
            const response = await request(app)
                .post(`/api/v1/payments/refund/${paidOrder.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    amount: 80000,
                    reason: 'Test refund',
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });
    });

    // Note: Callback and webhook tests are skipped because they require:
    // 1. Mock payment gateway responses
    // 2. Signature verification
    // 3. Complex payload structures
    // These should be tested in integration tests with actual payment gateways
    describe.skip('Payment Callbacks and Webhooks', () => {
        it('should handle MoMo callback', async () => {
            // Mock MoMo callback payload
        });

        it('should handle VNPay callback', async () => {
            // Mock VNPay callback payload
        });

        it('should handle MoMo webhook', async () => {
            // Mock MoMo webhook payload
        });

        it('should handle VNPay webhook', async () => {
            // Mock VNPay webhook payload
        });
    });
});

