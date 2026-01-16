// backend/src/controllers/search.controller.js
import searchService from '../services/search.service.js'
import ApiResponse from '../utils/response.util.js'
import { asyncHandler } from '../middlewares/error.middleware.js'

class SearchController {
    /**
     * @route   GET /api/v1/search/courses
     * @desc    Search courses with advanced filters
     * @access  Public
     * @query   q, category, tags, level, price, rating, featured, sort, page, limit
     */
    searchCourses = asyncHandler(async (req, res) => {
        const {
            q,
            category,
            tags,
            level,
            price,
            rating,
            featured,
            sort,
            page,
            limit,
        } = req.query

        const filters = {
            q: q || undefined,
            category: category || undefined,
            tags: tags || undefined,
            level: level || undefined,
            price: price || undefined,
            rating: rating || undefined,
            featured: featured || undefined,
            sort: sort || 'newest',
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
        }

        const result = await searchService.searchCourses(filters)

        return ApiResponse.paginated(
            res,
            result.courses,
            {
                page: filters.page,
                limit: filters.limit,
                total: result.total,
            },
            'Tìm kiếm khóa học thành công'
        )
    })

    /**
     * @route   GET /api/v1/search/instructors
     * @desc    Search instructors
     * @access  Public
     * @query   q, sort, page, limit
     */
    searchInstructors = asyncHandler(async (req, res) => {
        const { q, sort, page, limit } = req.query

        const filters = {
            q: q || undefined,
            sort: sort || 'popular',
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
        }

        const result = await searchService.searchInstructors(filters)

        return ApiResponse.paginated(
            res,
            result.instructors,
            {
                page: filters.page,
                limit: filters.limit,
                total: result.total,
            },
            'Tìm kiếm giảng viên thành công'
        )
    })

    /**
     * @route   GET /api/v1/search/suggestions
     * @desc    Get search suggestions/autocomplete
     * @access  Public
     * @query   q, limit
     */
    getSearchSuggestions = asyncHandler(async (req, res) => {
        const { q, limit } = req.query

        if (!q || q.trim().length < 2) {
            return ApiResponse.badRequest(
                res,
                'Truy vấn tìm kiếm phải có ít nhất 2 ký tự'
            )
        }

        const limitNum = parseInt(limit) || 10

        const suggestions = await searchService.getSearchSuggestions(
            q,
            limitNum
        )

        return ApiResponse.success(
            res,
            suggestions,
            'Truy xuất đề xuất tìm kiếm thành công'
        )
    })

    /**
     * @route   POST /api/v1/search/voice
     * @desc    Process voice search (speech-to-text)
     * @access  Public
     * @body    transcript
     */
    processVoiceSearch = asyncHandler(async (req, res) => {
        const { transcript } = req.body

        if (!transcript || transcript.trim().length === 0) {
            return ApiResponse.badRequest(
                res,
                'Transcript là bắt buộc cho tìm kiếm giọng nói'
            )
        }

        const result = await searchService.processVoiceSearch(transcript)

        return ApiResponse.paginated(
            res,
            result.courses,
            {
                page: 1,
                limit: 20,
                total: result.total,
            },
            `Tìm kiếm giọng nói thành công cho: "${result.transcript}"`
        )
    })
}

export default new SearchController()
