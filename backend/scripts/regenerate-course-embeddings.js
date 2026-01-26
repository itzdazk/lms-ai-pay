// scripts/regenerate-course-embeddings.js
// Script để regenerate embeddings cho tất cả courses

import { PrismaClient } from '@prisma/client'
import embeddingService from '../src/services/embedding.service.js'
import logger from '../src/config/logger.config.js'
import config from '../src/config/app.config.js'

const prisma = new PrismaClient()

async function regenerateEmbeddings() {
    try {
        console.log('🚀 Starting embedding regeneration...')
        console.log(`📊 RAG Enabled: ${config.RAG_ENABLED}`)
        console.log(`🤖 Embedding Model: ${config.OLLAMA_EMBEDDING_MODEL}`)
        console.log(`📐 Dimensions: ${embeddingService.getDimensions()}`)
        console.log('')

        // Check if RAG is enabled
        if (config.RAG_ENABLED === false) {
            console.warn('⚠️  RAG is disabled. Set RAG_ENABLED=true in .env to enable embeddings.')
            process.exit(1)
        }

        // Check if Ollama is enabled
        if (config.OLLAMA_ENABLED === false) {
            console.error('❌ Ollama is disabled. Set OLLAMA_ENABLED=true in .env')
            process.exit(1)
        }

        // Get all published courses
        const courses = await prisma.course.findMany({
            where: {
                status: 'PUBLISHED',
            },
            include: {
                category: true,
                courseTags: {
                    include: {
                        tag: true,
                    },
                },
            },
            orderBy: {
                id: 'asc',
            },
        })

        console.log(`📚 Found ${courses.length} published courses`)
        console.log('')

        if (courses.length === 0) {
            console.log('ℹ️  No courses to process. Exiting.')
            process.exit(0)
        }

        let successCount = 0
        let skipCount = 0
        let errorCount = 0

        // Process each course
        for (let i = 0; i < courses.length; i++) {
            const course = courses[i]
            const progress = `[${i + 1}/${courses.length}]`

            try {
                // Check if course has content
                const hasContent =
                    course.title ||
                    course.shortDescription ||
                    course.description ||
                    course.whatYouLearn

                if (!hasContent) {
                    console.log(`${progress} ⏭️  Skipping course ${course.id}: "${course.title}" (no content)`)
                    skipCount++
                    continue
                }

                console.log(`${progress} 🔄 Processing course ${course.id}: "${course.title}"`)

                // Generate embedding
                const embedding = await embeddingService.generateCourseEmbedding(course)
                const embeddingString = `[${embedding.join(',')}]`
                const model = embeddingService.getModel()

                // Update database
                await prisma.$executeRaw`
                    UPDATE courses
                    SET 
                        embedding = ${embeddingString}::vector,
                        embedding_model = ${model},
                        embedding_updated_at = NOW()
                    WHERE id = ${course.id}
                `

                console.log(`${progress} ✅ Generated embedding for course ${course.id}: "${course.title}"`)
                successCount++

                // Rate limiting: wait 100ms between courses
                if (i < courses.length - 1) {
                    await new Promise((resolve) => setTimeout(resolve, 100))
                }
            } catch (error) {
                console.error(
                    `${progress} ❌ Error processing course ${course.id}: "${course.title}"`,
                    error.message
                )
                errorCount++
            }
        }

        console.log('')
        console.log('='.repeat(50))
        console.log('📊 Summary:')
        console.log(`✅ Success: ${successCount}`)
        console.log(`⏭️  Skipped: ${skipCount}`)
        console.log(`❌ Errors: ${errorCount}`)
        console.log(`📚 Total: ${courses.length}`)
        console.log('='.repeat(50))
    } catch (error) {
        console.error('❌ Fatal error:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

// Run script
regenerateEmbeddings()
    .then(() => {
        console.log('')
        console.log('✅ Embedding regeneration completed!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('❌ Script failed:', error)
        process.exit(1)
    })
