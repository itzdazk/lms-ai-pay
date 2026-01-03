// src/workers/hls.worker.js
import { Worker } from 'bullmq'
import path from 'path'
import { fileURLToPath } from 'url'
import config from '../config/app.config.js'
import logger from '../config/logger.config.js'
import { convertToHLS } from '../services/hls.service.js'
import { hlsDir } from '../config/multer.config.js'
import { prisma } from '../config/database.config.js'
import { HLS_STATUS } from '../config/constants.js'

const connection = {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD || undefined,
    tls: config.REDIS_TLS ? {} : undefined,
}

const worker = new Worker(
    'hls-conversion',
    async (job) => {
        const { lessonId, videoPath } = job.data
        if (!lessonId || !videoPath) {
            throw new Error('Invalid job data: lessonId and videoPath are required')
        }

        const outputDir = path.join(hlsDir, String(lessonId))
        logger.info(`[HLS][Job ${job.id}] Start convert lesson ${lessonId}`)

        const masterPath = await convertToHLS({ inputPath: videoPath, outputDir })
        const masterUrl = `/uploads/hls/${lessonId}/master.m3u8`

        await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                hlsStatus: HLS_STATUS.COMPLETED,
                hlsUrl: masterUrl,
            },
        })

        logger.info(`[HLS][Job ${job.id}] Completed lesson ${lessonId}`)
        return { masterPath }
    },
    { connection, concurrency: 1 }
)

worker.on('failed', async (job, err) => {
    logger.error(`[HLS][Job ${job?.id}] Failed: ${err.message}`)
    if (job?.data?.lessonId) {
        try {
            await prisma.lesson.update({
                where: { id: job.data.lessonId },
                data: {
                    hlsStatus: HLS_STATUS.FAILED,
                    hlsUrl: null,
                },
            })
        } catch (updateError) {
            logger.error(`[HLS][Job ${job?.id}] Failed to update lesson status: ${updateError.message}`)
        }
    }
})

worker.on('completed', (job) => {
    logger.info(`[HLS][Job ${job.id}] Completed`)
})

// Graceful shutdown
const shutdown = async () => {
    logger.info('[HLS] Shutting down worker...')
    await worker.close()
    process.exit(0)
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
