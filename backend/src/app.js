// src/app.js
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import hpp from 'hpp'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { fileURLToPath } from 'url'

import config from './config/app.config.js'
import logger from './config/logger.config.js'
import { HTTP_STATUS, RATE_LIMITS } from './config/constants.js'
import { notFound, errorHandler } from './middlewares/error.middleware.js'
import routes from './routes/index.js'

// Create Express app
const app = express()

// Trust proxy
app.set('trust proxy', 1) // Collect User IP

// Security middleware
app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
    })
)

// CORS configuration
app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, postman, etc.)
            if (!origin) return callback(null, true)

            if (config.ALLOWED_ORIGINS.indexOf(origin) !== -1) {
                callback(null, true)
            } else {
                callback(new Error('Not allowed by CORS'))
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
)

// Body parser middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Cookie parser
app.use(cookieParser(config.COOKIE_SECRET))

// Compression middleware
app.use(compression())

// Logging middleware
if (config.NODE_ENV === 'development') {
    app.use(morgan('dev'))
} else {
    app.use(morgan('combined', { stream: logger.stream }))
}

// Custom middleware for Express 5 compatibility
app.use((req, res, next) => {
    // Sanitize body parameters (remove MongoDB operators)
    if (req.body && typeof req.body === 'object') {
        const sanitizeObject = (obj) => {
            for (const key in obj) {
                if (key.startsWith('$')) {
                    delete obj[key]
                } else if (
                    typeof obj[key] === 'object' &&
                    obj[key] !== null &&
                    !Array.isArray(obj[key])
                ) {
                    sanitizeObject(obj[key])
                } else if (Array.isArray(obj[key])) {
                    obj[key].forEach((item) => {
                        if (typeof item === 'object' && item !== null) {
                            sanitizeObject(item)
                        }
                    })
                }
            }
        }
        sanitizeObject(req.body)
    }
    next()
})

// Custom XSS protection middleware for Express 5
app.use((req, res, next) => {
    // Sanitize body to prevent XSS
    if (req.body && typeof req.body === 'object') {
        const sanitizeString = (str) => {
            if (typeof str !== 'string') return str
            // Remove potentially dangerous characters
            return str
                .replace(
                    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
                    ''
                )
                .replace(
                    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
                    ''
                )
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '')
        }

        const sanitizeObject = (obj) => {
            for (const key in obj) {
                if (typeof obj[key] === 'string') {
                    obj[key] = sanitizeString(obj[key])
                } else if (
                    typeof obj[key] === 'object' &&
                    obj[key] !== null &&
                    !Array.isArray(obj[key])
                ) {
                    sanitizeObject(obj[key])
                } else if (Array.isArray(obj[key])) {
                    obj[key] = obj[key].map((item) => {
                        if (typeof item === 'string') {
                            return sanitizeString(item)
                        } else if (typeof item === 'object' && item !== null) {
                            sanitizeObject(item)
                            return item
                        }
                        return item
                    })
                }
            }
        }
        sanitizeObject(req.body)
    }
    next()
})

// Prevent HTTP Parameter Pollution
app.use(
    hpp({
        whitelist: ['sort', 'page', 'limit', 'category', 'level', 'tags'],
    })
)

// Rate limiting
const limiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS || RATE_LIMITS.PUBLIC.windowMs,
    max: config.RATE_LIMIT_MAX_REQUESTS || RATE_LIMITS.PUBLIC.max,
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
})
app.use('/api/', limiter)

// Root endpoint
app.get('/', (req, res) => {
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'LMS AI Pay API',
        version: config.API_VERSION,
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/health',
            api: `/api/${config.API_VERSION}`,
        },
    })
})

// Favicon handler (to avoid 404 errors)
app.get('/favicon.ico', (req, res) => {
    res.status(HTTP_STATUS.NO_CONTENT).end()
})

// Serve static files (uploads)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// API routes
app.use(`/api/${config.API_VERSION}`, routes)

// API documentation - Swagger (commented out until swagger.config.js is created)
// if (config.NODE_ENV === 'development') {
//     try {
//         const swaggerUi = require('swagger-ui-express')
//         const swaggerSpec = require('./config/swagger.config')

//         app.use(
//             '/api-docs',
//             swaggerUi.serve,
//             swaggerUi.setup(swaggerSpec, {
//                 explorer: true,
//                 customSiteTitle: 'E-Learning API Documentation',
//             })
//         )

//         logger.info(
//             `📚 API Documentation available at http://localhost:${config.PORT}/api-docs`
//         )
//     } catch (error) {
//         logger.warn('Swagger documentation not available:', error.message)
//     }
// }

// Start transcription worker (if enabled)
if (config.WHISPER_ENABLED !== false && config.WORKER_MODE !== 'hls-only') {
    try {
        await import('./workers/transcription.worker.js')
        logger.info('Transcription worker started')
    } catch (err) {
        logger.warn(`Failed to start transcription worker: ${err.message}`)
    }
}

// 404 handler
app.use(notFound)

// Global error handler
app.use(errorHandler)

export default app
