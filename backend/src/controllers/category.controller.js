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
}

export default new CategoryController()
