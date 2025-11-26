// src/config/app.config.js
import dotenv from 'dotenv'
dotenv.config()

const config = {
    // Server
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT, 10) || 5000,
    API_VERSION: process.env.API_VERSION || 'v1',
    SERVER_URL: process.env.SERVER_URL || 'http://localhost:5000',

    // Database
    DATABASE_URL: process.env.DATABASE_URL,

    // JWT
    // node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    JWT_SECRET:
        process.env.JWT_SECRET || 'your-jwt-secret-change-in-production',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

    // Cookie
    COOKIE_SECRET: process.env.COOKIE_SECRET || 'your-cookie-secret',
    COOKIE_MAX_AGE: parseInt(process.env.COOKIE_MAX_AGE, 10) || 604800000,

    // CORS
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',')
        : ['http://localhost:3000', 'http://localhost:3001'],

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS:
        parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    RATE_LIMIT_MAX_REQUESTS:
        parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    AUTH_RATE_LIMIT_MAX: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 5,

    // File Upload
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760,
    MAX_IMAGE_SIZE: parseInt(process.env.MAX_IMAGE_SIZE, 10) || 5242880,
    UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
    ALLOWED_IMAGE_TYPES: process.env.ALLOWED_IMAGE_TYPES
        ? process.env.ALLOWED_IMAGE_TYPES.split(',')
        : ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
    ALLOWED_VIDEO_TYPES: process.env.ALLOWED_VIDEO_TYPES
        ? process.env.ALLOWED_VIDEO_TYPES.split(',')
        : ['video/mp4', 'video/webm'],

    // Email
    SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
    SMTP_SECURE: process.env.SMTP_SECURE === 'true',
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@elearning.com',
    EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'E-Learning Platform',

    // Payment - VNPay
    VNPAY_TMN_CODE: process.env.VNPAY_TMN_CODE,
    VNPAY_HASH_SECRET: process.env.VNPAY_HASH_SECRET,
    VNPAY_URL:
        process.env.VNPAY_URL ||
        'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    VNPAY_RETURN_URL: process.env.VNPAY_RETURN_URL,
    VNPAY_EXPIRATION_MINUTES:
        parseInt(process.env.VNPAY_EXPIRATION_MINUTES, 10) || 10,

    // Payment - MoMo
    MOMO_PARTNER_CODE: process.env.MOMO_PARTNER_CODE,
    MOMO_ACCESS_KEY: process.env.MOMO_ACCESS_KEY,
    MOMO_SECRET_KEY: process.env.MOMO_SECRET_KEY,
    MOMO_ENDPOINT:
        process.env.MOMO_ENDPOINT ||
        'https://test-payment.momo.vn/v2/gateway/api/create',
    MOMO_RETURN_URL: process.env.MOMO_RETURN_URL,
    MOMO_NOTIFY_URL: process.env.MOMO_NOTIFY_URL,
    MOMO_REFUND_ENDPOINT:
        process.env.MOMO_REFUND_ENDPOINT ||
        'https://test-payment.momo.vn/v2/gateway/api/refund',
    MOMO_IP_WHITELIST: process.env.MOMO_IP_WHITELIST || '',

    // AI - OpenAI
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4',
    OPENAI_MAX_TOKENS: parseInt(process.env.OPENAI_MAX_TOKENS, 10) || 2000,
    OPENAI_TEMPERATURE: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,


    // AI - Ollama (Local LLM)
    OLLAMA_ENABLED: process.env.OLLAMA_ENABLED !== 'false',
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'llama3.1:8b', // Use 8b model for faster response (recommended for local)
    OLLAMA_TEMPERATURE: parseFloat(process.env.OLLAMA_TEMPERATURE) || 0.7,
    OLLAMA_MAX_TOKENS: parseInt(process.env.OLLAMA_MAX_TOKENS, 10) || 1000, // Reduced to 1000 for faster response

    // AI - Whisper (Local)
    WHISPER_ENABLED: process.env.WHISPER_ENABLED !== 'false',
    WHISPER_AUTO_TRANSCRIBE:
        process.env.WHISPER_AUTO_TRANSCRIBE !== 'false',
    WHISPER_COMMAND: process.env.WHISPER_COMMAND || 'whisper',
    WHISPER_MODEL: process.env.WHISPER_MODEL || 'small',
    WHISPER_TASK: process.env.WHISPER_TASK || 'transcribe',
    WHISPER_OUTPUT_FORMAT: process.env.WHISPER_OUTPUT_FORMAT || 'srt',
    WHISPER_OUTPUT_DIR:
        process.env.WHISPER_OUTPUT_DIR || 'uploads/transcripts',
    WHISPER_LANGUAGE: process.env.WHISPER_LANGUAGE || '',
    WHISPER_FP16: process.env.WHISPER_FP16 === 'true',

    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
    LOG_MAX_FILES: process.env.LOG_MAX_FILES || '14d',
    LOG_MAX_SIZE: process.env.LOG_MAX_SIZE || '20m',

    // Cloud Storage (Optional)
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION || 'ap-southeast-1',
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,

    // Cloudinary (Alternative)
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

    // Redis (Optional)
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: parseInt(process.env.REDIS_PORT, 10) || 6379,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,

    // Security
    BCRYPT_ROUNDS: 12,
    MAX_LOGIN_ATTEMPTS: 5,
    LOCK_TIME: 2 * 60 * 60 * 1000, // 2 hours

    // Email Templates
    EMAIL_VERIFICATION_URL:
        process.env.EMAIL_VERIFICATION_URL ||
        `${process.env.CLIENT_URL}/verify-email`,
    PASSWORD_RESET_URL:
        process.env.PASSWORD_RESET_URL ||
        `${process.env.CLIENT_URL}/reset-password`,
}

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET']

if (config.NODE_ENV === 'production') {
    requiredEnvVars.push(
        'SMTP_USER',
        'SMTP_PASSWORD',
        'VNPAY_TMN_CODE',
        'VNPAY_HASH_SECRET'
    )
}

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar])

if (missingEnvVars.length > 0) {
    console.error(
        `Missing required environment variables: ${missingEnvVars.join(', ')}`
    )
    if (config.NODE_ENV === 'production') {
        process.exit(1)
    }
}

export default config
