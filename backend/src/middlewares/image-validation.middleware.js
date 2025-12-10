// src/middlewares/image-validation.middleware.js
import sharp from 'sharp'
import fs from 'fs'
import { HTTP_STATUS, ERROR_CODES } from '../config/constants.js'
import ApiResponse from '../utils/response.util.js'

/**
 * Validate image aspect ratio (16:9)
 * @param {number} tolerance - Tolerance for aspect ratio (default: 0.05 = 5%)
 */
export const validateThumbnailAspectRatio = (tolerance = 0.05) => {
    return async (req, res, next) => {
        // Skip if no file uploaded
        if (!req.file) {
            return next()
        }

        // Only validate image files
        if (!req.file.mimetype.startsWith('image/')) {
            return next()
        }

        try {
            const filePath = req.file.path
            const metadata = await sharp(filePath).metadata()
            const { width, height } = metadata

            if (!width || !height) {
                // Delete invalid file
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath)
                }
                return ApiResponse.error(
                    res,
                    'Unable to read image dimensions',
                    HTTP_STATUS.BAD_REQUEST,
                    { code: ERROR_CODES.VALIDATION_ERROR }
                )
            }

            // Calculate aspect ratio
            const aspectRatio = width / height
            const targetRatio = 16 / 9 // 1.777...
            const ratioDifference = Math.abs(aspectRatio - targetRatio)

            // Check if aspect ratio is within tolerance
            if (ratioDifference > tolerance) {
                // Delete file that doesn't meet requirements
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath)
                }

                return ApiResponse.error(
                    res,
                    `Image aspect ratio must be 16:9. Current ratio: ${width}:${height} (${aspectRatio.toFixed(2)}:1). Allowed tolerance: ±${(tolerance * 100).toFixed(0)}%`,
                    HTTP_STATUS.UNPROCESSABLE_ENTITY,
                    { 
                        code: ERROR_CODES.VALIDATION_ERROR,
                        currentRatio: `${width}:${height}`,
                        aspectRatio: aspectRatio.toFixed(2),
                        requiredRatio: '16:9'
                    }
                )
            }

            // Store dimensions in request for potential use
            req.file.dimensions = { width, height, aspectRatio }
            next()
        } catch (error) {
            // Delete file on error
            if (req.file && req.file.path && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path)
            }

            return ApiResponse.error(
                res,
                `Image validation failed: ${error.message}`,
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                { code: ERROR_CODES.FILE_UPLOAD_ERROR }
            )
        }
    }
}

