// src/controllers/category.controller.js
import categoryService from '../services/category.service.js'
import ApiResponse from '../utils/response.util.js'
import { asyncHandler } from '../middlewares/error.middleware.js'

class CategoryController {
    /**
     * @route   POST /api/v1/categories
     * @desc    Create new category
     * @access  Private (Admin/Instructor)
     */
    createCategory = asyncHandler(async (req, res) => {
        const {
            name,
            slug,
            description,
            imageUrl,
            parentId,
            sortOrder,
            isActive,
        } = req.body

        const categoryData = {
            name,
            slug,
            description,
            imageUrl,
            parentId: parentId ? parseInt(parentId) : null,
            sortOrder: sortOrder ? parseInt(sortOrder) : 0,
            isActive: isActive !== undefined ? isActive : true,
        }

        const category = await categoryService.createCategory(categoryData)

        return ApiResponse.created(
            res,
            category,
            'Category created successfully'
        )
    })

    /**
     * @route   PUT /api/v1/categories/:id
     * @desc    Update category
     * @access  Private (Admin/Instructor)
     */
    updateCategory = asyncHandler(async (req, res) => {
        const { id } = req.params
        const {
            name,
            slug,
            description,
            imageUrl,
            parentId,
            sortOrder,
            isActive,
        } = req.body

        const updateData = {}

        if (name !== undefined) updateData.name = name
        if (slug !== undefined) updateData.slug = slug
        if (description !== undefined) updateData.description = description
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl
        if (parentId !== undefined)
            updateData.parentId = parentId ? parseInt(parentId) : null
        if (sortOrder !== undefined) updateData.sortOrder = parseInt(sortOrder)
        if (isActive !== undefined) updateData.isActive = isActive

        const category = await categoryService.updateCategory(
            parseInt(id),
            updateData
        )

        return ApiResponse.success(
            res,
            category,
            'Category updated successfully'
        )
    })
}

export default new CategoryController()
