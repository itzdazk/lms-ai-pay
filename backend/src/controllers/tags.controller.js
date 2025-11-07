// src/controllers/tags.controller.js
import tagsService from '../services/tags.service.js'
import ApiResponse from '../utils/response.util.js'
import { asyncHandler } from '../middlewares/error.middleware.js'

class TagsController {
    /**
     * @route   GET /api/v1/tags
     * @desc    Get tags list with pagination and search
     * @access  Public
     */
    getTags = asyncHandler(async (req, res) => {
        const result = await tagsService.getTags(req.query)
        return ApiResponse.success(
            res,
            result,
            'Tags retrieved successfully'
        )
    })

    /**
     * @route   GET /api/v1/tags/:id
     * @desc    Get tag by ID
     * @access  Public
     */
    getTagById = asyncHandler(async (req, res) => {
        const { id } = req.params
        const tag = await tagsService.getTagById(parseInt(id))
        return ApiResponse.success(res, tag, 'Tag retrieved successfully')
    })

    /**
     * @route   GET /api/v1/tags/:id/courses
     * @desc    Get courses by tag ID
     * @access  Public
     */
    getTagCourses = asyncHandler(async (req, res) => {
        const { id } = req.params
        const result = await tagsService.getTagCourses(parseInt(id), req.query)
        return ApiResponse.success(
            res,
            result,
            'Courses retrieved successfully'
        )
    })

    /**
     * @route   POST /api/v1/tags
     * @desc    Create new tag
     * @access  Private (Admin/Instructor)
     */
    createTag = asyncHandler(async (req, res) => {
        const { name, slug, description } = req.body

        const tagData = {
            name,
            slug,
            description,
        }

        const tag = await tagsService.createTag(tagData)

        return ApiResponse.created(res, tag, 'Tag created successfully')
    })

    /**
     * @route   PUT /api/v1/tags/:id
     * @desc    Update tag
     * @access  Private (Admin/Instructor)
     */
    updateTag = asyncHandler(async (req, res) => {
        const { id } = req.params
        const { name, slug, description } = req.body

        const updateData = {}

        if (name !== undefined) updateData.name = name
        if (slug !== undefined) updateData.slug = slug
        if (description !== undefined) updateData.description = description

        const tag = await tagsService.updateTag(parseInt(id), updateData)

        return ApiResponse.success(res, tag, 'Tag updated successfully')
    })

    /**
     * @route   DELETE /api/v1/tags/:id
     * @desc    Delete tag
     * @access  Private (Admin/Instructor)
     */
    deleteTag = asyncHandler(async (req, res) => {
        const { id } = req.params

        await tagsService.deleteTag(parseInt(id))

        return ApiResponse.success(res, null, 'Tag deleted successfully')
    })
}

export default new TagsController()



