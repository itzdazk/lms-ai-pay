// src/config/database.config.js
// Load .env.test first if in test environment (before PrismaClient is created)
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

if (process.env.NODE_ENV === 'test') {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    dotenv.config({ path: resolve(__dirname, '../../.env.test') })
}

import { PrismaClient } from '@prisma/client'
import logger from './logger.config.js'

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
        await prisma.$executeRaw`SET TIME ZONE 'Asia/Ho_Chi_Minh'`
        logger.info('Database connected successfully')
        return true
    } catch (error) {
        logger.error('Database connection failed:', error)
        process.exit(1)
    }
}

// Graceful shutdown
const disconnectDB = async () => {
    try {
        await prisma.$disconnect()
        logger.info('Database disconnected')
    } catch (error) {
        logger.error('Error disconnecting database:', error)
        process.exit(1)
    }
}

export { prisma, connectDB, disconnectDB }
