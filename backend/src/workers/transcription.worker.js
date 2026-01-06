// src/workers/transcription.worker.js
import { Worker } from 'bullmq'
import config from '../config/app.config.js'
import logger from '../config/logger.config.js'
import { prisma } from '../config/database.config.js'
import { TRANSCRIPT_STATUS } from '../config/constants.js'
import { transcriptionService } from '../services/transcription.service.js'

const connection = {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD || undefined,
    tls: config.REDIS_TLS ? {} : undefined,
}

const worker = new Worker(
    'transcription',
    async (job) => {
        const { lessonId, videoPath, userId, courseId } = job.data
        if (!lessonId || !videoPath || !userId || !courseId) {
            throw new Error('Invalid job data: lessonId, videoPath, userId, and courseId are required')
        }

        logger.info(`[Transcription][Job ${job.id}] Start transcribing lesson ${lessonId}`)

        try {
            // Execute actual transcription (internal method)
            const result = await transcriptionService._executeTranscription({
                videoPath,
                lessonId,
                userId,
                source: 'queue',
            })

            logger.info(`[Transcription][Job ${job.id}] Completed lesson ${lessonId}`)
            return result
        } catch (error) {
            logger.error(`[Transcription][Job ${job.id}] Error: ${error.message}`)
            throw error
        }
    },
    { connection, concurrency: config.WHISPER_MAX_CONCURRENT || 2 }
)

worker.on('failed', async (job, err) => {
    logger.error(`[Transcription][Job ${job?.id}] Failed: ${err.message}`)
    if (job?.data?.lessonId) {
        try {
            await prisma.lesson.update({
                where: { id: job.data.lessonId },
                data: {
                    transcriptStatus: TRANSCRIPT_STATUS.FAILED,
                    transcriptUrl: null,
                    transcriptJsonUrl: null,
                },
            })
        } catch (updateError) {
            logger.error(`[Transcription][Job ${job?.id}] Failed to update lesson status: ${updateError.message}`)
        }
    }
})

worker.on('completed', (job) => {
    logger.info(`[Transcription][Job ${job.id}] Completed`)
})

// Graceful shutdown
const shutdown = async () => {
    logger.info('[Transcription] Shutting down worker...')
    await worker.close()
    process.exit(0)
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
