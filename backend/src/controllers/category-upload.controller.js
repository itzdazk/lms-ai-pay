// src/controllers/category-upload.controller.js
import { prisma } from '../config/database.config.js'
import ApiResponse from '../utils/response.util.js'
import { asyncHandler } from '../middlewares/error.middleware.js'
import logger from '../config/logger.config.js'
import config from '../config/app.config.js'
import fs from 'fs/promises'
import path from 'path'

class CategoryUploadController {
    /**
     * @route   POST /api/v1/categories/:id/upload-image
     * @desc    Upload category image
     * @access  Private (Admin/Instructor)
     */
    uploadImage = asyncHandler(async (req, res) => {
        const { id } = req.params

        // Check if category exists
        const category = await prisma.category.findUnique({
            where: { id: parseInt(id) },
        })

        if (!category) {
            // Delete uploaded file if category not found
            if (req.file) {
                await fs.unlink(req.file.path).catch(() => {})
            }
            return ApiResponse.notFound(res, 'Category not found')
        }

        // Check if file was uploaded
        if (!req.file) {
            return ApiResponse.badRequest(res, 'No image file provided')
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
                })
            }

            // Generate image URL
            const imageUrl = `${config.SERVER_URL}/uploads/categories/${req.file.filename}`

            // Update category with new image URL
            const updatedCategory = await prisma.category.update({
                where: { id: parseInt(id) },
                data: { imageUrl },
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

            logger.info(
                `Category image uploaded: ${category.name} (ID: ${category.id})`
            )

            return ApiResponse.success(
                res,
                {
                    category: updatedCategory,
                    imageUrl,
                },
                'Category image uploaded successfully'
            )
        } catch (error) {
            // Delete uploaded file if database update fails
            if (req.file) {
                await fs.unlink(req.file.path).catch(() => {})
            }
            throw error
        }
    })

    /**
     * @route   DELETE /api/v1/categories/:id/image
     * @desc    Delete category image
     * @access  Private (Admin/Instructor)
     */
    deleteImage = asyncHandler(async (req, res) => {
        const { id } = req.params

        // Check if category exists
        const category = await prisma.category.findUnique({
            where: { id: parseInt(id) },
        })

        if (!category) {
            return ApiResponse.notFound(res, 'Category not found')
        }

        if (!category.imageUrl) {
            return ApiResponse.badRequest(res, 'Category has no image')
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
                where: { id: parseInt(id) },
                data: { imageUrl: null },
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

            logger.info(
                `Category image deleted: ${category.name} (ID: ${category.id})`
            )

            return ApiResponse.success(
                res,
                updatedCategory,
                'Category image deleted successfully'
            )
        } catch (error) {
            logger.error('Error deleting category image:', error)
            throw error
        }
    })
}

export default new CategoryUploadController()