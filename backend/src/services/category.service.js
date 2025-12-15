// src/services/category.service.js
import { prisma } from '../config/database.config.js'
import { COURSE_STATUS, HTTP_STATUS } from '../config/constants.js'
import logger from '../config/logger.config.js'
import config from '../config/app.config.js'
import fs from 'fs/promises'
import path from 'path'

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
            const error = new Error('Category with this slug already exists')
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }

        // If parentId is provided, check if parent exists
        if (parentId) {
            const parentCategory = await prisma.category.findUnique({
                where: { id: parentId },
            })

            if (!parentCategory) {
                const error = new Error('Parent category not found')
                error.statusCode = HTTP_STATUS.BAD_REQUEST
                throw error
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
            const error = new Error('Category not found')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // If slug is being updated, check for uniqueness
        if (updateData.slug && updateData.slug !== existingCategory.slug) {
            const slugExists = await prisma.category.findUnique({
                where: { slug: updateData.slug },
            })

            if (slugExists) {
                const error = new Error(
                    'Category with this slug already exists'
                )
                error.statusCode = HTTP_STATUS.BAD_REQUEST
                throw error
            }
        }

        // If parentId is being updated, validate
        if (updateData.parentId !== undefined) {
            // Prevent setting itself as parent
            if (updateData.parentId === categoryId) {
                const error = new Error('Category cannot be its own parent')
                error.statusCode = HTTP_STATUS.BAD_REQUEST
                throw error
            }

            // If parentId is not null, check if parent exists
            if (updateData.parentId !== null) {
                const parentCategory = await prisma.category.findUnique({
                    where: { id: updateData.parentId },
                })

                if (!parentCategory) {
                    const error = new Error('Parent category not found')
                    error.statusCode = HTTP_STATUS.BAD_REQUEST
                    throw error
                }

                // Prevent circular reference (child cannot become parent of its parent)
                if (parentCategory.parentId === categoryId) {
                    const error = new Error('Circular reference not allowed')
                    error.statusCode = HTTP_STATUS.BAD_REQUEST
                    throw error
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
            const error = new Error('Category not found')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Check if category has courses
        if (category._count.courses > 0) {
            const error = new Error(
                `Không thể xóa danh mục khi đang có ${category._count.courses} khóa học đang hoạt động. Vui lòng phân bổ lại các khóa học trước.`
            )
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }

        // Check if category has children
        if (category._count.children > 0) {
            const error = new Error(
                `Không thể xóa danh mục có ${category._count.children} danh mục con. Vui lòng xóa danh mục con trước.`
            )
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
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
            const error = new Error('Category not found')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
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
            const error = new Error('Category not found')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
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
            const error = new Error('Category not found')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        // Reuse getCoursesByCategory method
        return await this.getCoursesByCategory(category.id, filters)
    }

    /**
     * Upload category image
     */
    async uploadCategoryImage(categoryId, file) {
        // Check if category exists
        const category = await prisma.category.findUnique({
            where: { id: categoryId },
        })

        if (!category) {
            const error = new Error('Category not found')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        try {
            // Delete old image if exists
            if (category.imageUrl) {
                const oldImagePath = path.join(
                    process.cwd(),
                    'uploads',
                    'categories',
                    path.basename(category.imageUrl)
                )
                await fs.unlink(oldImagePath).catch(() => {
                    // Ignore if file doesn't exist
                    logger.debug(`Old image file not found: ${oldImagePath}`)
                })
            }

            // Generate image URL
            const imageUrl = `/uploads/categories/${file.filename}`

            // Update category with new image URL
            const updatedCategory = await prisma.category.update({
                where: { id: categoryId },
                data: { imageUrl },
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

            logger.info(
                `Category image uploaded: ${category.name} (ID: ${category.id})`
            )

            return {
                category: updatedCategory,
                imageUrl,
            }
        } catch (error) {
            // Delete uploaded file if database update fails
            if (file) {
                await fs.unlink(file.path).catch(() => {
                    logger.debug(`Failed to delete file: ${file.path}`)
                })
            }
            throw error
        }
    }

    /**
     * Delete category image
     */
    async deleteCategoryImage(categoryId) {
        // Check if category exists
        const category = await prisma.category.findUnique({
            where: { id: categoryId },
        })

        if (!category) {
            const error = new Error('Category not found')
            error.statusCode = HTTP_STATUS.NOT_FOUND
            throw error
        }

        if (!category.imageUrl) {
            const error = new Error('Category has no image')
            error.statusCode = HTTP_STATUS.BAD_REQUEST
            throw error
        }

        try {
            // Delete image file
            const imagePath = path.join(
                process.cwd(),
                'uploads',
                'categories',
                path.basename(category.imageUrl)
            )
            await fs.unlink(imagePath).catch(() => {
                // Ignore if file doesn't exist
                logger.warn(`Image file not found: ${imagePath}`)
            })

            // Update category to remove image URL
            const updatedCategory = await prisma.category.update({
                where: { id: categoryId },
                data: { imageUrl: null },
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

            logger.info(
                `Category image deleted: ${category.name} (ID: ${category.id})`
            )

            return updatedCategory
        } catch (error) {
            logger.error('Error deleting category image:', error)
            throw error
        }
    }
}

export default new CategoryService()
