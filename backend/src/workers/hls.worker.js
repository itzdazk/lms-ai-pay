// src/workers/hls.worker.js
import { Worker } from 'bullmq'
import path from 'path'
import { fileURLToPath } from 'url'
import config from '../config/app.config.js'
import logger from '../config/logger.config.js'
import { convertToHLS } from '../services/hls.service.js'
import { prisma } from '../config/database.config.js'
import { HLS_STATUS } from '../config/constants.js'
import pathUtil from '../utils/path.util.js'

const connection = {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD || undefined,
    tls: config.REDIS_TLS ? {} : undefined,
}

const worker = new Worker(
    'hls-conversion',
    async (job) => {
        const { lessonId, videoPath, courseId } = job.data
        if (!lessonId || !videoPath || !courseId) {
            throw new Error(
                'Dữ liệu công việc không hợp lệ: yêu cầu phải có lessonId, videoPath và courseId'
            )
        }

        const outputDir = path.join(
            pathUtil.getHlsDir(courseId),
            String(lessonId)
        )
        logger.info(
            `[HLS][Job ${job.id}] Start convert lesson ${lessonId} in course ${courseId}`
        )

        const masterPath = await convertToHLS({
            inputPath: videoPath,
            outputDir,
        })
        const masterUrl = pathUtil.getHlsPlaylistUrl(courseId, lessonId)

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
            logger.error(
                `[HLS][Job ${job?.id}] Failed to update lesson status: ${updateError.message}`
            )
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
