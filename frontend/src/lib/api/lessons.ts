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

    // Get lesson video URL
    async getLessonVideo(lessonId: string | number): Promise<{ videoUrl: string }> {
        const response = await apiClient.get<ApiResponse<{ videoUrl: string }>>(`/lessons/${lessonId}/video`)
        return response.data.data
    },

    // Get lesson transcript
    async getLessonTranscript(lessonId: string | number): Promise<{ transcript: string; transcriptJson?: any }> {
        const response = await apiClient.get<ApiResponse<{ transcript: string; transcriptJson?: any }>>(`/lessons/${lessonId}/transcript`)
        return response.data.data
    },

    // Get all lessons for a course
    async getCourseLessons(courseId: string | number): Promise<CourseLessonsResponse> {
        const response = await apiClient.get<ApiResponse<CourseLessonsResponse>>(`/courses/${courseId}/lessons`)
        return response.data.data
    },
}


