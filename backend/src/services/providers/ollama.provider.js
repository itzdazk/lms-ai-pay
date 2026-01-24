// src/services/providers/ollama.provider.js
import { BaseProvider } from './base.provider.js'
import logger from '../../config/logger.config.js'

/**
 * Ollama Provider - Implementation for Ollama LLM
 */
export class OllamaProvider extends BaseProvider {
    constructor(config) {
        super({
            ...config,
            providerName: 'ollama',
        })
        this.baseUrl = config.baseUrl || 'http://localhost:11434'
        this.model = config.model || 'llama3.1:latest'
        this.temperature = config.temperature || 0.7
        this.maxTokens = config.maxTokens || 2000
    }

    /**
     * Check if Ollama is available
     * @returns {Promise<boolean>}
     */
    async checkHealth() {
        if (!this.enabled) {
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

            // Add timeout to prevent hanging
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 3000) // 3s timeout

            const response = await fetch(`${this.baseUrl}/api/tags`, {
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
                logger.warn('Ollama health check timeout')
            } else {
                logger.warn('Ollama health check failed:', error.message)
            }
            this.healthCheckCache = {
                isHealthy: false,
                lastCheck: Date.now(),
            }
            return false
        }
    }

    /**
     * Generate response using Ollama chat API
     * @param {string} prompt - User message
     * @param {Array} context - Conversation context (messages history)
     * @param {string|null} systemPrompt - System prompt with knowledge base context
     * @returns {Promise<string>} AI response
     */
    async generateResponse(prompt, context = [], systemPrompt = null) {
        if (!this.enabled) {
            throw new Error('Ollama đã bị vô hiệu hóa')
        }

        try {
            // Build messages array
            const messages = this.buildMessages(prompt, context, systemPrompt)

            // Call Ollama API with timeout
            logger.debug(
                `Calling Ollama API: ${this.baseUrl}/api/chat with model: ${this.model}`
            )
            const startTime = Date.now()

            const controller = new AbortController()
            // Increase timeout to 120s for complex queries (llama3.1 can be slow)
            const timeoutId = setTimeout(() => controller.abort(), 120000) // 120s timeout for generation

            try {
                const response = await fetch(`${this.baseUrl}/api/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    signal: controller.signal,
                    body: JSON.stringify({
                        model: this.model,
                        messages: messages,
                        stream: false,
                        options: {
                            temperature: this.temperature,
                            num_predict: this.maxTokens,
                        },
                    }),
                })

                clearTimeout(timeoutId)

                const duration = Date.now() - startTime
                logger.info(`Ollama API call completed in ${duration}ms`)

                if (!response.ok) {
                    const errorText = await response.text()
                    logger.error(
                        `Ollama API error: ${response.status} - ${errorText}`
                    )
                    throw new Error(
                        `Lỗi API Ollama: ${response.status} - ${errorText}`
                    )
                }

                const data = await response.json()

                if (!data.message || !data.message.content) {
                    throw new Error('Phản hồi không hợp lệ từ API Ollama')
                }

                const totalDuration = Date.now() - startTime
                logger.info(
                    `Ollama response generated (${data.message.content.length} chars) in ${totalDuration}ms`
                )

                return data.message.content.trim()
            } catch (error) {
                clearTimeout(timeoutId)
                const errorDuration = Date.now() - startTime
                if (error.name === 'AbortError') {
                    logger.error(
                        `Ollama API timeout after ${errorDuration}ms`
                    )
                    throw new Error(
                        `Hết thời gian chờ API Ollama - phản hồi mất quá nhiều thời gian (${errorDuration}ms)`
                    )
                }
                logger.error(
                    `Error generating Ollama response after ${errorDuration}ms:`,
                    error.message,
                    error.stack
                )
                throw this.normalizeError(error)
            }
        } catch (error) {
            logger.error('Error generating Ollama response:', error)
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
            throw new Error('Ollama đã bị vô hiệu hóa')
        }

        const startTime = Date.now()
        let totalChunks = 0
        let buffer = ''

        try {
            // Build messages array
            const messages = this.buildMessages(prompt, context, systemPrompt)

            logger.debug(
                `Starting Ollama streaming: ${this.baseUrl}/api/chat with model: ${this.model}`
            )

            // Add timeout for streaming (longer than non-streaming)
            const controller = new AbortController()
            const timeoutId = setTimeout(() => {
                controller.abort()
                logger.warn('Ollama streaming timeout after 180s')
            }, 180000) // 180s timeout for streaming

            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: controller.signal,
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    stream: true,
                    options: {
                        temperature: this.temperature,
                        num_predict: this.maxTokens,
                    },
                }),
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                const errorText = await response.text()
                logger.error(
                    `Ollama streaming API error: ${response.status} - ${errorText}`
                )
                throw new Error(
                    `Lỗi API Ollama: ${response.status} - ${errorText}`
                )
            }

            const reader = response.body.getReader()
            const decoder = new TextDecoder()

            try {
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    // Decode chunk and add to buffer (handle partial JSON)
                    buffer += decoder.decode(value, { stream: true })

                    // Process complete lines
                    const lines = buffer.split('\n')
                    buffer = lines.pop() || '' // Keep incomplete line in buffer

                    for (const line of lines) {
                        const trimmedLine = line.trim()
                        if (!trimmedLine) continue

                        try {
                            // Ollama streaming format: JSON per line
                            const data = JSON.parse(trimmedLine)

                            if (data.message && data.message.content) {
                                const content = data.message.content
                                totalChunks++
                                yield content
                            }

                            // Check if done
                            if (data.done === true) {
                                const duration = Date.now() - startTime
                                logger.info(
                                    `Ollama streaming completed: ${totalChunks} chunks in ${duration}ms`
                                )
                                return
                            }
                        } catch (parseError) {
                            // Skip invalid JSON lines (common in streaming)
                            logger.debug(
                                `Skipping invalid JSON line in stream: ${trimmedLine.substring(0, 50)}`
                            )
                        }
                    }
                }

                // Process remaining buffer
                if (buffer.trim()) {
                    try {
                        const data = JSON.parse(buffer.trim())
                        if (data.message && data.message.content) {
                            yield data.message.content
                        }
                    } catch (e) {
                        // Ignore parse errors for remaining buffer
                    }
                }

                const duration = Date.now() - startTime
                logger.info(
                    `Ollama streaming finished: ${totalChunks} chunks in ${duration}ms`
                )
            } finally {
                reader.releaseLock()
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                const duration = Date.now() - startTime
                logger.error(`Ollama streaming timeout after ${duration}ms`)
                throw new Error(
                    `Hết thời gian chờ Ollama streaming - phản hồi mất quá nhiều thời gian (${duration}ms)`
                )
            }
            logger.error('Error in Ollama stream:', error)
            throw this.normalizeError(error)
        }
    }

    /**
     * Get list of available models from Ollama
     * @returns {Promise<Array>} List of models
     */
    async getAvailableModels() {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`)
            if (!response.ok) {
                throw new Error(`Lỗi API Ollama: ${response.status}`)
            }
            const data = await response.json()
            return data.models || []
        } catch (error) {
            logger.error('Error fetching Ollama models:', error)
            throw error
        }
    }

    /**
     * Get Ollama provider status
     * @returns {Promise<Object>} Provider status
     */
    async getStatus() {
        try {
            const isHealthy = await this.checkHealth()
            const models = isHealthy ? await this.getAvailableModels() : []

            return {
                provider: 'ollama',
                enabled: this.enabled,
                available: isHealthy,
                baseUrl: this.baseUrl,
                model: this.model,
                temperature: this.temperature,
                maxTokens: this.maxTokens,
                models: models.map((m) => ({
                    name: m.name || m.model,
                    size: m.size,
                    modifiedAt: m.modified_at,
                })),
            }
        } catch (error) {
            logger.error('Error getting Ollama status:', error)
            return {
                provider: 'ollama',
                enabled: this.enabled,
                available: false,
                baseUrl: this.baseUrl,
                model: this.model,
                error: error.message,
            }
        }
    }
}
