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
            'Danh mục đã được tạo thành công'
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
            'Danh mục đã được cập nhật thành công'
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

        return ApiResponse.success(res, null, 'Danh mục đã được xóa thành công')
    })

    /**
     * @route   GET /api/v1/categories
     * @desc    Get all categories (with optional filters)
     * @access  Public
     */
    getCategories = asyncHandler(async (req, res) => {
        const {
            page,
            limit,
            parentId,
            categoryId,
            isActive,
            search,
            sort,
            sortOrder,
        } = req.query

        // For public API, default to only active categories unless explicitly requested
        // If user is authenticated admin/instructor, they can see all categories
        const isAuthenticatedAdmin =
            req.user &&
            (req.user.role === 'ADMIN' || req.user.role === 'INSTRUCTOR')

        const filters = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            parentId:
                parentId === 'null' || parentId === null
                    ? null
                    : parentId
                      ? parseInt(parentId)
                      : undefined,
            categoryId: categoryId ? parseInt(categoryId) : undefined,
            isActive:
                isActive === 'true'
                    ? true
                    : isActive === 'false'
                      ? false
                      : // For public API (not authenticated admin/instructor), default to active only
                        !isAuthenticatedAdmin
                        ? true
                        : undefined,
            search: search || undefined,
            sort: sort || 'sortOrder',
            sortOrder: sortOrder || 'asc',
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
            'Truy xuất danh sách danh mục thành công'
        )
    })

    /**
     * @route   GET /api/v1/categories/:id
     * @desc    Get category by ID
     * @access  Public
     */
    getCategoryById = asyncHandler(async (req, res) => {
        const { id } = req.params

        const category = await categoryService.getCategoryById(parseInt(id))

        if (!category) {
            return ApiResponse.notFound(res, 'Không tìm thấy danh mục')
        }

        return ApiResponse.success(
            res,
            category,
            'Truy xuất danh sách danh mục thành công'
        )
    })

    /**
     * @route   GET /api/v1/categories/:id/courses
     * @desc    Get courses in a category by ID
     * @access  Public
     */
    getCoursesByCategoryId = asyncHandler(async (req, res) => {
        const { id } = req.params
        const { page, limit, level, sort } = req.query

        const filters = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            level: level || undefined,
            sort: sort || 'newest', // newest, popular, rating, price_asc, price_desc
        }

        const result = await categoryService.getCoursesByCategory(
            parseInt(id),
            filters
        )

        return ApiResponse.paginated(
            res,
            result.courses,
            {
                page: filters.page,
                limit: filters.limit,
                total: result.total,
            },
            'Truy xuất danh sách khóa học thành công'
        )
    })

    /**
     * @route   GET /api/v1/categories/:slug/courses
     * @desc    Get courses in a category by slug
     * @access  Public
     */
    getCoursesByCategorySlug = asyncHandler(async (req, res) => {
        const { slug } = req.params
        const { page, limit, level, sort } = req.query

        const filters = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            level: level || undefined,
            sort: sort || 'newest',
        }

        const result = await categoryService.getCoursesByCategorySlug(
            slug,
            filters
        )

        return ApiResponse.paginated(
            res,
            result.courses,
            {
                page: filters.page,
                limit: filters.limit,
                total: result.total,
            },
            'Truy xuất danh sách khóa học thành công'
        )
    })

    /**
     * @route   POST /api/v1/categories/:id/upload-image
     * @desc    Upload category image
     * @access  Private (Admin/Instructor)
     */
    uploadImage = asyncHandler(async (req, res) => {
        const { id } = req.params

        // Check if file was uploaded
        if (!req.file) {
            return ApiResponse.badRequest(res, 'Không tìm thấy tệp ảnh')
        }

        const result = await categoryService.uploadCategoryImage(
            parseInt(id),
            req.file
        )

        return ApiResponse.success(
            res,
            result,
            'Ảnh danh mục đã được tải lên thành công'
        )
    })

    /**
     * @route   DELETE /api/v1/categories/:id/image
     * @desc    Delete category image
     * @access  Private (Admin/Instructor)
     */
    deleteImage = asyncHandler(async (req, res) => {
        const { id } = req.params

        const updatedCategory = await categoryService.deleteCategoryImage(
            parseInt(id)
        )

        return ApiResponse.success(
            res,
            updatedCategory,
            'Ảnh danh mục đã được xóa thành công'
        )
    })

    /**
     * @route   GET /api/v1/categories/stats
     * @desc    Get category statistics
     * @access  Public
     */
    getCategoryStats = asyncHandler(async (req, res) => {
        const stats = await categoryService.getCategoryStats()

        return ApiResponse.success(
            res,
            stats,
            'Truy xuất thống kê danh mục thành công'
        )
    })
}

export default new CategoryController()
