// src/config/database.config.js
const { PrismaClient } = require('@prisma/client')
const logger = require('./logger.config')

const prisma = new PrismaClient({
    log: [
        {
            emit: 'event',
            level: 'query',
        },
        {
            emit: 'event',
            level: 'error',
        },
        {
            emit: 'event',
            level: 'info',
        },
        {
            emit: 'event',
            level: 'warn',
        },
    ],
})

// Log queries in development
if (process.env.NODE_ENV === 'development') {
    prisma.$on('query', (e) => {
        logger.debug('Query: ' + e.query)
        logger.debug('Duration: ' + e.duration + 'ms')
    })
}

prisma.$on('error', (e) => {
    logger.error('Prisma Error:', e)
})

prisma.$on('warn', (e) => {
    logger.warn('Prisma Warning:', e)
})

prisma.$on('info', (e) => {
    logger.info('Prisma Info:', e)
})

// Test database connection
const connectDB = async () => {
    try {
        await prisma.$connect()
        logger.info('✅ Database connected successfully')
        return true
    } catch (error) {
        logger.error('❌ Database connection failed:', error)
        process.exit(1)
    }
}

// Graceful shutdown
const disconnectDB = async () => {
    try {
        await prisma.$disconnect()
        logger.info('🔌 Database disconnected')
    } catch (error) {
        logger.error('Error disconnecting database:', error)
        process.exit(1)
    }
}

module.exports = {
    prisma,
    connectDB,
    disconnectDB,
}


