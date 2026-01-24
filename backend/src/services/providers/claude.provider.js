// src/services/providers/claude.provider.js
import { BaseProvider } from './base.provider.js'
import logger from '../../config/logger.config.js'

/**
 * Anthropic Claude Provider - Implementation for Claude API
 */
export class ClaudeProvider extends BaseProvider {
    constructor(config) {
        super({
            ...config,
            providerName: 'claude',
        })
        this.apiKey = config.apiKey
        this.baseUrl = config.baseUrl || 'https://api.anthropic.com/v1'
        this.model = config.model || 'claude-3-5-haiku-20241022'
        this.temperature = config.temperature || 0.7
        this.maxTokens = config.maxTokens || 2000

        if (!this.apiKey) {
            logger.warn('Claude API key not provided')
        }
    }

    /**
     * Check if Claude is available
     * Claude doesn't have a dedicated health check endpoint, so we'll try a minimal API call
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

            // Try a minimal API call to check health (count tokens endpoint)
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout

            const response = await fetch(`${this.baseUrl}/messages/count_tokens`, {
                method: 'POST',
                headers: {
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json',
                },
                signal: controller.signal,
                body: JSON.stringify({
                    model: this.model,
                    messages: [{ role: 'user', content: 'test' }],
                }),
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
                logger.warn('Claude health check timeout')
            } else {
                logger.warn('Claude health check failed:', error.message)
            }
            this.healthCheckCache = {
                isHealthy: false,
                lastCheck: Date.now(),
            }
            return false
        }
    }

    /**
     * Build Claude messages format
     * Claude supports system messages in messages array or as separate system field
     * @param {string} prompt - User message
     * @param {Array} context - Conversation context
     * @param {string|null} systemPrompt - System prompt
     * @returns {Object} Claude request format
     */
    buildClaudeRequest(prompt, context = [], systemPrompt = null) {
        const messages = []

        // Add conversation history
        context.forEach((msg) => {
            messages.push({
                role: msg.senderType === 'user' ? 'user' : 'assistant',
                content: msg.message,
            })
        })

        // Add current user message
        messages.push({
            role: 'user',
            content: prompt,
        })

        const request = {
            model: this.model,
            messages: messages,
            max_tokens: this.maxTokens,
            temperature: this.temperature,
        }

        // Add system prompt if provided (Claude supports system field)
        if (systemPrompt) {
            request.system = systemPrompt
        }

        return request
    }

    /**
     * Generate response using Claude Messages API
     * @param {string} prompt - User message
     * @param {Array} context - Conversation context (messages history)
     * @param {string|null} systemPrompt - System prompt with knowledge base context
     * @returns {Promise<string>} AI response
     */
    async generateResponse(prompt, context = [], systemPrompt = null) {
        if (!this.enabled) {
            throw new Error('Claude đã bị vô hiệu hóa')
        }

        if (!this.apiKey) {
            throw new Error('Claude API key chưa được cấu hình')
        }

        try {
            // Build Claude request format
            const requestBody = this.buildClaudeRequest(prompt, context, systemPrompt)

            logger.debug(
                `Calling Claude API: ${this.baseUrl}/messages with model: ${this.model}`
            )
            const startTime = Date.now()

            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 120000) // 120s timeout

            try {
                const response = await fetch(`${this.baseUrl}/messages`, {
                    method: 'POST',
                    headers: {
                        'x-api-key': this.apiKey,
                        'anthropic-version': '2023-06-01',
                        'Content-Type': 'application/json',
                    },
                    signal: controller.signal,
                    body: JSON.stringify(requestBody),
                })

                clearTimeout(timeoutId)

                const duration = Date.now() - startTime
                logger.info(`Claude API call completed in ${duration}ms`)

                if (!response.ok) {
                    let errorData
                    try {
                        errorData = await response.json()
                    } catch {
                        const errorText = await response.text()
                        errorData = { error: { message: errorText } }
                    }
                    const errorMessage = errorData.error?.message || `HTTP ${response.status}`
                    logger.error(`Claude API error: ${response.status} - ${errorMessage}`)
                    throw new Error(`Lỗi API Claude: ${response.status} - ${errorMessage}`)
                }

                const data = await response.json()

                if (
                    !data.content ||
                    !Array.isArray(data.content) ||
                    !data.content[0] ||
                    !data.content[0].text
                ) {
                    throw new Error('Phản hồi không hợp lệ từ API Claude')
                }

                const content = data.content[0].text.trim()
                const totalDuration = Date.now() - startTime
                logger.info(
                    `Claude response generated (${content.length} chars) in ${totalDuration}ms`
                )

                return content
            } catch (error) {
                clearTimeout(timeoutId)
                const errorDuration = Date.now() - startTime
                if (error.name === 'AbortError') {
                    logger.error(`Claude API timeout after ${errorDuration}ms`)
                    throw new Error(
                        `Hết thời gian chờ API Claude - phản hồi mất quá nhiều thời gian (${errorDuration}ms)`
                    )
                }
                logger.error(
                    `Error generating Claude response after ${errorDuration}ms:`,
                    error.message,
                    error.stack
                )
                throw this.normalizeError(error)
            }
        } catch (error) {
            logger.error('Error generating Claude response:', error)
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
            throw new Error('Claude đã bị vô hiệu hóa')
        }

        if (!this.apiKey) {
            throw new Error('Claude API key chưa được cấu hình')
        }

        const startTime = Date.now()
        let totalChunks = 0

        try {
            // Build Claude request format
            const requestBody = this.buildClaudeRequest(prompt, context, systemPrompt)
            requestBody.stream = true

            logger.debug(
                `Starting Claude streaming: ${this.baseUrl}/messages with model: ${this.model}`
            )

            const controller = new AbortController()
            const timeoutId = setTimeout(() => {
                controller.abort()
                logger.warn('Claude streaming timeout after 180s')
            }, 180000) // 180s timeout for streaming

            const response = await fetch(`${this.baseUrl}/messages`, {
                method: 'POST',
                headers: {
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json',
                },
                signal: controller.signal,
                body: JSON.stringify(requestBody),
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
                logger.error(`Claude streaming API error: ${response.status} - ${errorMessage}`)
                throw new Error(`Lỗi API Claude: ${response.status} - ${errorMessage}`)
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
                        if (!trimmedLine) continue

                        // Claude streaming format: "event: {...}" or "data: {...}"
                        if (trimmedLine.startsWith('data: ')) {
                            try {
                                const jsonStr = trimmedLine.substring(6) // Remove "data: " prefix
                                const data = JSON.parse(jsonStr)

                                // Extract content from text_delta
                                if (data.type === 'content_block_delta' && data.delta && data.delta.text) {
                                    totalChunks++
                                    yield data.delta.text
                                }

                                // Check if done
                                if (data.type === 'message_stop') {
                                    const duration = Date.now() - startTime
                                    logger.info(
                                        `Claude streaming completed: ${totalChunks} chunks in ${duration}ms`
                                    )
                                    return
                                }
                            } catch (parseError) {
                                // Skip invalid JSON lines (common in streaming)
                                logger.debug(
                                    `Skipping invalid JSON line in Claude stream: ${trimmedLine.substring(0, 50)}`
                                )
                            }
                        }
                    }
                }

                const duration = Date.now() - startTime
                logger.info(
                    `Claude streaming finished: ${totalChunks} chunks in ${duration}ms`
                )
            } finally {
                reader.releaseLock()
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                const duration = Date.now() - startTime
                logger.error(`Claude streaming timeout after ${duration}ms`)
                throw new Error(
                    `Hết thời gian chờ Claude streaming - phản hồi mất quá nhiều thời gian (${duration}ms)`
                )
            }
            logger.error('Error in Claude stream:', error)
            throw this.normalizeError(error)
        }
    }

    /**
     * Normalize Claude errors
     * @param {Error} error - Original error
     * @returns {Error} Normalized error
     */
    normalizeError(error) {
        if (error.message && error.message.includes('Claude')) {
            return error
        }
        return new Error(`Lỗi Claude: ${error.message || 'Unknown error'}`)
    }

    /**
     * Get Claude provider status
     * @returns {Promise<Object>} Provider status
     */
    async getStatus() {
        try {
            const isHealthy = await this.checkHealth()

            return {
                provider: 'claude',
                enabled: this.enabled,
                available: isHealthy,
                model: this.model,
                temperature: this.temperature,
                maxTokens: this.maxTokens,
                hasApiKey: !!this.apiKey,
            }
        } catch (error) {
            logger.error('Error getting Claude status:', error)
            return {
                provider: 'claude',
                enabled: this.enabled,
                available: false,
                model: this.model,
                error: error.message,
                hasApiKey: !!this.apiKey,
            }
        }
    }
}
