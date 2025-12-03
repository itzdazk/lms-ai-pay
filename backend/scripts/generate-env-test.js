#!/usr/bin/env node
/**
 * Generate .env.test file with test environment variables
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file to get DATABASE_URL
const envPath = path.join(__dirname, '../.env');
let databaseUrl = 'postgresql://postgres:admin@localhost:5432/lms_ai_pay?schema=public';

if (fs.existsSync(envPath)) {
    // Read .env file directly to avoid parsing issues
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const dbUrlMatch = envContent.match(/^DATABASE_URL=["']?([^"'\n]+)["']?$/m);
    if (dbUrlMatch) {
        databaseUrl = dbUrlMatch[1].trim();
        // Ensure schema=public is included
        if (!databaseUrl.includes('schema=')) {
            databaseUrl += (databaseUrl.includes('?') ? '&' : '?') + 'schema=public';
        }
        console.log('📝 Loaded DATABASE_URL from .env file');
    } else {
        dotenv.config({ path: envPath });
        databaseUrl = (process.env.DATABASE_URL || databaseUrl).replace(/^["']|["']$/g, '').trim();
        if (!databaseUrl.includes('schema=')) {
            databaseUrl += (databaseUrl.includes('?') ? '&' : '?') + 'schema=public';
        }
        console.log('📝 Loaded DATABASE_URL from .env file (fallback)');
    }
} else {
    console.log('⚠️  No .env file found, using default DATABASE_URL');
}

// Generate random secrets
const jwtSecret = crypto.randomBytes(32).toString('hex');
const refreshSecret = crypto.randomBytes(32).toString('hex');
const cookieSecret = crypto.randomBytes(32).toString('hex');

const envTestContent = `# Test Environment Variables
# Auto-generated - DO NOT commit to git
NODE_ENV=test

# Database - Uses same database as dev (or create separate test database)
DATABASE_URL=${databaseUrl}

# JWT Secrets - Auto-generated
JWT_SECRET=${jwtSecret}
JWT_REFRESH_SECRET=${refreshSecret}
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Cookie
COOKIE_SECRET=${cookieSecret}

# Server
PORT=5000
API_VERSION=v1
SERVER_URL=http://localhost:5000

# CORS
CLIENT_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Email (Optional for testing)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_FROM=noreply@test.com
EMAIL_FROM_NAME=Test Platform

# Payment (Optional for testing)
VNPAY_TMN_CODE=test
VNPAY_HASH_SECRET=test-secret
MOMO_PARTNER_CODE=test
MOMO_ACCESS_KEY=test
MOMO_SECRET_KEY=test

# AI (Optional for testing)
OLLAMA_ENABLED=false
WHISPER_ENABLED=false

# Logging
LOG_LEVEL=error
`;

const envTestPath = path.join(__dirname, '../.env.test');

fs.writeFileSync(envTestPath, envTestContent);
console.log('✅ .env.test file generated successfully!');
console.log('📝 Please update DATABASE_URL with your test database connection string.');

