// src/utils/transcript-parser.util.js
import fs from 'fs/promises'
import path from 'path'
import srtParser2 from 'srt-parser-2'
import webvtt from 'node-webvtt'
import logger from '../config/logger.config.js'

class TranscriptParser {
    /**
     * Parse transcript file dựa vào extension
     * @param {string} filePath - Đường dẫn file transcript
     * @returns {Promise<Array>} Array of transcript segments
     */
    static async parse(filePath) {
        try {
            const ext = path.extname(filePath).toLowerCase()

            switch (ext) {
                case '.txt':
                    return await this.parseTxt(filePath)
                case '.srt':
                    return await this.parseSrt(filePath)
                case '.vtt':
                    return await this.parseVtt(filePath)
                default:
                    throw new Error(`Unsupported transcript format: ${ext}`)
            }
        } catch (error) {
            logger.error('Error parsing transcript:', error)
            throw error
        }
    }

    /**
     * Parse .txt file (không có timestamp)
     */
    static async parseTxt(filePath) {
        const content = await fs.readFile(filePath, 'utf-8')

        // Split thành paragraphs
        const paragraphs = content
            .split('\n\n')
            .filter((p) => p.trim().length > 0)
            .map((text, index) => ({
                id: index + 1,
                startTime: null,
                endTime: null,
                text: text.trim(),
            }))

        return paragraphs
    }

    /**
     * Parse .srt file (có timestamp)
     * Format:
     * 1
     * 00:00:20,000 --> 00:00:24,400
     * Text here...
     */
    static async parseSrt(filePath) {
        const content = await fs.readFile(filePath, 'utf-8')
        const parser = new srtParser2()
        const parsed = parser.fromSrt(content)

        return parsed.map((item) => ({
            id: item.id,
            startTime: this.timeToSeconds(item.startTime),
            endTime: this.timeToSeconds(item.endTime),
            text: item.text,
        }))
    }

    /**
     * Parse .vtt file (WebVTT format)
     * Format:
     * WEBVTT
     *
     * 00:00:20.000 --> 00:00:24.400
     * Text here...
     */
    static async parseVtt(filePath) {
        const content = await fs.readFile(filePath, 'utf-8')
        const parsed = webvtt.parse(content)

        return parsed.cues.map((cue, index) => ({
            id: index + 1,
            startTime: cue.start,
            endTime: cue.end,
            text: cue.text,
        }))
    }

    /**
     * Convert time string to seconds
     * "00:05:30,000" -> 330
     */
    static timeToSeconds(timeString) {
        const parts = timeString.replace(',', '.').split(':')
        const hours = parseInt(parts[0])
        const minutes = parseInt(parts[1])
        const seconds = parseFloat(parts[2])
        return hours * 3600 + minutes * 60 + seconds
    }

    /**
     * Convert seconds to readable format
     * 330 -> "05:30"
     */
    static secondsToTime(seconds) {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = Math.floor(seconds % 60)

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        }
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    /**
     * Search keyword trong transcript và return đoạn text xung quanh
     * @param {Array} segments - Parsed transcript segments
     * @param {string} keyword - Keyword to search
     * @param {number} contextWindow - Số segments trước/sau để lấy context
     */
    static searchInTranscript(segments, keyword, contextWindow = 1) {
        const results = []
        const lowerKeyword = keyword.toLowerCase()

        segments.forEach((segment, index) => {
            if (segment.text.toLowerCase().includes(lowerKeyword)) {
                // Lấy context: segment trước và sau
                const startIndex = Math.max(0, index - contextWindow)
                const endIndex = Math.min(
                    segments.length - 1,
                    index + contextWindow
                )

                const contextSegments = segments.slice(startIndex, endIndex + 1)
                const contextText = contextSegments.map((s) => s.text).join(' ')

                results.push({
                    matchedSegment: segment,
                    startTime: segment.startTime,
                    endTime: segment.endTime,
                    timestamp: segment.startTime
                        ? this.secondsToTime(segment.startTime)
                        : null,
                    text: segment.text,
                    contextText: contextText,
                    contextSegments: contextSegments,
                })
            }
        })

        return results
    }

    /**
     * Highlight keyword trong text
     */
    static highlightKeyword(text, keyword) {
        const regex = new RegExp(`(${keyword})`, 'gi')
        return text.replace(regex, '**$1**')
    }

    /**
     * Get transcript excerpt (đoạn trích) với max length
     */
    static getExcerpt(text, maxLength = 200) {
        if (text.length <= maxLength) return text

        const excerpt = text.substring(0, maxLength)
        const lastSpace = excerpt.lastIndexOf(' ')

        return lastSpace > 0
            ? excerpt.substring(0, lastSpace) + '...'
            : excerpt + '...'
    }
}

export default TranscriptParser
