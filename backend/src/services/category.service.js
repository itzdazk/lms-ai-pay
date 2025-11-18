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

    /**
     * Get all categories with filters
     */
    async getCategories(filters) {
        const { page, limit, parentId, isActive, search } = filters

        const skip = (page - 1) * limit

        // Build where clause
        const where = {}

        if (parentId !== undefined) {
            where.parentId = parentId
        }

        if (isActive !== undefined) {
            where.isActive = isActive
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ]
        }

        // Get categories with children count
        const [categories, total] = await Promise.all([
            prisma.category.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
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
                            isActive: true,
                        },
                        where: { isActive: true },
                        orderBy: { sortOrder: 'asc' },
                    },
                    _count: {
                        select: {
                            courses: {
                                where: {
                                    status: COURSE_STATUS.PUBLISHED,
                                },
                            },
                        },
                    },
                },
            }),
            prisma.category.count({ where }),
        ])

        // Format response
        const formattedCategories = categories.map((category) => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            imageUrl: category.imageUrl,
            sortOrder: category.sortOrder,
            isActive: category.isActive,
            parent: category.parent,
            children: category.children,
            coursesCount: category._count.courses,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
        }))

        logger.info(`Retrieved ${categories.length} categories`)

        return {
            categories: formattedCategories,
            total,
        }
    }

    /**
     * Get category by ID
     */
    async getCategoryById(categoryId) {
        const category = await prisma.category.findUnique({
            where: { id: categoryId },
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
                        imageUrl: true,
                        isActive: true,
                    },
                    where: { isActive: true },
                    orderBy: { sortOrder: 'asc' },
                },
                _count: {
                    select: {
                        courses: {
                            where: {
                                status: COURSE_STATUS.PUBLISHED,
                            },
                        },
                    },
                },
            },
        })

        if (!category) {
            throw new Error('Category not found')
        }

        return {
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            imageUrl: category.imageUrl,
            sortOrder: category.sortOrder,
            isActive: category.isActive,
            parent: category.parent,
            children: category.children,
            coursesCount: category._count.courses,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
        }
    }

    /**
     * Get courses by category ID
     */
    async getCoursesByCategory(categoryId, filters) {
        const { page, limit, level, sort } = filters

        const skip = (page - 1) * limit

        // Check if category exists
        const category = await prisma.category.findUnique({
            where: { id: categoryId },
        })

        if (!category) {
            throw new Error('Category not found')
        }

        // Build where clause
        const where = {
            categoryId,
            status: COURSE_STATUS.PUBLISHED,
        }

        if (level) {
            where.level = level
        }

        // Build orderBy clause
        let orderBy = {}
        switch (sort) {
            case 'popular':
                orderBy = { enrolledCount: 'desc' }
                break
            case 'rating':
                orderBy = { ratingAvg: 'desc' }
                break
            case 'price_asc':
                orderBy = { price: 'asc' }
                break
            case 'price_desc':
                orderBy = { price: 'desc' }
                break
            case 'newest':
            default:
                orderBy = { publishedAt: 'desc' }
        }

        const [courses, total] = await Promise.all([
            prisma.course.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    shortDescription: true,
                    thumbnailUrl: true,
                    price: true,
                    discountPrice: true,
                    level: true,
                    durationHours: true,
                    totalLessons: true,
                    ratingAvg: true,
                    ratingCount: true,
                    enrolledCount: true,
                    isFeatured: true,
                    publishedAt: true,
                    instructor: {
                        select: {
                            id: true,
                            userName: true,
                            fullName: true,
                            avatarUrl: true,
                        },
                    },
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                },
            }),
            prisma.course.count({ where }),
        ])

        logger.info(
            `Retrieved ${courses.length} courses for category ${categoryId}`
        )

        return {
            courses,
            total,
            category: {
                id: category.id,
                name: category.name,
                slug: category.slug,
            },
        }
    }

    /**
     * Get courses by category slug
     */
    async getCoursesByCategorySlug(slug, filters) {
        // Find category by slug
        const category = await prisma.category.findUnique({
            where: { slug },
            select: { id: true, name: true, slug: true },
        })

        if (!category) {
            throw new Error('Category not found')
        }

        // Reuse getCoursesByCategory method
        return await this.getCoursesByCategory(category.id, filters)
    }
}

export default new CategoryService()
