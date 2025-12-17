import apiClient from './client'
import type {
    ApiResponse,
    Lesson,
    CreateLessonRequest,
    UpdateLessonRequest,
} from './types'

export const instructorLessonsApi = {
    /**
     * Create a new lesson (Instructor only)
     */
    async createLesson(
        courseId: number,
        data: CreateLessonRequest
    ): Promise<Lesson> {
        const response = await apiClient.post<ApiResponse<Lesson>>(
            `/instructor/courses/${courseId}/lessons`,
            data
        )
        return response.data.data
    },

    /**
     * Update a lesson (Instructor only)
     */
    async updateLesson(
        courseId: number,
        lessonId: number,
        data: UpdateLessonRequest
    ): Promise<Lesson> {
        const response = await apiClient.put<ApiResponse<Lesson>>(
            `/instructor/courses/${courseId}/lessons/${lessonId}`,
            data
        )
        return response.data.data
    },

    /**
     * Delete a lesson (Instructor only)
     */
    async deleteLesson(courseId: number, lessonId: number): Promise<void> {
        await apiClient.delete<ApiResponse<void>>(
            `/instructor/courses/${courseId}/lessons/${lessonId}`
        )
    },

    /**
     * Upload video to lesson (Instructor only)
     */
    async uploadVideo(
        courseId: number,
        lessonId: number,
        videoFile: File,
        onUploadProgress?: (progress: number) => void
    ): Promise<Lesson> {
        const formData = new FormData()
        formData.append('video', videoFile)

        const response = await apiClient.patch<ApiResponse<Lesson>>(
            `/instructor/courses/${courseId}/lessons/${lessonId}/video`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    if (onUploadProgress && progressEvent.total) {
                        const progress = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        )
                        onUploadProgress(progress)
                    }
                },
            }
        )
        return response.data.data
    },

    /**
     * Upload transcript to lesson (Instructor only)
     */
    async uploadTranscript(
        courseId: number,
        lessonId: number,
        transcriptFile: File
    ): Promise<Lesson> {
        const formData = new FormData()
        formData.append('transcript', transcriptFile)

        const response = await apiClient.patch<ApiResponse<Lesson>>(
            `/instructor/courses/${courseId}/lessons/${lessonId}/transcript`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        )
        return response.data.data
    },

    /**
     * Reorder lesson (Instructor only)
     */
    async reorderLesson(
        courseId: number,
        lessonId: number,
        newOrder: number
    ): Promise<void> {
        await apiClient.patch<ApiResponse<void>>(
            `/instructor/courses/${courseId}/lessons/${lessonId}/order`,
            { newOrder }
        )
    },

    /**
     * Publish/Unpublish lesson (Instructor only)
     */
    async publishLesson(
        courseId: number,
        lessonId: number,
        isPublished: boolean
    ): Promise<Lesson> {
        const response = await apiClient.patch<ApiResponse<Lesson>>(
            `/instructor/courses/${courseId}/lessons/${lessonId}/publish`,
            { isPublished }
        )
        return response.data.data
    },

    /**
     * Reorder multiple lessons in a chapter (Instructor only)
     */
    async reorderLessons(
        courseId: number,
        chapterId: number,
        lessonIds: number[]
    ): Promise<void> {
        await apiClient.put<ApiResponse<void>>(
            `/instructor/courses/${courseId}/chapters/${chapterId}/lessons/reorder`,
            { lessonIds }
        )
    },
}

