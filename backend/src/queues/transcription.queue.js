// src/queues/transcription.queue.js
import { Queue } from 'bullmq'
import config from '../config/app.config.js'

const connection = {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD || undefined,
    tls: config.REDIS_TLS ? {} : undefined,
}

export const transcriptionQueue = new Queue('transcription', {
    connection,
    defaultJobOptions: {
        attempts: 2,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: 20,
        removeOnFail: 50,
    },
})

export async function enqueueTranscriptionJob({ lessonId, videoPath, userId, courseId }) {
    return transcriptionQueue.add('transcribe', {
        lessonId,
        videoPath,
        userId,
        courseId,
    })
}
