// backend/src/__tests__/health.test.js
import request from 'supertest';
import app from '../app.js';

describe('Health Check API', () => {
    describe('GET /api/v1/health', () => {
        it('should return health status', async () => {
            const response = await request(app)
                .get('/api/v1/health')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body).toHaveProperty('message');
        });
    });

    describe('GET /api/v1/health/db', () => {
        it('should return database health status', async () => {
            const response = await request(app)
                .get('/api/v1/health/db');

            // Database health check may return 200 (healthy) or 503 (unhealthy)
            expect([200, 503]).toContain(response.status);
            expect(response.body).toHaveProperty('success');
            
            if (response.status === 200) {
                expect(response.body.data).toHaveProperty('status');
            }
        });
    });

    describe('GET /api/v1/health/storage', () => {
        it('should return storage health status', async () => {
            const response = await request(app)
                .get('/api/v1/health/storage')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('status');
        });
    });
});

