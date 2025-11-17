// backend/src/routes/search.routes.js
import express from 'express'
import searchController from '../controllers/search.controller.js'
import {
    searchCoursesValidator,
    searchInstructorsValidator,
    getSearchSuggestionsValidator,
    processVoiceSearchValidator,
} from '../validators/search.validator.js'

const router = express.Router()

/**
 * @route   GET /api/v1/search/courses
 * @desc    Search courses with advanced filters
 * @access  Public
 * @query   q, category, tags, level, price, rating, featured, sort, page, limit
 *
 * Examples:
 * - /api/v1/search/courses?q=javascript
 * - /api/v1/search/courses?q=web&level=BEGINNER&price=free
 * - /api/v1/search/courses?category=1&tags=html,css&sort=rating
 * - /api/v1/search/courses?rating=4&featured=true&sort=enrolled
 */
router.get('/courses', searchCoursesValidator, searchController.searchCourses)

/**
 * @route   GET /api/v1/search/instructors
 * @desc    Search instructors
 * @access  Public
 * @query   q, sort, page, limit
 *
 * Examples:
 * - /api/v1/search/instructors?q=john
 * - /api/v1/search/instructors?q=nguyen&sort=popular
 * - /api/v1/search/instructors?sort=newest&limit=10
 */
router.get(
    '/instructors',
    searchInstructorsValidator,
    searchController.searchInstructors
)

/**
 * @route   GET /api/v1/search/suggestions
 * @desc    Get search suggestions/autocomplete
 * @access  Public
 * @query   q (required, min 2 chars), limit (optional, default 10)
 *
 * Examples:
 * - /api/v1/search/suggestions?q=ja
 * - /api/v1/search/suggestions?q=web&limit=5
 */
router.get(
    '/suggestions',
    getSearchSuggestionsValidator,
    searchController.getSearchSuggestions
)

/**
 * @route   POST /api/v1/search/voice
 * @desc    Process voice search (speech-to-text)
 * @access  Public
 * @body    transcript (required)
 *
 * Example body:
 * {
 *   "transcript": "tìm kiếm khóa học lập trình javascript cho người mới bắt đầu"
 * }
 */
router.post(
    '/voice',
    processVoiceSearchValidator,
    searchController.processVoiceSearch
)

// Sự khác biệt giữa /courses và /search/courses:
// - /courses: Basic search qua parameter "search", không hỗ trợ tags filter
// - /search/courses: Advanced search với "q", hỗ trợ tags filter (tags=html,css,js)
//                    và filter theo rating (rating=4)

export default router
