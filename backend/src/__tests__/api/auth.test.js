// Integration tests for Auth API
import request from 'supertest';
import app from '../../app.js';
import { createTestUser, cleanupTestData, generateTestToken } from '../helpers/test-helpers.js';
import { prisma } from '../../config/database.config.js';
import { USER_ROLES } from '../../config/constants.js';

describe('Auth API', () => {
    let testUser;

    beforeEach(async () => {
        // Don't cleanup all test data in beforeEach to avoid interfering with other tests
        // Each test will create its own data
    });

    afterAll(async () => {
        await cleanupTestData();
    });

    describe('POST /api/v1/auth/register', () => {
        it('should register a new student', async () => {
            const userData = {
                userName: `student_${Date.now()}`,
                email: `student_${Date.now()}@test.com`,
                password: 'Student@123456',
                fullName: 'Test Student',
                role: USER_ROLES.STUDENT,
            };

            const response = await request(app)
                .post('/api/v1/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toHaveProperty('id');
            expect(response.body.data.user.email).toBe(userData.email);
            expect(response.body.data.user.role).toBe(USER_ROLES.STUDENT);
        });

        it('should not register with duplicate email', async () => {
            const userData = {
                userName: `user1_${Date.now()}`,
                email: `duplicate_${Date.now()}@test.com`,
                password: 'Test@123456',
                fullName: 'Test User 1',
            };

            // Register first time
            await request(app)
                .post('/api/v1/auth/register')
                .send(userData)
                .expect(201);

            // Try to register again with same email
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({ ...userData, userName: 'different_username' })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should not register with duplicate username', async () => {
            const userData = {
                userName: `duplicate_username_${Date.now()}`,
                email: `email1_${Date.now()}@test.com`,
                password: 'Test@123456',
                fullName: 'Test User',
            };

            // Register first time
            await request(app)
                .post('/api/v1/auth/register')
                .send(userData)
                .expect(201);

            // Try to register again with same username
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({ ...userData, email: `email2_${Date.now()}@test.com` })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/v1/auth/login', () => {
        beforeEach(async () => {
            testUser = await createTestUser({
                email: `login_${Date.now()}@test.com`,
                password: 'Test@123456',
            });
        });

        it('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: testUser.email,
                    password: 'Test@123456',
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toHaveProperty('id');
            expect(response.body.data.user.email).toBe(testUser.email);
        });

        it('should not login with invalid email', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'nonexistent@test.com',
                    password: 'Test@123456',
                })
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should not login with invalid password', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: testUser.email,
                    password: 'WrongPassword@123',
                })
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/v1/auth/logout', () => {
        beforeEach(async () => {
            testUser = await createTestUser();
        });

        it('should logout successfully with valid token', async () => {
            const token = generateTestToken(testUser);

            const response = await request(app)
                .post('/api/v1/auth/logout')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should not logout without token', async () => {
            const response = await request(app)
                .post('/api/v1/auth/logout')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/auth/me', () => {
        beforeEach(async () => {
            testUser = await createTestUser();
        });

        it('should get current user with valid token', async () => {
            const token = generateTestToken(testUser);

            const response = await request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(testUser.id);
            expect(response.body.data.email).toBe(testUser.email);
        });

        it('should not get current user without token', async () => {
            const response = await request(app)
                .get('/api/v1/auth/me')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });
});


