import apiClient from './client'
import type { ApiResponse } from './types'

export interface LessonNote {
    id: number
    content: string
    createdAt: string
    updatedAt: string
}

export interface LessonNoteResponse {
    lesson: {
        id: number
        title: string
        slug: string
    }
    note: LessonNote | null
}

export interface CourseNotesResponse {
    course: {
        id: number
        title: string
    }
    notes: Array<{
        id: number
        lesson: {
            id: number
            title: string
            slug: string
            lessonOrder: number
        }
        content: string
        createdAt: string
        updatedAt: string
    }>
}

export interface UpsertLessonNoteRequest {
    content: string
}

export const lessonNotesApi = {
    /**
     * Get note for a lesson
     * GET /api/v1/notes/lessons/:lessonId
     */
    async getLessonNote(lessonId: string | number): Promise<LessonNoteResponse> {
        const response = await apiClient.get<ApiResponse<LessonNoteResponse>>(
            `/notes/lessons/${lessonId}`
        )
        return response.data.data
    },

    /**
     * Create or update note for a lesson
     * PUT /api/v1/notes/lessons/:lessonId
     */
    async upsertLessonNote(
        lessonId: string | number,
        content: string
    ): Promise<{ note: LessonNote }> {
        const response = await apiClient.put<ApiResponse<{ note: LessonNote }>>(
            `/notes/lessons/${lessonId}`,
            { content }
        )
        return response.data.data
    },

    /**
     * Delete note for a lesson
     * DELETE /api/v1/notes/lessons/:lessonId
     */
    async deleteLessonNote(lessonId: string | number): Promise<void> {
        await apiClient.delete(`/notes/lessons/${lessonId}`)
    },

    /**
     * Get all notes for a course
     * GET /api/v1/notes/courses/:courseId
     */
    async getCourseNotes(courseId: string | number): Promise<CourseNotesResponse> {
        const response = await apiClient.get<ApiResponse<CourseNotesResponse>>(
            `/notes/courses/${courseId}`
        )
        return response.data.data
    },
}

