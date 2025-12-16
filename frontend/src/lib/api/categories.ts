import apiClient from './client'
import type {
    ApiResponse,
    Category,
    PaginatedApiResponse,
    PublicCourse,
} from './types'

export interface CategoryFilters {
    page?: number
    limit?: number
    parentId?: number
    isActive?: boolean
    search?: string
}

export interface CategoryCoursesFilters {
    page?: number
    limit?: number
    level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
    sort?: 'newest' | 'popular' | 'rating' | 'price_asc' | 'price_desc'
}

export interface CategoryStats {
    total: number
    active: number
    inactive: number
    parent: number
    child: number
}

export const categoriesApi = {
    /**
     * Get all categories with optional filters
     * @param params - Filter parameters
     * @returns Paginated categories response (not normalized)
     */
    async getCategories(
        params?: CategoryFilters
    ): Promise<PaginatedApiResponse<Category>> {
        const queryParams = new URLSearchParams()

        if (params?.page) queryParams.append('page', params.page.toString())
        if (params?.limit) queryParams.append('limit', params.limit.toString())
        if (params?.parentId !== undefined)
            queryParams.append('parentId', params.parentId.toString())
        if (params?.isActive !== undefined)
            queryParams.append('isActive', params.isActive.toString())
        if (params?.search) queryParams.append('search', params.search)

        const response = await apiClient.get<
            PaginatedApiResponse<Category>
        >(`/categories?${queryParams.toString()}`)

        return response.data
    },

    /**
     * Get category statistics
     * @returns Category statistics
     */
    async getCategoryStats(): Promise<CategoryStats> {
        const response = await apiClient.get<ApiResponse<CategoryStats>>(
            '/categories/stats'
        )
        return response.data.data
    },

    /**
     * Get category by ID
     * @param id - Category ID
     * @returns Category details
     */
    async getCategoryById(id: number): Promise<Category> {
        const response = await apiClient.get<ApiResponse<Category>>(
            `/categories/${id}`
        )
        return response.data.data
    },

    /**
     * Get courses in a category by category ID
     * @param categoryId - Category ID
     * @param params - Filter parameters for courses
     * @returns Paginated courses response (not normalized)
     */
    async getCoursesByCategoryId(
        categoryId: number,
        params?: CategoryCoursesFilters
    ): Promise<PaginatedApiResponse<PublicCourse>> {
        const queryParams = new URLSearchParams()

        if (params?.page) queryParams.append('page', params.page.toString())
        if (params?.limit) queryParams.append('limit', params.limit.toString())
        if (params?.level) queryParams.append('level', params.level)
        if (params?.sort) queryParams.append('sort', params.sort)

        const response = await apiClient.get<
            PaginatedApiResponse<PublicCourse>
        >(`/categories/${categoryId}/courses?${queryParams.toString()}`)

        return response.data
    },

    /**
     * Get courses in a category by category slug
     * @param slug - Category slug
     * @param params - Filter parameters for courses
     * @returns Paginated courses response (not normalized)
     */
    async getCoursesByCategorySlug(
        slug: string,
        params?: CategoryCoursesFilters
    ): Promise<PaginatedApiResponse<PublicCourse>> {
        const queryParams = new URLSearchParams()

        if (params?.page) queryParams.append('page', params.page.toString())
        if (params?.limit) queryParams.append('limit', params.limit.toString())
        if (params?.level) queryParams.append('level', params.level)
        if (params?.sort) queryParams.append('sort', params.sort)

        const response = await apiClient.get<
            PaginatedApiResponse<PublicCourse>
        >(`/categories/${slug}/courses?${queryParams.toString()}`)

        return response.data
    },
}

/**
 * Build breadcrumb path from category to root
 * @param category - Category object with parent chain
 * @returns Array of categories from root to current category
 */
export function getCategoryPath(category: Category): Category[] {
    const path: Category[] = []
    let current: Category | null | undefined = category

    // Traverse up the parent chain
    while (current) {
        path.unshift(current)
        current = current.parent || null
    }

    return path
}
