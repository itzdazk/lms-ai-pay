// backend/src/routes/ai-recommendation.routes.js
import express from 'express'
import aiRecommendationController from '../controllers/ai-recommendation.controller.js'
import {
    authenticate,
    optionalAuthenticate,
} from '../middlewares/authenticate.middleware.js'
import {
    getRecommendationsValidator,
    getSimilarCoursesValidator,
    markAsViewedValidator,
} from '../validators/ai-recommendation.validator.js'

const router = express.Router()

/**
 * @route   GET /api/v1/ai/recommendations
 * @desc    Get AI-powered course recommendations for authenticated user
 * @access  Private
 * @query   limit (default: 10, max: 50), forceRefresh (default: false)
 *
 * FEATURES:
 * - AI-powered recommendations using Ollama LLM
 * - Personalized based on user's enrollment history and preferences
 * - Analyzes: categories, tags, level, progress, completion rate
 * - Caches results for 24 hours (use forceRefresh=true to regenerate)
 * - Falls back to rule-based recommendations if AI unavailable
 */
router.get(
    '/recommendations',
    authenticate,
    getRecommendationsValidator,
    aiRecommendationController.getRecommendations
)

/**
 * @route   GET /api/v1/ai/recommendations/similar/:courseId
 * @desc    Get similar courses for a specific course using AI
 * @access  Public
 * @query   limit (default: 5, max: 20)
 *
 * FEATURES:
 * - AI-powered similarity analysis using Ollama LLM
 * - Analyzes: category, tags, level, content, instructor
 * - Falls back to rule-based similarity if AI unavailable
 */
router.get(
    '/recommendations/similar/:courseId',
    optionalAuthenticate, // Optional: can be public or authenticated
    getSimilarCoursesValidator,
    aiRecommendationController.getSimilarCourses
)

/**
 * @route   POST /api/v1/ai/recommendations/:id/view
 * @desc    Mark recommendation as viewed (for analytics)
 * @access  Private
 *
 * PURPOSE:
 * - Track user engagement with recommendations
 * - Improve future recommendations based on user interaction
 * - Analytics for recommendation effectiveness
 */
router.post(
    '/recommendations/:id/view',
    authenticate,
    markAsViewedValidator,
    aiRecommendationController.markAsViewed
)

export default router
