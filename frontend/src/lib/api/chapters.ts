import apiClient from './client'
import type { ApiResponse, Chapter } from './types'

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
}

