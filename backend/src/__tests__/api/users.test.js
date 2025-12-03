// Integration tests for Users API
import request from 'supertest';
import app from '../../app.js';
import { createTestUser, cleanupTestData, generateTestToken } from '../helpers/test-helpers.js';
import { prisma } from '../../config/database.config.js';

describe('Users API', () => {
    let testUser;
    let authToken;

    beforeEach(async () => {
        // Don't cleanup all test data, only create new user for this test
        // This prevents interfering with other test suites
        testUser = await createTestUser();
        authToken = generateTestToken(testUser);
    });

    afterAll(async () => {
        await cleanupTestData();
    });

    describe('GET /api/v1/users/profile', () => {
        it('should get user profile', async () => {
            const response = await request(app)
                .get('/api/v1/users/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(testUser.id);
            expect(response.body.data.email).toBe(testUser.email);
        });

        it('should not get profile without token', async () => {
            const response = await request(app)
                .get('/api/v1/users/profile')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/v1/users/profile', () => {
        it('should update user profile', async () => {
            const updateData = {
                fullName: 'Updated Name',
                phone: '0987654321',
                bio: 'Updated bio',
            };

            const response = await request(app)
                .put('/api/v1/users/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.fullName).toBe(updateData.fullName);
        });

        it('should not update profile without token', async () => {
            const response = await request(app)
                .put('/api/v1/users/profile')
                .send({ fullName: 'New Name' })
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/v1/users/change-password', () => {
        it('should change password with valid current password', async () => {
            // Use the user from beforeEach to ensure it's not cleaned up by other tests
            // The user is created fresh in beforeEach for each test
            const response = await request(app)
                .put('/api/v1/users/change-password')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    currentPassword: 'Test@123456',
                    newPassword: 'NewPassword@123',
                    confirmPassword: 'NewPassword@123',
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should not change password with invalid current password', async () => {
            // Create a new user and token for this test to avoid token invalidation
            const testUser2 = await createTestUser({
                email: `test2_${Date.now()}@test.com`,
            });
            const authToken2 = generateTestToken(testUser2);

            const response = await request(app)
                .put('/api/v1/users/change-password')
                .set('Authorization', `Bearer ${authToken2}`)
                .send({
                    currentPassword: 'WrongPassword@123',
                    newPassword: 'NewPassword@123',
                })
                .expect(422);

            expect(response.body.success).toBe(false);
        });
    });
});


