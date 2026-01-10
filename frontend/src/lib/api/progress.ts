import apiClient from './client'
import type { ApiResponse } from './types'

export interface UpdateLessonProgressPayload {
    position?: number
    watchDuration?: number
}

export interface LessonProgress {
    isCompleted: boolean
    completedAt?: string
    watchDuration: number
    lastPosition: number
    attemptsCount: number
}

export interface LessonQuizProgress {
    lessonId: number;
    isCompleted: boolean;
    quizCompleted: boolean;
}

export const progressApi = {
    // Lấy tiến độ bài học
    async getLessonProgress(lessonId: string | number): Promise<LessonProgress> {
        const response = await apiClient.get<ApiResponse<any>>(`/progress/lessons/${lessonId}`);
        // Đảm bảo trả về object progress thay vì { lesson, progress }
        return response.data.data.progress;
    },

    // Cập nhật tiến độ bài học (gửi vị trí, thời lượng, viewedSegments)
    async updateLessonProgress(lessonId: string | number, payload: UpdateLessonProgressPayload): Promise<LessonProgress> {
        // Làm tròn position và watchDuration về số nguyên không âm trước khi gửi
        const cleanPayload = { ...payload };
        if (typeof cleanPayload.position === 'number' && cleanPayload.position >= 0) {
            cleanPayload.position = Math.floor(cleanPayload.position);
        }
        if (typeof cleanPayload.watchDuration === 'number' && cleanPayload.watchDuration >= 0) {
            cleanPayload.watchDuration = Math.floor(cleanPayload.watchDuration);
        }
        const response = await apiClient.put<ApiResponse<any>>(`/progress/lessons/${lessonId}/update`, cleanPayload);
        // Đảm bảo trả về object progress thay vì { progress: ... }
        return response.data.data.progress;
    },

    // Lấy trạng thái lesson/quiz cho LessonList UI
    async getCourseLessonProgressList(courseId: string | number): Promise<LessonQuizProgress[]> {
        const response = await apiClient.get<ApiResponse<LessonQuizProgress[]>>(`/progress/courses/${courseId}/lesson-progress`);
        return response.data.data;
    }
}
