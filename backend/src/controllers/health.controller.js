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

        return ApiResponse.success(res, healthStatus, 'API hoạt động ổn định')
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
                logger.error(
                    'Kiểm tra trạng thái cơ sở dữ liệu thất bại',
                    dbStatus.error
                )
                return ApiResponse.error(
                    res,
                    'Kết nối cơ sở dữ liệu thất bại',
                    503,
                    { details: dbStatus }
                )
            }

            return ApiResponse.success(
                res,
                dbStatus,
                'Kết nối cơ sở dữ liệu hoạt động ổn định'
            )
        } catch (error) {
            logger.error('Kiểm tra trạng thái cơ sở dữ liệu thất bại', error)
            return ApiResponse.error(
                res,
                'Kiểm tra trạng thái cơ sở dữ liệu thất bại',
                503
            )
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
                    'Kiểm tra trạng thái lưu trữ thất bại:',
                    storageStatus.error
                )
                return ApiResponse.error(
                    res,
                    'Kiểm tra trạng thái lưu trữ thất bại',
                    503,
                    {
                        details: storageStatus,
                    }
                )
            }

            return ApiResponse.success(
                res,
                storageStatus,
                'Lưu trữ hoạt động ổn định'
            )
        } catch (error) {
            logger.error('Kiểm tra trạng thái lưu trữ thất bại', error)
            return ApiResponse.error(
                res,
                'Kiểm tra trạng thái lưu trữ thất bại',
                503
            )
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
                'Một số dịch vụ không hoạt động ổn định',
                503,
                fullHealthStatus
            )
        }

        return ApiResponse.success(
            res,
            fullHealthStatus,
            'Tất cả các dịch vụ hoạt động ổn định'
        )
    })
}

export default new HealthController()
