import apiClient from './client'
import type {
    ApiResponse,
    Lesson,
    CourseLessonsResponse,
} from './types'

export const lessonsApi = {
    // Get lesson by ID
    async getLessonById(lessonId: string | number): Promise<Lesson> {
        const response = await apiClient.get<ApiResponse<Lesson>>(`/lessons/${lessonId}`)
        return response.data.data
    },

    // Get lesson by slug
    async getLessonBySlug(courseSlug: string, lessonSlug: string): Promise<Lesson> {
        const response = await apiClient.get<ApiResponse<Lesson>>(`/courses/slug/${courseSlug}/lessons/${lessonSlug}`)
        return response.data.data
    },

    // Get lesson video URL
    async getLessonVideo(lessonId: string | number): Promise<{ videoUrl: string }> {
        const response = await apiClient.get<ApiResponse<{ videoUrl: string }>>(`/lessons/${lessonId}/video`)
        return response.data.data
    },

    // Get lesson transcript URL
    async getLessonTranscript(lessonId: string | number): Promise<{ id: number; title: string; transcriptUrl: string } | null> {
        try {
            const response = await apiClient.get<ApiResponse<{ id: number; title: string; transcriptUrl: string }>>(`/lessons/${lessonId}/transcript`)
            return response.data.data
        } catch (error: any) {
            // Return null if transcript not available (404)
            if (error.response?.status === 404) {
                return null
            }
            throw error
        }
    },

    // Get all lessons for a course
    async getCourseLessons(courseId: string | number): Promise<CourseLessonsResponse> {
        const response = await apiClient.get<ApiResponse<CourseLessonsResponse>>(`/courses/${courseId}/lessons`)
        return response.data.data
    },
}


