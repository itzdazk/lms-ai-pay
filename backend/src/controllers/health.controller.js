// backend/src/controllers/health.controller.js
import { asyncHandler } from '../middlewares/error.middleware.js'
import ApiResponse from '../utils/response.util.js'
import healthService from '../services/health.service.js'
import logger from '../config/logger.config.js'

class HealthController {
    /**
     * @route   GET /api/v1/health
     * @desc    Basic health check - API status
     * @access  Public
     */
    checkHealth = asyncHandler(async (req, res) => {
        const healthStatus = await healthService.checkBasicHealth()

        return ApiResponse.success(res, healthStatus, 'API is healthy')
    })

    /**
     * @route   GET /api/v1/health/db
     * @desc    Database connection health check
     * @access  Public
     */
    checkDatabase = asyncHandler(async (req, res) => {
        try {
            const dbStatus = await healthService.checkDatabaseHealth()

            if (!dbStatus.isHealthy) {
                logger.error('Database health check failed:', dbStatus.error)
                return ApiResponse.error(
                    res,
                    'Database connection failed',
                    503,
                    { details: dbStatus }
                )
            }

            return ApiResponse.success(
                res,
                dbStatus,
                'Database connection is healthy'
            )
        } catch (error) {
            logger.error('Database health check error:', error)
            return ApiResponse.error(res, 'Database health check failed', 503)
        }
    })

    /**
     * @route   GET /api/v1/health/storage
     * @desc    Storage (file system) health check
     * @access  Public
     */
    checkStorage = asyncHandler(async (req, res) => {
        try {
            const storageStatus = await healthService.checkStorageHealth()

            if (!storageStatus.isHealthy) {
                logger.error(
                    'Storage health check failed:',
                    storageStatus.error
                )
                return ApiResponse.error(res, 'Storage check failed', 503, {
                    details: storageStatus,
                })
            }

            return ApiResponse.success(res, storageStatus, 'Storage is healthy')
        } catch (error) {
            logger.error('Storage health check error:', error)
            return ApiResponse.error(res, 'Storage health check failed', 503)
        }
    })

    /**
     * @route   GET /api/v1/health/full
     * @desc    Complete health check (all services)
     * @access  Public
     */
    checkFullHealth = asyncHandler(async (req, res) => {
        const fullHealthStatus = await healthService.checkFullHealth()

        const isAllHealthy =
            fullHealthStatus.database.isHealthy &&
            fullHealthStatus.storage.isHealthy

        if (!isAllHealthy) {
            return ApiResponse.error(
                res,
                'Some services are unhealthy',
                503,
                fullHealthStatus
            )
        }

        return ApiResponse.success(
            res,
            fullHealthStatus,
            'All services are healthy'
        )
    })
}

export default new HealthController()
