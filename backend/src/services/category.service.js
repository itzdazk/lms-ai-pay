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

    /**
     * Update category
     */
    async updateCategory(categoryId, updateData) {
        // Check if category exists
        const existingCategory = await prisma.category.findUnique({
            where: { id: categoryId },
        })

        if (!existingCategory) {
            throw new Error('Category not found')
        }

        // If slug is being updated, check for uniqueness
        if (updateData.slug && updateData.slug !== existingCategory.slug) {
            const slugExists = await prisma.category.findUnique({
                where: { slug: updateData.slug },
            })

            if (slugExists) {
                throw new Error('Category with this slug already exists')
            }
        }

        // If parentId is being updated, validate
        if (updateData.parentId !== undefined) {
            // Prevent setting itself as parent
            if (updateData.parentId === categoryId) {
                throw new Error('Category cannot be its own parent')
            }

            // If parentId is not null, check if parent exists
            if (updateData.parentId !== null) {
                const parentCategory = await prisma.category.findUnique({
                    where: { id: updateData.parentId },
                })

                if (!parentCategory) {
                    throw new Error('Parent category not found')
                }

                // Prevent circular reference (child cannot become parent of its parent)
                if (parentCategory.parentId === categoryId) {
                    throw new Error('Circular reference not allowed')
                }
            }
        }

        const category = await prisma.category.update({
            where: { id: categoryId },
            data: updateData,
            include: {
                parent: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
                children: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
        })

        logger.info(`Category updated: ${category.name} (ID: ${category.id})`)

        return category
    }

    /**
     * Delete category
     */
    async deleteCategory(categoryId) {
        // Check if category exists
        const category = await prisma.category.findUnique({
            where: { id: categoryId },
            include: {
                _count: {
                    select: {
                        courses: true,
                        children: true,
                    },
                },
            },
        })

        if (!category) {
            throw new Error('Category not found')
        }

        // Check if category has courses
        if (category._count.courses > 0) {
            throw new Error(
                `Cannot delete category with ${category._count.courses} active courses. Please reassign courses first.`
            )
        }

        // Check if category has children
        if (category._count.children > 0) {
            throw new Error(
                `Cannot delete category with ${category._count.children} subcategories. Please delete subcategories first.`
            )
        }

        await prisma.category.delete({
            where: { id: categoryId },
        })

        logger.info(`Category deleted: ${category.name} (ID: ${category.id})`)

        return true
    }
}

export default new CategoryService()
