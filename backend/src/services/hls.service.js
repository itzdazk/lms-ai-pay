// src/services/hls.service.js
import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import fs from 'fs/promises'
import logger from '../config/logger.config.js'

const HLS_VARIANTS = [
    { name: '720p', width: 1280, height: 720, bandwidth: 2800000, videoBitrate: '2800k', audioBitrate: '128k' },
    { name: '480p', width: 854, height: 480, bandwidth: 1400000, videoBitrate: '1400k', audioBitrate: '96k' },
    { name: '360p', width: 640, height: 360, bandwidth: 800000, videoBitrate: '800k', audioBitrate: '64k' },
]

async function ensureCleanDir(dirPath) {
    await fs.rm(dirPath, { recursive: true, force: true })
    await fs.mkdir(dirPath, { recursive: true })
}

async function transcodeVariant(inputPath, variantDir, variant) {
    await fs.mkdir(variantDir, { recursive: true })

    await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .outputOptions([
                '-preset veryfast', // balance speed and quality
                '-profile:v main',
                '-crf 21',
                `-b:v ${variant.videoBitrate}`,
                `-maxrate ${variant.videoBitrate}`,
                '-bufsize 4000k',
                '-sc_threshold 0',
                '-g 48',
                '-keyint_min 48',
                '-hls_time 6',
                '-hls_playlist_type vod',
                '-hls_list_size 0',
                '-hls_segment_filename', path.join(variantDir, 'segment_%03d.ts'),
            ])
            .size(`${variant.width}x${variant.height}`)
            .audioBitrate(variant.audioBitrate)
            .videoCodec('libx264')
            .audioCodec('aac')
            .format('hls')
            .output(path.join(variantDir, 'index.m3u8'))
            .on('start', (cmd) => logger.info(`[HLS] ffmpeg start: ${cmd}`))
            .on('error', (err) => reject(err))
            .on('end', () => resolve())
            .run()
    })
}

function buildMasterPlaylist(variants) {
    const lines = ['#EXTM3U', '#EXT-X-VERSION:3']

    variants.forEach((variant) => {
        lines.push(
            `#EXT-X-STREAM-INF:BANDWIDTH=${variant.bandwidth},RESOLUTION=${variant.width}x${variant.height}`
        )
        lines.push(`${variant.name}/index.m3u8`)
    })

    return lines.join('\n')
}

export async function convertToHLS({ inputPath, outputDir, masterPlaylistName = 'master.m3u8' }) {
    try {
        await ensureCleanDir(outputDir)

        for (const variant of HLS_VARIANTS) {
            const variantDir = path.join(outputDir, variant.name)
            await transcodeVariant(inputPath, variantDir, variant)
        }

        const masterContent = buildMasterPlaylist(HLS_VARIANTS)
        const masterPath = path.join(outputDir, masterPlaylistName)
        await fs.writeFile(masterPath, masterContent, 'utf8')

        return masterPath
    } catch (error) {
        logger.error(`[HLS] Conversion failed: ${error.message}`)
        // Cleanup partial outputs to avoid stale files
        await fs.rm(outputDir, { recursive: true, force: true }).catch(() => {})
        throw error
    }
}

export { HLS_VARIANTS }
