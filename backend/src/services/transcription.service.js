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

    cancelTranscriptionJob(lessonId) {
        const job = this.activeJobs.get(lessonId)
        if (job) {
            try {
                if (process.platform === 'win32') {
                    spawn('taskkill', ['/pid', job.pid, '/t', '/f'])
                } else {
                    job.kill('SIGTERM')
                }
                logger.info(
                    `Cancelled running Whisper job for lesson ${lessonId}`
                )
            } catch (error) {
                logger.error(
                    `Failed to cancel Whisper job for lesson ${lessonId}: ${error.message}`
                )
            } finally {
                this.activeJobs.delete(lessonId)
            }
        }
    }

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

        this.cancelTranscriptionJob(lessonId)

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

