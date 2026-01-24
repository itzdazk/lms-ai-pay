// src/services/providers/gemini.provider.js
import { BaseProvider } from './base.provider.js'
import logger from '../../config/logger.config.js'

/**
 * Google Gemini Provider - Implementation for Gemini API
 * Note: Gemini uses systemInstruction instead of system messages
 */
export class GeminiProvider extends BaseProvider {
    constructor(config) {
        super({
            ...config,
            providerName: 'gemini',
        })
        this.apiKey = config.apiKey
        this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta'
        this.model = config.model || 'gemini-1.5-flash'
        this.temperature = config.temperature || 0.7
        this.maxTokens = config.maxTokens || 2000

        if (!this.apiKey) {
            logger.warn('Gemini API key not provided')
        }
    }

    /**
     * Check if Gemini is available
     * Gemini doesn't have a dedicated health check endpoint, so we'll try a minimal API call
     * @returns {Promise<boolean>}
     */
    async checkHealth() {
        if (!this.enabled || !this.apiKey) {
            return false
        }

        try {
            // Cache health check for 30 seconds
            const now = Date.now()
            if (
                this.healthCheckCache.isHealthy !== null &&
                now - this.healthCheckCache.lastCheck < this.healthCheckCacheTTL
            ) {
                return this.healthCheckCache.isHealthy
            }

            // Try a minimal API call to check health
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout

            const response = await fetch(
                `${this.baseUrl}/models/${this.model}?key=${this.apiKey}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    signal: controller.signal,
                }
            )

            clearTimeout(timeoutId)

            const isHealthy = response.ok
            this.healthCheckCache = {
                isHealthy,
                lastCheck: now,
            }

            return isHealthy
        } catch (error) {
            if (error.name === 'AbortError') {
                logger.warn('Gemini health check timeout')
            } else {
                logger.warn('Gemini health check failed:', error.message)
            }
            this.healthCheckCache = {
                isHealthy: false,
                lastCheck: Date.now(),
            }
            return false
        }
    }

    /**
     * Build Gemini request format
     * Gemini uses contents array and systemInstruction (not system messages)
     * @param {string} prompt - User message
     * @param {Array} context - Conversation context
     * @param {string|null} systemPrompt - System prompt
     * @returns {Object} Gemini request format
     */
    buildGeminiRequest(prompt, context = [], systemPrompt = null) {
        const contents = []

        // Add conversation history
        context.forEach((msg) => {
            contents.push({
                role: msg.senderType === 'user' ? 'user' : 'model',
                parts: [{ text: msg.message }],
            })
        })

        // Add current user message
        contents.push({
            role: 'user',
            parts: [{ text: prompt }],
        })

        const request = {
            contents: contents,
            generationConfig: {
                temperature: this.temperature,
                maxOutputTokens: this.maxTokens,
            },
        }

        // Add system instruction if provided (Gemini-specific)
        if (systemPrompt) {
            request.systemInstruction = {
                parts: [{ text: systemPrompt }],
            }
        }

        return request
    }

    /**
     * Generate response using Gemini API
     * @param {string} prompt - User message
     * @param {Array} context - Conversation context (messages history)
     * @param {string|null} systemPrompt - System prompt with knowledge base context
     * @returns {Promise<string>} AI response
     */
    async generateResponse(prompt, context = [], systemPrompt = null) {
        if (!this.enabled) {
            throw new Error('Gemini đã bị vô hiệu hóa')
        }

        if (!this.apiKey) {
            throw new Error('Gemini API key chưa được cấu hình')
        }

        try {
            // Build Gemini request format
            const requestBody = this.buildGeminiRequest(prompt, context, systemPrompt)

            logger.debug(
                `Calling Gemini API: ${this.baseUrl}/models/${this.model}:generateContent`
            )
            const startTime = Date.now()

            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 120000) // 120s timeout

            try {
                const response = await fetch(
                    `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        signal: controller.signal,
                        body: JSON.stringify(requestBody),
                    }
                )

                clearTimeout(timeoutId)

                const duration = Date.now() - startTime
                logger.info(`Gemini API call completed in ${duration}ms`)

                if (!response.ok) {
                    let errorData
                    try {
                        errorData = await response.json()
                    } catch {
                        const errorText = await response.text()
                        errorData = { error: { message: errorText } }
                    }
                    const errorMessage = errorData.error?.message || `HTTP ${response.status}`
                    logger.error(`Gemini API error: ${response.status} - ${errorMessage}`)
                    throw new Error(`Lỗi API Gemini: ${response.status} - ${errorMessage}`)
                }

                const data = await response.json()

                if (
                    !data.candidates ||
                    !data.candidates[0] ||
                    !data.candidates[0].content ||
                    !data.candidates[0].content.parts ||
                    !data.candidates[0].content.parts[0] ||
                    !data.candidates[0].content.parts[0].text
                ) {
                    throw new Error('Phản hồi không hợp lệ từ API Gemini')
                }

                const content = data.candidates[0].content.parts[0].text.trim()
                const totalDuration = Date.now() - startTime
                logger.info(
                    `Gemini response generated (${content.length} chars) in ${totalDuration}ms`
                )

                return content
            } catch (error) {
                clearTimeout(timeoutId)
                const errorDuration = Date.now() - startTime
                if (error.name === 'AbortError') {
                    logger.error(`Gemini API timeout after ${errorDuration}ms`)
                    throw new Error(
                        `Hết thời gian chờ API Gemini - phản hồi mất quá nhiều thời gian (${errorDuration}ms)`
                    )
                }
                logger.error(
                    `Error generating Gemini response after ${errorDuration}ms:`,
                    error.message,
                    error.stack
                )
                throw this.normalizeError(error)
            }
        } catch (error) {
            logger.error('Error generating Gemini response:', error)
            throw this.normalizeError(error)
        }
    }

    /**
     * Generate response with streaming
     * @param {string} prompt - User message
     * @param {Array} context - Conversation context (messages history)
     * @param {string|null} systemPrompt - System prompt with knowledge base context
     * @returns {AsyncGenerator<string>} Streaming response chunks
     */
    async *generateResponseStream(prompt, context = [], systemPrompt = null) {
        if (!this.enabled) {
            throw new Error('Gemini đã bị vô hiệu hóa')
        }

        if (!this.apiKey) {
            throw new Error('Gemini API key chưa được cấu hình')
        }

        const startTime = Date.now()
        let totalChunks = 0

        try {
            // Build Gemini request format
            const requestBody = this.buildGeminiRequest(prompt, context, systemPrompt)

            logger.debug(
                `Starting Gemini streaming: ${this.baseUrl}/models/${this.model}:streamGenerateContent`
            )

            const controller = new AbortController()
            const timeoutId = setTimeout(() => {
                controller.abort()
                logger.warn('Gemini streaming timeout after 180s')
            }, 180000) // 180s timeout for streaming

            const response = await fetch(
                `${this.baseUrl}/models/${this.model}:streamGenerateContent?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    signal: controller.signal,
                    body: JSON.stringify(requestBody),
                }
            )

            clearTimeout(timeoutId)

            if (!response.ok) {
                let errorData
                try {
                    errorData = await response.json()
                } catch {
                    const errorText = await response.text()
                    errorData = { error: { message: errorText } }
                }
                const errorMessage = errorData.error?.message || `HTTP ${response.status}`
                logger.error(`Gemini streaming API error: ${response.status} - ${errorMessage}`)
                throw new Error(`Lỗi API Gemini: ${response.status} - ${errorMessage}`)
            }

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''

            try {
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    // Decode chunk
                    buffer += decoder.decode(value, { stream: true })

                    // Process complete lines (Gemini uses newline-delimited JSON)
                    const lines = buffer.split('\n')
                    buffer = lines.pop() || '' // Keep incomplete line in buffer

                    for (const line of lines) {
                        const trimmedLine = line.trim()
                        if (!trimmedLine) continue

                        try {
                            // Gemini streaming format: JSON per line
                            const data = JSON.parse(trimmedLine)

                            // Extract content from candidates
                            if (
                                data.candidates &&
                                data.candidates[0] &&
                                data.candidates[0].content &&
                                data.candidates[0].content.parts &&
                                data.candidates[0].content.parts[0] &&
                                data.candidates[0].content.parts[0].text
                            ) {
                                const content = data.candidates[0].content.parts[0].text
                                totalChunks++
                                yield content
                            }

                            // Check if done
                            if (
                                data.candidates &&
                                data.candidates[0] &&
                                data.candidates[0].finishReason
                            ) {
                                const duration = Date.now() - startTime
                                logger.info(
                                    `Gemini streaming completed: ${totalChunks} chunks in ${duration}ms`
                                )
                                return
                            }
                        } catch (parseError) {
                            // Skip invalid JSON lines (common in streaming)
                            logger.debug(
                                `Skipping invalid JSON line in Gemini stream: ${trimmedLine.substring(0, 50)}`
                            )
                        }
                    }
                }

                const duration = Date.now() - startTime
                logger.info(
                    `Gemini streaming finished: ${totalChunks} chunks in ${duration}ms`
                )
            } finally {
                reader.releaseLock()
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                const duration = Date.now() - startTime
                logger.error(`Gemini streaming timeout after ${duration}ms`)
                throw new Error(
                    `Hết thời gian chờ Gemini streaming - phản hồi mất quá nhiều thời gian (${duration}ms)`
                )
            }
            logger.error('Error in Gemini stream:', error)
            throw this.normalizeError(error)
        }
    }

    /**
     * Normalize Gemini errors
     * @param {Error} error - Original error
     * @returns {Error} Normalized error
     */
    normalizeError(error) {
        if (error.message && error.message.includes('Gemini')) {
            return error
        }
        return new Error(`Lỗi Gemini: ${error.message || 'Unknown error'}`)
    }

    /**
     * Get Gemini provider status
     * @returns {Promise<Object>} Provider status
     */
    async getStatus() {
        try {
            const isHealthy = await this.checkHealth()

            return {
                provider: 'gemini',
                enabled: this.enabled,
                available: isHealthy,
                model: this.model,
                temperature: this.temperature,
                maxTokens: this.maxTokens,
                hasApiKey: !!this.apiKey,
            }
        } catch (error) {
            logger.error('Error getting Gemini status:', error)
            return {
                provider: 'gemini',
                enabled: this.enabled,
                available: false,
                model: this.model,
                error: error.message,
                hasApiKey: !!this.apiKey,
            }
        }
    }
}
