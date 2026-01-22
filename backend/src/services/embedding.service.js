// src/services/embedding.service.js
import config from '../config/app.config.js'
import logger from '../config/logger.config.js'

class EmbeddingService {
    constructor() {
        // Check if OpenAI is configured
        if (config.OPENAI_API_KEY) {
            // Dynamic import OpenAI to avoid errors if not installed
            import('openai').then((module) => {
                const OpenAI = module.default
                this.openai = new OpenAI({
                    apiKey: config.OPENAI_API_KEY,
                })
            }).catch((err) => {
                logger.warn('OpenAI package not available, using Ollama only')
            })
            this.provider = 'openai'
            this.model = config.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'
            this.dimensions = 1536 // text-embedding-3-small
            logger.info(`Embedding service initialized with OpenAI: ${this.model}`)
        }
        // Check if Ollama is enabled
        else if (config.OLLAMA_ENABLED) {
            this.provider = 'ollama'
            this.baseUrl = config.OLLAMA_BASE_URL || 'http://localhost:11434'
            this.model = config.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text'
            
            // Map dimensions based on model
            const dimensionMap = {
                'nomic-embed-text': 768,
                'mxbai-embed-large': 1024,
                'all-minilm': 384,
            }
            this.dimensions = dimensionMap[this.model] || 768
            
            logger.info(
                `Embedding service initialized with Ollama: model=${this.model}, dimensions=${this.dimensions}`
            )
        } else {
            throw new Error(
                'No embedding provider configured. Set OPENAI_API_KEY or OLLAMA_ENABLED=true'
            )
        }
    }

    /**
     * Generate embedding for text
     * @param {string} text - Text to embed
     * @returns {Promise<number[]>} Embedding vector
     */
    async generateEmbedding(text) {
        if (!text || text.trim().length === 0) {
            throw new Error('Text cannot be empty')
        }

        try {
            if (this.provider === 'openai') {
                return await this._generateOpenAIEmbedding(text)
            } else if (this.provider === 'ollama') {
                return await this._generateOllamaEmbedding(text)
            }
        } catch (error) {
            logger.error('Error generating embedding:', error)
            throw error
        }
    }

    /**
     * Generate OpenAI embedding
     */
    async _generateOpenAIEmbedding(text) {
        if (!this.openai) {
            throw new Error('OpenAI client not initialized')
        }

        const response = await this.openai.embeddings.create({
            model: this.model,
            input: text,
            dimensions: this.dimensions,
        })
        return response.data[0].embedding
    }

    /**
     * Generate Ollama embedding
     * LƯU Ý: Cần đảm bảo embedding model đã được pull trước
     * Ví dụ: ollama pull nomic-embed-text
     */
    async _generateOllamaEmbedding(text) {
        try {
            const response = await fetch(`${this.baseUrl}/api/embeddings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.model,
                    prompt: text,
                }),
            })

            if (!response.ok) {
                const errorText = await response.text()
                // Check if model not found
                if (response.status === 404 || errorText.includes('model')) {
                    throw new Error(
                        `Ollama embedding model "${this.model}" not found. ` +
                        `Please run: ollama pull ${this.model}`
                    )
                }
                throw new Error(
                    `Ollama embedding failed: ${response.statusText} - ${errorText}`
                )
            }

            const data = await response.json()

            if (!data.embedding || !Array.isArray(data.embedding)) {
                throw new Error('Invalid embedding response from Ollama')
            }

            // Verify dimension
            if (data.embedding.length !== this.dimensions) {
                logger.warn(
                    `Embedding dimension mismatch: expected ${this.dimensions}, got ${data.embedding.length}`
                )
            }

            return data.embedding
        } catch (error) {
            logger.error(`Error generating Ollama embedding with model ${this.model}:`, error)
            throw error
        }
    }

    /**
     * Generate embedding for course (combine multiple fields)
     * @param {Object} course - Course object
     * @returns {Promise<number[]>} Embedding vector
     */
    async generateCourseEmbedding(course) {
        // Combine relevant fields for embedding
        const text = [
            course.title || '',
            course.shortDescription || '',
            course.description || '',
            course.whatYouLearn || '',
            course.courseObjectives || '',
            course.targetAudience || '',
        ]
            .filter(Boolean)
            .join('\n')

        if (text.trim().length === 0) {
            throw new Error('Course has no text content to embed')
        }

        return await this.generateEmbedding(text)
    }

    /**
     * Batch generate embeddings
     * @param {string[]} texts - Array of texts to embed
     * @param {number} batchSize - Batch size (default: 10 for Ollama, 100 for OpenAI)
     * @returns {Promise<number[][]>} Array of embedding vectors
     */
    async generateBatchEmbeddings(texts, batchSize = null) {
        const defaultBatchSize = this.provider === 'openai' ? 100 : 10
        const size = batchSize || defaultBatchSize

        const embeddings = []
        for (let i = 0; i < texts.length; i += size) {
            const batch = texts.slice(i, i + size)
            const batchEmbeddings = await Promise.all(
                batch.map((text) => this.generateEmbedding(text))
            )
            embeddings.push(...batchEmbeddings)

            // Rate limiting: wait between batches (especially for Ollama)
            if (i + size < texts.length && this.provider === 'ollama') {
                await new Promise((resolve) => setTimeout(resolve, 100)) // 100ms delay
            }
        }
        return embeddings
    }

    /**
     * Get embedding dimensions
     * @returns {number} Dimension count
     */
    getDimensions() {
        return this.dimensions
    }

    /**
     * Get embedding model name
     * @returns {string} Model name
     */
    getModel() {
        return this.model
    }

    /**
     * Get provider name
     * @returns {string} Provider name ('openai' or 'ollama')
     */
    getProvider() {
        return this.provider
    }
}

export default new EmbeddingService()
