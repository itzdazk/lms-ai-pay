// src/workers/embedding.worker.js
import { Worker } from 'bullmq'
import config from '../config/app.config.js'
import logger from '../config/logger.config.js'
import { prisma } from '../config/database.config.js'
import embeddingService from '../services/embedding.service.js'

const connection = {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD || undefined,
    tls: config.REDIS_TLS ? {} : undefined,
}

// Check if queue mode is enabled
if (config.RAG_USE_QUEUE !== true) {
    logger.warn(
        '[Embedding Worker] RAG_USE_QUEUE is not enabled. Worker will run but no jobs will be queued. ' +
        'Set RAG_USE_QUEUE=true in .env to use queue mode.'
    )
}

const worker = new Worker(
    'embedding-generation',
    async (job) => {
        const { courseId, courseData } = job.data

        if (!courseId || !courseData) {
            throw new Error(
                'Dữ liệu công việc không hợp lệ: yêu cầu phải có courseId và courseData'
            )
        }

        logger.info(`[Embedding][Job ${job.id}] Start generating embedding for course ${courseId}`)

        try {
            // Check if course has enough content to embed
            const hasContent =
                courseData.title ||
                courseData.shortDescription ||
                courseData.description ||
                courseData.whatYouLearn

            if (!hasContent) {
                logger.debug(`[Embedding][Job ${job.id}] Course ${courseId} has no content, skipping`)
                return { skipped: true, reason: 'no_content' }
            }

            // Generate embedding
            const embedding = await embeddingService.generateCourseEmbedding(courseData)
            const embeddingString = `[${embedding.join(',')}]`
            const model = embeddingService.getModel()

            // Update database (using raw SQL to cast to vector type)
            // PostgreSQL will automatically convert JSON string to vector(768)
            await prisma.$executeRaw`
                UPDATE courses
                SET 
                    embedding = ${embeddingString}::vector,
                    embedding_model = ${model},
                    embedding_updated_at = NOW()
                WHERE id = ${courseId}
            `

            logger.info(
                `[Embedding][Job ${job.id}] ✅ Generated embedding for course ${courseId}: ${courseData.title}`
            )

            return {
                courseId,
                model,
                dimensions: embedding.length,
            }
        } catch (error) {
            logger.error(
                `[Embedding][Job ${job.id}] Error generating embedding for course ${courseId}:`,
                error.message
            )
            throw error // Re-throw để BullMQ retry
        }
    },
    {
        connection,
        concurrency: 2, // Process 2 embeddings concurrently
    }
)

worker.on('completed', (job) => {
    logger.info(`[Embedding][Job ${job.id}] Completed successfully`)
})

worker.on('failed', async (job, err) => {
    logger.error(`[Embedding][Job ${job?.id}] Failed: ${err.message}`)
    // Could update course status here if needed
})

worker.on('error', (err) => {
    logger.error(`[Embedding] Worker error: ${err.message}`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('[Embedding] Shutting down worker...')
    await worker.close()
})

export default worker
