// src/middlewares/category.middleware.js
import { prisma } from '../config/database.config.js'
import ApiResponse from '../utils/response.util.js'
import { HTTP_STATUS } from '../config/constants.js'

/**
 * Check if category exists
 * Must be called before multer middleware for upload routes
 */
const checkCategoryExists = async (req, res, next) => {
    try {
        const categoryId = parseInt(req.params.id)

        if (!categoryId || isNaN(categoryId)) {
            return ApiResponse.badRequest(res, 'Yêu cầu mã danh mục hợp lệ')
        }

        const category = await prisma.category.findUnique({
            where: { id: categoryId },
            select: {
                id: true,
                name: true,
                slug: true,
                imageUrl: true,
            },
        })

        if (!category) {
            return ApiResponse.notFound(res, 'Không tìm thấy danh mục')
        }

        // Attach category to request for later use
        req.category = category
        next()
    } catch (error) {
        return ApiResponse.error(
            res,
            'Lỗi kiểm tra danh mục',
            HTTP_STATUS.INTERNAL_SERVER_ERROR
        )
    }
}

export { checkCategoryExists }
