import apiClient from './client'
import type { ApiResponse, PaginatedResponse, Tag } from './types'

export interface AdminTagFilters {
    page?: number
    limit?: number
    search?: string
    sort?: 'name' | 'createdAt' | 'updatedAt' | 'slug'
    sortOrder?: 'asc' | 'desc'
}

export interface TagFormState {
    name?: string
    slug?: string
    description?: string
}

// API Functions
export const adminTagsApi = {
    /**
     * Get all tags with admin filters
     */
    async getAllTags(
        filters: AdminTagFilters = {}
    ): Promise<PaginatedResponse<Tag>> {
        const params = new URLSearchParams()

        if (filters.page) params.append('page', filters.page.toString())
        if (filters.limit) params.append('limit', filters.limit.toString())
        if (filters.search) params.append('search', filters.search)
        if (filters.sort) params.append('sort', filters.sort)
        if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)

        const response = await apiClient.get<PaginatedResponse<Tag>>(
            `/admin/tags?${params.toString()}`
        )
        return response.data
    },

    /**
     * Create a new tag
     */
    async createTag(data: TagFormState): Promise<Tag> {
        const response = await apiClient.post<ApiResponse<Tag>>('/admin/tags', data)
        return response.data.data
    },

    /**
     * Update a tag
     */
    async updateTag(id: number, data: Partial<TagFormState>): Promise<Tag> {
        const response = await apiClient.put<ApiResponse<Tag>>(`/admin/tags/${id}`, data)
        return response.data.data
    },

    /**
     * Delete a tag
     */
    async deleteTag(id: number): Promise<void> {
        await apiClient.delete(`/admin/tags/${id}`)
    },

    /**
     * Get tag by ID
     */
    async getTagById(id: number): Promise<Tag> {
        const response = await apiClient.get<ApiResponse<Tag>>(`/admin/tags/${id}`)
        return response.data.data
    },
}
