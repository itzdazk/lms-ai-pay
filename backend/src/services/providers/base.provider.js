// src/services/providers/base.provider.js
import logger from '../../config/logger.config.js'

/**
 * Base Provider Class - Abstract class for all LLM providers
 * All providers must extend this class and implement required methods
 */
export class BaseProvider {
    constructor(config) {
        this.config = config
        this.enabled = config.enabled !== false
        this.providerName = config.providerName || 'unknown'
        this.healthCheckCache = { isHealthy: null, lastCheck: 0 }
        this.healthCheckCacheTTL = 30000 // 30 seconds

        if (this.enabled) {
            logger.info(
                `${this.providerName} provider initialized`
            )
        }
    }

    /**
     * Check if provider is available
     * Must be implemented by each provider
     * @returns {Promise<boolean>}
     */
    async checkHealth() {
        throw new Error('checkHealth() must be implemented by provider')
    }

    /**
     * Generate response (non-streaming)
     * Must be implemented by each provider
     * @param {string} prompt - User message
     * @param {Array} context - Conversation context (messages history)
     * @param {string|null} systemPrompt - System prompt
     * @returns {Promise<string>} AI response
     */
    async generateResponse(prompt, context = [], systemPrompt = null) {
        throw new Error('generateResponse() must be implemented by provider')
    }

    /**
     * Generate response with streaming
     * Must be implemented by each provider
     * @param {string} prompt - User message
     * @param {Array} context - Conversation context (messages history)
     * @param {string|null} systemPrompt - System prompt
     * @returns {AsyncGenerator<string>} Streaming response chunks
     */
    async *generateResponseStream(prompt, context = [], systemPrompt = null) {
        throw new Error('generateResponseStream() must be implemented by provider')
    }

    /**
     * Get provider status
     * Can be overridden by providers for custom status
     * @returns {Promise<Object>} Provider status
     */
    async getStatus() {
        try {
            const isHealthy = await this.checkHealth()
            return {
                provider: this.providerName,
                enabled: this.enabled,
                available: isHealthy,
            }
        } catch (error) {
            logger.error(`Error getting ${this.providerName} status:`, error)
            return {
                provider: this.providerName,
                enabled: this.enabled,
                available: false,
                error: error.message,
            }
        }
    }

    /**
     * Build messages array from prompt, context, and systemPrompt
     * Common utility method for all providers
     * @param {string} prompt - User message
     * @param {Array} context - Conversation context
     * @param {string|null} systemPrompt - System prompt
     * @returns {Array} Messages array
     */
    buildMessages(prompt, context = [], systemPrompt = null) {
        const messages = []

        // Add system prompt if provided
        if (systemPrompt) {
            messages.push({
                role: 'system',
                content: systemPrompt,
            })
        }

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

        return messages
    }

    /**
     * Normalize error from provider-specific format to common format
     * Can be overridden by providers for custom error handling
     * @param {Error} error - Original error
     * @returns {Error} Normalized error
     */
    normalizeError(error) {
        // Default: return error as-is
        // Providers can override to normalize their specific error formats
        return error
    }
}
