// src/services/vector-search.service.js
import { prisma } from '../config/database.config.js'
import embeddingService from './embedding.service.js'
import logger from '../config/logger.config.js'
import config from '../config/app.config.js'

class VectorSearchService {
    /**
     * Search courses using vector similarity
     * @param {string} query - User query
     * @param {Object} options - Search options
     * @returns {Promise<Array>} Similar courses with similarity scores
     */
    async searchCoursesByVector(query, options = {}) {
        const {
            limit = 20,
            threshold = config.RAG_SIMILARITY_THRESHOLD || 0.7, // Minimum similarity score (0-1)
            status = 'PUBLISHED', // Use uppercase to match database values
        } = options

        try {
            // 1. Generate embedding for query
            const queryEmbedding = await embeddingService.generateEmbedding(query)
            const dimensions = embeddingService.getDimensions()

            // 2. Convert to PostgreSQL array format
            const embeddingString = `[${queryEmbedding.join(',')}]`

            // 3. Vector similarity search using cosine distance
            // Note: This requires pgvector extension to be installed
            // If embedding is TEXT (not vector type), this will fail and return empty array
            // <=> is cosine distance operator (lower = more similar)
            // 1 - (embedding <=> query) gives similarity score (higher = more similar)
            // Note: Don't select embedding column (vector type) as Prisma can't deserialize it
            const courses = await prisma.$queryRaw`
                SELECT 
                    c.id,
                    c.title,
                    c.slug,
                    c.description,
                    c.short_description as "shortDescription",
                    c.thumbnail_url as "thumbnailUrl",
                    c.video_preview_url as "videoPreviewUrl",
                    c.video_preview_duration as "videoPreviewDuration",
                    c.price,
                    c.discount_price as "discountPrice",
                    c.instructor_id as "instructorId",
                    c.category_id as "categoryId",
                    c.level,
                    c.duration_hours as "durationHours",
                    c.total_lessons as "totalLessons",
                    c.language,
                    c.requirements,
                    c.what_you_learn as "whatYouLearn",
                    c.course_objectives as "courseObjectives",
                    c.target_audience as "targetAudience",
                    c.status,
                    c.is_featured as "isFeatured",
                    c.rating_avg as "ratingAvg",
                    c.rating_count as "ratingCount",
                    c.enrolled_count as "enrolledCount",
                    c.views_count as "viewsCount",
                    c.completion_rate as "completionRate",
                    c.published_at as "publishedAt",
                    c.created_at as "createdAt",
                    c.updated_at as "updatedAt",
                    1 - (c.embedding::vector <=> ${embeddingString}::vector) as similarity
                FROM courses c
                WHERE 
                    c.status = ${status}
                    AND c.embedding IS NOT NULL
                    AND (1 - (c.embedding::vector <=> ${embeddingString}::vector)) >= ${threshold}
                ORDER BY c.embedding::vector <=> ${embeddingString}::vector
                LIMIT ${limit}
            `

            logger.info(
                `Vector search: Found ${courses.length} courses for query: "${query.substring(0, 50)}" (threshold: ${threshold})`
            )

            // Convert Decimal to Number and format results
            return courses.map((course) => ({
                ...course,
                similarity: parseFloat(course.similarity),
                // Ensure numeric fields are properly converted
                ratingAvg: course.ratingAvg ? parseFloat(course.ratingAvg) : 0,
                price: course.price ? parseFloat(course.price) : 0,
                discountPrice: course.discountPrice
                    ? parseFloat(course.discountPrice)
                    : null,
            }))
        } catch (error) {
            logger.error('Error in vector search:', error)
            // If pgvector extension not installed or embedding column missing, return empty
            if (
                error.message?.includes('vector') ||
                error.message?.includes('embedding') ||
                error.message?.includes('operator does not exist')
            ) {
                logger.warn(
                    'Vector search failed - pgvector may not be installed or embedding column missing'
                )
                return []
            }
            throw error
        }
    }

    /**
     * Hybrid search: Combine vector search + keyword search
     * @param {string} query - User query
     * @param {Object} options - Search options
     * @returns {Promise<Array>} Combined results with weighted scores
     */
    async hybridSearch(query, options = {}) {
        const {
            vectorWeight = config.RAG_VECTOR_WEIGHT || 0.7,
            keywordWeight = config.RAG_KEYWORD_WEIGHT || 0.3,
            limit = 20,
        } = options

        try {
            // Import keyword search from knowledge-base service
            const knowledgeBaseService = (
                await import('./knowledge-base.service.js')
            ).default

            // Run both searches in parallel
            const [vectorResults, keywordResults] = await Promise.all([
                this.searchCoursesByVector(query, { ...options, limit: limit * 2 }), // Get more for ranking
                knowledgeBaseService.searchCoursesByQuery(query, {
                    published: false,
                    limit: limit * 2,
                }),
            ])

            logger.debug(
                `Hybrid search: Vector=${vectorResults.length} results, Keyword=${keywordResults.length} results`
            )

            // Combine and re-rank results
            const combined = this._combineResults(
                vectorResults,
                keywordResults,
                vectorWeight,
                keywordWeight,
                limit
            )

            return combined
        } catch (error) {
            logger.error('Error in hybrid search:', error)
            // Fallback to vector search only
            return await this.searchCoursesByVector(query, options)
        }
    }

    /**
     * Combine vector and keyword results with weighted scoring
     * @private
     */
    _combineResults(vectorResults, keywordResults, vectorWeight, keywordWeight, limit) {
        const courseMap = new Map()

        // Add vector results with normalized score
        const maxVectorScore = vectorResults.length > 0 ? 1.0 : 1.0
        vectorResults.forEach((course, index) => {
            // Use similarity score from vector search, normalized by position
            const positionPenalty = index / vectorResults.length * 0.1 // Small penalty for lower rank
            const score = (course.similarity || (1 - positionPenalty)) * vectorWeight
            courseMap.set(course.id, {
                course,
                vectorScore: score,
                keywordScore: 0,
                vectorSimilarity: course.similarity || 0,
            })
        })

        // Add keyword results with normalized score
        keywordResults.forEach((course, index) => {
            const positionPenalty = index / keywordResults.length * 0.1
            const score = (1 - positionPenalty) * keywordWeight
            const existing = courseMap.get(course.id)
            if (existing) {
                existing.keywordScore = score
            } else {
                courseMap.set(course.id, {
                    course,
                    vectorScore: 0,
                    keywordScore: score,
                    vectorSimilarity: 0,
                })
            }
        })

        // Calculate final score and sort
        const combined = Array.from(courseMap.values())
            .map((item) => ({
                ...item.course,
                finalScore: item.vectorScore + item.keywordScore,
                vectorSimilarity: item.vectorSimilarity,
            }))
            .sort((a, b) => b.finalScore - a.finalScore)
            .slice(0, limit)

        logger.debug(
            `Hybrid search: Combined ${combined.length} results (top score: ${combined[0]?.finalScore?.toFixed(3)})`
        )

        return combined
    }

    /**
     * Check if vector search is available
     * @returns {Promise<boolean>} True if pgvector is installed and embeddings exist
     */
    async isAvailable() {
        try {
            // Check if extension exists and embedding column exists
            const result = await prisma.$queryRaw`
                SELECT 
                    EXISTS(
                        SELECT 1 FROM pg_extension WHERE extname = 'vector'
                    ) as has_extension,
                    EXISTS(
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'courses' AND column_name = 'embedding'
                    ) as has_column
            `
            const { has_extension, has_column } = result[0]
            return has_extension && has_column
        } catch (error) {
            logger.error('Error checking vector search availability:', error)
            return false
        }
    }
}

export default new VectorSearchService()
