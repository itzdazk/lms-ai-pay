// src/config/cron.config.js
import cron from 'node-cron'
import logger from './logger.config.js'
import ordersService from '../services/orders.service.js'

/**
 * Configure and start all Cron Jobs
 */
export const startCronJobs = () => {
    logger.info('Starting scheduled cron jobs...')

    // Schedule: Run every 5 minutes
    // Cron syntax: * * * * * * (second, minute, hour, day, month, weekday)
    const cronSchedule = '*/5 * * * *'

    // Cron Job: Cancel pending orders that have expired (15 minutes)
    cron.schedule(cronSchedule, async () => {
        try {
            logger.debug('Executing cron job: cleanupExpiredPendingOrders...')
            await ordersService.cleanupExpiredPendingOrders()
        } catch (error) {
            logger.error('CRON JOB FAILED: cleanupExpiredPendingOrders', error)
        }
    })

    // Add other cron jobs here if needed...

    logger.info('All cron jobs scheduled successfully.')
}
