// backend/src/__tests__/setup.js
import { prisma } from '../config/database.config.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.test for testing environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

// Setup before all tests
beforeAll(async () => {
    try {
        // Connect to test database
        await prisma.$connect();
        // Set timezone for test database
        await prisma.$executeRaw`SET TIME ZONE 'Asia/Ho_Chi_Minh'`;
        console.log('✅ Test database connected');
    } catch (error) {
        console.error('❌ Test database connection failed:', error.message);
        throw error;
    }
});

// Cleanup after all tests
afterAll(async () => {
    try {
        await prisma.$disconnect();
        console.log('✅ Test database disconnected');
    } catch (error) {
        console.error('❌ Error disconnecting test database:', error.message);
    }
});

// Export prisma for use in tests
export { prisma };

