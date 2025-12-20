import apiClient from './client'
import type { ApiResponse, Chapter, CreateChapterRequest, UpdateChapterRequest } from './types'

export const chaptersApi = {
    /**
     * Get all chapters by course ID
     */
    async getChaptersByCourse(
        courseId: number,
        includeLessons: boolean = false
    ): Promise<Chapter[]> {
        const params = new URLSearchParams()
        if (includeLessons) {
            params.append('includeLessons', 'true')
        }

        const response = await apiClient.get<ApiResponse<Chapter[]>>(
            `/courses/${courseId}/chapters${params.toString() ? `?${params.toString()}` : ''}`
        )
        return response.data.data
    },

    /**
     * Get chapter by ID
     */
    async getChapterById(
        chapterId: number,
        includeLessons: boolean = false
    ): Promise<Chapter> {
        const params = new URLSearchParams()
        if (includeLessons) {
            params.append('includeLessons', 'true')
        }

        const response = await apiClient.get<ApiResponse<Chapter>>(
            `/chapters/${chapterId}${params.toString() ? `?${params.toString()}` : ''}`
        )
        return response.data.data
    },

    /**
     * Create a new chapter (Instructor only)
     */
    async createChapter(
        courseId: number,
        data: CreateChapterRequest
    ): Promise<Chapter> {
        const response = await apiClient.post<ApiResponse<Chapter>>(
            `/instructor/courses/${courseId}/chapters`,
            data
        )
        return response.data.data
    },

    /**
     * Update a chapter (Instructor only)
     */
    async updateChapter(
        chapterId: number,
        data: UpdateChapterRequest
    ): Promise<Chapter> {
        const response = await apiClient.put<ApiResponse<Chapter>>(
            `/instructor/chapters/${chapterId}`,
            data
        )
        return response.data.data
    },

    /**
     * Delete a chapter (Instructor only)
     */
    async deleteChapter(chapterId: number): Promise<void> {
        await apiClient.delete<ApiResponse<void>>(
            `/instructor/chapters/${chapterId}`
        )
    },

    /**
     * Reorder chapters (Instructor only)
     */
    async reorderChapters(
        courseId: number,
        chapterIds: number[]
    ): Promise<void> {
        await apiClient.put<ApiResponse<void>>(
            `/instructor/courses/${courseId}/chapters/reorder`,
            { chapterIds }
        )
    },
}

