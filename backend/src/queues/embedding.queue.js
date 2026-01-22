// src/queues/embedding.queue.js
import { Queue } from 'bullmq'
import config from '../config/app.config.js'

const connection = {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD || undefined,
    tls: config.REDIS_TLS ? {} : undefined,
}

export const embeddingQueue = new Queue('embedding-generation', {
    connection,
    defaultJobOptions: {
        attempts: 3, // Retry 3 times
        backoff: {
            type: 'exponential',
            delay: 5000, // 5s, 10s, 20s
        },
        removeOnComplete: 50, // Keep last 50 completed jobs
        removeOnFail: 100, // Keep last 100 failed jobs
    },
})

/**
 * Enqueue embedding generation job
 * @param {Object} data - Job data
 * @param {number} data.courseId - Course ID
 * @param {Object} data.courseData - Course data for embedding
 * @param {string} data.priority - Job priority ('high', 'normal', 'low')
 * @returns {Promise<Job>} BullMQ job
 */
export async function enqueueEmbeddingJob({ courseId, courseData, priority = 'normal' }) {
    const priorityMap = {
        high: 1,
        normal: 5,
        low: 10,
    }

    return embeddingQueue.add(
        'generate-embedding',
        {
            courseId,
            courseData,
        },
        {
            priority: priorityMap[priority] || 5,
            jobId: `embedding-${courseId}`, // Unique job ID per course
        }
    )
}

/**
 * Get queue status
 * @returns {Promise<Object>} Queue statistics
 */
export async function getEmbeddingQueueStatus() {
    const [waiting, active, completed, failed] = await Promise.all([
        embeddingQueue.getWaitingCount(),
        embeddingQueue.getActiveCount(),
        embeddingQueue.getCompletedCount(),
        embeddingQueue.getFailedCount(),
    ])

    return {
        waiting,
        active,
        completed,
        failed,
        total: waiting + active + completed + failed,
    }
}
