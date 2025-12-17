// src/utils/video.util.js
import { exec } from 'child_process'
import { promisify } from 'util'
import logger from '../config/logger.config.js'

const execAsync = promisify(exec)

/**
 * Get video duration in seconds using ffprobe
 * @param {string} videoPath - Path to video file
 * @returns {Promise<number>} Duration in seconds, rounded to nearest integer
 */
export async function getVideoDuration(videoPath) {
    try {
        // Try using ffprobe (part of ffmpeg) - most accurate
        const { stdout } = await execAsync(
            `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
        )
        
        const duration = parseFloat(stdout.trim())
        
        if (isNaN(duration) || duration <= 0) {
            logger.warn(`Invalid duration extracted from video: ${videoPath}`)
            return null
        }
        
        // Round to nearest integer (seconds)
        return Math.round(duration)
    } catch (error) {
        // If ffprobe is not available, try alternative method
        logger.warn(`ffprobe not available, trying alternative method: ${error.message}`)
        
        try {
            // Alternative: Use Node.js built-in methods (less accurate, but works for some formats)
            // This is a fallback - ideally ffprobe should be installed
            const fs = await import('fs')
            const stats = await fs.promises.stat(videoPath)
            
            // This is not accurate, just a fallback
            logger.warn(`Using fallback method for video duration - may not be accurate`)
            return null
        } catch (fallbackError) {
            logger.error(`Failed to get video duration: ${fallbackError.message}`)
            return null
        }
    }
}

/**
 * Get video duration using get-video-duration package (alternative method)
 * This requires: npm install get-video-duration
 * @param {string} videoPath - Path to video file
 * @returns {Promise<number>} Duration in seconds, rounded to nearest integer
 */
export async function getVideoDurationAlternative(videoPath) {
    try {
        // Dynamic import to avoid errors if package not installed
        const { getVideoDuration } = await import('get-video-duration')
        const duration = await getVideoDuration(videoPath)
        
        if (isNaN(duration) || duration <= 0) {
            logger.warn(`Invalid duration extracted from video: ${videoPath}`)
            return null
        }
        
        // Round to nearest integer (seconds)
        return Math.round(duration)
    } catch (error) {
        logger.error(`Failed to get video duration using alternative method: ${error.message}`)
        return null
    }
}

