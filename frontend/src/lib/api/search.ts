import apiClient from './client'
import type {
    ApiResponse,
    PaginatedApiResponse,
    PublicCourse,
} from './types'

// Search filters for courses
export interface SearchCoursesFilters {
    q?: string // Search keyword
    category?: number | string // Category ID
    tags?: string // Comma-separated tag slugs: "html,css,javascript"
    level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | string
    price?: 'free' | 'paid' // Filter by price type
    rating?: number // Minimum rating (0-5)
    featured?: boolean | string // Featured courses only
    sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'rating' | 'enrolled'
    page?: number
    limit?: number
}

// Search filters for instructors
export interface SearchInstructorsFilters {
    q?: string // Search keyword
    sort?: 'popular' | 'name' | 'newest'
    page?: number
    limit?: number
}

// Search suggestions response
export interface SearchSuggestions {
    courses: Array<{
        id: number
        title: string
        slug: string
        thumbnailUrl?: string
    }>
    categories: Array<{
        id: number
        name: string
        slug: string
    }>
    tags: Array<{
        id: number
        name: string
        slug: string
    }>
    instructors: Array<{
        id: number
        userName: string
        fullName: string
        avatarUrl?: string
    }>
}

// Instructor search result
export interface InstructorSearchResult {
    id: number
    userName: string
    fullName: string
    avatarUrl?: string
    bio?: string
    createdAt: string
    totalCourses: number
    totalEnrollments: number
    averageRating: number
}

// Voice search request
export interface VoiceSearchRequest {
    transcript: string
}

// Voice search response
export interface VoiceSearchResponse {
    transcript: string
    courses: PublicCourse[]
    total: number
}

export const searchApi = {
    /**
     * Search courses with advanced filters
     * @param filters - Search filters
     * @returns Paginated courses
     */
    async searchCourses(
        filters: SearchCoursesFilters
    ): Promise<PaginatedApiResponse<PublicCourse>> {
        const params = new URLSearchParams()

        if (filters.q) params.append('q', filters.q)
        if (filters.category) params.append('category', String(filters.category))
        if (filters.tags) params.append('tags', filters.tags)
        if (filters.level) params.append('level', filters.level)
        if (filters.price) params.append('price', filters.price)
        if (filters.rating !== undefined)
            params.append('rating', String(filters.rating))
        if (filters.featured !== undefined)
            params.append('featured', String(filters.featured))
        if (filters.sort) params.append('sort', filters.sort)
        if (filters.page) params.append('page', String(filters.page))
        if (filters.limit) params.append('limit', String(filters.limit))

        const response = await apiClient.get<
            PaginatedApiResponse<PublicCourse>
        >(`/search/courses?${params.toString()}`)

        return response.data
    },

    /**
     * Search instructors
     * @param filters - Search filters
     * @returns Paginated instructors
     */
    async searchInstructors(
        filters: SearchInstructorsFilters
    ): Promise<PaginatedApiResponse<InstructorSearchResult>> {
        const params = new URLSearchParams()

        if (filters.q) params.append('q', filters.q)
        if (filters.sort) params.append('sort', filters.sort)
        if (filters.page) params.append('page', String(filters.page))
        if (filters.limit) params.append('limit', String(filters.limit))

        const response = await apiClient.get<
            PaginatedApiResponse<InstructorSearchResult>
        >(`/search/instructors?${params.toString()}`)

        return response.data
    },

    /**
     * Get search suggestions/autocomplete
     * @param q - Search query (min 2 characters)
     * @param limit - Maximum number of suggestions per type
     * @returns Search suggestions
     */
    async getSearchSuggestions(
        q: string,
        limit: number = 10
    ): Promise<SearchSuggestions> {
        if (!q || q.trim().length < 2) {
            return {
                courses: [],
                categories: [],
                tags: [],
                instructors: [],
            }
        }

        const params = new URLSearchParams()
        params.append('q', q.trim())
        params.append('limit', String(limit))

        const response = await apiClient.get<ApiResponse<SearchSuggestions>>(
            `/search/suggestions?${params.toString()}`
        )

        return response.data.data
    },

    /**
     * Process voice search (speech-to-text)
     * @param transcript - Speech-to-text transcript
     * @returns Search results
     */
    async processVoiceSearch(
        transcript: string
    ): Promise<PaginatedApiResponse<PublicCourse>> {
        const response = await apiClient.post<
            PaginatedApiResponse<PublicCourse>
        >('/search/voice', { transcript })

        return response.data
    },
}

