// src/server.js
import app from './app.js'
import config from './config/app.config.js'
import logger from './config/logger.config.js'
import { connectDB, disconnectDB } from './config/database.config.js'

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! Shutting down...')
    logger.error(err.name, err.message)
    logger.error(err.stack)
    process.exit(1)
})

// Connect to database and start server
const startServer = async () => {
    try {
        // Connect to database
        await connectDB() // Wait until completion -> continue

        // Start server
        const server = app.listen(config.PORT, () => {
            logger.info('=================================')
            logger.info(`Server running in ${config.NODE_ENV} mode`)
            logger.info(`Server URL: ${config.SERVER_URL}`)
            logger.info(
                `API Base: ${config.SERVER_URL}/api/${config.API_VERSION}`
            )
            logger.info(`Port: ${config.PORT}`)
            logger.info('=================================')
        })

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (err) => {
            logger.error('UNHANDLED REJECTION! Shutting down...')
            logger.error(err.name, err.message)
            logger.error(err.stack)

            server.close(async () => {
                await disconnectDB()
                process.exit(1)
            })
        })

        // Handle SIGTERM
        process.on('SIGTERM', () => {
            logger.info('SIGTERM RECEIVED. Shutting down gracefully...')
            server.close(async () => {
                logger.info('Process terminated!')
                await disconnectDB()
                process.exit(0)
            })
        })

        // Handle SIGINT (Ctrl+C)
        process.on('SIGINT', () => {
            logger.info('SIGINT RECEIVED. Shutting down gracefully...')
            server.close(async () => {
                logger.info('Process terminated!')
                await disconnectDB()
                process.exit(0)
            })
        })
    } catch (error) {
        logger.error('Failed to start server:', error)
        process.exit(1)
    }
}

// Start the server
startServer()
