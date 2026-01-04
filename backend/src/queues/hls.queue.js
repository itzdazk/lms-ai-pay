// src/queues/hls.queue.js
import { Queue } from 'bullmq'
import config from '../config/app.config.js'

const connection = {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD || undefined,
    tls: config.REDIS_TLS ? {} : undefined,
}

export const hlsQueue = new Queue('hls-conversion', {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: 20,
        removeOnFail: 50,
    },
})

export async function enqueueHlsJob({ lessonId, videoPath, courseId }) {
    return hlsQueue.add('convert', { lessonId, videoPath, courseId })
}
