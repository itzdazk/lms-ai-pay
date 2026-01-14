// src/config/database.config.js
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
        logger.info('Kết nối cơ sở dữ liệu thành công')
        return true
    } catch (error) {
        logger.error('Kết nối cơ sở dữ liệu thất bại', error)
        process.exit(1)
    }
}

// Graceful shutdown
const disconnectDB = async () => {
    try {
        await prisma.$disconnect()
        logger.info('Ngắt kết nối cơ sở dữ liệu')
    } catch (error) {
        logger.error('Lỗi ngắt kết nối cơ sở dữ liệu', error)
        process.exit(1)
    }
}

export { prisma, connectDB, disconnectDB }
