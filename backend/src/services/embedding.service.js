// src/services/embedding.service.js
// LƯU Ý: Embedding service LUÔN LUÔN sử dụng Ollama, không phụ thuộc vào AI_PROVIDER
// AI_PROVIDER chỉ ảnh hưởng đến LLM (chat/completion), không ảnh hưởng embedding
import config from '../config/app.config.js'
import logger from '../config/logger.config.js'

class EmbeddingService {
    constructor() {
        // Embedding LUÔN LUÔN dùng Ollama (không phụ thuộc vào AI_PROVIDER)
        if (!config.OLLAMA_ENABLED) {
            throw new Error(
                'Ollama must be enabled for embedding service. Set OLLAMA_ENABLED=true'
            )
        }

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
            `Embedding service initialized with Ollama (always): model=${this.model}, dimensions=${this.dimensions}`
        )
    }

    /**
     * Generate embedding for text
     * LƯU Ý: Luôn sử dụng Ollama, không phụ thuộc vào AI_PROVIDER
     * @param {string} text - Text to embed
     * @returns {Promise<number[]>} Embedding vector
     */
    async generateEmbedding(text) {
        if (!text || text.trim().length === 0) {
            throw new Error('Text cannot be empty')
        }

        try {
            // Embedding luôn dùng Ollama
            return await this._generateOllamaEmbedding(text)
        } catch (error) {
            logger.error('Error generating embedding:', error)
            throw error
        }
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
        // Map level thành synonyms để semantic search tốt hơn
        const levelSynonyms = {
            'BEGINNER': 'cơ bản, mới bắt đầu, beginner, starter, người mới',
            'INTERMEDIATE': 'trung cấp, intermediate, nâng cao cơ bản, có kinh nghiệm',
            'ADVANCED': 'nâng cao, advanced, chuyên sâu, expert, cao cấp',
        }
        const levelText = course.level ? (levelSynonyms[course.level] || course.level) : ''

        // Combine tags
        const tagsText = course.courseTags?.map(ct => ct.tag?.name || ct.tag).filter(Boolean).join(', ') || ''

        // Category info
        const categoryName = course.category?.name || ''
        const categoryDesc = course.category?.description || ''

        // Price info (miễn phí/có phí)
        const priceText = course.price && Number(course.price) > 0 
            ? 'khóa học có phí, trả phí, paid course' 
            : 'khóa học miễn phí, free course, không mất phí'

        // Combine relevant fields for embedding
        const text = [
            course.title || '',
            course.shortDescription || '',
            course.description || '',
            course.whatYouLearn || '',
            course.courseObjectives || '',
            course.targetAudience || '',
            categoryName,                    // ✅ THÊM: Category name
            categoryDesc,                   // ✅ THÊM: Category description
            tagsText,                       // ✅ THÊM: Tags (comma-separated)
            levelText,                      // ✅ THÊM: Level với synonyms
            priceText,                      // ✅ THÊM: Price info (miễn phí/có phí)
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
     * @param {number} batchSize - Batch size (default: 10 for Ollama)
     * @returns {Promise<number[][]>} Array of embedding vectors
     */
    async generateBatchEmbeddings(texts, batchSize = null) {
        const defaultBatchSize = 10 // Ollama batch size
        const size = batchSize || defaultBatchSize

        const embeddings = []
        for (let i = 0; i < texts.length; i += size) {
            const batch = texts.slice(i, i + size)
            const batchEmbeddings = await Promise.all(
                batch.map((text) => this.generateEmbedding(text))
            )
            embeddings.push(...batchEmbeddings)

            // Rate limiting: wait between batches for Ollama
            if (i + size < texts.length) {
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
     * @returns {string} Provider name (always 'ollama')
     */
    getProvider() {
        return this.provider // Always 'ollama'
    }
}

export default new EmbeddingService()
