// src/services/providers/openai.provider.js
import { BaseProvider } from './base.provider.js'
import logger from '../../config/logger.config.js'

/**
 * OpenAI Provider - Implementation for OpenAI API
 */
export class OpenAIProvider extends BaseProvider {
    constructor(config) {
        super({
            ...config,
            providerName: 'openai',
        })
        this.apiKey = config.apiKey
        this.baseUrl = config.baseUrl || 'https://api.openai.com/v1'
        this.model = config.model || 'gpt-4o-mini'
        this.temperature = config.temperature || 0.7
        this.maxTokens = config.maxTokens || 2000

        if (!this.apiKey) {
            logger.warn('OpenAI API key not provided')
        }
    }

    /**
     * Check if OpenAI is available
     * OpenAI doesn't have a dedicated health check endpoint, so we'll try a minimal API call
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

            const response = await fetch(`${this.baseUrl}/models`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                signal: controller.signal,
            })

            clearTimeout(timeoutId)

            const isHealthy = response.ok
            this.healthCheckCache = {
                isHealthy,
                lastCheck: now,
            }

            return isHealthy
        } catch (error) {
            if (error.name === 'AbortError') {
                logger.warn('OpenAI health check timeout')
            } else {
                logger.warn('OpenAI health check failed:', error.message)
            }
            this.healthCheckCache = {
                isHealthy: false,
                lastCheck: Date.now(),
            }
            return false
        }
    }

    /**
     * Generate response using OpenAI chat completions API
     * @param {string} prompt - User message
     * @param {Array} context - Conversation context (messages history)
     * @param {string|null} systemPrompt - System prompt with knowledge base context
     * @returns {Promise<string>} AI response
     */
    async generateResponse(prompt, context = [], systemPrompt = null) {
        if (!this.enabled) {
            throw new Error('OpenAI đã bị vô hiệu hóa')
        }

        if (!this.apiKey) {
            throw new Error('OpenAI API key chưa được cấu hình')
        }

        try {
            // Build messages array
            const messages = this.buildMessages(prompt, context, systemPrompt)

            logger.debug(
                `Calling OpenAI API: ${this.baseUrl}/chat/completions with model: ${this.model}`
            )
            const startTime = Date.now()

            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 120000) // 120s timeout

            try {
                const response = await fetch(`${this.baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    signal: controller.signal,
                    body: JSON.stringify({
                        model: this.model,
                        messages: messages,
                        temperature: this.temperature,
                        max_tokens: this.maxTokens,
                        stream: false,
                    }),
                })

                clearTimeout(timeoutId)

                const duration = Date.now() - startTime
                logger.info(`OpenAI API call completed in ${duration}ms`)

                if (!response.ok) {
                    let errorData
                    try {
                        errorData = await response.json()
                    } catch {
                        const errorText = await response.text()
                        errorData = { error: { message: errorText } }
                    }
                    const errorMessage = errorData.error?.message || `HTTP ${response.status}`
                    logger.error(`OpenAI API error: ${response.status} - ${errorMessage}`)
                    throw new Error(`Lỗi API OpenAI: ${response.status} - ${errorMessage}`)
                }

                const data = await response.json()

                if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
                    throw new Error('Phản hồi không hợp lệ từ API OpenAI')
                }

                const content = data.choices[0].message.content.trim()
                const totalDuration = Date.now() - startTime
                logger.info(
                    `OpenAI response generated (${content.length} chars) in ${totalDuration}ms`
                )

                return content
            } catch (error) {
                clearTimeout(timeoutId)
                const errorDuration = Date.now() - startTime
                if (error.name === 'AbortError') {
                    logger.error(`OpenAI API timeout after ${errorDuration}ms`)
                    throw new Error(
                        `Hết thời gian chờ API OpenAI - phản hồi mất quá nhiều thời gian (${errorDuration}ms)`
                    )
                }
                logger.error(
                    `Error generating OpenAI response after ${errorDuration}ms:`,
                    error.message,
                    error.stack
                )
                throw this.normalizeError(error)
            }
        } catch (error) {
            logger.error('Error generating OpenAI response:', error)
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
            throw new Error('OpenAI đã bị vô hiệu hóa')
        }

        if (!this.apiKey) {
            throw new Error('OpenAI API key chưa được cấu hình')
        }

        const startTime = Date.now()
        let totalChunks = 0

        try {
            // Build messages array
            const messages = this.buildMessages(prompt, context, systemPrompt)

            logger.debug(
                `Starting OpenAI streaming: ${this.baseUrl}/chat/completions with model: ${this.model}`
            )

            const controller = new AbortController()
            const timeoutId = setTimeout(() => {
                controller.abort()
                logger.warn('OpenAI streaming timeout after 180s')
            }, 180000) // 180s timeout for streaming

            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                signal: controller.signal,
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    temperature: this.temperature,
                    max_tokens: this.maxTokens,
                    stream: true,
                }),
            })

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
                logger.error(`OpenAI streaming API error: ${response.status} - ${errorMessage}`)
                throw new Error(`Lỗi API OpenAI: ${response.status} - ${errorMessage}`)
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

                    // Process complete SSE lines
                    const lines = buffer.split('\n')
                    buffer = lines.pop() || '' // Keep incomplete line in buffer

                    for (const line of lines) {
                        const trimmedLine = line.trim()
                        if (!trimmedLine || trimmedLine === 'data: [DONE]') {
                            if (trimmedLine === 'data: [DONE]') {
                                const duration = Date.now() - startTime
                                logger.info(
                                    `OpenAI streaming completed: ${totalChunks} chunks in ${duration}ms`
                                )
                                return
                            }
                            continue
                        }

                        // OpenAI streaming format: "data: {...}"
                        if (trimmedLine.startsWith('data: ')) {
                            try {
                                const jsonStr = trimmedLine.substring(6) // Remove "data: " prefix
                                const data = JSON.parse(jsonStr)

                                // Extract content from delta
                                if (data.choices && data.choices[0] && data.choices[0].delta) {
                                    const delta = data.choices[0].delta
                                    if (delta.content) {
                                        totalChunks++
                                        yield delta.content
                                    }
                                }

                                // Check if done
                                if (data.choices && data.choices[0] && data.choices[0].finish_reason) {
                                    const duration = Date.now() - startTime
                                    logger.info(
                                        `OpenAI streaming completed: ${totalChunks} chunks in ${duration}ms`
                                    )
                                    return
                                }
                            } catch (parseError) {
                                // Skip invalid JSON lines (common in streaming)
                                logger.debug(
                                    `Skipping invalid JSON line in OpenAI stream: ${trimmedLine.substring(0, 50)}`
                                )
                            }
                        }
                    }
                }

                const duration = Date.now() - startTime
                logger.info(
                    `OpenAI streaming finished: ${totalChunks} chunks in ${duration}ms`
                )
            } finally {
                reader.releaseLock()
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                const duration = Date.now() - startTime
                logger.error(`OpenAI streaming timeout after ${duration}ms`)
                throw new Error(
                    `Hết thời gian chờ OpenAI streaming - phản hồi mất quá nhiều thời gian (${duration}ms)`
                )
            }
            logger.error('Error in OpenAI stream:', error)
            throw this.normalizeError(error)
        }
    }

    /**
     * Normalize OpenAI errors
     * @param {Error} error - Original error
     * @returns {Error} Normalized error
     */
    normalizeError(error) {
        // OpenAI API errors are usually well-formed
        // Just ensure we have a proper error message
        if (error.message && error.message.includes('OpenAI')) {
            return error
        }
        return new Error(`Lỗi OpenAI: ${error.message || 'Unknown error'}`)
    }

    /**
     * Get OpenAI provider status
     * @returns {Promise<Object>} Provider status
     */
    async getStatus() {
        try {
            const isHealthy = await this.checkHealth()

            return {
                provider: 'openai',
                enabled: this.enabled,
                available: isHealthy,
                model: this.model,
                temperature: this.temperature,
                maxTokens: this.maxTokens,
                hasApiKey: !!this.apiKey,
            }
        } catch (error) {
            logger.error('Error getting OpenAI status:', error)
            return {
                provider: 'openai',
                enabled: this.enabled,
                available: false,
                model: this.model,
                error: error.message,
                hasApiKey: !!this.apiKey,
            }
        }
    }
}
