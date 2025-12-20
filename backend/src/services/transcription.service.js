// src/services/transcription.service.js
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { parse } from 'node-webvtt'
import config from '../config/app.config.js'
import logger from '../config/logger.config.js'
import { prisma } from '../config/database.config.js'
import { TRANSCRIPT_STATUS } from '../config/constants.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class TranscriptionService {
    constructor() {
        this.enabled = config.WHISPER_ENABLED !== false
        this.command = config.WHISPER_COMMAND || 'whisper'
        this.model = config.WHISPER_MODEL || 'small'
        this.task = config.WHISPER_TASK || 'transcribe'
        this.outputFormat = config.WHISPER_OUTPUT_FORMAT || 'all'
        this.language = config.WHISPER_LANGUAGE || ''
        this.forceFp16 = config.WHISPER_FP16 === true
        this.outputDir = this._resolveOutputDir(
            config.WHISPER_OUTPUT_DIR || path.join('uploads', 'transcripts')
        )
        this.activeJobs = new Map()
        
        // Queue system to limit concurrent transcriptions
        this.maxConcurrent = config.WHISPER_MAX_CONCURRENT || 2
        this.queue = [] // Queue of pending transcription jobs
        this.running = new Set() // Set of lessonIds currently being transcribed
    }

    _resolveOutputDir(dirPath) {
        const absolutePath = path.isAbsolute(dirPath)
            ? dirPath
            : path.join(process.cwd(), dirPath)

        if (!fs.existsSync(absolutePath)) {
            fs.mkdirSync(absolutePath, { recursive: true })
            logger.info(`Created transcript directory: ${absolutePath}`)
        }

        return absolutePath
    }

    /**
     * Cancel transcription job (both running and queued)
     * Returns true if a job was cancelled, false otherwise
     */
    cancelTranscriptionJob(lessonId) {
        let cancelled = false
        
        // Cancel running job
        const job = this.activeJobs.get(lessonId)
        if (job) {
            try {
                // Try graceful termination first
                if (process.platform === 'win32') {
                    // On Windows, use taskkill to forcefully kill the process tree
                    const killProcess = spawn('taskkill', ['/pid', job.pid.toString(), '/t', '/f'], {
                        stdio: 'ignore',
                        detached: true
                    })
                    killProcess.unref() // Don't wait for it to finish
                } else {
                    // On Unix-like systems, try SIGTERM first, then SIGKILL if needed
                    try {
                        job.kill('SIGTERM')
                        // If process doesn't terminate within 2 seconds, force kill
                        setTimeout(() => {
                            if (this.activeJobs.has(lessonId)) {
                                try {
                                    job.kill('SIGKILL')
                                    logger.warn(`Force killed Whisper job for lesson ${lessonId} after SIGTERM timeout`)
                                } catch (err) {
                                    logger.error(`Failed to force kill Whisper job for lesson ${lessonId}: ${err.message}`)
                                }
                            }
                        }, 2000)
                    } catch (err) {
                        logger.error(`Failed to send SIGTERM to Whisper job for lesson ${lessonId}: ${err.message}`)
                        // Try SIGKILL as fallback
                        try {
                            job.kill('SIGKILL')
                        } catch (killErr) {
                            logger.error(`Failed to kill Whisper job for lesson ${lessonId}: ${killErr.message}`)
                        }
                    }
                }
                
                logger.info(
                    `Cancelled running Whisper job for lesson ${lessonId} (PID: ${job.pid})`
                )
                cancelled = true
            } catch (error) {
                logger.error(
                    `Failed to cancel Whisper job for lesson ${lessonId}: ${error.message}`
                )
            } finally {
                // Always remove from tracking, even if kill failed
                this.activeJobs.delete(lessonId)
                this.running.delete(lessonId)
            }
        }
        
        // Remove from queue if pending
        const queueIndex = this.queue.findIndex(job => job.lessonId === lessonId)
        if (queueIndex !== -1) {
            const queuedJob = this.queue[queueIndex]
            // Reject the promise if it exists
            if (queuedJob.reject) {
                try {
                    queuedJob.reject(new Error('Transcription job cancelled: new video uploaded'))
                } catch (err) {
                    // Ignore if promise already resolved/rejected
                }
            }
            this.queue.splice(queueIndex, 1)
            logger.info(
                `Removed lesson ${lessonId} from transcription queue`
            )
            cancelled = true
        }
        
        return cancelled
    }

    /**
     * Get queue status
     */
    getQueueStatus() {
        return {
            queueLength: this.queue.length,
            running: this.running.size,
            maxConcurrent: this.maxConcurrent,
            activeJobs: Array.from(this.activeJobs.keys()),
        }
    }

    /**
     * Process next job in queue
     */
    async _processQueue() {
        // Don't process if at max capacity
        if (this.running.size >= this.maxConcurrent) {
            return
        }

        // Don't process if queue is empty
        if (this.queue.length === 0) {
            return
        }

        // Get next job from queue
        const job = this.queue.shift()
        const { videoPath, lessonId, userId, source, resolve, reject } = job

        // Mark as running
        this.running.add(lessonId)

        logger.info(
            `Processing transcription queue job for lesson ${lessonId} (${this.running.size}/${this.maxConcurrent} running, ${this.queue.length} queued)`
        )

        try {
            // Execute transcription
            // Note: _executeTranscription will remove from running set when process completes
            const result = await this._executeTranscription({
                videoPath,
                lessonId,
                userId,
                source,
            })
            resolve(result)
        } catch (error) {
            // On error, remove from running set and process next job
            this.running.delete(lessonId)
            reject(error)
        } finally {
            // Process next job in queue (only if not already processing)
            // Note: running set is removed in _executeTranscription's close handler when process completes
            setImmediate(() => this._processQueue())
        }
    }

    /**
     * Add transcription job to queue
     */
    async queueTranscription({ videoPath, lessonId, userId, source = 'upload' }) {
        return new Promise((resolve, reject) => {
            // Check if already in queue or running
            const inQueue = this.queue.some(job => job.lessonId === lessonId)
            const isRunning = this.running.has(lessonId)

            if (inQueue || isRunning) {
                logger.warn(
                    `Transcription job for lesson ${lessonId} already queued or running. Skipping.`
                )
                return resolve(null)
            }

            // Add to queue
            this.queue.push({
                videoPath,
                lessonId,
                userId,
                source,
                resolve,
                reject,
            })

            logger.info(
                `Added transcription job to queue for lesson ${lessonId} (${this.queue.length} in queue, ${this.running.size}/${this.maxConcurrent} running)`
            )

            // Try to process immediately
            setImmediate(() => this._processQueue())
        })
    }

    /**
     * Public method: Queue transcription job
     * This is the main entry point - jobs are queued and processed with concurrency limit
     */
    async transcribeLessonVideo({
        videoPath,
        lessonId,
        userId,
        source = 'upload',
    }) {
        if (!this.enabled) {
            logger.debug('Whisper transcription disabled via config')
            return null
        }

        if (!videoPath || !lessonId) {
            logger.warn(
                'Missing videoPath or lessonId. Skip Whisper transcription.'
            )
            return null
        }

        // Cancel any existing job for this lesson
        this.cancelTranscriptionJob(lessonId)

        // Add to queue (will be processed with concurrency limit)
        return this.queueTranscription({
            videoPath,
            lessonId,
            userId,
            source,
        })
    }

    /**
     * Execute transcription (internal method, called by queue processor)
     */
    async _executeTranscription({
        videoPath,
        lessonId,
        userId,
        source = 'upload',
    }) {
        const absoluteVideoPath = path.isAbsolute(videoPath)
            ? videoPath
            : path.resolve(__dirname, '../../', videoPath)
        const baseName = path.basename(
            absoluteVideoPath,
            path.extname(absoluteVideoPath)
        )

        const args = [
            absoluteVideoPath,
            '--model',
            this.model,
            '--task',
            this.task,
            '--output_format',
            this.outputFormat,
            '--output_dir',
            this.outputDir,
            '--verbose',
            'False',
        ]

        if (this.language) {
            args.push('--language', this.language)
        }

        if (!this.forceFp16) {
            args.push('--fp16', 'False')
        }

        logger.info(
            `Starting Whisper transcription for lesson ${lessonId} (user ${userId}, source ${source})`
        )

        return new Promise((resolve, reject) => {
            const whisperProcess = spawn(this.command, args, {
                shell: process.platform === 'win32',
            })

            this.activeJobs.set(lessonId, whisperProcess)

            whisperProcess.stdout.on('data', (data) => {
                logger.debug(`[whisper stdout] ${data}`)
            })

            whisperProcess.stderr.on('data', (data) => {
                logger.debug(`[whisper stderr] ${data}`)
            })

            whisperProcess.on('error', (error) => {
                logger.error('Whisper process failed to start:', error)
                reject(error)
            })

            whisperProcess.on('close', async (code, signal) => {
                this.activeJobs.delete(lessonId)
                const wasRunning = this.running.delete(lessonId)

                if (signal === 'SIGTERM' || signal === 'SIGKILL') {
                    logger.info(
                        `Whisper transcription cancelled for lesson ${lessonId}`
                    )
                    await prisma.lesson.update({
                        where: { id: lessonId },
                        data: {
                            transcriptStatus: TRANSCRIPT_STATUS.CANCELLED,
                        },
                    })
                    // Process next job in queue after cancellation
                    if (wasRunning) {
                        setImmediate(() => this._processQueue())
                    }
                    return reject(new Error('Whisper transcription cancelled'))
                }

                if (code !== 0) {
                    const error = new Error(
                        `Whisper process exited with code ${code}`
                    )
                    logger.error(error.message)
                    await prisma.lesson.update({
                        where: { id: lessonId },
                        data: {
                            transcriptStatus: TRANSCRIPT_STATUS.FAILED,
                        },
                    })
                    // Process next job in queue after failure
                    if (wasRunning) {
                        setImmediate(() => this._processQueue())
                    }
                    return reject(error)
                }

                try {
                    const transcriptFilename = `${baseName}.srt`
                    const transcriptPath = path.join(
                        this.outputDir,
                        transcriptFilename
                    )

                    if (!fs.existsSync(transcriptPath)) {
                        logger.warn(
                            `Whisper finished but transcript file missing for lesson ${lessonId}`
                        )
                        return resolve(null)
                    }

                    const transcriptUrl = `/uploads/transcripts/${transcriptFilename}`
                    let transcriptJsonUrl = null

                    await prisma.lesson.update({
                        where: { id: lessonId },
                        data: {
                            transcriptUrl,
                            transcriptJsonUrl,
                            transcriptStatus: TRANSCRIPT_STATUS.COMPLETED,
                        },
                    })

                    try {
                        const jsonFilename = `${baseName}.json`
                        const jsonPath = path.join(this.outputDir, jsonFilename)
                        const segments = this._convertSrtToJson(transcriptPath)
                        fs.writeFileSync(
                            jsonPath,
                            JSON.stringify(segments, null, 2),
                            'utf-8'
                        )
                        transcriptJsonUrl = `/uploads/transcripts/${jsonFilename}`
                        
                        // Update database with JSON URL after successful creation
                        await prisma.lesson.update({
                            where: { id: lessonId },
                            data: { transcriptJsonUrl },
                        })
                        
                        logger.info(
                            `Generated transcript JSON for lesson ${lessonId}: ${transcriptJsonUrl}`
                        )
                    } catch (jsonError) {
                        logger.error(
                            `Failed to convert transcript to JSON for lesson ${lessonId}: ${jsonError.message}`
                        )
                    }

                    logger.info(
                        `Whisper transcription completed for lesson ${lessonId}: ${transcriptUrl}`
                    )

                    resolve({
                        lessonId,
                        transcriptUrl,
                        transcriptJsonUrl,
                        transcriptPath,
                        source,
                    })
                    
                    // Process next job in queue after successful completion
                    if (wasRunning) {
                        setImmediate(() => this._processQueue())
                    }
                } catch (error) {
                    logger.error(
                        `Failed to finalize Whisper transcript for lesson ${lessonId}`,
                        error
                    )
                    await prisma.lesson.update({
                        where: { id: lessonId },
                        data: {
                            transcriptStatus: TRANSCRIPT_STATUS.FAILED,
                        },
                    })
                    reject(error)
                    
                    // Process next job in queue after error
                    if (wasRunning) {
                        setImmediate(() => this._processQueue())
                    }
                }
            })
        })
    }

    /**
     * Convert SRT format to WebVTT format for parsing
     * SRT uses comma (,) for milliseconds, WebVTT uses dot (.)
     * SRT doesn't have WEBVTT header
     */
    _convertSrtToWebVtt(srtContent) {
        // Add WEBVTT header
        let webvttContent = 'WEBVTT\n\n'
        
        // Replace comma with dot in timestamps (SRT format: 00:00:00,000 --> 00:00:05,000)
        // WebVTT format: 00:00:00.000 --> 00:00:05.000
        webvttContent += srtContent.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')
        
        return webvttContent
    }

    /**
     * Convert SRT file to JSON using node-webvtt
     * @param {string} transcriptPath - Path to SRT file
     * @returns {Array} Array of transcript segments with index, start, end, text
     */
    _convertSrtToJson(transcriptPath) {
        const srtContent = fs.readFileSync(transcriptPath, 'utf-8')
        
        try {
            // Convert SRT to WebVTT format
            const webvttContent = this._convertSrtToWebVtt(srtContent)
            
            // Parse using node-webvtt
            const parsed = parse(webvttContent, { strict: false })
            
            if (!parsed.valid) {
                logger.warn(
                    `Invalid subtitle format, falling back to manual parsing. Errors: ${parsed.errors.join(', ')}`
                )
                // Fallback to manual parsing if node-webvtt fails
                return this._convertSrtToJsonManual(srtContent)
            }
            
            // Convert cues to our format
            const segments = parsed.cues.map((cue, index) => ({
                index: index + 1,
                start: cue.start,
                end: cue.end,
                text: cue.text.trim(),
            }))
            
            logger.debug(
                `Successfully parsed ${segments.length} segments using node-webvtt`
            )
            
            return segments
        } catch (error) {
            logger.error(
                `Failed to parse SRT with node-webvtt: ${error.message}. Falling back to manual parsing.`
            )
            // Fallback to manual parsing if node-webvtt throws error
            return this._convertSrtToJsonManual(srtContent)
        }
    }

    /**
     * Manual SRT parsing (fallback method)
     * @param {string} srtContent - SRT file content
     * @returns {Array} Array of transcript segments
     */
    _convertSrtToJsonManual(srtContent) {
        const blocks = srtContent
            .split(/\r?\n\r?\n/)
            .map((block) => block.trim())
            .filter(Boolean)

        const segments = blocks
            .map((block) => {
                const lines = block
                    .split(/\r?\n/)
                    .map((line) => line.trim())
                    .filter(Boolean)

                if (lines.length < 2) {
                    return null
                }

                const timingLine = lines[1]
                const text = lines.slice(2).join(' ')
                const [startStr, endStr] = timingLine.split('-->')

                if (!startStr || !endStr) {
                    return null
                }

                return {
                    index: Number(lines[0]) || 0,
                    start: this._timestampToSeconds(startStr.trim()),
                    end: this._timestampToSeconds(endStr.trim()),
                    text: text,
                }
            })
            .filter(Boolean)

        return segments
    }

    /**
     * Convert SRT timestamp to seconds
     * SRT format: HH:MM:SS,mmm or HH:MM:SS.mmm
     */
    _timestampToSeconds(timestamp) {
        const [timePart, msPart] = timestamp.replace(',', '.').split('.')
        const [hours, minutes, seconds] = timePart.split(':').map(Number)
        const milliseconds = msPart ? Number(`0.${msPart}`) : 0
        return hours * 3600 + minutes * 60 + seconds + milliseconds
    }
}

export default new TranscriptionService()

