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

    /**
     * @route   DELETE /api/v1/categories/:id
     * @desc    Delete category
     * @access  Private (Admin/Instructor)
     */
    deleteCategory = asyncHandler(async (req, res) => {
        const { id } = req.params

        await categoryService.deleteCategory(parseInt(id))

        return ApiResponse.success(res, null, 'Category deleted successfully')
    })

    /**
     * @route   GET /api/v1/categories
     * @desc    Get all categories (with optional filters)
     * @access  Public
     */
    getCategories = asyncHandler(async (req, res) => {
        const { page, limit, parentId, isActive, search } = req.query

        const filters = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            parentId: parentId ? parseInt(parentId) : undefined,
            isActive:
                isActive === 'true'
                    ? true
                    : isActive === 'false'
                      ? false
                      : undefined,
            search: search || undefined,
        }

        const result = await categoryService.getCategories(filters)

        return ApiResponse.paginated(
            res,
            result.categories,
            {
                page: filters.page,
                limit: filters.limit,
                total: result.total,
            },
            'Categories retrieved successfully'
        )
    })
}

export default new CategoryController()
