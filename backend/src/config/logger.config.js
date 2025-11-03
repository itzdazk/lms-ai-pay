// src/config/logger.config.js
const winston = require('winston')
const DailyRotateFile = require('winston-daily-rotate-file')
const path = require('path')
const config = require('./app.config')

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
)

const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`
        }
        return msg
    })
)

// Create logs directory if it doesn't exist
const fs = require('fs')
const logsDir = path.join(process.cwd(), 'logs')
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true })
}

// Define log transports
const transports = [
    // Console transport
    new winston.transports.Console({
        format: consoleFormat,
        level: config.NODE_ENV === 'production' ? 'info' : 'debug',
    }),

    // Error log file
    new DailyRotateFile({
        filename: path.join(logsDir, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        format: logFormat,
        maxFiles: config.LOG_MAX_FILES,
        maxSize: config.LOG_MAX_SIZE,
        zippedArchive: true,
    }),

    // Combined log file
    new DailyRotateFile({
        filename: path.join(logsDir, 'combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        format: logFormat,
        maxFiles: config.LOG_MAX_FILES,
        maxSize: config.LOG_MAX_SIZE,
        zippedArchive: true,
    }),
]

// Create logger
const logger = winston.createLogger({
    level: config.LOG_LEVEL,
    format: logFormat,
    transports,
    exitOnError: false,
})

// Create a stream for Morgan
logger.stream = {
    write: (message) => {
        logger.info(message.trim())
    },
}

module.exports = logger
