import { coursesApi } from './courses'
import type { PaginatedResponse, Tag } from './types'

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

// API Functions - Using existing coursesApi since tags are managed via courses
export const adminTagsApi = {
    /**
     * Get all tags with admin filters
     */
    async getAllTags(
        filters: AdminTagFilters = {}
    ): Promise<PaginatedResponse<Tag>> {
        const result = await coursesApi.getCourseTags(filters)
        // Convert format to match PaginatedResponse
        return {
            data: result.tags,
            pagination: result.pagination
        }
    },

    /**
     * Create a new tag
     */
    async createTag(data: TagFormState): Promise<Tag> {
        if (!data.name) {
            throw new Error('Tag name is required')
        }
        return coursesApi.createTag(data.name, data.description)
    },

    /**
     * Update a tag
     */
    async updateTag(id: number, data: Partial<TagFormState>): Promise<Tag> {
        return coursesApi.updateTag(id, {
            name: data.name,
            slug: data.slug,
            description: data.description,
        })
    },

    /**
     * Delete a tag
     */
    async deleteTag(id: number): Promise<void> {
        return coursesApi.deleteTag(id.toString())
    },

    /**
     * Get tag by ID - using existing tags API
     */
    async getTagById(id: number): Promise<Tag> {
        // This would need a separate API call, but for now we'll use coursesApi approach
        // In a real scenario, this might need to be implemented in backend
        throw new Error('Get tag by ID not implemented')
    },
}
