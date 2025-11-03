// src/app.js
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const morgan = require('morgan')
const compression = require('compression')
const cookieParser = require('cookie-parser')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')
const rateLimit = require('express-rate-limit')

const config = require('./config/app.config')
const logger = require('./config/logger.config')
const { notFound, errorHandler } = require('./middlewares/error.middleware')

// Create Express app
const app = express()

// Trust proxy
app.set('trust proxy', 1)

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

// Data sanitization against NoSQL injection
app.use(mongoSanitize())

// Data sanitization against XSS
app.use(xss())

// Prevent HTTP Parameter Pollution
app.use(
    hpp({
        whitelist: ['sort', 'page', 'limit', 'category', 'level', 'tags'],
    })
)

// Rate limiting
const limiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX_REQUESTS,
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
})
app.use('/api/', limiter)

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: config.NODE_ENV,
    })
})

// API routes
const routes = require('./routes')
app.use(`/api/${config.API_VERSION}`, routes)

// API documentation - Swagger
if (config.NODE_ENV === 'development') {
    const swaggerUi = require('swagger-ui-express')
    const swaggerSpec = require('./config/swagger.config')

    app.use(
        '/api-docs',
        swaggerUi.serve,
        swaggerUi.setup(swaggerSpec, {
            explorer: true,
            customSiteTitle: 'E-Learning API Documentation',
        })
    )

    logger.info(
        `📚 API Documentation available at http://localhost:${config.PORT}/api-docs`
    )
}

// 404 handler
app.use(notFound)

// Global error handler
app.use(errorHandler)

module.exports = app
