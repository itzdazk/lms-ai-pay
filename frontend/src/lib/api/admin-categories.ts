import apiClient from './client'
import type { ApiResponse, PaginatedResponse, Category } from './types'

export interface AdminCategoryFilters {
    page?: number
    limit?: number
    parentId?: number
    categoryId?: number
    isActive?: boolean
    search?: string
    sort?: 'name' | 'createdAt' | 'updatedAt' | 'sortOrder'
    sortOrder?: 'asc' | 'desc'
}

export interface CreateCategoryRequest {
    name: string
    slug?: string
    description?: string
    imageUrl?: string
    parentId?: number | null
    sortOrder?: number
    isActive?: boolean
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {}

// API Functions
export const adminCategoriesApi = {
    /**
     * Get all categories with admin filters
     */
    async getAllCategories(
        filters: AdminCategoryFilters = {}
    ): Promise<PaginatedResponse<Category>> {
        const params = new URLSearchParams()

        if (filters.page) params.append('page', filters.page.toString())
        if (filters.limit) params.append('limit', filters.limit.toString())
        if (filters.parentId !== undefined) {
            // If parentId is null, send 'null' string to filter root categories
            // If parentId is a number, send the number
            params.append(
                'parentId',
                filters.parentId === null ? 'null' : filters.parentId.toString()
            )
        }
        if (filters.categoryId !== undefined)
            params.append('categoryId', filters.categoryId.toString())
        if (filters.isActive !== undefined)
            params.append('isActive', filters.isActive.toString())
        if (filters.search) params.append('search', filters.search)
        if (filters.sort) params.append('sort', filters.sort)
        if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)

        const response = await apiClient.get<ApiResponse<Category[]>>(
            `/categories?${params.toString()}`
        )

        // Transform to PaginatedResponse format
        // Backend already handles sorting, so no need for client-side sorting
        const categories = response.data.data || []

        // Get pagination info from response
        const total = (response.data as any).pagination?.total || categories.length

        return {
            data: categories,
            pagination: {
                page: filters.page || 1,
                limit: filters.limit || 20,
                total: total,
                totalPages: Math.ceil(total / (filters.limit || 20)),
            },
        }
    },

    /**
     * Get category by ID
     */
    async getCategoryById(id: number): Promise<Category> {
        const response = await apiClient.get<ApiResponse<Category>>(
            `/categories/${id}`
        )
        return response.data.data
    },

    /**
     * Create new category
     */
    async createCategory(data: CreateCategoryRequest): Promise<Category> {
        const response = await apiClient.post<ApiResponse<Category>>(
            '/categories',
            data
        )
        return response.data.data
    },

    /**
     * Update category
     */
    async updateCategory(
        id: number,
        data: UpdateCategoryRequest
    ): Promise<Category> {
        const response = await apiClient.put<ApiResponse<Category>>(
            `/categories/${id}`,
            data
        )
        return response.data.data
    },

    /**
     * Delete category
     */
    async deleteCategory(id: number): Promise<void> {
        await apiClient.delete<ApiResponse<void>>(`/categories/${id}`)
    },

    /**
     * Upload category image
     */
    async uploadCategoryImage(
        id: number,
        file: File
    ): Promise<{ category: Category; imageUrl: string }> {
        const formData = new FormData()
        formData.append('image', file)

        const response = await apiClient.post<
            ApiResponse<{ category: Category; imageUrl: string }>
        >(`/categories/${id}/upload-image`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
        return response.data.data
    },

    /**
     * Delete category image
     */
    async deleteCategoryImage(id: number): Promise<Category> {
        const response = await apiClient.delete<ApiResponse<Category>>(
            `/categories/${id}/image`
        )
        return response.data.data
    },
}
