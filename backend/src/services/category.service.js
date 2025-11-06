// src/services/category.service.js
import { prisma } from '../config/database.config.js'
import { COURSE_STATUS } from '../config/constants.js'
import logger from '../config/logger.config.js'

class CategoryService {
    /**
     * Create new category
     */
    async createCategory(data) {
        const {
            name,
            slug,
            description,
            imageUrl,
            parentId,
            sortOrder,
            isActive,
        } = data

        // Check if slug already exists
        const existingCategory = await prisma.category.findUnique({
            where: { slug },
        })

        if (existingCategory) {
            throw new Error('Category with this slug already exists')
        }

        // If parentId is provided, check if parent exists
        if (parentId) {
            const parentCategory = await prisma.category.findUnique({
                where: { id: parentId },
            })

            if (!parentCategory) {
                throw new Error('Parent category not found')
            }
        }

        const category = await prisma.category.create({
            data: {
                name,
                slug,
                description,
                imageUrl,
                parentId,
                sortOrder,
                isActive,
            },
            include: {
                parent: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
        })

        logger.info(`Category created: ${category.name} (ID: ${category.id})`)

        return category
    }
}

export default new CategoryService()
