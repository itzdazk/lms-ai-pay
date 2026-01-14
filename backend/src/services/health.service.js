// backend/src/services/health.service.js
import { prisma } from '../config/database.config.js'
import config from '../config/app.config.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import os from 'os'
import transcriptionService from './transcription.service.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class HealthService {
    /**
     * Check basic API health
     */
    async checkBasicHealth() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: config.NODE_ENV,
            version: config.API_VERSION,
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(
                    process.memoryUsage().heapTotal / 1024 / 1024
                ),
                unit: 'MB',
            },
            system: {
                platform: os.platform(),
                arch: os.arch(),
                cpus: os.cpus().length,
                totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024),
                freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024),
                unit: 'GB',
            },
        }
    }

    /**
     * Check database connection health
     */
    async checkDatabaseHealth() {
        const startTime = Date.now()

        try {
            // Test database connection with a simple query
            await prisma.$queryRaw`SELECT 1 as result`

            // Get additional database info
            const userCount = await prisma.user.count()
            const courseCount = await prisma.course.count()

            const responseTime = Date.now() - startTime

            return {
                isHealthy: true,
                status: 'connected',
                responseTime: `${responseTime}ms`,
                timestamp: new Date().toISOString(),
                info: {
                    users: userCount,
                    courses: courseCount,
                },
            }
        } catch (error) {
            return {
                isHealthy: false,
                status: 'disconnected',
                error: error.message,
                timestamp: new Date().toISOString(),
            }
        }
    }

    /**
     * Check storage (file system) health
     */
    async checkStorageHealth() {
        try {
            // Define directories to check
            const uploadsDir = path.join(process.cwd(), 'uploads')
            const directories = [
                { name: 'uploads', path: uploadsDir },
                { name: 'avatars', path: path.join(uploadsDir, 'avatars') },
                { name: 'videos', path: path.join(uploadsDir, 'videos') },
                {
                    name: 'transcripts',
                    path: path.join(uploadsDir, 'transcripts'),
                },
                {
                    name: 'thumbnails',
                    path: path.join(uploadsDir, 'thumbnails'),
                },
                {
                    name: 'video-previews',
                    path: path.join(uploadsDir, 'video-previews'),
                },
            ]

            const directoriesStatus = []
            let allHealthy = true

            // Check each directory
            for (const dir of directories) {
                try {
                    // Check if directory exists
                    const exists = fs.existsSync(dir.path)

                    if (!exists) {
                        directoriesStatus.push({
                            name: dir.name,
                            exists: false,
                            readable: false,
                            writable: false,
                            status: 'missing',
                        })
                        allHealthy = false
                        continue
                    }

                    // Check read permission
                    let readable = false
                    try {
                        fs.accessSync(dir.path, fs.constants.R_OK)
                        readable = true
                    } catch (e) {
                        allHealthy = false
                    }

                    // Check write permission
                    let writable = false
                    try {
                        fs.accessSync(dir.path, fs.constants.W_OK)
                        writable = true
                    } catch (e) {
                        allHealthy = false
                    }

                    // Get directory stats
                    const stats = fs.statSync(dir.path)
                    const files = fs.readdirSync(dir.path)

                    directoriesStatus.push({
                        name: dir.name,
                        exists: true,
                        readable,
                        writable,
                        fileCount: files.length,
                        created: stats.birthtime,
                        modified: stats.mtime,
                        status: readable && writable ? 'healthy' : 'unhealthy',
                    })
                } catch (error) {
                    directoriesStatus.push({
                        name: dir.name,
                        exists: false,
                        error: error.message,
                        status: 'error',
                    })
                    allHealthy = false
                }
            }

            // Test write operation (create and delete a test file)
            const testFilePath = path.join(uploadsDir, '.health-check-test')
            let writeTest = false

            try {
                fs.writeFileSync(testFilePath, 'health check test')
                fs.unlinkSync(testFilePath)
                writeTest = true
            } catch (error) {
                allHealthy = false
            }

            return {
                isHealthy: allHealthy,
                status: allHealthy ? 'operational' : 'degraded',
                timestamp: new Date().toISOString(),
                directories: directoriesStatus,
                writeTest: {
                    success: writeTest,
                    message: writeTest
                        ? 'Write test successful'
                        : 'Write test failed',
                },
            }
        } catch (error) {
            return {
                isHealthy: false,
                status: 'failed',
                error: error.message,
                timestamp: new Date().toISOString(),
            }
        }
    }

    /**
     * Check transcription queue health
     */
    checkTranscriptionQueueHealth() {
        try {
            const queueStatus = transcriptionService.getQueueStatus()

            return {
                isHealthy: true,
                status: 'operational',
                timestamp: new Date().toISOString(),
                queue: queueStatus,
            }
        } catch (error) {
            return {
                isHealthy: false,
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString(),
            }
        }
    }

    /**
     * Check full system health (all services)
     */
    async checkFullHealth() {
        const [basicHealth, dbHealth, storageHealth, transcriptionHealth] =
            await Promise.all([
                this.checkBasicHealth(),
                this.checkDatabaseHealth(),
                this.checkStorageHealth(),
                Promise.resolve(this.checkTranscriptionQueueHealth()),
            ])

        return {
            timestamp: new Date().toISOString(),
            api: basicHealth,
            database: dbHealth,
            storage: storageHealth,
            transcription: transcriptionHealth,
            overall: {
                isHealthy: dbHealth.isHealthy && storageHealth.isHealthy,
                status:
                    dbHealth.isHealthy && storageHealth.isHealthy
                        ? 'healthy'
                        : 'degraded',
            },
        }
    }
}

export default new HealthService()
