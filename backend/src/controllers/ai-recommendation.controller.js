// backend/src/controllers/ai-recommendation.controller.js
import aiRecommendationService from '../services/ai-recommendation.service.js'
import ApiResponse from '../utils/response.util.js'
import { asyncHandler } from '../middlewares/error.middleware.js'

class AIRecommendationController {
    /**
     * @route   GET /api/v1/ai/recommendations
     * @desc    Get AI-powered course recommendations for user
     * @access  Private
     * @query   limit (default: 10), forceRefresh (default: false)
     */
    getRecommendations = asyncHandler(async (req, res) => {
        const { limit = 10, forceRefresh = false } = req.query

        const recommendations =
            await aiRecommendationService.getRecommendationsForUser(
                req.user.id,
                {
                    limit: parseInt(limit),
                    forceRefresh: forceRefresh === 'true',
                }
            )

        return ApiResponse.success(
            res,
            recommendations,
            'Recommendations retrieved successfully',
            200,
            {
                total: recommendations.length,
                limit: parseInt(limit),
            }
        )
    })

    /**
     * @route   GET /api/v1/ai/recommendations/similar/:courseId
     * @desc    Get similar courses for a given course
     * @access  Public
     * @query   limit (default: 5)
     */
    getSimilarCourses = asyncHandler(async (req, res) => {
        const { courseId } = req.params
        const { limit = 5 } = req.query

        const similarCourses = await aiRecommendationService.getSimilarCourses(
            parseInt(courseId),
            parseInt(limit)
        )

        return ApiResponse.success(
            res,
            similarCourses,
            'Similar courses retrieved successfully',
            200,
            {
                total: similarCourses.length,
                limit: parseInt(limit),
            }
        )
    })

    /**
     * @route   POST /api/v1/ai/recommendations/:id/view
     * @desc    Mark recommendation as viewed
     * @access  Private
     */
    markAsViewed = asyncHandler(async (req, res) => {
        const { id } = req.params

        await aiRecommendationService.markRecommendationAsViewed(
            parseInt(id),
            req.user.id
        )

        return ApiResponse.success(res, null, 'Recommendation marked as viewed')
    })
}

export default new AIRecommendationController()
