import apiClient from './client'
import type { ApiResponse, PaginatedResponse, Category } from './types'

export interface AdminCategoryFilters {
    page?: number
    limit?: number
    parentId?: number
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
        if (filters.parentId !== undefined)
            params.append('parentId', filters.parentId.toString())
        if (filters.isActive !== undefined)
            params.append('isActive', filters.isActive.toString())
        if (filters.search) params.append('search', filters.search)

        const response = await apiClient.get<ApiResponse<Category[]>>(
            `/categories?${params.toString()}`
        )

        // Transform to PaginatedResponse format
        let categories = response.data.data || []

        // Apply client-side sorting if needed
        if (filters.sort) {
            const sortOrder = filters.sortOrder || 'asc'
            categories = [...categories].sort((a, b) => {
                let aVal: any
                let bVal: any

                switch (filters.sort) {
                    case 'name':
                        aVal = a.name.toLowerCase()
                        bVal = b.name.toLowerCase()
                        break
                    case 'createdAt':
                        aVal = new Date(a.createdAt).getTime()
                        bVal = new Date(b.createdAt).getTime()
                        break
                    case 'updatedAt':
                        aVal = new Date(a.updatedAt).getTime()
                        bVal = new Date(b.updatedAt).getTime()
                        break
                    case 'sortOrder':
                        aVal = a.sortOrder
                        bVal = b.sortOrder
                        break
                    default:
                        return 0
                }

                if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
                if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
                return 0
            })
        }

        // For now, we'll use the total from response if available
        // Otherwise, we'll use the length of categories array
        const total =
            (response.data as any).pagination?.total || categories.length

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
